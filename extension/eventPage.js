const numMetaphorResults = 5

const contextMenuItem = {
    id: "AIsearch",
    title: "AI Search",
    contexts: ["selection"]
}

chrome.contextMenus.create(contextMenuItem);

const apikey_metaphor = '79c84cb7-8f8c-446e-a819-a9419ea29e46'
const apikey_cohere = 'dXvUkT3DntsiIOhqRU8zDuoEPmE7irjk9z2seDZu'

function metaphor(query, numResults=10, callback){
    const options = {
        method: 'POST',
        headers: {
          accept: 'text/plain',
          'content-type': 'application/json',
          'x-api-key': apikey_metaphor
        },
        body: JSON.stringify({query: query, numResults: numResults})
      };

      fetch('https://api.metaphor.systems/search', options)
        .then(response => response.json())
        .then(response => callback(response))
        .catch(err => console.error(err));

}

chrome.contextMenus.onClicked.addListener(function(clickData){
    const selectedText = clickData.selectionText
    if(clickData.menuItemId == "AIsearch" && selectedText){
        // make a request to local search server
        metaphor(selectedText, numMetaphorResults, function(response){
            console.log(response)
            // send the response back to the content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {metaphor: response, selectedText: selectedText})
            })
        })
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

async function fetchRerank(request, sendResponse){
    try {
        const payload = {
            return_documents: false,
            model: 'rerank-english-v2.0',
            query: request.text,
            documents: request.documents,
            top_n: 5
        }
        const response = await fetch('https://api.cohere.ai/v1/rerank', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apikey_cohere}`
            },
            body: JSON.stringify(payload)
        });
        const ret = await response.text();
        // Send the HTML content back to the content script
        sendResponse({ ret });
    } catch (error) {
        // Send an error message back to the content script
        sendResponse({ error: error.message });
    }
}

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchUrl')
        fetchURL(request, sendResponse)
    else if (request.action === 'fetchRerank'){
        fetchRerank(request, sendResponse)
    }
    return true
});