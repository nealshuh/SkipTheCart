//
//  content.js
//  CartImageExtractor
//
//  Created by Prafull Sharma on 3/22/25.
//

/**
 * Cart Image Extractor - Multi-site cart visualization extension
 * ============================================================
 *
 * This extension creates a visual summary panel for e-commerce shopping carts.
 * It detects when a user is on a supported site's cart page, extracts product
 * information (images, names, prices, colors, sizes), and displays them in a
 * consistent, user-friendly panel at the bottom of the page.
 *
 * ## How to add support for new sites:
 *
 * 1. Each site needs an entry in the SITE_CONFIGS object with:
 *    - cartDetection: Patterns to detect cart pages (URL patterns, DOM selectors, text)
 *    - itemSelectors: CSS selectors for finding items and their attributes
 *
 * 2. To add a new site:
 *    a) Find an example cart page with items added to it
 *    b) Identify the HTML structure for cart items (inspect the DOM)
 *    c) Create CSS selectors for:
 *       - Container elements that hold each cart item
 *       - Item images
 *       - Product names
 *       - Prices
 *       - Size/variant information
 *       - Color information
 *    d) Add a site detection condition in the detectCurrentSite() function
 *    e) Test with the site's cart page to verify selectors work
 *
 * The extension uses multiple strategies to handle different site implementations:
 * - SPA detection via History API interception
 * - DOM mutation observation for dynamic content
 * - Multiple fallback selectors per site
 * - Aggressive retry mechanisms
 *
 * ## Current limitations:
 * - Panel styling is generic (may need site-specific tweaks)
 * - Error handling is basic (could use more robust recovery)
 *
 * When implementing new sites, focus on precise selectors for elements to avoid
 * false positives and ensure consistent extraction.
 */

// ==============================================
// SITE CONFIGURATIONS
// ==============================================

const SITE_CONFIGS = {
  zara: {
    // URL patterns to detect cart pages
    cartDetection: {
      urlPatterns: ['/shop/cart', '/cart', '/checkout'],
      domSelectors: [
        '.shop-cart-item',
        '.shop-cart-grid-items',
        '[data-qa-id="cart-item"]',
        '[data-testid="cart-item"]',
        '.cart-container'
      ],
      textIndicators: ['shopping cart', 'basket', 'cart']
    },
    // Selectors for cart items and their components
    itemSelectors: {
      container: [
        '.shop-cart-item',
        '[data-qa-id="cart-item"]',
        '.cart-items .item',
        '.cart-product'
      ],
      image: [
        '.media-image__image',
        'img.product-image',
        '[data-qa-id="product-image"] img',
        'img[src*="product"]'
      ],
      name: [
        '.shop-cart-item-header__description-link',
        '.product-name',
        '[data-qa-id="product-name"]',
        '.item-title'
      ],
      price: [
        '.money-amount__main',
        '.price',
        '[data-qa-id="price"]',
        '.item-price'
      ],
      size: [
        '.shop-cart-item-details-base__size',
        '.size',
        '[data-qa-id="size"]',
        '.item-size'
      ],
      color: [
        '.shop-cart-item-details-base__color',
        '.color',
        '[data-qa-id="color"]',
        '.item-color'
      ]
    }
  }
  // Additional sites can be added here
};

// ==============================================
// INITIALIZATION & DEBUGGING UTILITIES
// ==============================================

// Inject Eruda console for mobile debugging
(function() {
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/eruda/2.4.1/eruda.min.js';
  document.body.appendChild(script);
  script.onload = function() {
    eruda.init();
    console.log("Console initialized for debugging");
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
console.log("Cart Image Extractor: Script loaded");
showDebugOverlay("Script loaded");

// State tracking variables
let hasInitialized = false;
let isCartPage = false;
let continuousCheckInterval = null;
let lastCheckedUrl = '';
let currentSiteConfig = null;

// ==============================================
// SITE DETECTION
// ==============================================

function detectCurrentSite() {
  const hostname = window.location.hostname;
  
  // Check for each supported site
  if (hostname.includes('zara.com')) {
    return SITE_CONFIGS.zara;
  }
  
  // Add additional site detections here
  
  // Default to null if no site matches
  return null;
}

// Check if we're on a cart page
function checkIfCartPage() {
  // Get current site configuration
  currentSiteConfig = detectCurrentSite();
  if (!currentSiteConfig) {
    console.log("Cart Image Extractor: Site not supported");
    return false;
  }
  
  const config = currentSiteConfig;
  
  // Check URL pattern
  const isCartUrl = config.cartDetection.urlPatterns.some(pattern =>
    window.location.href.includes(pattern)
  );
  
  // Check for cart elements that might appear in the DOM
  const hasCartElements = config.cartDetection.domSelectors.some(selector =>
    Boolean(document.querySelector(selector))
  );
  
  // Check if there's any element with cart indicator text
  const cartTextCheck = config.cartDetection.textIndicators.some(text => {
    return Array.from(document.querySelectorAll('*')).some(el => {
      return (el.id && el.id.toLowerCase().includes(text)) ||
             (el.className && el.className.toString().toLowerCase().includes(text)) ||
             (el.textContent && el.textContent.toLowerCase().includes(text));
    });
  });
  
  isCartPage = isCartUrl || hasCartElements || cartTextCheck;
  
  if (isCartPage) {
    console.log("Cart Image Extractor: Detected cart page");
    showDebugOverlay("Detected cart page with method: " +
                     (isCartUrl ? "URL match, " : "") +
                     (hasCartElements ? "Cart elements, " : "") +
                     (cartTextCheck ? "Text match" : ""));
  }
  
  return isCartPage;
}

// ==============================================
// CORE INITIALIZATION
// ==============================================

// Main initialization function - try to extract cart items
function initializeExtension() {
  if (hasInitialized) {
    console.log("Cart Image Extractor: Already initialized, skipping");
    return;
  }
  
  if (checkIfCartPage()) {
    hasInitialized = true;
    console.log("Cart Image Extractor: Initializing extension on cart page");
    showDebugOverlay("Initializing extension on cart page");
    
    // Extract cart items immediately
    extractAndDisplayImages();
    
    // Set up observation for dynamic changes
    observeCartChanges();
    
    // Set up continuous checking for cart items (safety net)
    setupContinuousChecking();
  } else {
    console.log("Cart Image Extractor: Not on cart page. Current URL:", window.location.href);
    showDebugOverlay("Not on cart page. Current URL: " + window.location.href);
  }
}

// ==============================================
// MONITORING FOR NAVIGATION EVENTS
// ==============================================

// Listen to all possible events that might signal navigation or page changes
document.addEventListener('DOMContentLoaded', function() {
  console.log("Cart Image Extractor: DOMContentLoaded fired");
  showDebugOverlay("DOMContentLoaded fired");
  initializeExtension();
});

window.addEventListener('load', function() {
  console.log("Cart Image Extractor: window.load fired");
  showDebugOverlay("window.load fired");
  initializeExtension();
});

// Monitor for History API changes - crucial for SPA navigation
const originalPushState = history.pushState;
history.pushState = function() {
  originalPushState.apply(this, arguments);
  console.log("Cart Image Extractor: pushState detected");
  showDebugOverlay("pushState detected");
  handleStateChange();
};

const originalReplaceState = history.replaceState;
history.replaceState = function() {
  originalReplaceState.apply(this, arguments);
  console.log("Cart Image Extractor: replaceState detected");
  showDebugOverlay("replaceState detected");
  handleStateChange();
};

window.addEventListener('popstate', function() {
  console.log("Cart Image Extractor: popstate event detected");
  showDebugOverlay("popstate event detected");
  handleStateChange();
});

// Handle any state change that might signal navigation
function handleStateChange() {
  // Reset initialization flag when URL changes
  if (lastCheckedUrl !== window.location.href) {
    hasInitialized = false;
    const newUrl = window.location.href;
    console.log("Cart Image Extractor: URL changed to:", newUrl);
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
    if (checkIfCartPage() && !document.getElementById('cart-panel')) {
      console.log("Cart Image Extractor: Continuous check found cart page without panel");
      showDebugOverlay("Continuous check triggered panel creation");
      extractAndDisplayImages();
    }
  }, 1000); // Check every second
  
  // Safety - stop checking after 30 seconds to avoid infinite resource usage
  setTimeout(function() {
    if (continuousCheckInterval) {
      clearInterval(continuousCheckInterval);
      console.log("Cart Image Extractor: Stopped continuous checking after timeout");
    }
  }, 30000);
}

// Observe for critical DOM mutations that might contain cart elements
function observeBodyForCartElements() {
  const observer = new MutationObserver(function(mutations) {
    // If we detect any significant change to the DOM and URL contains cart
    if (!hasInitialized && currentSiteConfig) {
      const cartUrlPattern = currentSiteConfig.cartDetection.urlPatterns.some(pattern =>
        window.location.href.includes(pattern)
      );
      
      if (cartUrlPattern) {
        setTimeout(function() {
          if (checkIfCartPage()) {
            console.log("Cart Image Extractor: DOM mutation observer detected cart page");
            showDebugOverlay("DOM mutation triggered initialization");
            initializeExtension();
          }
        }, 500);
      }
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

// ==============================================
// EXTRACT AND DISPLAY CART ITEMS
// ==============================================

// Function to extract and display cart images
function extractAndDisplayImages() {
  if (!currentSiteConfig) {
    console.log("Cart Image Extractor: No site configuration available");
    return;
  }
  
  console.log("Cart Image Extractor: Starting to extract images");
  showDebugOverlay("Starting to extract images");
  
  // First, create our bottom panel if it doesn't exist
  let panel = document.getElementById('cart-panel');
  if (!panel) {
    console.log("Cart Image Extractor: Creating panel");
    showDebugOverlay("Creating panel");
    panel = createBottomPanel();
  } else {
    console.log("Cart Image Extractor: Panel already exists");
    showDebugOverlay("Panel already exists");
  }
  
  // Try selectors for cart items from the site configuration
  const selectors = currentSiteConfig.itemSelectors.container;
  
  let cartItems = [];
  let usedSelector = '';
  
  // Try each selector until we find cart items
  for (const selector of selectors) {
    const items = document.querySelectorAll(selector);
    console.log(`Cart Image Extractor: Trying selector "${selector}" - found ${items.length} items`);
    showDebugOverlay(`Selector "${selector}": ${items.length} items`);
    
    if (items.length > 0) {
      cartItems = items;
      usedSelector = selector;
      break;
    }
  }
  
  if (cartItems.length === 0) {
    panel.innerHTML = '<div class="panel-message">Looking for items in your cart...</div>';
    
    // Dump page HTML for debugging
    console.log("Page HTML structure:", document.body.innerHTML.substring(0, 1000) + "...");
    showDebugOverlay("Could not find cart items. Check console for HTML structure.");
    
    // Set up a more aggressive observer to catch when items appear
    setupAggressiveCartObserver();
  } else {
    processCartItems(cartItems, panel, usedSelector);
  }
}

// More aggressive observation strategy
function setupAggressiveCartObserver() {
  if (!currentSiteConfig) return;
  
  console.log("Cart Image Extractor: Setting up aggressive observer");
  showDebugOverlay("Setting up aggressive observer");
  
  const observer = new MutationObserver(function(mutations) {
    // Check if any cart items have appeared using all our selectors
    const selectors = currentSiteConfig.itemSelectors.container.join(', ');
    
    const anyCartItems = document.querySelectorAll(selectors).length > 0;
    
    if (anyCartItems) {
      console.log("Cart Image Extractor: Items detected via aggressive observer");
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
    console.log("Cart Image Extractor: Disconnected aggressive observer after timeout");
    showDebugOverlay("Disconnected aggressive observer after timeout");
  }, 10000);
}

// Process the cart items
function processCartItems(cartItems, panel, usedSelector) {
  if (!currentSiteConfig) return;
  
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
      console.log(`Cart Image Extractor: Processing item ${index+1}`);
      showDebugOverlay(`Processing item ${index+1}`);
      
      // Get image selectors from site config
      let imageSelectors = currentSiteConfig.itemSelectors.image;
      
      let imgElement = null;
      let imageUrl = '';
      
      // Try each image selector
      for (const selector of imageSelectors) {
        imgElement = item.querySelector(selector);
        if (imgElement) {
          // Handle both img elements and background images
          if (imgElement.tagName === 'IMG' && imgElement.src) {
            imageUrl = imgElement.src;
            break;
          } else if (imgElement.style && imgElement.style.backgroundImage) {
            // Extract URL from background-image style
            const bgImg = imgElement.style.backgroundImage;
            imageUrl = bgImg.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
            break;
          }
        }
      }
      
      // Last resort - look for any image URL in the attributes or styles
      if (!imageUrl) {
        const elementsWithUrl = item.querySelectorAll('[src], [style*="url"]');
        for (const el of elementsWithUrl) {
          if (el.src && el.src.includes('/images/')) {
            imageUrl = el.src;
            break;
          } else if (el.style && el.style.backgroundImage) {
            const bgImg = el.style.backgroundImage;
            if (bgImg.includes('/images/')) {
              imageUrl = bgImg.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
              break;
            }
          }
        }
      }
      
      if (!imageUrl) {
        console.log(`Cart Image Extractor: No image found for item ${index+1}`);
        showDebugOverlay(`No image found for item ${index+1}`);
        return;
      }
      
      console.log(`Cart Image Extractor: Found image for item ${index+1}: ${imageUrl}`);
      showDebugOverlay(`Found image for item ${index+1}`);
      
      // Helper function to try multiple selectors
      function getTextFromSelectors(selectorType) {
        const selectors = currentSiteConfig.itemSelectors[selectorType];
        for (const selector of selectors) {
          const element = item.querySelector(selector);
          if (element && element.textContent) {
            return element.textContent.trim();
          }
        }
        return '';
      }
      
      // Extract product details using configured selectors
      const productName = getTextFromSelectors('name') || 'Product';
      const price = getTextFromSelectors('price') || '';
      const size = getTextFromSelectors('size') || '';
      const color = getTextFromSelectors('color') || '';
      
      // Create item container
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      
      // Create image container to maintain aspect ratio
      const imgContainer = document.createElement('div');
      imgContainer.className = 'item-image-container';
      
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
      
      imgContainer.appendChild(itemImg);
      
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
      itemElement.appendChild(imgContainer);
      itemElement.appendChild(detailsElement);
      
      // Add item to the image container
      imageContainer.appendChild(itemElement);
    } catch (error) {
      console.error('Cart Image Extractor: Error extracting item details:', error);
      showDebugOverlay('Error extracting item details: ' + error.message);
    }
  });
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', function() {
    panel.classList.add('hidden');
    
    // Create toggle button to reopen panel
    createToggleButton();
  });
  panel.appendChild(closeButton);
  
  // Show panel
  panel.classList.remove('hidden');
  
  console.log("Cart Image Extractor: Panel populated and displayed");
  showDebugOverlay("Panel populated and displayed");
}

// Create a toggle button to reopen the panel
function createToggleButton() {
  let toggleBtn = document.getElementById('panel-toggle-button');
  
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'panel-toggle-button';
    toggleBtn.textContent = 'Show Cart Items';
    toggleBtn.className = 'panel-toggle-button';
    
    // Style the toggle button
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.bottom = '20px';
    toggleBtn.style.right = '20px';
    toggleBtn.style.zIndex = '9998';
    toggleBtn.style.padding = '10px 15px';
    toggleBtn.style.backgroundColor = '#000';
    toggleBtn.style.color = '#fff';
    toggleBtn.style.border = 'none';
    toggleBtn.style.borderRadius = '5px';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    // Add event listener
    toggleBtn.addEventListener('click', function() {
      const panel = document.getElementById('cart-panel');
      if (panel) {
        panel.classList.remove('hidden');
        toggleBtn.style.display = 'none';
      }
    });
    
    document.body.appendChild(toggleBtn);
  }
  
  toggleBtn.style.display = 'block';
}

// Function to create the bottom panel
function createBottomPanel() {
  // Add our CSS to the page
  const style = document.createElement('style');
  style.textContent = `
    #cart-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      background-color: white;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      padding: 15px;
      transition: transform 0.3s ease;
      max-height: 300px; /* Increased from 220px */
      overflow-y: auto;
    }
    
    #cart-panel.hidden {
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
      min-width: 140px;
      max-width: 140px;
    }
    
    .item-image-container {
      width: 100%;
      height: 180px; /* Fixed height container */
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      margin-bottom: 5px;
    }
    
    .item-image {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain; /* Contains the image fully within the container */
      position: absolute;
    }
    
    .item-details {
      padding: 5px 0;
    }
    
    .item-name {
      font-size: 12px;
      font-weight: bold;
      white-space: normal; /* Allow text to wrap */
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2; /* Limit to 2 lines */
      -webkit-box-orient: vertical;
      line-height: 1.2;
      max-height: 2.4em; /* 2 lines */
    }
    
    .item-price {
      font-size: 12px;
      color: #777;
      margin-top: 3px;
    }
    
    .item-specs {
      font-size: 10px;
      color: #999;
      margin-top: 2px;
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
  panel.id = 'cart-panel';
  panel.className = 'cart-panel';
  document.body.appendChild(panel);
  
  console.log("Cart Image Extractor: Bottom panel created");
  showDebugOverlay("Bottom panel created");
  
  return panel;
}

// Observe changes to the cart to update our panel
function observeCartChanges() {
  if (!currentSiteConfig) return;
  
  console.log("Cart Image Extractor: Setting up observer");
  showDebugOverlay("Setting up observer");
  
  // Look for the cart container using configured selectors
  const possibleCartContainers = currentSiteConfig.cartDetection.domSelectors;
  
  let cartContainer = null;
  
  // Try each possible container selector
  for (const selector of possibleCartContainers) {
    cartContainer = document.querySelector(selector);
    if (cartContainer) {
      console.log(`Cart Image Extractor: Found cart container "${selector}" to observe`);
      showDebugOverlay(`Found cart container "${selector}" to observe`);
      break;
    }
  }
  
  if (cartContainer) {
    const observer = new MutationObserver(function(mutations) {
      console.log("Cart Image Extractor: Cart content changed, updating panel");
      showDebugOverlay("Cart content changed, updating panel");
      extractAndDisplayImages();
    });
    
    observer.observe(cartContainer, {
      subtree: true,
      childList: true,
      attributes: true
    });
  } else {
    console.log("Cart Image Extractor: Couldn't find cart container to observe");
    showDebugOverlay("Couldn't find cart container to observe");
    
    // Fallback to body observation with more focused checking
    const observer = new MutationObserver(function(mutations) {
      // Look for mutations that might indicate cart items loading
      const cartRelatedMutation = mutations.some(mutation => {
        const cartIndicators = currentSiteConfig.cartDetection.textIndicators;
        
        // Check if mutation target or its parent has cart-related class/id
        const isCartRelated = cartIndicators.some(indicator => {
          return (mutation.target.className && mutation.target.className.toString().toLowerCase().includes(indicator)) ||
                 (mutation.target.id && mutation.target.id.toLowerCase().includes(indicator)) ||
                 (mutation.target.parentElement &&
                 mutation.target.parentElement.className &&
                 mutation.target.parentElement.className.toString().toLowerCase().includes(indicator));
        });
        
        return isCartRelated;
      });
      
      if (cartRelatedMutation) {
        console.log("Cart Image Extractor: Cart-related DOM change detected");
        showDebugOverlay("Cart-related DOM change detected");
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
