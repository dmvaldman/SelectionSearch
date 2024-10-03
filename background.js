// Add your API keys here
// const apikey_metaphor = "YOUR METAPHOR KEY HERE"
const apikey_metaphor = ''

// -----------------------------------------------------------------------------------

const numMetaphorResults = 5

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

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchUrl'){
        fetchURL(request, sendResponse)
        return true
    }
    return false
});
