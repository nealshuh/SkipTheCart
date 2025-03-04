// content.js - This runs on the Zara cart page

// Add mobile console for debugging
(function() {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/eruda/2.4.1/eruda.min.js';
    document.body.appendChild(script);
    script.onload = function() {
        eruda.init();
        console.log("Eruda console initialized");
    }
})();

// Debug overlay function
function showDebugOverlay(message) {
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

// Log when script is loaded
console.log("Zara Cart Image Extractor: Script loaded");
showDebugOverlay("Script loaded");

// Both DOMContentLoaded and load events for better coverage
document.addEventListener('DOMContentLoaded', function() {
    console.log("Zara Cart Image Extractor: DOMContentLoaded fired");
    showDebugOverlay("DOMContentLoaded fired");
    initializeExtension();
});

window.addEventListener('load', function() {
    console.log("Zara Cart Image Extractor: window.load fired");
    showDebugOverlay("window.load fired");
    initializeExtension();
});

// Initialize the extension
function initializeExtension() {
    // Check if we're on the Zara cart page
    if (window.location.href.includes('zara.com') && window.location.href.includes('/shop/cart')) {
        console.log("Zara Cart Image Extractor: Detected cart URL:", window.location.href);
        showDebugOverlay("Detected cart URL: " + window.location.href);
        
        // Wait a bit for the page to fully load
        setTimeout(extractAndDisplayImages, 1000);
        
        // Also observe for changes in the cart (for dynamic updates)
        setTimeout(observeCartChanges, 1500);
    } else {
        console.log("Zara Cart Image Extractor: Not on cart page. Current URL:", window.location.href);
        showDebugOverlay("Not on cart page. Current URL: " + window.location.href);
    }
}

// Function to extract and display cart images
function extractAndDisplayImages() {
    console.log("Zara Cart Image Extractor: Starting to extract images");
    showDebugOverlay("Starting to extract images");
    
    // First, create our bottom panel if it doesn't exist
    let panel = document.getElementById('zara-cart-panel');
    if (!panel) {
        console.log("Zara Cart Image Extractor: Creating panel");
        showDebugOverlay("Creating panel");
        panel = createBottomPanel();
    } else {
        console.log("Zara Cart Image Extractor: Panel already exists");
        showDebugOverlay("Panel already exists");
    }
    
    // Get all cart items
    const cartItems = document.querySelectorAll('.shop-cart-item');
    console.log("Zara Cart Image Extractor: Found", cartItems.length, "cart items");
    showDebugOverlay("Found " + cartItems.length + " cart items");
    
    if (cartItems.length === 0) {
        // Try alternative selectors based on the HTML you provided
        const altCartItems = document.querySelectorAll('.shop-cart-grid-items .shop-cart-item');
        console.log("Zara Cart Image Extractor: Found", altCartItems.length, "cart items with alternative selector");
        showDebugOverlay("Found " + altCartItems.length + " cart items with alternative selector");
        
        if (altCartItems.length > 0) {
            processCartItems(altCartItems, panel);
        } else {
            panel.innerHTML = '<div class="panel-message">No items found in cart. HTML structure may have changed.</div>';
            
            // Dump page HTML for debugging
            console.log("Page HTML structure:", document.body.innerHTML.substring(0, 1000) + "...");
            showDebugOverlay("Could not find cart items. Check console for HTML structure.");
        }
    } else {
        processCartItems(cartItems, panel);
    }
}

// Process the cart items
function processCartItems(cartItems, panel) {
    // Clear existing content
    panel.innerHTML = '';
    
    // Title for the panel
    const panelTitle = document.createElement('div');
    panelTitle.className = 'panel-title';
    panelTitle.textContent = 'Items in Your Cart';
    panel.appendChild(panelTitle);
    
    // Container for the images
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    panel.appendChild(imageContainer);
    
    // Extract all product information and images
    cartItems.forEach((item, index) => {
        try {
            console.log(`Zara Cart Image Extractor: Processing item ${index+1}`);
            showDebugOverlay(`Processing item ${index+1}`);
            
            // Extract image URL
            const imgElement = item.querySelector('.media-image__image');
            if (!imgElement) {
                console.log(`Zara Cart Image Extractor: No image found for item ${index+1}`);
                showDebugOverlay(`No image found for item ${index+1}`);
                return;
            }
            
            const imageUrl = imgElement.src;
            console.log(`Zara Cart Image Extractor: Found image for item ${index+1}: ${imageUrl}`);
            showDebugOverlay(`Found image for item ${index+1}`);
            
            // Extract product name
            const nameElement = item.querySelector('.shop-cart-item-header__description-link');
            const productName = nameElement ? nameElement.textContent.trim() : 'Product';
            
            // Extract price
            const priceElement = item.querySelector('.money-amount__main');
            const price = priceElement ? priceElement.textContent.trim() : '';
            
            // Extract size and color
            const sizeElement = item.querySelector('.shop-cart-item-details-base__size');
            const colorElement = item.querySelector('.shop-cart-item-details-base__color');
            const size = sizeElement ? sizeElement.textContent.trim() : '';
            const color = colorElement ? colorElement.textContent.trim() : '';
            
            // Create item container
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            
            // Create item image
            const itemImg = document.createElement('img');
            itemImg.src = imageUrl;
            itemImg.alt = productName;
            itemImg.className = 'item-image';
            
            // Create item details
            const detailsElement = document.createElement('div');
            detailsElement.className = 'item-details';
            
            // Add product name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'item-name';
            nameDiv.textContent = productName;
            detailsElement.appendChild(nameDiv);
            
            // Add price
            const priceDiv = document.createElement('div');
            priceDiv.className = 'item-price';
            priceDiv.textContent = price;
            detailsElement.appendChild(priceDiv);
            
            // Add size and color
            const specDiv = document.createElement('div');
            specDiv.className = 'item-specs';
            specDiv.textContent = `${size} | ${color}`;
            detailsElement.appendChild(specDiv);
            
            // Add all elements to item container
            itemElement.appendChild(itemImg);
            itemElement.appendChild(detailsElement);
            
            // Add item to the image container
            imageContainer.appendChild(itemElement);
        } catch (error) {
            console.error('Zara Cart Image Extractor: Error extracting item details:', error);
            showDebugOverlay('Error extracting item details: ' + error.message);
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
    
    console.log("Zara Cart Image Extractor: Panel populated and displayed");
    showDebugOverlay("Panel populated and displayed");
}

// Function to create the bottom panel
function createBottomPanel() {
    // Add our CSS to the page
    const style = document.createElement('style');
    style.textContent = `
        #zara-cart-panel {
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
        
        #zara-cart-panel.hidden {
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
    panel.id = 'zara-cart-panel';
    panel.className = 'cart-panel';
    document.body.appendChild(panel);
    
    console.log("Zara Cart Image Extractor: Bottom panel created");
    showDebugOverlay("Bottom panel created");
    
    return panel;
}

// Observe changes to the cart to update our panel
function observeCartChanges() {
    console.log("Zara Cart Image Extractor: Setting up observer");
    showDebugOverlay("Setting up observer");
    
    // Look for the cart container
    const cartContainer = document.querySelector('.shop-cart-grid-items');
    
    if (cartContainer) {
        console.log("Zara Cart Image Extractor: Found cart container to observe");
        showDebugOverlay("Found cart container to observe");
        
        const observer = new MutationObserver(function(mutations) {
            console.log("Zara Cart Image Extractor: Cart content changed, updating panel");
            showDebugOverlay("Cart content changed, updating panel");
            extractAndDisplayImages();
        });
        
        observer.observe(cartContainer, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class']
        });
    } else {
        console.log("Zara Cart Image Extractor: Couldn't find cart container to observe");
        showDebugOverlay("Couldn't find cart container to observe");
        
        // Try to find any element that might contain cart items for observation
        const altContainer = document.querySelector('main') || document.body;
        
        if (altContainer) {
            console.log("Zara Cart Image Extractor: Using alternative container for observation");
            showDebugOverlay("Using alternative container for observation");
            
            const observer = new MutationObserver(function(mutations) {
                // Check if our target elements have appeared
                if (document.querySelector('.shop-cart-item') ||
                    document.querySelector('.shop-cart-grid-items')) {
                    console.log("Zara Cart Image Extractor: Cart elements appeared, updating panel");
                    showDebugOverlay("Cart elements appeared, updating panel");
                    extractAndDisplayImages();
                }
            });
            
            observer.observe(altContainer, {
                subtree: true,
                childList: true
            });
        }
    }
}

// Handle messages from popup or background
chrome.runtime.onMessage?.addListener(function(message, sender, sendResponse) {
    if (message.action === "showPanel") {
        let panel = document.getElementById('zara-cart-panel');
        if (panel) {
            panel.classList.remove('hidden');
        } else {
            extractAndDisplayImages();
        }
    }
});

// Additional initialization for iOS Safari which might behave differently
if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
    console.log("Zara Cart Image Extractor: iOS device detected, adding additional initialization");
    showDebugOverlay("iOS device detected, adding additional initialization");
    
    // Try initializing after a delay in case the normal events don't fire as expected
    setTimeout(function() {
        console.log("Zara Cart Image Extractor: Delayed initialization");
        showDebugOverlay("Delayed initialization");
        initializeExtension();
    }, 2000);
}
