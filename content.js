const EXA_SCORE_THRESHOLD = 0.16

let currEl = null
let clientX = 0
let clientY = 0
let linkContainerEl = null

function handleRightClick(event) {
    currEl = event.target; // Get the HTML element that was clicked
    clientX = event.clientX
    clientY = event.clientY
}

// Add the event listener to intercept the right-click event
document.addEventListener('contextmenu', handleRightClick);

function iso2date(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date.getFullYear().toString().slice(2)}`;
    return formattedDate;
}

// DOM element constructors

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
    linkDomain.textContent = new URL(link.url).hostname + ' | ' + iso2date(link.publishedDate);

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

function createLinkContainerEl(currEl){
    // create a tooltip over the current element
    // contains draggable bar, wrapper content, and resize bar
    const linkContainerEl = document.createElement('div')
    linkContainerEl.classList.add('ss')

    // create top portion with close bar and draggable bar
    const topBar = document.createElement('div')
    topBar.classList.add('top-bar')

    // contains the content of the tooltip
    const linkContainerElWrapper = document.createElement('div')
    linkContainerElWrapper.classList.add('tooltip-wrapper')

    // add resize div
    const resizeHandle = document.createElement('div')
    resizeHandle.textContent = '↘'
    resizeHandle.classList.add('resize-handle')

    const closeEl = document.createElement('button')
    closeEl.classList.add('close-tooltip')
    closeEl.textContent = '×'

    topBar.appendChild(closeEl)
    linkContainerEl.appendChild(topBar)
    linkContainerEl.appendChild(linkContainerElWrapper)
    linkContainerEl.appendChild(resizeHandle)

    const linkList = document.createElement('div')
    linkList.classList.add('link-list')
    linkContainerElWrapper.appendChild(linkList)

    let mousePosition = {
        x: 0,
        y: 0
    }

    function moveTooltip(e){
        const dx = e.clientX - mousePosition.x
        const dy = e.clientY - mousePosition.y
        const left = parseInt(window.getComputedStyle(linkContainerEl).left)
        const top = parseInt(window.getComputedStyle(linkContainerEl).top)
        linkContainerEl.style.left = `${left + dx}px`
        linkContainerEl.style.top = `${top + dy}px`
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
        linkContainerEl.remove();
    }

    // Attach the closeTooltipOnClick function to the click event of the "X" button
    closeEl.addEventListener('click', closeTooltip);

    let isResizing = false;
    let initialWidth, initialHeight, initialMouseX, initialMouseY;

    resizeHandle.addEventListener("mousedown", (e) => {
        isResizing = true;
        initialWidth = linkContainerEl.offsetWidth;
        initialHeight = linkContainerEl.offsetHeight;
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;
    });

    window.addEventListener("mousemove", (e) => {
        if (!isResizing) return;

        const newWidth = initialWidth + (e.clientX - initialMouseX);
        const newHeight = initialHeight + (e.clientY - initialMouseY);

        linkContainerEl.style.width = newWidth + "px";
        linkContainerEl.style.height = newHeight + "px";
    });

    window.addEventListener("mouseup", () => {
        isResizing = false;
    });

    return linkContainerEl
}

function createCarouselEl(linkItem, quotes, images){
    if (quotes.length == 0) return

    const carouselContainer = linkItem.querySelector('.carousel-container');
    const carouselContent = carouselContainer.querySelector('.carousel-content');

    const prevButton = document.createElement('button');
    prevButton.classList.add('carousel-button');
    prevButton.classList.add('carousel-left');
    prevButton.textContent = '❮';
    carouselContainer.insertBefore(prevButton, carouselContainer.firstChild);

    quotes.forEach((quote) => {
        const quoteEl = document.createElement('div');
        quoteEl.classList.add('carousel-item');
        carouselContent.appendChild(quoteEl);
        // truncate after 100 words
        if (quote.split(' ').length > 100)
            quote = quote.split(' ').slice(0, 100).join(' ') + '...';
        quoteEl.textContent = '"' + quote + '"';
    });

    const nextButton = document.createElement('button');
    nextButton.classList.add('carousel-button');
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
        if (currentItemIndex === 0) return;
        currentItemIndex--;
        updateCarousel();
    });

    nextButton.addEventListener('click', () => {
        if (currentItemIndex === totalItems - 1) return;
        currentItemIndex++;
        updateCarousel();
    });

    updateCarousel()

    return carouselContainer
}

function loadAnimation(el){
    // add loading animation to element
    const loadingEl = document.createElement('div');
    loadingEl.classList.add('loading');
    el.appendChild(loadingEl);
    return loadingEl
}

function isValidLink(link){
    if (link.score < EXA_SCORE_THRESHOLD) return false
    if (!link.url || !link.title) return false

    // make sure url is not from same domain
    const parsedURL = new URL(link.url)
    const currentDomain = window.location.hostname;
    if (parsedURL.hostname == currentDomain) return false

    return true
}

// Extension message handling
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.exaResponse) {
        // executed on response from Exa
        const links = request.exaResponse.results

        const loadEl = linkContainerEl.querySelector('.loading')
        const linkList = linkContainerEl.querySelector('.link-list')

        loadEl.remove()

        let validLinks = links.filter(isValidLink)

        if (validLinks.length == 0)
            linkList.textContent = 'No references found, Sorry!'
        else {
            for (let i = 0; i < validLinks.length; i++){
                let link = validLinks[i]

                let linkItem = createLinkEl(link)
                linkList.appendChild(linkItem);

                // load content in parallel
                const textContentSummary = link['text']
                const highlights = link['highlights']
                const images = []

                createCarouselEl(linkItem, highlights, images)
            }
        }
    }
    else if (request.searchSelected){
        // executed on selection of extension from contextmenu

        // create tooltip container
        linkContainerEl = createLinkContainerEl(currEl)

        // position tooltip below of the current element with some margin
        let margin = 30
        linkContainerEl.style.top = (window.scrollY + clientY + margin) + "px";
        linkContainerEl.style.left = (clientX + margin) + "px";
        loadEl = loadAnimation(linkContainerEl)

        document.body.prepend(linkContainerEl);
    }
})