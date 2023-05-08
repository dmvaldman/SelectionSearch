// Add your API keys here
const apikey_metaphor = "YOUR METAPHOR KEY HERE"
const apikey_cohere = "YOUR COHERE KEY HERE"

// -----------------------------------------------------------------------------------

const numMetaphorResults = 5

const contextMenuItem = {
    id: "SearchSelect",
    title: "Selection Search",
    contexts: ["selection"]
}

chrome.contextMenus.create(contextMenuItem);

async function fetchMetaphor(query, numResults=10){
    const prompt = "Excerpt: " + query + "\n\n Some great articles illustrating this point:"

    const payload = {
        query: prompt,
        numResults: numResults
    }

    const options = {
        method: 'POST',
        headers: {
          'accept': 'text/plain',
          'content-type': 'application/json',
          'x-api-key': apikey_metaphor
        },
        body: JSON.stringify(payload)
      };

    const result = await fetch('https://api.metaphor.systems/search', options)
    const json = await result.json()
    return json
}

chrome.contextMenus.onClicked.addListener(async function (clickData) {
    const selectedText = clickData.selectionText;
    if (clickData.menuItemId == "SearchSelect" && selectedText) {
      try {
        // Make a request to the local search server
        const response = await fetchMetaphor(selectedText, numMetaphorResults);
        // Send the response back to the content script
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tabs[0].id, { metaphor: response, selectedText: selectedText });
      } catch (error) {
        console.error("Error fetching metaphor:", error);
      }
    }
  });


async function fetchURL(request, sendResponse){
    try {
        const response = await fetch(request.url);
        const html = await response.text();
        // Send the HTML content back to the content script
        sendResponse({ html });
    }
    catch (error) {
        // Send an error message back to the content script
        sendResponse({ error: error.message });
    }
}

// async function summarizeOpenAI(request, sendResponse){
//     const prompt = "Below is the text from a website. \
//     Respond with JSON containing a 2-sentence summary, 1-3 \
//     interesting short passages (verbatim) from the text, and 1-3 keywords describing the text. \
//     Use the following schema:\
//     {\"summary\": \"\", \"passages\": [\"\", \"\"], \"keywords\": [\"\", \"\"]}\
//     Website Text: "

//     const system_prompt = "You are an excellent summarizer, extracting interesting and relevant information. You only respond with valid JSON."

//     // truncate entire content if too long (max 4096 tokens). each word is about 2.5 tokens.
//     let content = prompt + request.text
//     if (content.split(' ').length > 4096/2.5) {
//         content = content.split(' ').slice(0, 4096/2.5).join(' ')
//     }

//     // Use openai gpt-3.5-turbo chat endpoint to summarize
//     try {
//         const payload = {
//             model: "gpt-3.5-turbo",
//             messages: [
//                 {role: 'system', content: system_prompt},
//                 {role: "user", content: content},
//             ],
//             temperature: 0
//         }

//         const response = await fetch('https://api.openai.com/v1/chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${apikey_openai}`
//             },
//             body: JSON.stringify(payload)
//         });
//         let ret = await response.text();
//         ret = JSON.parse(ret)['choices'][0].message.content
//         // Send the HTML content back to the content script
//         sendResponse(ret);
//     } catch (error) {
//         // Send an error message back to the content script
//         sendResponse({ error: error.message });
//     }
// }

async function summarizeCohere(request, sendResponse){
    try {
        const payload = {
            text: request.text,
            length: 'short',
            format: 'paragraph',
            model: 'summarize-xlarge',
            additional_command: '',
            temperature: 0,
        }

        const response_summary = await fetch('https://api.cohere.ai/v1/summarize', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apikey_cohere}`
            },
            body: JSON.stringify(payload)
        });

        const response_summary_text = await response_summary.text();
        const summary = JSON.parse(response_summary_text).summary

        // split text into sentences to use as the documents
        const text = request.selectedText
        const sentences = request.text.split('. ')

        let documents = []
        // combine pairs of sentences into documents
        for (let i = 0; i < sentences.length; i += 2) {
            if (i + 1 < sentences.length) {
                documents.push(sentences[i] + '. ' + sentences[i + 1])
            } else {
                documents.push(sentences[i])
            }
        }

        const payload_rerank = {
            return_documents: false,
            model: 'rerank-english-v2.0',
            query: text,
            documents: documents,
            top_n: 3
        }

        const response_sentences = await fetch('https://api.cohere.ai/v1/rerank', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apikey_cohere}`
            },
            body: JSON.stringify(payload_rerank)
        });

        const ret_rerank = await response_sentences.text();
        const results = JSON.parse(ret_rerank).results;

        const passages = [
            documents[results[0].index],
            documents[results[1].index],
            documents[results[2].index]
        ]

        let response = {
            "summary": summary,
            "passages": passages,
            "keywords": []
        }

        let response_str = JSON.stringify(response)

        // Send the HTML content back to the content script
        sendResponse(response_str);
    } catch (error) {
        // Send an error message back to the content script
        sendResponse({ error: error.message });
    }
}

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchUrl')
        fetchURL(request, sendResponse)
    else if (request.action === 'summarize')
        // summarizeOpenAI(request, sendResponse)
        summarizeCohere(request, sendResponse)
    return true
});