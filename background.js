// -----------------------------------------------------------------------------------

const numExaResults = 5
const API_KEY_STORAGE_KEY = 'exa_api_key'

const contextMenuItem = {
    id: "SearchSelect",
    title: "Search Selection",
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

    const payload = {
      "query": query,
      "type": "neural",
      "contents": {
        "summary": {
          "query": "Show the most relevant (direct quote) text snippets related to the user's query.",
          "schema": {
            "description": "Array of (direct quote) text snippets",
            "type": "object",
            "required": ["snippets"],
            "additionalProperties": false,
            "properties": {
              "snippets": {
                "type": "array",
                "description": "Collection of 1-3 direct quote text snippets most relevant to the query. Each snippet should be 1-4 sentences.",
                "items": {
                  "type": "string",
                  "description": "Text content of the snippet. 1-4 sentences, max 100 words."
                }
              }
            }
          }
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

    if (!result.ok) {
        throw new Error(`Exa API error: ${result.status} ${result.statusText}`);
    }

    const json = await result.json()

    // Parse summary field safely
    if (json.results && Array.isArray(json.results)) {
        json.results.forEach(result => {
            if (result.summary) {
                try {
                    result.summary = JSON.parse(result.summary);
                } catch (e) {
                    console.error('Error parsing summary:', e);
                    result.summary = { snippets: [] };
                }
            }
        });
    }

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
