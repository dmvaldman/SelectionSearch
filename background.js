const API_KEY_STORAGE_KEY = 'exa_api_key'

const contextMenuItem = {
    id: "BetweenTheLines",
    title: "Read Between the Lines",
    contexts: ["selection"]
}

// Create context menu item, handling duplicates if it already exists
chrome.contextMenus.create(contextMenuItem, () => {
    if (chrome.runtime.lastError) {
        // Menu item already exists, which is fine
        console.log('Context menu already exists:', chrome.runtime.lastError.message);
    }
});

async function getApiKey() {
    const result = await chrome.storage.local.get([API_KEY_STORAGE_KEY]);
    return result[API_KEY_STORAGE_KEY];
}

async function fetchExa(query){
    const apikey_exa = await getApiKey();

    if (!apikey_exa) {
        throw new Error('No API key found. Please set your Exa API key by clicking the extension icon.');
    }

    const contents = {
      "summary": {
        "query": "Select 0-3 verbatim quotes that reflect the article's main points. Avoid low information-content text. Return an empty array if no relevant quotes are found or if the web content is boilerplate.",
        "schema": {
          "type": "object",
          "required": ["snippets"],
          "additionalProperties": false,
          "properties": {
            "snippets": {
              "type": "array",
              "description": "Array of 0-3 verbatim quotes.",
              "items": {
                "type": "string",
                "description": "A quote. 1-4 sentences, max 100 words."
              }
            }
          }
        }
      }
    }

    // Old API. Still functional but seems unmaintained.
    // const contents = {
    //     "highlights": {
    //       "numSentences": 3,
    //       "highlightsPerUrl": 3,
    //       "query": query
    //     }
    //   }

    const payload = {
      "query": query,
      "type": "neural",
      "contents": contents
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

async function sendMessageToTab(tabId, message) {
    try {
        await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
        // Content script might not be loaded on this page (e.g., chrome:// pages, extensions)
        if (error.message && error.message.includes('Receiving end does not exist')) {
            console.log('Content script not available on this page');
        } else {
            console.error('Error sending message:', error);
        }
    }
}

chrome.contextMenus.onClicked.addListener(async function (clickData) {
    const selectedText = clickData.selectionText;
    if (clickData.menuItemId == "BetweenTheLines" && selectedText) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
            console.error("No active tab found");
            return;
        }
        const tabId = tabs[0].id;

        // Send response to start the loading animation
        await sendMessageToTab(tabId, { selectedText: selectedText });

        // Make a request to the local search server
        const response = await fetchExa(selectedText);
        // Send the response back to the content script
        await sendMessageToTab(tabId, { exaResponse: response, selectedText: selectedText });
      } catch (error) {
        console.error("Error fetching from Exa:", error);
        // Send error message to content script
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs && tabs.length > 0) {
                await sendMessageToTab(tabs[0].id, {
                    exaError: error.message,
                    selectedText: selectedText
                });
            }
        } catch (sendError) {
            console.error("Error sending error message:", sendError);
        }
      }
    }
  });
