//
//  aritzia-content.js
//  PursePause for Aritzia
//
//  Created on 3/4/25.
//

// IMMEDIATE SELF-EXECUTING FUNCTION FOR INSTANT DEBUGGING
(function() {
    // Create debug overlay immediately before anything else
    function createDebugOverlay() {
        if (document.getElementById('debug-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.color = 'white';
        overlay.style.padding = '20px';
        overlay.style.zIndex = '10000';
        overlay.style.maxHeight = '50%';
        overlay.style.overflow = 'auto';
        
        // Add initial message
        const initialMessage = document.createElement('div');
        initialMessage.textContent = `[${new Date().toLocaleTimeString()}] PursePause initialized`;
        overlay.appendChild(initialMessage);
        
        // Append to document if body exists, otherwise wait for it
        if (document.body) {
            document.body.appendChild(overlay);
            console.log("DEBUG: Debug overlay created immediately");
        } else {
            // Set up a loop to check for body
            const checkBodyInterval = setInterval(function() {
                if (document.body) {
                    document.body.appendChild(overlay);
                    console.log("DEBUG: Debug overlay created after body was available");
                    clearInterval(checkBodyInterval);
                }
            }, 10);
        }
    }
    
    // Call immediately
    createDebugOverlay();
    
    // Add first log message
    console.log("PursePause: Script initialized - immediate execution");
    showDebugOverlay("Script initialized - immediate execution");
})();

// Debug overlay function - works even if body isn't ready yet
function showDebugOverlay(message) {
    console.log(`DEBUG: ${message}`); // Always log to console
    
    // If body doesn't exist yet, queue the message and add it later
    if (!document.body) {
        if (!window.debugMessageQueue) window.debugMessageQueue = [];
        window.debugMessageQueue.push(message);
        return;
    }
    
    let overlay = document.getElementById('debug-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.color = 'white';
        overlay.style.padding = '20px';
        overlay.style.zIndex = '10000';
        overlay.style.maxHeight = '50%';
        overlay.style.overflow = 'auto';
        document.body.appendChild(overlay);
    }
    
    const logLine = document.createElement('div');
    logLine.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    overlay.appendChild(logLine);
}

// Process any queued messages once body is available
document.addEventListener('DOMContentLoaded', function() {
    if (window.debugMessageQueue && window.debugMessageQueue.length) {
        window.debugMessageQueue.forEach(function(message) {
            showDebugOverlay(message);
        });
        window.debugMessageQueue = [];
    }
});

// Add Eruda console for mobile debugging
setTimeout(function() {
    if (document.body) {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/eruda/2.4.1/eruda.min.js';
        document.body.appendChild(script);
        script.onload = function() {
            eruda.init();
            console.log("Eruda console initialized");
            showDebugOverlay("Eruda console initialized");
        }
    }
}, 100);

// Log when script is loaded
console.log("PursePause for Aritzia: Script loaded");
showDebugOverlay("Script loaded");

// Track if we've already initialized for the current page
let hasInitialized = false;
let isCartPage = false;
let continuousCheckInterval = null;
let lastCheckedUrl = '';

// =============================================
// CORE INITIALIZATION STRATEGIES
// =============================================

// Check if we're on an Aritzia website regardless of page
function checkIfAritziaPage() {
    const isAritzia = window.location.href.includes('aritzia.com');
    if (isAritzia) {
        showDebugOverlay("Detected Aritzia website");
    }
    return isAritzia;
}

// Check if we're on an Aritzia cart page
function checkIfCartPage() {
    try {
        // First check if we're on Aritzia at all
        if (!checkIfAritziaPage()) {
            return false;
        }
        
        // Check URL pattern - this is the most reliable method
        const isCartUrl = window.location.href.includes('/cart') ||
                          window.location.href.includes('/checkout') ||
                          window.location.href.includes('/shopping-bag');
        
        if (isCartUrl) {
            console.log("PursePause: Detected Aritzia cart page via URL");
            showDebugOverlay("Detected Aritzia cart page via URL");
            isCartPage = true;
            return true;
        }
        
        // Check for Aritzia-specific cart elements
        const hasCartElements = Boolean(
            document.querySelector('.ar-cart__table') ||
            document.querySelector('.ar-cart-item') ||
            document.querySelector('#js-cart-table') ||
            document.querySelector('[data-selid="bag-product-info"]') ||
            document.title.toLowerCase().includes('shopping bag')
        );
        
        if (hasCartElements) {
            console.log("PursePause: Detected Aritzia cart page via cart elements");
            showDebugOverlay("Detected Aritzia cart page via cart elements");
            isCartPage = true;
            return true;
        }
        
        // Additional check for any element with "cart" or "bag" in its text
        const cartTextCheck = Array.from(document.querySelectorAll('*')).some(el => {
            return (el.id && (el.id.toLowerCase().includes('cart') || el.id.toLowerCase().includes('bag'))) ||
                   (el.className && typeof el.className === 'string' &&
                    (el.className.toLowerCase().includes('cart') || el.className.toLowerCase().includes('bag'))) ||
                   (el.textContent && (el.textContent.toLowerCase().includes('shopping bag') ||
                                      el.textContent.toLowerCase().includes('my bag')));
        });
        
        if (cartTextCheck) {
            console.log("PursePause: Detected Aritzia cart page via text content");
            showDebugOverlay("Detected Aritzia cart page via text content");
            isCartPage = true;
            return true;
        }
        
        isCartPage = false;
        return false;
    } catch (error) {
        console.error("PursePause: Error checking if cart page:", error);
        showDebugOverlay("Error checking if cart page: " + error.message);
        return false;
    }
}

// Main initialization function - try to extract cart items
function initializeExtension() {
    try {
        console.log("PursePause: Attempting to initialize extension");
        showDebugOverlay("Attempting to initialize extension");
        
        // Always check if we're on Aritzia first
        if (!checkIfAritziaPage()) {
            console.log("PursePause: Not on Aritzia website");
            showDebugOverlay("Not on Aritzia website, exiting initialization");
            return;
        }
        
        showDebugOverlay("On Aritzia website: " + window.location.href);
        
        if (hasInitialized) {
            console.log("PursePause: Already initialized, skipping");
            showDebugOverlay("Already initialized, skipping");
            return;
        }
        
        // Check if we're on a cart page
        const isOnCartPage = checkIfCartPage();
        console.log(`PursePause: Is on cart page? ${isOnCartPage}`);
        
        if (isOnCartPage) {
            hasInitialized = true;
            console.log("PursePause: Initializing extension on Aritzia cart page");
            showDebugOverlay("Initializing extension on Aritzia cart page");
            
            // Extract cart items immediately
            extractAndDisplayImages();
            
            // Set up observation for dynamic changes
            observeCartChanges();
            
            // Set up continuous checking for cart items (safety net)
            setupContinuousChecking();
        } else {
            console.log("PursePause: Not on cart page. Current URL:", window.location.href);
            showDebugOverlay("Not on cart page. Current URL: " + window.location.href);
        }
    } catch (error) {
        console.error("PursePause: Error during initialization:", error);
        showDebugOverlay("Error during initialization: " + error.message);
    }
}

// =============================================
// MONITORING FOR NAVIGATION EVENTS
// =============================================

// Listen to all possible events that might signal navigation or page changes
document.addEventListener('DOMContentLoaded', function() {
    console.log("PursePause: DOMContentLoaded fired");
    showDebugOverlay("DOMContentLoaded fired");
    initializeExtension();
});

window.addEventListener('load', function() {
    console.log("PursePause: window.load fired");
    showDebugOverlay("window.load fired");
    initializeExtension();
});

// Initialize immediately if document is already complete
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("PursePause: Document already ready, initializing immediately");
    showDebugOverlay("Document already ready, initializing immediately");
    setTimeout(initializeExtension, 100); // Small delay to ensure DOM is accessible
}

// Monitor for History API changes - crucial for SPA navigation
const originalPushState = history.pushState;
history.pushState = function() {
    originalPushState.apply(this, arguments);
    console.log("PursePause: pushState detected");
    showDebugOverlay("pushState detected");
    handleStateChange();
};

const originalReplaceState = history.replaceState;
history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    console.log("PursePause: replaceState detected");
    showDebugOverlay("replaceState detected");
    handleStateChange();
};

window.addEventListener('popstate', function() {
    console.log("PursePause: popstate event detected");
    showDebugOverlay("popstate event detected");
    handleStateChange();
});

// Handle any state change that might signal navigation
function handleStateChange() {
    // Reset initialization flag when URL changes
    if (lastCheckedUrl !== window.location.href) {
        hasInitialized = false;
        const newUrl = window.location.href;
        console.log("PursePause: URL changed to:", newUrl);
        showDebugOverlay("URL changed to: " + newUrl);
        lastCheckedUrl = newUrl;
    }
    
    // Check immediately
    setTimeout(initializeExtension, 100);
    
    // And check again after delay to catch slower loading content
    setTimeout(initializeExtension, 1000);
    setTimeout(initializeExtension, 2000);
}

// Set up continuous checking for cart UI elements appearing
function setupContinuousChecking() {
    if (continuousCheckInterval) {
        clearInterval(continuousCheckInterval);
    }
    
    continuousCheckInterval = setInterval(function() {
        if (checkIfCartPage() && !document.getElementById('aritzia-panel')) {
            console.log("PursePause: Continuous check found Aritzia cart page without panel");
            showDebugOverlay("Continuous check triggered panel creation");
            extractAndDisplayImages();
        }
    }, 1000); // Check every second
    
    // Safety - stop checking after 30 seconds to avoid infinite resource usage
    setTimeout(function() {
        if (continuousCheckInterval) {
            clearInterval(continuousCheckInterval);
            console.log("PursePause: Stopped continuous checking after timeout");
        }
    }, 30000);
}

// Observe for critical DOM mutations that might contain cart elements
function observeBodyForCartElements() {
    const observer = new MutationObserver(function(mutations) {
        // If we detect any significant change to the DOM and URL contains cart/bag
        if (!hasInitialized &&
            (window.location.href.includes('/cart') ||
             window.location.href.includes('/shopping-bag'))) {
            setTimeout(function() {
                if (checkIfCartPage()) {
                    console.log("PursePause: DOM mutation observer detected cart page");
                    showDebugOverlay("DOM mutation triggered initialization");
                    initializeExtension();
                }
            }, 500);
        }
    });
    
    // Observe the entire body for any changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
}

// Start body observation as soon as possible
if (document.body) {
    observeBodyForCartElements();
} else {
    document.addEventListener('DOMContentLoaded', observeBodyForCartElements);
}

// =============================================
// EXTRACT AND DISPLAY CART ITEMS
// =============================================

// Function to extract and display cart images
function extractAndDisplayImages() {
    console.log("PursePause: Starting to extract Aritzia cart images");
    showDebugOverlay("Starting to extract Aritzia cart images");
    
    // First, create our bottom panel if it doesn't exist
    let panel = document.getElementById('aritzia-panel');
    if (!panel) {
        console.log("PursePause: Creating panel");
        showDebugOverlay("Creating panel");
        panel = createBottomPanel();
    } else {
        console.log("PursePause: Panel already exists");
        showDebugOverlay("Panel already exists");
    }
    
    // Try Aritzia-specific selectors
    const selectors = [
        '.ar-cart-item',
        '.ar-cart__table .ar-cart-item',
        '#js-cart-table .ar-cart-item',
        '#js-cart-table li',
        '[data-selid="bag-product-info"]',
        '[class*="cart-item"]',
        '[class*="bag-item"]'
    ];
    
    let cartItems = [];
    let usedSelector = '';
    
    // Try each selector until we find cart items
    for (const selector of selectors) {
        const items = document.querySelectorAll(selector);
        console.log(`PursePause: Trying Aritzia selector "${selector}" - found ${items.length} items`);
        showDebugOverlay(`Selector "${selector}": ${items.length} items`);
        
        if (items.length > 0) {
            cartItems = items;
            usedSelector = selector;
            break;
        }
    }
    
    if (cartItems.length === 0) {
        panel.innerHTML = '<div class="panel-message">Looking for items in your Aritzia bag...</div>';
        
        // Dump page HTML for debugging
        const htmlSample = document.body.innerHTML.substring(0, 1000) + "...";
        console.log("Page HTML structure:", htmlSample);
        showDebugOverlay("Could not find Aritzia cart items. Check console for HTML structure.");
        
        // Set up a more aggressive observer to catch when items appear
        setupAggressiveCartObserver();
    } else {
        processAritziaCartItems(cartItems, panel, usedSelector);
    }
}

// More aggressive observation strategy
function setupAggressiveCartObserver() {
    console.log("PursePause: Setting up aggressive observer for Aritzia");
    showDebugOverlay("Setting up aggressive observer for Aritzia");
    
    const selectors = [
        '.ar-cart-item',
        '#js-cart-table li',
        '[data-selid="bag-product-info"]',
        '.ar-cart__table'
    ].join(', ');
    
    const observer = new MutationObserver(function(mutations) {
        // Check if any cart items have appeared using all our selectors
        const anyCartItems = document.querySelectorAll(selectors).length > 0;
        
        if (anyCartItems) {
            console.log("PursePause: Items detected via aggressive observer");
            showDebugOverlay("Items detected via aggressive observer");
            observer.disconnect();
            extractAndDisplayImages();
        }
    });
    
    // Observe the entire document
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: false
    });
    
    // Safety timeout to avoid observing forever
    setTimeout(() => {
        observer.disconnect();
        console.log("PursePause: Disconnected aggressive observer after timeout");
        showDebugOverlay("Disconnected aggressive observer after timeout");
    }, 10000);
}

// Process the Aritzia cart items
function processAritziaCartItems(cartItems, panel, usedSelector) {
    // Clear existing content
    panel.innerHTML = '';
    
    // Title for the panel
    const panelTitle = document.createElement('div');
    panelTitle.className = 'panel-title';
    panelTitle.textContent = 'Items in Your Aritzia Bag';
    panel.appendChild(panelTitle);
    
    // Container for the images
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    panel.appendChild(imageContainer);
    
    // Extract all product information and images
    cartItems.forEach((item, index) => {
        try {
            console.log(`PursePause: Processing Aritzia item ${index+1}`);
            showDebugOverlay(`Processing Aritzia item ${index+1}`);
            
            // Aritzia-specific image selectors
            let imageUrl = '';
            const imageElement = item.querySelector('.ar-cart-item__img img') ||
                                 item.querySelector('[class*="cart-item"] img') ||
                                 item.querySelector('img');
            
            if (imageElement && imageElement.src) {
                imageUrl = imageElement.src;
            }
            
            if (!imageUrl) {
                console.log(`PursePause: No image found for Aritzia item ${index+1}`);
                showDebugOverlay(`No image found for Aritzia item ${index+1}`);
                return;
            }
            
            console.log(`PursePause: Found image for Aritzia item ${index+1}: ${imageUrl}`);
            showDebugOverlay(`Found image for Aritzia item ${index+1}`);
            
            // Extract product details
            let productBrand = '';
            const brandElement = item.querySelector('.js-cart-item__product-brand');
            if (brandElement) {
                productBrand = brandElement.textContent.trim();
            }
            
            let productName = '';
            const nameElement = item.querySelector('.js-cart-item__product-name');
            if (nameElement) {
                productName = nameElement.textContent.trim();
            }
            
            let productPrice = '';
            const priceElement = item.querySelector('.js-cart-item__product-price span');
            if (priceElement) {
                productPrice = priceElement.textContent.trim();
            }
            
            let productColor = '';
            const colorElement = item.querySelector('.js-cart-item__product-color');
            if (colorElement) {
                productColor = colorElement.textContent.trim();
            }
            
            let productSize = '';
            const sizeElement = item.querySelector('.js-cart-item__product-size');
            if (sizeElement) {
                productSize = sizeElement.textContent.trim().replace(/\s+/g, ' ');
            }
            
            // Fallback for product name if not found
            if (!productName) {
                const titleElement = item.querySelector('[title]');
                if (titleElement && titleElement.getAttribute('title')) {
                    productName = titleElement.getAttribute('title');
                } else {
                    productName = 'Product';
                }
            }
            
            // Create item container
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            
            // Create item image
            const itemImg = document.createElement('img');
            itemImg.src = imageUrl;
            itemImg.alt = productName;
            itemImg.className = 'item-image';
            itemImg.onerror = function() {
                // If image fails to load, try to fix common URL issues
                if (imageUrl.includes('?')) {
                    // Try removing query parameters
                    this.src = imageUrl.split('?')[0];
                } else if (!imageUrl.startsWith('http')) {
                    // Try adding protocol if missing
                    this.src = 'https:' + imageUrl;
                }
            };
            
            // Create item details
            const detailsElement = document.createElement('div');
            detailsElement.className = 'item-details';
            
            // Add brand if available
            if (productBrand) {
                const brandDiv = document.createElement('div');
                brandDiv.className = 'item-brand';
                brandDiv.textContent = productBrand;
                detailsElement.appendChild(brandDiv);
            }
            
            // Add product name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'item-name';
            nameDiv.textContent = productName;
            detailsElement.appendChild(nameDiv);
            
            // Add price
            const priceDiv = document.createElement('div');
            priceDiv.className = 'item-price';
            priceDiv.textContent = productPrice;
            detailsElement.appendChild(priceDiv);
            
            // Add size and color
            const specDiv = document.createElement('div');
            specDiv.className = 'item-specs';
            specDiv.textContent = `${productSize} | ${productColor}`;
            detailsElement.appendChild(specDiv);
            
            // Add all elements to item container
            itemElement.appendChild(itemImg);
            itemElement.appendChild(detailsElement);
            
            // Add item to the image container
            imageContainer.appendChild(itemElement);
        } catch (error) {
            console.error('PursePause: Error extracting Aritzia item details:', error);
            showDebugOverlay('Error extracting Aritzia item details: ' + error.message);
        }
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', function() {
        panel.classList.add('hidden');
    });
    panel.appendChild(closeButton);
    
    // Show panel
    panel.classList.remove('hidden');
    
    console.log("PursePause: Aritzia panel populated and displayed");
    showDebugOverlay("Aritzia panel populated and displayed");
}

// Function to create the bottom panel
function createBottomPanel() {
    // Add our CSS to the page
    const style = document.createElement('style');
    style.textContent = `
        #aritzia-panel {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background-color: white;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            padding: 15px;
            transition: transform 0.3s ease;
            max-height: 220px;
            overflow-y: auto;
        }
        
        #aritzia-panel.hidden {
            transform: translateY(100%);
        }
        
        .panel-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .image-container {
            display: flex;
            overflow-x: auto;
            gap: 15px;
            padding-bottom: 10px;
        }
        
        .cart-item {
            display: flex;
            flex-direction: column;
            min-width: 120px;
            max-width: 120px;
        }
        
        .item-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 4px;
        }
        
        .item-details {
            padding: 5px 0;
        }
        
        .item-brand {
            font-size: 11px;
            color: #444;
            margin-bottom: 2px;
        }
        
        .item-name {
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .item-price {
            font-size: 12px;
            color: #777;
        }
        
        .item-specs {
            font-size: 10px;
            color: #999;
        }
        
        .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #444;
        }
        
        .panel-message {
            padding: 20px;
            text-align: center;
            color: #777;
        }
    `;
    document.head.appendChild(style);
    
    // Create the panel
    const panel = document.createElement('div');
    panel.id = 'aritzia-panel';
    panel.className = 'cart-panel';
    document.body.appendChild(panel);
    
    console.log("PursePause: Bottom panel created");
    showDebugOverlay("Bottom panel created");
    
    return panel;
}

// Observe changes to the cart to update our panel
function observeCartChanges() {
    console.log("PursePause: Setting up observer for Aritzia");
    showDebugOverlay("Setting up observer for Aritzia");
    
    // Different selectors for Aritzia
    const possibleCartContainers = [
        '.ar-cart__table',
        '#js-cart-table',
        '[class*="cart-container"]',
        '[class*="bag-container"]',
        'main'
    ];
    
    let cartContainer = null;
    
    // Try each possible container selector
    for (const selector of possibleCartContainers) {
        cartContainer = document.querySelector(selector);
        if (cartContainer) {
            console.log(`PursePause: Found Aritzia cart container "${selector}" to observe`);
            showDebugOverlay(`Found Aritzia cart container "${selector}" to observe`);
            break;
        }
    }
    
    if (cartContainer) {
        const observer = new MutationObserver(function(mutations) {
            console.log("PursePause: Aritzia cart content changed, updating panel");
            showDebugOverlay("Aritzia cart content changed, updating panel");
            extractAndDisplayImages();
        });
        
        observer.observe(cartContainer, {
            subtree: true,
            childList: true,
            attributes: true
        });
    } else {
        console.log("PursePause: Couldn't find Aritzia cart container to observe");
        showDebugOverlay("Couldn't find Aritzia cart container to observe");
        
        // Fallback to body observation with more focused checking
        const observer = new MutationObserver(function(mutations) {
            // Look for mutations that might indicate cart items loading
            const relevantTerms = ['cart', 'bag'];
            
            const cartRelatedMutation = mutations.some(mutation => {
                // Check if mutation target or its parent has cart/bag-related class/id
                const targetHasRelevantClass = mutation.target.className &&
                    typeof mutation.target.className === 'string' &&
                    relevantTerms.some(term => mutation.target.className.toLowerCase().includes(term));
                
                const targetHasRelevantId = mutation.target.id &&
                    relevantTerms.some(term => mutation.target.id.toLowerCase().includes(term));
                
                const parentHasRelevantClass = mutation.target.parentElement &&
                    mutation.target.parentElement.className &&
                    typeof mutation.target.parentElement.className === 'string' &&
                    relevantTerms.some(term => mutation.target.parentElement.className.toLowerCase().includes(term));
                
                return targetHasRelevantClass || targetHasRelevantId || parentHasRelevantClass;
            });
            
            if (cartRelatedMutation) {
                console.log("PursePause: Aritzia cart-related DOM change detected");
                showDebugOverlay("Aritzia cart-related DOM change detected");
                extractAndDisplayImages();
            }
        });
        
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'id']
        });
    }
}
