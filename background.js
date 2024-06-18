// Add your API keys here
// const apikey_metaphor = "YOUR METAPHOR KEY HERE"
// const apikey_cohere = "YOUR COHERE KEY HERE"
// const apikey_openai = "YOUR OPENAI KEY HERE"
const apikey_metaphor = ''
const apikey_cohere = ''
const apikey_openai = ''

// -----------------------------------------------------------------------------------

const numMetaphorResults = 5
const min_similarity = .8

const contextMenuItem = {
    id: "SearchSelect",
    title: "Selection Search",
    contexts: ["selection"]
}

chrome.contextMenus.create(contextMenuItem);

async function fetchMetaphor(query, numResults=10){
    const prompt = "Excerpt: " + query + "\n\n Some great articles illustrating this:"

    const payload = {
        query: prompt,
        numResults: numResults,
        useQueryExpansion: true,
        contents: {
        text: {
            maxCharacters: 500,
            includeHtmlTags: false
        },
        highlights: {
            numSentences: 3,
            highlightsPerUrl: 3
        }
      }
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

// Function to compute dot product of two vectors
function dotProduct(vecA, vecB) {
    let product = 0;
    for (let i = 0; i < vecA.length; i++) product += vecA[i] * vecB[i];
    return product;
}

// Function to compute magnitude (norm) of a vector
function norm(vec) {
    let sum = 0;
    for (let i = 0; i < vec.length; i++) sum += vec[i] ** 2;
    return Math.sqrt(sum);
}

// Function to compute cosine similarity of two vectors
function cosineSimilarity(vecA, vecB) {
    return dotProduct(vecA, vecB) / (norm(vecA) * norm(vecB));
}

async function getSnippetsCohere(query, documents){
    const payload = {
        query: query,
        documents: documents,
        return_documents: false,
        model: 'rerank-english-v3.0',
        top_n: 3
    }

    const url = "https://api.cohere.ai/v1/rerank"

    const response_sentences = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apikey_cohere}`
        },
        body: JSON.stringify(payload)
    });

    const ret_rerank = await response_sentences.text();
    const results = JSON.parse(ret_rerank).results;

    const passages = [
        documents[results[0].index],
        documents[results[1].index],
        documents[results[2].index]
    ]

    return passages
}

async function getSnippetsOpenAI(query, documents){
    // create embeddings and do semantic search
    const input = [query, ...documents]
    const payload = {
        input: input,
        model: "text-embedding-3-small"
    }
    const url = "https://api.openai.com/v1/embeddings"

    const embeddings_response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apikey_openai}`
        },
        body: JSON.stringify(payload)
    });

    let embeddings = await embeddings_response.text();
    embeddings = JSON.parse(embeddings).data;

    let query_embed = embeddings.shift()

    // create a sorted list by similarity to query in the form {index: i, similarity: s}
    const max_results = 3
    let similarities = []
    for (let i = 0; i < embeddings.length; i++) {
        const similarity = cosineSimilarity(query_embed.embedding, embeddings[i].embedding)
        if (similarity > min_similarity)
            similarities.push({index: i, similarity: similarity})
    }

    // sort by similarity
    similarities.sort((a, b) => (a.similarity < b.similarity) ? 1 : -1)

    let passages = []
    for (let i = 0; i < similarities.length; i++) {
        let similarity = similarities[i]
        if (i < max_results && similarity.similarity > min_similarity)
            passages.push(documents[similarity.index])
    }

    return passages
}

function convertWebtextToDocs(webtext){
    const sentences = webtext.split('. ')
    let documents = []
    // combine triples of sentences into documents, overlapping with 1 sentence
    for (let i = 0; i < sentences.length; i += 2) {
        let doc = sentences.slice(i, i+3).join('. ')
        documents.push(doc)
    }
    return documents
}

async function getSnippets(query, webtext, method='cohere'){
    const documents = convertWebtextToDocs(webtext)
    let results = null
    switch (method) {
        case 'cohere':
            results = await getSnippetsCohere(query, documents)
            break;
        case 'openai':
            results = await getSnippetsOpenAI(query, documents)
            break;
    }
    return results
}

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
        const query = request.selectedText
        const webtext = request.text
        const snippets = await getSnippets(query, webtext, method='openai')

        let response = {
            "summary": summary,
            "passages": snippets,
            "keywords": []
        }

        // Send the HTML content back to the content script
        sendResponse(JSON.stringify(response));
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