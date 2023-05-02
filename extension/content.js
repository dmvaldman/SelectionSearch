const METAPHOR_SCORE_THRESHOLD = 0.19
let currEl = null

function handleRightClick(event) {
    currEl = event.target; // Get the HTML element that was clicked
}

// Add the event listener to intercept the right-click event
document.addEventListener('contextmenu', handleRightClick);

function createLinkEl(link){
    const linkItem = document.createElement('div');
    linkItem.classList.add('link-item');

    const linkTitle = document.createElement('a');
    linkTitle.classList.add('link-title');
    linkTitle.href = link.url;
    linkTitle.textContent = link.title;
    linkItem.appendChild(linkTitle);

    const linkDescription = document.createElement('span');
    linkDescription.classList.add('link-description');
    linkItem.appendChild(linkDescription);

    const linkScore = document.createElement('span');
    linkScore.classList.add('link-score');
    linkScore.textContent = link.score;
    linkItem.appendChild(linkScore);

    const linkDate = document.createElement('span');
    linkDate.classList.add('link-date');
    linkDate.textContent = link.dateCreated;
    linkItem.appendChild(linkDate);

    return linkItem
}

function createLinkContainerEl(currEl){
    // create a tooltip over the current element
    const tooltipContainer = document.createElement('div')
    tooltipContainer.classList.add('tooltip')

    const linkList = document.createElement('div')
    linkList.classList.add('link-list')

    const closeEl = document.createElement('button')
    closeEl.classList.add('close-tooltip')
    closeEl.textContent = 'X'

    linkList.appendChild(closeEl)

    // Function to close the tooltip when the "X" button is clicked
    function closeTooltip() {
        tooltipContainer.remove();
    }

    // Attach the closeTooltipOnClick function to the click event of the "X" button
    closeEl.addEventListener('click', closeTooltip);

    tooltipContainer.style.left = `${currEl.clientX}px`;
    tooltipContainer.style.top = `${currEl.clientY}px`;

    return {tooltipContainer, linkList}
}

function isValidLink(link){
    if (link.score < METAPHOR_SCORE_THRESHOLD) return false
    if (!link.url || !link.title) return false

    // make sure url is not from same domain
    const parsedURL = new URL(link.url)
    const currentDomain = window.location.hostname;
    if (parsedURL.hostname == currentDomain) return false

    return true
}

async function fetchRerank(text, documents,){
    // call to cohere
    const cohere_api_key = 'dXvUkT3DntsiIOhqRU8zDuoEPmE7irjk9z2seDZu'

    const response = await new Promise((resolve) => {
        // Send a message to the background script to fetch the URL
        chrome.runtime.sendMessage({ action: 'fetchRerank', text: text, documents: documents }, (response) => {
            resolve(response);
        });
    });
    return response
}

async function scrape(link){
    function extractReadableText(doc) {
        // Remove script, style, and noscript elements
        const elementsToRemove = doc.querySelectorAll('script, style, noscript');
        elementsToRemove.forEach((element) => element.remove());

        // Retrieve the readable text content
        const readableText = doc.body.textContent.trim();

        return readableText;
    }

    async function fetchContent(url) {
        const response = await new Promise((resolve) => {
            // Send a message to the background script to fetch the URL
            chrome.runtime.sendMessage({ action: 'fetchUrl', url: url }, (response) => {
                resolve(response);
            });
        });
        return response
    }

    async function parseHtml(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const textContent = extractReadableText(doc);
        const images = Array.from(doc.images).map(img => img.src)

        return { textContent, images };
    }

    if (!isValidLink(link)) return
    const html = await fetchContent(link.url)
    const { textContent, images } = await parseHtml(html.html)
    return { textContent, images }
}

async function summarize(text){
    const response = await new Promise((resolve) => {
        // Send a message to the background script to fetch the URL
        chrome.runtime.sendMessage({ action: 'summarize', text: text }, (response) => {
            resolve(response);
        });
    });
    return response
}

// Get results from eventPage.js
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    // get response from metaphor
    if (request.metaphor) {
        console.log(currEl)
        console.log(request.metaphor)

        const selectedText = request.selectedText

        links = request.metaphor.results

        const {tooltipContainer, linkList} = createLinkContainerEl(currEl)

        links.forEach((link) => {
            if (!isValidLink(link)) return
            linkItem =  createLinkEl(link)
            linkList.appendChild(linkItem);
        });

        tooltipContainer.appendChild(linkList)
        currEl.appendChild(tooltipContainer)

        for (let i = 0; i < links.length; i++){
            let link = links[i]
            if (!isValidLink(link)) continue
            const { textContent, images } = await scrape(link)

            // split text into paragraphs, avoiding empty lines and lines with fewer than 10 words
            const paragraphs = textContent.split('\n').filter(line => line.split(' ').length > 10).map((str) => str.trim())
            const paragraphsReranked = await fetchRerank(selectedText, paragraphs)

            const ranks = JSON.parse(paragraphsReranked.ret).results

            const index = ranks[0].index
            let linkEl = tooltipContainer.querySelectorAll('.link-description')[i]
            linkEl.textContent = paragraphs[index]
        }
    }
})