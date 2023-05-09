const METAPHOR_SCORE_THRESHOLD = 0.16
let currEl = null

function handleRightClick(event) {
    currEl = event.target; // Get the HTML element that was clicked
}

// Add the event listener to intercept the right-click event
document.addEventListener('contextmenu', handleRightClick);

function createLinkEl(link){
    const linkItem = document.createElement('div');
    linkItem.classList.add('link-item');

    // Put link title and date in a container
    const linkTitleDateContainer = document.createElement('div');
    linkTitleDateContainer.classList.add('link-title-date-container');
    linkItem.appendChild(linkTitleDateContainer);

    const linkTitle = document.createElement('a');
    linkTitle.classList.add('link-title');
    linkTitle.href = link.url;
    linkTitle.textContent = link.title;

    // put the URL domain next to it in a span
    const linkDomain = document.createElement('span');
    linkDomain.classList.add('link-domain');
    linkDomain.textContent = new URL(link.url).hostname + ' | ' + link.dateCreated;

    linkTitleDateContainer.appendChild(linkTitle);
    linkTitleDateContainer.appendChild(linkDomain);

    const linkDescription = document.createElement('span');
    linkDescription.classList.add('link-description');
    linkItem.appendChild(linkDescription);

    const tagContainer = document.createElement('div');
    tagContainer.classList.add('tag-container');
    linkItem.appendChild(tagContainer);

    const carouselContainer = document.createElement('div');
    carouselContainer.classList.add('carousel-container');
    linkItem.appendChild(carouselContainer);

    const carouselContent = document.createElement('div');
    carouselContent.classList.add('carousel-content');
    carouselContainer.appendChild(carouselContent);

    // score for debugging purposes
    // const linkScore = document.createElement('span');
    // linkScore.classList.add('link-score');
    // linkScore.textContent = link.score;
    // linkItem.appendChild(linkScore);

    return linkItem
}

function carouselLoadStart(carouselEl){
    // add loading animation to carousel content
    const loadingEl = document.createElement('div');
    loadingEl.classList.add('loading');
    carouselEl.appendChild(loadingEl);
    return loadingEl
}

function createTagEls(linkItemEl, tags){
    if (tags.length == 0) return

    const tagContainer = linkItemEl.querySelector('.tag-container');

    // truncate to three tags
    if (tags.length > 3) tags.splice(3)

    tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.classList.add('link-tag');
        tagEl.textContent = tag;
        tagContainer.appendChild(tagEl);
    });
}

function createLinkContainerEl(currEl){
    // create a tooltip over the current element
    // contains draggable bar, wrapper content, and resize bar
    const tooltipContainer = document.createElement('div')
    tooltipContainer.classList.add('tooltip')

    // create top portion with close bar and draggable bar
    const topBar = document.createElement('div')
    topBar.classList.add('top-bar')

    // contains the content of the tooltip
    const tooltipContainerWrapper = document.createElement('div')
    tooltipContainerWrapper.classList.add('tooltip-wrapper')

    // add resize div
    const resizeHandle = document.createElement('div')
    resizeHandle.textContent = '↘'
    resizeHandle.classList.add('resize-handle')

    const closeEl = document.createElement('button')
    closeEl.classList.add('close-tooltip')
    closeEl.textContent = '×'

    topBar.appendChild(closeEl)
    tooltipContainer.appendChild(topBar)
    tooltipContainer.appendChild(tooltipContainerWrapper)
    tooltipContainer.appendChild(resizeHandle)

    const linkList = document.createElement('div')
    linkList.classList.add('link-list')
    tooltipContainerWrapper.appendChild(linkList)

    let mousePosition = {
        x: 0,
        y: 0
    }

    function moveTooltip(e){
        const dx = e.clientX - mousePosition.x
        const dy = e.clientY - mousePosition.y
        const left = parseInt(window.getComputedStyle(tooltipContainer).left)
        const top = parseInt(window.getComputedStyle(tooltipContainer).top)
        tooltipContainer.style.left = `${left + dx}px`
        tooltipContainer.style.top = `${top + dy}px`
        mousePosition.x = e.clientX
        mousePosition.y = e.clientY
    }

    // make topbar draggable
    topBar.addEventListener('mousedown', function(e){
        mousePosition.x = e.clientX
        mousePosition.y = e.clientY
        document.addEventListener('mousemove', moveTooltip)
    })

    document.addEventListener('mouseup', function(){
        document.removeEventListener('mousemove', moveTooltip)
    })

    function closeTooltip() {
        tooltipContainer.remove();
    }

    // Attach the closeTooltipOnClick function to the click event of the "X" button
    closeEl.addEventListener('click', closeTooltip);

    let isResizing = false;
    let initialWidth, initialHeight, initialMouseX, initialMouseY;

    resizeHandle.addEventListener("mousedown", (e) => {
        isResizing = true;
        initialWidth = tooltipContainer.offsetWidth;
        initialHeight = tooltipContainer.offsetHeight;
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;
    });

    window.addEventListener("mousemove", (e) => {
        if (!isResizing) return;

        const newWidth = initialWidth + (e.clientX - initialMouseX);
        const newHeight = initialHeight + (e.clientY - initialMouseY);

        tooltipContainer.style.width = newWidth + "px";
        tooltipContainer.style.height = newHeight + "px";
    });

    window.addEventListener("mouseup", () => {
        isResizing = false;
    });

    return {tooltipContainer, linkList}
}

function createCarouselEl(linkItem, quotes, images){
    if (quotes.length == 0) return

    const carouselContainer = linkItem.querySelector('.carousel-container');
    const carouselContent = carouselContainer.querySelector('.carousel-content');

    const prevButton = document.createElement('button');
    prevButton.classList.add('carousel-left');
    prevButton.textContent = '❮';
    carouselContainer.insertBefore(prevButton, carouselContainer.firstChild);

    quotes.forEach((quote) => {
        const quoteEl = document.createElement('div');
        quoteEl.classList.add('carousel-item');
        carouselContent.appendChild(quoteEl);
        // truncate after 40 words
        if (quote.split(' ').length > 50)
            quote = quote.split(' ').slice(0, 50).join(' ') + '...';
        quoteEl.textContent = '"' + quote + '"';
    });

    // images.forEach((image) => {
    //     const imageEl = document.createElement('img');
    //     imageEl.classList.add('carousel-item');
    //     carouselContent.appendChild(imageEl);
    //     imageEl.src = image;
    // });

    const nextButton = document.createElement('button');
    nextButton.classList.add('carousel-right');
    nextButton.textContent = '❯';
    carouselContainer.appendChild(nextButton);

    let currentItemIndex = 0;
    const totalItems = quotes.length;
    // const totalItems = quotes.length + images.length;

    const updateCarousel = () => {
        carouselContent.style.transform = `translateX(-${currentItemIndex * 100}%)`;
        prevButton.disabled = currentItemIndex === 0;
        nextButton.disabled = currentItemIndex === totalItems - 1;
    };

    prevButton.addEventListener('click', () => {
        currentItemIndex--;
        updateCarousel();
    });

    nextButton.addEventListener('click', () => {
        currentItemIndex++;
        updateCarousel();
    });

    updateCarousel();
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

async function scrape(link){
    function extractReadableText(doc) {
        // Remove script, style, and noscript elements
        const elementsToRemove = doc.querySelectorAll('script, style, noscript');
        elementsToRemove.forEach((element) => element.remove());

        // Retrieve the readable text content
        let readableText = doc.body.textContent.trim();

        // replace multiple tabs, spaces and newlines with single space
        readableText = readableText.replace(/\s\s+/g, ' ').trim();

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
        // apply the following query selector 'p img' to get images within <p> tags only
        const images = Array.from(doc.querySelectorAll('p img')).map(img => img.src)

        return { textContent, images };
    }

    if (!isValidLink(link)) return
    const html = await fetchContent(link.url)
    const { textContent, images } = await parseHtml(html.html)
    return { textContent, images }
}

async function summarize(selectedText, webText){
    const response = await new Promise((resolve) => {
        // Send a message to the background script to fetch the URL
        chrome.runtime.sendMessage({ action: 'summarize', text: webText, selectedText: selectedText }, (response) => {
            resolve(response);
        });
    });
    return response
}

chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.metaphor) {
        const selectedText = request.selectedText
        const links = request.metaphor.results
        const {tooltipContainer, linkList} = createLinkContainerEl(currEl)

        let validLinks = links.filter(isValidLink)

        for (let i = 0; i < validLinks.length; i++){
            let link = validLinks[i]

            let linkItem = createLinkEl(link)
            linkList.appendChild(linkItem);

            // add loading animation
            let carouselEl = linkItem.querySelector('.carousel-content')
            let carouselLoadEl = carouselLoadStart(carouselEl)

            // Async load all link content
            async function load(link, linkItem, carouselLoadEl){
                const { textContent, images } = await scrape(link)
                const response = await summarize(selectedText, textContent)

                try {
                    const textContentSummary = JSON.parse(response)
                    let descriptionEl = linkItem.querySelector('.link-description')
                    descriptionEl.textContent = textContentSummary.summary
                    createTagEls(linkItem, textContentSummary.keywords)
                    createCarouselEl(linkItem, textContentSummary.passages, images)
                    carouselLoadEl.remove()
                }
                catch (error) {
                    console.log(error)
                }
            }

            load(link, linkItem, carouselLoadEl)
        }

        // position tooltip below of the current element with some margin
        let margin = 20
        const rect = currEl.getBoundingClientRect();
        tooltipContainer.style.top = (rect.bottom + margin) + "px";
        tooltipContainer.style.left = (rect.left + margin) + "px";
        document.body.appendChild(tooltipContainer);
    }
})