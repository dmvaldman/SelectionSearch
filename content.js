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
    linkTitle.target = '_blank';
    linkTitle.rel = 'noopener noreferrer';
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
        const dx = e.pageX - mousePosition.x
        const dy = e.pageY - mousePosition.y
        const left = parseInt(window.getComputedStyle(linkContainerEl).left)
        const top = parseInt(window.getComputedStyle(linkContainerEl).top)
        linkContainerEl.style.left = `${left + dx}px`
        linkContainerEl.style.top = `${top + dy}px`
        mousePosition.x = e.pageX
        mousePosition.y = e.pageY
    }

    // make topbar draggable
    topBar.addEventListener('mousedown', function(e){
        mousePosition.x = e.pageX
        mousePosition.y = e.pageY
        document.addEventListener('mousemove', moveTooltip)
    })

    document.addEventListener('mouseup', function(){
        document.removeEventListener('mousemove', moveTooltip)
    })

    function closeTooltip() {
        // Clean up resize listeners if still active
        if (isResizing) {
            isResizing = false;
            document.removeEventListener("mousemove", handleResizeMove);
            document.removeEventListener("mouseup", handleResizeUp);
        }
        linkContainerEl.remove();
    }

    // Attach the closeTooltipOnClick function to the click event of the "X" button
    closeEl.addEventListener('click', closeTooltip);

    let isResizing = false;
    let initialWidth, initialHeight, initialMouseX, initialMouseY;

    function handleResizeMove(e) {
        if (!isResizing) return;

        const newWidth = initialWidth + (e.pageX - initialMouseX);
        const newHeight = initialHeight + (e.pageY - initialMouseY);

        // Enforce minimum size
        const minWidth = 300;
        const minHeight = 200;

        linkContainerEl.style.width = Math.max(minWidth, newWidth) + "px";
        linkContainerEl.style.height = Math.max(minHeight, newHeight) + "px";
    }

    function handleResizeUp() {
        if (isResizing) {
            isResizing = false;
            document.removeEventListener("mousemove", handleResizeMove);
            document.removeEventListener("mouseup", handleResizeUp);
        }
    }

    resizeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault(); // Prevent text selection
        isResizing = true;
        initialWidth = linkContainerEl.offsetWidth;
        initialHeight = linkContainerEl.offsetHeight;
        initialMouseX = e.pageX;
        initialMouseY = e.pageY;

        // Attach to document level for better tracking
        document.addEventListener("mousemove", handleResizeMove);
        document.addEventListener("mouseup", handleResizeUp);
    });

    return linkContainerEl
}

function createCarouselEl(linkItem, quotes, images){
    if (!quotes || !Array.isArray(quotes) || quotes.length === 0) return

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

    const updateCarousel = () => {
        carouselContent.style.transform = `translateX(-${currentItemIndex * 100}%)`;
        if (currentItemIndex === 0) {
            prevButton.classList.add('hidden');
        } else {
            prevButton.classList.remove('hidden');
        }
        if (currentItemIndex === totalItems - 1) {
            nextButton.classList.add('hidden');
        } else {
            nextButton.classList.remove('hidden');
        }
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
                const highlights = link.summary?.snippets || []
                const images = []

                createCarouselEl(linkItem, highlights, images)
            }
        }
    }
    else if (request.exaError) {
        // executed on error from Exa API
        const loadEl = linkContainerEl.querySelector('.loading')
        const linkList = linkContainerEl.querySelector('.link-list')

        loadEl.remove()
        // Escape HTML to prevent XSS
        const escapedError = request.exaError.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        linkList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: red;">
                <p style="font-weight: bold; margin-bottom: 10px;">Error: ${escapedError}</p>
                <p style="font-size: 14px;">Please click the extension icon to set your API key.</p>
            </div>
        `
    }
    else if (request.searchSelected){
        // executed on selection of extension from contextmenu

        // create tooltip container
        linkContainerEl = createLinkContainerEl(currEl)

        // Temporarily position off-screen to get computed dimensions
        linkContainerEl.style.visibility = 'hidden';
        linkContainerEl.style.position = 'absolute';
        linkContainerEl.style.top = '-9999px';
        linkContainerEl.style.left = '-9999px';

        // Add to DOM to get computed dimensions
        document.body.prepend(linkContainerEl);

        // Force layout calculation by accessing offsetWidth/offsetHeight
        const modalWidth = linkContainerEl.offsetWidth;
        const modalHeight = linkContainerEl.offsetHeight;

        // position tooltip below of the current element with some margin
        let margin = 50

        // Calculate initial position
        let left = window.scrollX + clientX - margin;
        let top = window.scrollY + clientY - margin;

        // Ensure modal stays within viewport bounds
        // Clamp left: not negative, and right edge doesn't exceed viewport
        left = Math.max(0, Math.min(left, window.scrollX + window.innerWidth - modalWidth));
        // Clamp top: not negative, and bottom edge doesn't exceed viewport
        top = Math.max(0, Math.min(top, window.scrollY + window.innerHeight - modalHeight));

        // Set final position and make visible
        linkContainerEl.style.top = top + "px";
        linkContainerEl.style.left = left + "px";
        linkContainerEl.style.visibility = 'visible';
        loadEl = loadAnimation(linkContainerEl)
    }
})