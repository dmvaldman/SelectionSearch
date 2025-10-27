// -----------------------------------------------------------------------------------

const numExaResults = 5
const API_KEY_STORAGE_KEY = 'exa_api_key'

const contextMenuItem = {
    id: "SearchSelect",
    title: "Exa Search",
    contexts: ["selection"]
}

chrome.contextMenus.create(contextMenuItem);

async function getApiKey() {
    const result = await chrome.storage.local.get([API_KEY_STORAGE_KEY]);
    return result[API_KEY_STORAGE_KEY];
}

async function fetchExa(query, numResults=10){
    const apikey_exa = await getApiKey();

    if (!apikey_exa) {
        throw new Error('No API key found. Please set your Exa API key by clicking the extension icon.');
    }

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
          'x-api-key': apikey_exa
        },
        body: JSON.stringify(payload)
      };

    const result = await fetch('https://api.exa.ai/search', options)
    const json = await result.json()
    return json
}

chrome.contextMenus.onClicked.addListener(async function (clickData) {
    const selectedText = clickData.selectionText;
    if (clickData.menuItemId == "SearchSelect" && selectedText) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabId = tabs[0].id
        // Send response to start the loading animation
        chrome.tabs.sendMessage(tabId, { searchSelected: true, selectedText: selectedText });

        // Make a request to the local search server
        const response = await fetchExa(selectedText, numExaResults);
        // Send the response back to the content script
        chrome.tabs.sendMessage(tabId, { exaResponse: response, selectedText: selectedText });
      } catch (error) {
        console.error("Error fetching from Exa:", error);
        // Send error message to content script
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, {
          exaError: error.message,
          selectedText: selectedText
        });
      }
    }
  });
