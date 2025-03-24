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
    // Existing Zara configuration
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
  },
  
  // H&M configuration
  hm: {
    cartDetection: {
      urlPatterns: ['/en_us/cart', '/cart'],
      domSelectors: [
        '[class*="CartItemsList"]',
        'ul > li > article',
        '.CartItemsList--northStarWrapper__J1Kff'
      ],
      textIndicators: ['shopping cart', 'basket', 'cart', 'shopping bag']
    },
    itemSelectors: {
      container: [
        'ul > li',
        'article',
        '[class*="CartItemsList"] li'
      ],
      image: [
        'picture img',
        'a[aria-label*="Go to product"] img',
        'img[alt*="Fit"]'
      ],
      name: [
        'h2',
        'a[aria-label] h2',
        'a[class] h2'
      ],
      price: [
        'span[class*="aeecde"]',
        'dl div:last-child dd span'
      ],
      size: [
        'dl div:nth-child(3) dd span span',
        'dt span:contains("Size") ~ dd span span'
      ],
      color: [
        'dl div:nth-child(2) dd span span',
        'dt span:contains("Color") ~ dd span span'
      ]
    }
  },
  
  // Aritzia configuration
  aritzia: {
    cartDetection: {
      urlPatterns: ['/us/en/cart', '/cart'],
      domSelectors: [
        '[data-componentname="CartItems"]',
        '[data-componentname="CartItem"]',
        '[data-testid="current-bag-items"]'
      ],
      textIndicators: ['my bag', 'shopping bag', 'cart', 'checkout']
    },
    itemSelectors: {
      container: [
        '[data-componentname="CartItem"]',
        'div[data-testid^="bag-product-info"]',
        'div[title*="Aritzia"]'
      ],
      image: [
        'img[srcset*="aritzia"]',
        'img[alt]',
        'div[class*="_1sj10sn1"] > img'
      ],
      name: [
        '[data-testid^="bag-product-name-text"]',
        'p[data-testid*="name"]'
      ],
      price: [
        '[data-testid="product-list-price-text"]',
        'div[data-testid="product-price-text"] p'
      ],
      size: [
        '[data-testid^="bag-size-text"]',
        'span[data-testid*="size"]'
      ],
      color: [
        '[data-testid^="bag-product-colour-text"]',
        'p[data-testid*="colour"]'
      ]
    }
  },
  
  // Abercrombie & Fitch configuration
  abercrombie: {
    cartDetection: {
      urlPatterns: ['/shop/OrderItemDisplayView', '/shop/bag', '/checkout'],
      domSelectors: [
        '.product-rail',
        '.shopping-bag-list-mfe',
        '[data-testid="baglist"]',
        '.shopping-bagV2',
        '.product-template-item' // Added direct item selector
      ],
      textIndicators: ['shopping bag', 'bag', 'items', 'your bag']
    },
    itemSelectors: {
      container: [
        '.product-template-item',
        'li[data-testid="bag-item"]',
        'div.product-template',
        '.shopping-bag-list-mfe li' // Added more general container selector
      ],
      image: [
        '.product-image img',
        'img[src*="img.abercrombie.com"]',
        'span.productcard-Image img',
        'button.product-image-button img'
      ],
      name: [
        '.product-name h2 button',
        '.product-name-font-size',
        'div.product-name button',
        'h2 button.link-button'
      ],
      price: [
        '.product-price-text',
        '[data-testid="product-price"] span',
        '.product-price-text-wrapper span'
      ],
      size: [
        '.size-color',
        'p.gender + p.size-color'
      ],
      color: [
        '.size-color',
        'p.gender + p.size-color'
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
// Add timestamp tracking for debug messages
let lastDebugMessages = {};

// Update showDebugOverlay function
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
  
  // Check if this message was already shown recently
  const now = new Date().getTime();
  if (lastDebugMessages[message] && (now - lastDebugMessages[message] < 2000)) {
    return; // Skip duplicate messages within 2 seconds
  }
  lastDebugMessages[message] = now;
  
  const logLine = document.createElement('div');
  logLine.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  overlay.appendChild(logLine);
  
  // Cap the number of messages to prevent overlay from getting too large
  if (overlay.children.length > 20) {
    overlay.removeChild(overlay.firstChild);
  }
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
    showDebugOverlay("Zara site detected");
    return SITE_CONFIGS.zara;
  }
  
  // H&M detection
  if (hostname.includes('hm.com') || hostname.includes('www2.hm.com')) {
    showDebugOverlay("H&M site detected");
    return SITE_CONFIGS.hm;
  }
  
  // Aritzia detection
  if (hostname.includes('aritzia.com')) {
    showDebugOverlay("Aritzia site detected");
    return SITE_CONFIGS.aritzia;
  }
  
  // Abercrombie & Fitch detection
  if (hostname.includes('abercrombie.com')) {
    showDebugOverlay("Abercrombie & Fitch site detected");
    return SITE_CONFIGS.abercrombie;
  }
  
  // Default to null if no site matches
  showDebugOverlay("No supported site detected");
  return null;
}

// ==============================================
// URL MONITORING FOR SPA NAVIGATION
// ==============================================

// Track the current URL to detect changes with improved debugging
function setupURLMonitoring() {
  try {
    showDebugOverlay("URL monitoring setup started");
    console.log("URL monitoring setup started");
  
    // Log initial URL
    showDebugOverlay(`Initial URL: ${location.href}`);
    console.log(`Initial URL: ${location.href}`);
    
    // Track URL changes with specific focus on cart
    let lastURL = location.href;
    let wasCartURL = checkForCartURL();
    let checkCount = 0;
    
    // Check for URL changes more frequently (every 100ms)
    setInterval(() => {
      try {
        const currentURL = location.href;
        checkCount++;
        
        // Every 10 checks, log that we're still monitoring
        if (checkCount % 10 === 0) {
          showDebugOverlay(`URL monitor active: ${currentURL}`);
          console.log(`URL monitor active: ${currentURL}`);
        }
        
        if (currentURL !== lastURL) {
          const isCartURL = checkForCartURL();
          
          // Log specific transitions with more detail
          console.log(`URL CHANGE DETECTED: ${lastURL} → ${currentURL}`);
          showDebugOverlay(`URL CHANGED: ${lastURL} → ${currentURL}`);
          showDebugOverlay(`CART STATUS: ${wasCartURL ? 'WAS cart' : 'was NOT cart'} → ${isCartURL ? 'IS cart' : 'is NOT cart'}`);
          
          // If we transitioned TO a cart URL, make it more visible in logs
          if (!wasCartURL && isCartURL) {
            console.log("🛒 CART PAGE DETECTED! 🛒");
            showDebugOverlay("🛒 CART PAGE DETECTED! 🛒");
          }
          
          // Update tracking variables
          lastURL = currentURL;
          wasCartURL = isCartURL;
          
          // Handle the change
          handleURLChange();
        }
      } catch (error) {
        showDebugOverlay("ERROR in URL monitoring interval: " + error.message);
        console.error("Error in URL monitoring interval:", error);
      }
    }, 100); // Check every 100ms
    
    showDebugOverlay("URL monitoring successfully initialized");
  } catch (error) {
    showDebugOverlay("ERROR in URL monitoring setup: " + error.message);
    console.error("Error in URL monitoring setup:", error);
  }
}

// Handle URL changes - this is the primary entry point for all checks
function handleURLChange() {
  try {
    console.log("Cart Image Extractor: URL change detected to:", location.href);
    showDebugOverlay("URL changed to: " + location.href);
    
    // First, detect the site we're on
    currentSiteConfig = detectCurrentSite();
    if (!currentSiteConfig) {
      console.log("Cart Image Extractor: Not on a supported site");
      hideCartPanel(); // Make sure panel is hidden on unsupported sites
      return;
    }
    
    // Second, check if the URL matches cart patterns
    const isCartURL = checkForCartURL();
    
    // Reset initialization state on URL change
    hasInitialized = false;
    
    if (isCartURL) {
      // Special handling for Abercrombie with longer delay
      if (window.location.hostname.includes('abercrombie.com')) {
        console.log("Abercrombie cart detected, using longer delay for content loading");
        setTimeout(() => {
          initializeExtension();
        }, 2000); // Increase to 2 seconds for Abercrombie
        return; // Skip the regular timeout below
      }
      
      // If it's a cart URL, proceed with cart detection and panel display
      console.log("Cart Image Extractor: Cart URL detected, initializing");
      showDebugOverlay("Cart URL matched, initializing");
      
      // Wait a bit for the page to load cart content
      setTimeout(() => {
        initializeExtension();
      }, 800); // Slightly longer delay to ensure cart items are loaded
    } else {
      // Not a cart URL, hide the panel if it exists
      console.log("Cart Image Extractor: Not a cart URL, hiding panel");
      showDebugOverlay("Not a cart URL, hiding panel");
      hideCartPanel();
    }
  } catch (error) {
    showDebugOverlay("ERROR in handleURLChange: " + error.message);
    console.error("Error in handleURLChange:", error);
  }
}

// Function to check specifically for cart URL patterns
function checkForCartURL() {
  try {
    if (!currentSiteConfig) {
      showDebugOverlay("No site config available");
      return false;
    }
    
    // Check each pattern individually for better logging
    for (const pattern of currentSiteConfig.cartDetection.urlPatterns) {
      if (window.location.href.includes(pattern)) {
        showDebugOverlay(`✅ Cart URL matched: "${pattern}" in "${window.location.href}"`);
        console.log(`✅ Cart URL matched: "${pattern}" in "${window.location.href}"`);
        return true;
      }
    }
    
    showDebugOverlay(`❌ No cart patterns matched in: "${window.location.href}"`);
    console.log(`❌ No cart patterns matched in: "${window.location.href}"`);
    return false;
  } catch (error) {
    showDebugOverlay("ERROR in checkForCartURL: " + error.message);
    console.error("Error in checkForCartURL:", error);
    return false;
  }
}

// Function to hide the cart panel
function hideCartPanel() {
  try {
    const panel = document.getElementById('cart-panel');
    if (panel) {
      panel.classList.add('hidden');
      
      // Optional: Remove panel entirely after animation completes
      setTimeout(() => {
        if (panel.parentNode) {
          panel.parentNode.removeChild(panel);
        }
      }, 300); // Match the transition time in CSS
    }
    
    // Remove any "looking for items" message to avoid confusion
    const toggleBtn = document.getElementById('panel-toggle-button');
    if (toggleBtn) {
      toggleBtn.style.display = 'none';
    }
  } catch (error) {
    showDebugOverlay("ERROR in hideCartPanel: " + error.message);
    console.error("Error in hideCartPanel:", error);
  }
}

// New function to check only for cart elements
function checkForCartElements() {
  try {
    if (!currentSiteConfig) return false;
    
    // Check for cart elements that might appear in the DOM
    const hasCartElements = currentSiteConfig.cartDetection.domSelectors.some(selector =>
      Boolean(document.querySelector(selector))
    );
    
    if (hasCartElements) {
      console.log("Cart Image Extractor: Cart elements found");
      showDebugOverlay("Cart elements found");
      return true;
    }
    
    return false;
  } catch (error) {
    showDebugOverlay("ERROR in checkForCartElements: " + error.message);
    console.error("Error in checkForCartElements:", error);
    return false;
  }
}

// ==============================================
// CORE INITIALIZATION - MODIFIED
// ==============================================

// Main initialization function - try to extract cart items
function initializeExtension() {
  try {
    if (hasInitialized) {
      console.log("Cart Image Extractor: Already initialized, skipping");
      return;
    }
    
    // First verify we're on a cart page
    if (!checkForCartURL()) {
      console.log("Cart Image Extractor: URL doesn't match cart patterns, aborting");
      hideCartPanel();
      return;
    }
    
    // Then check for cart elements
    if (checkForCartElements()) {
      hasInitialized = true;
      console.log("Cart Image Extractor: Initializing extension on cart page");
      showDebugOverlay("Initializing extension on cart page");
      
      // Extract cart items immediately
      extractAndDisplayImages();
      
      // Set up observation for dynamic changes
      observeCartChanges();
    } else {
      console.log("Cart Image Extractor: Cart URL but no cart elements yet, waiting");
      showDebugOverlay("Cart URL matched but elements not found yet");
      
      // Don't create a panel with "Looking for items" here
      // Instead, set up a short timeout to check again
      setTimeout(() => {
        if (!hasInitialized && checkForCartURL()) {
          checkForCartElements();
        }
      }, 1500);
    }
  } catch (error) {
    showDebugOverlay("ERROR in initializeExtension: " + error.message);
    console.error("Error in initializeExtension:", error);
  }
}

// ==============================================
// MODIFIED NAVIGATION EVENT LISTENERS
// ==============================================

// Make the initialization more robust
console.log("Cart Image Extractor: Beginning immediate execution");
showDebugOverlay("Starting URL monitoring now");

// Run setup immediately instead of waiting for DOMContentLoaded
try {
  setupURLMonitoring();
  // Initial URL check
  setTimeout(() => {
    currentSiteConfig = detectCurrentSite();
    handleURLChange();
  }, 500);
} catch (error) {
  showDebugOverlay("ERROR in immediate execution: " + error.message);
  console.error("Error in immediate execution:", error);
}

// Also keep the event-based initialization
document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log("Cart Image Extractor: DOMContentLoaded fired");
    showDebugOverlay("DOMContentLoaded fired");
    // Call handleURLChange directly
    handleURLChange();
  } catch (error) {
    showDebugOverlay("ERROR in DOMContentLoaded: " + error.message);
    console.error("Error in DOMContentLoaded handler:", error);
  }
});

// Monitor for History API changes - crucial for SPA navigation
const originalPushState = history.pushState;
history.pushState = function() {
  try {
    originalPushState.apply(this, arguments);
    console.log("Cart Image Extractor: pushState detected");
    showDebugOverlay("pushState detected");
    handleURLChange();
  } catch (error) {
    showDebugOverlay("ERROR in pushState handler: " + error.message);
    console.error("Error in pushState handler:", error);
  }
};

const originalReplaceState = history.replaceState;
history.replaceState = function() {
  try {
    originalReplaceState.apply(this, arguments);
    console.log("Cart Image Extractor: replaceState detected");
    showDebugOverlay("replaceState detected");
    handleURLChange();
  } catch (error) {
    showDebugOverlay("ERROR in replaceState handler: " + error.message);
    console.error("Error in replaceState handler:", error);
  }
};

window.addEventListener('popstate', function() {
  try {
    console.log("Cart Image Extractor: popstate event detected");
    showDebugOverlay("popstate event detected");
    handleURLChange();
  } catch (error) {
    showDebugOverlay("ERROR in popstate handler: " + error.message);
    console.error("Error in popstate handler:", error);
  }
});

// ==============================================
// EXTRACT AND DISPLAY CART ITEMS
// ==============================================

// Function to extract and display cart images
function extractAndDisplayImages() {
  try {
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
    
    // Debug logging for Abercrombie
    if (window.location.hostname.includes('abercrombie.com')) {
      console.log("Cart item selectors tried:", currentSiteConfig.itemSelectors.container);
      document.querySelectorAll('.product-template-item').forEach((item, i) => {
        console.log(`Direct DOM check: Found product-template-item ${i+1}`);
      });
      document.querySelectorAll('[data-testid="bag-item"]').forEach((item, i) => {
        console.log(`Direct DOM check: Found bag-item ${i+1}`);
      });
    }
    
    if (cartItems.length === 0) {
      // Special handling for Abercrombie
      if (window.location.hostname.includes('abercrombie.com')) {
        console.log("No Abercrombie items found with selectors, trying direct DOM queries");
        // Try direct DOM queries as fallback
        const directItems = document.querySelectorAll('.product-template-item, [data-testid="bag-item"], div.product-template, ul.shopping-bag-list-mfe li');
        if (directItems.length > 0) {
          console.log(`Found ${directItems.length} items via direct DOM query`);
          cartItems = directItems;
          usedSelector = 'direct-dom-query';
        } else {
          // Set up more aggressive retry
          console.log("Still no items, setting up aggressive retry");
          setTimeout(() => {
            if (!hasInitialized && checkForCartURL()) {
              extractAndDisplayImages();
            }
          }, 3000); // Try again after 3 seconds
        }
      }
      
      // If still no items, don't show the panel
      if (cartItems.length === 0) {
        console.log("Cart Image Extractor: No cart items found, hiding panel");
        hideCartPanel();
        
        // Set up to check again soon but don't show the panel yet
        setTimeout(() => {
          if (!hasInitialized && checkForCartURL()) {
            extractAndDisplayImages();
          }
        }, 1000);
        return;
      }
    }
    
    // Process the cart items
    processCartItems(cartItems, panel, usedSelector);
  } catch (error) {
    showDebugOverlay("ERROR in extractAndDisplayImages: " + error.message);
    console.error("Error in extractAndDisplayImages:", error);
  }
}

// More aggressive observation strategy
function setupAggressiveCartObserver() {
  try {
    if (!currentSiteConfig) return;
    
    console.log("Cart Image Extractor: Setting up aggressive observer");
    showDebugOverlay("Setting up aggressive observer");
    
    const observer = new MutationObserver(function(mutations) {
      try {
        // Check if any cart items have appeared using all our selectors
        const selectors = currentSiteConfig.itemSelectors.container.join(', ');
        
        const anyCartItems = document.querySelectorAll(selectors).length > 0;
        
        if (anyCartItems) {
          console.log("Cart Image Extractor: Items detected via aggressive observer");
          showDebugOverlay("Items detected via aggressive observer");
          observer.disconnect();
          extractAndDisplayImages();
        }
      } catch (error) {
        showDebugOverlay("ERROR in aggressive observer: " + error.message);
        console.error("Error in aggressive observer:", error);
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
  } catch (error) {
    showDebugOverlay("ERROR in setupAggressiveCartObserver: " + error.message);
    console.error("Error in setupAggressiveCartObserver:", error);
  }
}

// Function to process Abercrombie items specifically
function processAbercrombieItem(item, index) {
  console.log(`Processing Abercrombie item ${index}`);
  
  // Find image directly
  let imageUrl = '';
  const imgEl = item.querySelector('button.product-image-button img');
  if (imgEl && imgEl.src) {
    imageUrl = imgEl.src;
    console.log(`Found image: ${imageUrl}`);
  }
  
  // Find product name directly
  let productName = '';
  const nameEl = item.querySelector('.product-name h2 button');
  if (nameEl) {
    productName = nameEl.textContent.trim();
    console.log(`Found name: ${productName}`);
  }
  
  // Find price directly
  let price = '';
  const priceEl = item.querySelector('.product-price-text');
  if (priceEl) {
    price = priceEl.textContent.trim();
    console.log(`Found price: ${price}`);
  }
  
  // Find size and color directly
  let sizeColor = '';
  const sizeColorEl = item.querySelector('p.size-color');
  if (sizeColorEl) {
    sizeColor = sizeColorEl.textContent.trim();
    console.log(`Found size/color: ${sizeColor}`);
  }
  
  // Extract size and color
  let size = '';
  let color = '';
  if (sizeColor.includes(',')) {
    const parts = sizeColor.split(',');
    size = parts[0].trim();
    color = parts.length > 1 ? parts[1].trim() : '';
  }
  
  return {
    imageUrl,
    productName: productName || 'Product',
    price: price || '',
    size: size || '',
    color: color || ''
  };
}

// Helper function to try multiple selectors with special handling for Abercrombie
function getTextFromSelectors(selectorType, item) {
  const selectors = currentSiteConfig.itemSelectors[selectorType];
  
  // Special handling for Abercrombie - check if we're on Abercrombie site
  if (window.location.hostname.includes('abercrombie.com') &&
      (selectorType === 'size' || selectorType === 'color')) {
    // Look for the combined size-color element
    const sizeColorEl = item.querySelector('.size-color');
    if (sizeColorEl && sizeColorEl.textContent.includes(',')) {
      const parts = sizeColorEl.textContent.split(',');
      if (selectorType === 'size' && parts.length >= 1) {
        return parts[0].trim();
      } else if (selectorType === 'color' && parts.length >= 2) {
        return parts[1].trim();
      }
    }
  }
  
  // First, try direct selectors
  for (const selector of selectors) {
    const elements = item.querySelectorAll(selector);
    for (let i = 0; i < elements.length; i++) {
      if (elements[i] && elements[i].textContent) {
        return elements[i].textContent.trim();
      }
    }
  }
  
  // Special case for Zara (their links contain the product names)
  if (selectorType === 'name') {
    // Look for a product link with text content
    const links = item.querySelectorAll('a');
    for (const link of links) {
      if (link.textContent && link.textContent.trim().length > 2 &&
          !link.textContent.includes('Delete') && !link.textContent.includes('Remove')) {
        return link.textContent.trim();
      }
    }
    
    // Alternative fallback - check for alt text in images
    const images = item.querySelectorAll('img');
    for (const img of images) {
      if (img.alt && img.alt.trim().length > 2) {
        return img.alt.trim();
      }
    }
  }
  
  return '';
}

          // Process the cart items
          function processCartItems(cartItems, panel, usedSelector) {
            try {
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
              
              // Special handling for Abercrombie items
              if (window.location.hostname.includes('abercrombie.com')) {
                cartItems.forEach((item, index) => {
                  try {
                    const productInfo = processAbercrombieItem(item, index);
                    
                    // Build the panel item using productInfo
                    // Create item container
                    const itemElement = document.createElement('div');
                    itemElement.className = 'cart-item';
                    
                    // Create image container
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'item-image-container';
                    
                    // Create item image
                    const itemImg = document.createElement('img');
                    itemImg.src = productInfo.imageUrl;
                    itemImg.alt = productInfo.productName;
                    itemImg.className = 'item-image';
                    itemImg.onerror = function() {
                      // If image fails to load, try to fix common URL issues
                      if (productInfo.imageUrl.includes('?')) {
                        // Try removing query parameters
                        this.src = productInfo.imageUrl.split('?')[0];
                      } else if (!productInfo.imageUrl.startsWith('http')) {
                        // Try adding protocol if missing
                        this.src = 'https:' + productInfo.imageUrl;
                      }
                    };
                    
                    imgContainer.appendChild(itemImg);
                    
                    // Create item details
                    const detailsElement = document.createElement('div');
                    detailsElement.className = 'item-details';
                    
                    // Add product name
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'item-name';
                    nameDiv.textContent = productInfo.productName;
                    detailsElement.appendChild(nameDiv);
                    
                    // Add price
                    const priceDiv = document.createElement('div');
                    priceDiv.className = 'item-price';
                    priceDiv.textContent = productInfo.price;
                    detailsElement.appendChild(priceDiv);
                    
                    // Add size and color
                    const specDiv = document.createElement('div');
                    specDiv.className = 'item-specs';
                    specDiv.textContent = `${productInfo.size} | ${productInfo.color}`;
                    detailsElement.appendChild(specDiv);
                    
                    // Add all elements to item container
                    itemElement.appendChild(imgContainer);
                    itemElement.appendChild(detailsElement);
                    
                    // Add item to the image container
                    imageContainer.appendChild(itemElement);
                  } catch (error) {
                    console.error('Cart Image Extractor: Error processing Abercrombie item:', error);
                    showDebugOverlay('Error processing Abercrombie item: ' + error.message);
                  }
                });
              } else {
                // Regular processing for other sites
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
                    
                    // Extract product details using getTextFromSelectors function
                    const productName = getTextFromSelectors('name', item) || 'Product';
                    const price = getTextFromSelectors('price', item) || '';
                    const size = getTextFromSelectors('size', item) || '';
                    const color = getTextFromSelectors('color', item) || '';
                    
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
              }
              
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
            } catch (error) {
              showDebugOverlay("ERROR in processCartItems: " + error.message);
              console.error("Error in processCartItems:", error);
            }
          }

          // Create a toggle button to reopen the panel
          function createToggleButton() {
            try {
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
            } catch (error) {
              showDebugOverlay("ERROR in createToggleButton: " + error.message);
              console.error("Error in createToggleButton:", error);
            }
          }

          // Function to create the bottom panel
          function createBottomPanel() {
            try {
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
                  } catch (error) {
                    showDebugOverlay("ERROR in createBottomPanel: " + error.message);
                    console.error("Error in createBottomPanel:", error);
                    // Create a simple fallback panel in case of error
                    const fallbackPanel = document.createElement('div');
                    fallbackPanel.id = 'cart-panel';
                    document.body.appendChild(fallbackPanel);
                    return fallbackPanel;
                  }
                }

                // Observe changes to the cart to update our panel
function observeCartChanges() {
    try {
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
                try {
                    console.log("Cart Image Extractor: Cart content changed, updating panel");
                    showDebugOverlay("Cart content changed, updating panel");
                    extractAndDisplayImages();
                } catch (error) {
                    showDebugOverlay("ERROR in cart observer callback: " + error.message);
                    console.error("Error in cart observer callback:", error);
                }
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
                try {
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
                } catch (error) {
                    showDebugOverlay("ERROR in fallback observer callback: " + error.message);
                    console.error("Error in fallback observer callback:", error);
                }
            });
            
            observer.observe(document.body, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'id']
            });
        }
    } catch (error) {
        showDebugOverlay("ERROR in observeCartChanges: " + error.message);
        console.error("Error in observeCartChanges:", error);
    }
}
                
