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
  return;
    
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
  
  // Edikted detection
  if (hostname.includes('edikted.com')) {
    showDebugOverlay("Edikted site detected");
    return SITE_CONFIGS.edikted;
  }
  
  // Princess Polly detection
  if (hostname.includes('princesspolly.com')) {
    showDebugOverlay("Princess Polly site detected");
    return SITE_CONFIGS.princessPolly;
  }
  
  // Revolve detection
  if (hostname.includes('revolve.com')) {
    showDebugOverlay("Revolve site detected");
    return SITE_CONFIGS.revolve;
  }
  
  // OhPolly detection
  if (hostname.includes('ohpolly.com')) {
    showDebugOverlay("OhPolly site detected");
    return SITE_CONFIGS.ohpolly;
  }
    
  if (hostname.includes('fashionnova.com')) {
    showDebugOverlay("Fashion Nova site detected");
    console.log("Fashion Nova site detected");
    return SITE_CONFIGS.fashionNova;
  }
 
  if (hostname.includes('urbanoutfitters.com')) {
    showDebugOverlay("Urban Outfitters site detected");
    console.log("Urban Outfitters site detected");
    return SITE_CONFIGS.urbanOutfitters;
  }
  
  if (hostname.includes('brandymelville.com')) {
    showDebugOverlay("Brandy Melville site detected");
    console.log("Brandy Melville site detected");
    return SITE_CONFIGS.brandyMelville;
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

function processBrandyMelvilleItem(item, index) {
  console.log(`Processing Brandy Melville item ${index}`);
  
  // Find image
  let imageUrl = '';
  const imgEl = item.querySelector('.cart-item__image');
  if (imgEl && imgEl.src) {
    imageUrl = imgEl.src;
    console.log(`Found image: ${imageUrl}`);
  }
  
  // Find product name
  let productName = '';
  const nameEl = item.querySelector('.cart-item__name');
  if (nameEl) {
    productName = nameEl.textContent.trim();
    console.log(`Found name: ${productName}`);
  }
  
  // Find price
  let price = '';
  const priceEl = item.querySelector('.price.price--end');
  if (priceEl) {
    price = priceEl.textContent.trim();
    console.log(`Found price: ${price}`);
  }
  
  // Find size
  let size = '';
  const sizeContainer = item.querySelector('.product-option dt:contains("Size") + dd, dl .product-option:contains("Size") dd');
  if (sizeContainer) {
    size = sizeContainer.textContent.trim();
    console.log(`Found size: ${size}`);
  }
  
  // Find color
  let color = '';
  const colorContainer = item.querySelector('.product-option dt:contains("Color") + dd, dl .product-option:contains("Color") dd');
  if (colorContainer) {
    color = colorContainer.textContent.trim();
    console.log(`Found color: ${color}`);
  }
  
  // Find delete link - this is the key difference for Brandy Melville
  const deleteLink = item.querySelector('cart-remove-button a, .button.button--tertiary[href*="quantity=0"]');
  
  return {
    imageUrl,
    productName: productName || 'Product',
    price: price || '',
    size: size || '',
    color: color || '',
    deleteLink  // Store the link for use in deletion
  };
}

function processOhPollyItem(item, index) {
  console.log(`Processing OhPolly item ${index}`);
  
  // Find image directly
  let imageUrl = '';
  const imgEl = item.querySelector('.rsp-Image_Image');
  if (imgEl && imgEl.src) {
    imageUrl = imgEl.src;
    console.log(`Found image: ${imageUrl}`);
  }
  
  // Find product strapline (brand/collection)
  let strapline = '';
  const straplineEl = item.querySelector('.crt-Product_Strapline');
  if (straplineEl) {
    strapline = straplineEl.textContent.trim();
    console.log(`Found strapline: ${strapline}`);
  }
  
  // Find product title - this contains name, color and size
  let fullTitle = '';
  const titleEl = item.querySelector('.crt-Product_TitleLink');
  if (titleEl) {
    fullTitle = titleEl.textContent.trim();
    console.log(`Found full title: ${fullTitle}`);
  }
  
  // Extract product name, color and size from the title
  // OhPolly format is typically "Product Description in Color - Size"
  let productName = fullTitle;
  let color = '';
  let size = '';
  
  // Extract color if format "in Color" is present
  if (fullTitle.includes(' in ')) {
    const parts = fullTitle.split(' in ');
    productName = parts[0].trim();
    
    // Extract size if format "Color - Size" is present
    if (parts[1] && parts[1].includes(' - ')) {
      const colorSizeParts = parts[1].split(' - ');
      color = colorSizeParts[0].trim();
      size = colorSizeParts[1].trim();
    } else {
      color = parts[1].trim();
    }
  }
  // If "in Color" format isn't present but "- Size" is
  else if (fullTitle.includes(' - ')) {
    const parts = fullTitle.split(' - ');
    productName = parts[0].trim();
    size = parts[1].trim();
  }
  
  // Find price directly
  let price = '';
  const priceEl = item.querySelector('.crt-Product_Price');
  if (priceEl) {
    price = priceEl.textContent.trim();
    console.log(`Found price: ${price}`);
  }
  
  // Find delete button
  const deleteButton = item.querySelector('.crt-Product_Button-remove') ||
                       item.querySelector('button[data-cart-item-el="remove"]');
  
  if (deleteButton) {
    console.log(`Found delete button for OhPolly item`);
  }
  
  return {
    imageUrl,
    strapline,
    productName: productName || 'Product',
    price: price || '',
    size: size || '',
    color: color || '',
    deleteButton // Include button reference for direct use
  };
}

function processRevolveItem(item, index) {
  console.log(`Processing Revolve item ${index}`);
  
  // Find image directly
  let imageUrl = '';
  const imgEl = item.querySelector('.shopping-bag__image img, .shopping-bag__image-placeholder img');
  if (imgEl && imgEl.src) {
    imageUrl = imgEl.src;
    console.log(`Found image: ${imageUrl}`);
  }
  
  // Find product name directly
  let productName = '';
  const nameEl = item.querySelector('.shopping-bag__body a strong, .shopping-bag__prod-info a strong');
  if (nameEl) {
    productName = nameEl.textContent.trim();
    console.log(`Found name: ${productName}`);
  }
  
  // Find brand directly
  let brand = '';
  const brandEl = item.querySelector('.shopping-bag__body a div:not(:first-child)');
  if (brandEl) {
    brand = brandEl.textContent.trim();
    console.log(`Found brand: ${brand}`);
  }
  
  // Find price directly
  let price = '';
  const priceEl = item.querySelector('span.js-price, .shopping-bag__pri .price__retail');
  if (priceEl) {
    price = priceEl.textContent.trim();
    console.log(`Found price: ${price}`);
  }
  
  // Find size directly
  let size = '';
  const sizeEl = item.querySelector('.shopbag_item_size .sb_display');
  if (sizeEl) {
    size = sizeEl.textContent.trim();
    console.log(`Found size: ${size}`);
  }
  
  // Find color directly - searching for spans containing "Color:"
  let color = '';
  const colorElements = item.querySelectorAll('.u-float--left');
  for (const el of colorElements) {
    if (el.textContent.includes('Color:')) {
      color = el.textContent.replace('Color:', '').trim();
      console.log(`Found color: ${color}`);
      break;
    }
  }
  
  // Find delete button
  const deleteButton = item.querySelector('button.js-track-remove');
  if (deleteButton) {
    console.log(`Found delete button for Revolve item`);
  }
  
  return {
    imageUrl,
    productName: productName || 'Product',
    brand: brand || '',
    price: price || '',
    size: size || '',
    color: color || '',
    deleteButton
  };
}

function processFashionNovaItem(item, index) {
  console.log(`Processing Fashion Nova item ${index}`);
  
  // Find image
  let imageUrl = '';
  const imgEl = item.querySelector('img[data-testid="cart-line-image"]');
  if (imgEl && imgEl.src) {
    imageUrl = imgEl.src;
    console.log(`Found image: ${imageUrl}`);
  }
  
  // Find product name
  let productName = '';
  const nameEl = item.querySelector('a[data-testid="cart-line-title-link"]');
  if (nameEl) {
    productName = nameEl.textContent.trim();
    console.log(`Found name: ${productName}`);
  }
  
  // Find price
  let price = '';
  const priceEl = item.querySelector('div[data-testid="cart-line-price"] span.body-md-bold');
  if (priceEl) {
    price = priceEl.textContent.trim();
    console.log(`Found price: ${price}`);
  }
  
  // Find size and color from the size selector
  let size = '';
  let color = '';
  const sizeSelector = item.querySelector('button[data-testid="size-selector"]');
  if (sizeSelector) {
    const sizeText = sizeSelector.textContent.trim();
    console.log(`Found size/color text: ${sizeText}`);
    
    // Fashion Nova typically formats as "Size: M | Color: Black"
    if (sizeText.includes('Size:')) {
      const sizeMatch = sizeText.match(/Size:\s*([^\s|]+)/);
      if (sizeMatch && sizeMatch[1]) {
        size = sizeMatch[1].trim();
      }
    }
    
    if (sizeText.includes('Color:')) {
      const colorMatch = sizeText.match(/Color:([^$]+)/);
      if (colorMatch && colorMatch[1]) {
        color = colorMatch[1].trim();
      }
    }
  }
  
  // Find delete button form
  const removeForm = item.querySelector('form[action="/cart"] input[value*="LinesRemove"]');
  const removeButton = item.querySelector('button[data-testid="remove-item"]');
  
  return {
    imageUrl,
    productName: productName || 'Product',
    price: price || '',
    size: size || '',
    color: color || '',
    removeForm,   // Store the form for later use
    removeButton  // Store the button for later use
  };
}

function processPrincessPollyItem(item, index) {
  console.log(`Processing Princess Polly item ${index}`);
  
  // Find image
  let imageUrl = '';
  const imgEl = item.querySelector('.shopping-cart__td--image img');
  if (imgEl && imgEl.src) {
    imageUrl = imgEl.src;
    console.log(`Found image: ${imageUrl}`);
  }
  
  // Find product name
  let productName = '';
  const nameEl = item.querySelector('.shopping-cart__product-name-text');
  if (nameEl) {
    productName = nameEl.textContent.trim();
    console.log(`Found name: ${productName}`);
  }
  
  // Find price
  let price = '';
  const priceEl = item.querySelector('[data-currency-conversion]');
  if (priceEl) {
    price = priceEl.textContent.trim();
    console.log(`Found price: ${price}`);
  }
  
  // Find variant info (size/color)
  let variantInfo = '';
  let size = '';
  let color = '';
  const variantEl = item.querySelector('.shopping-cart__product-variant');
  if (variantEl) {
    variantInfo = variantEl.textContent.trim();
    console.log(`Found variant info: ${variantInfo}`);
    
    // Try to extract size and color if they're in "Size / Color" format
    if (variantInfo.includes('/')) {
      const parts = variantInfo.split('/');
      size = parts[0].trim();
      color = parts[1].trim();
    }
  }
  
  return {
    imageUrl,
    productName: productName || 'Product',
    price: price || '',
    size: size || '',
    color: color || '',
    variantInfo
  };
}

// For Aritzia
function processAritziaItem(item, index) {
  console.log(`Processing Aritzia item ${index}`);
  
  // Find image
  let imageUrl = '';
  const imgEl = item.querySelector('div._1sj10sn1 img');
  if (imgEl && imgEl.src) {
    imageUrl = imgEl.src;
    console.log(`Found image: ${imageUrl}`);
  }
  
  // Find product name
  let productName = '';
  const nameEl = item.querySelector('[data-testid^="bag-product-name-text"]');
  if (nameEl) {
    productName = nameEl.textContent.trim();
    console.log(`Found name: ${productName}`);
  }
  
  // Find brand
  let brand = '';
  const brandEl = item.querySelector('[data-testid^="bag-product-brand-text"]');
  if (brandEl) {
    brand = brandEl.textContent.trim();
    console.log(`Found brand: ${brand}`);
  }
  
  // Find price
  let price = '';
  const priceEl = item.querySelector('[data-testid="product-list-price-text"]');
  if (priceEl) {
    price = priceEl.textContent.trim();
    console.log(`Found price: ${price}`);
  }
  
  // Find size
  let size = '';
  const sizeEl = item.querySelector('[data-testid^="bag-size-text"]');
  if (sizeEl) {
    size = sizeEl.textContent.trim();
    console.log(`Found size: ${size}`);
  }
  
  // Find color
  let color = '';
  const colorEl = item.querySelector('[data-testid^="bag-product-colour-text"]');
  if (colorEl) {
    color = colorEl.textContent.trim();
    console.log(`Found color: ${color}`);
  }
  
  return {
    imageUrl,
    productName: productName || 'Product',
    brand: brand || '',
    price: price || '',
    size: size || '',
    color: color || ''
  };
}

function processHMItem(item, index) {
  console.log(`Processing H&M item ${index}`);
  
  // Find image directly
  let imageUrl = '';
  const imgEl = item.querySelector('picture img');
  if (imgEl && imgEl.src) {
    imageUrl = imgEl.src;
    console.log(`Found image: ${imageUrl}`);
  }
  
  // Find product name directly
  let productName = '';
  const nameEl = item.querySelector('h2');
  if (nameEl) {
    productName = nameEl.textContent.trim();
    console.log(`Found name: ${productName}`);
  }
  
  // Find price directly - this will find something like "span.aeecde"
  let price = '';
  const priceElements = Array.from(item.querySelectorAll('span'));
  const priceEl = priceElements.find(el => {
    // Look for price-like content with currency symbol
    return el.textContent.includes('$') && /\$\d+\.\d+/.test(el.textContent);
  });
  
  if (priceEl) {
    price = priceEl.textContent.trim();
    console.log(`Found price: ${price}`);
  }
  
  // Find size directly
  let size = '';
  const sizeElements = Array.from(item.querySelectorAll('dl div'));
  const sizeContainer = sizeElements.find(el =>
    el.textContent.includes('Size') ||
    el.querySelector('dt span')?.textContent.includes('Size')
  );
  
  if (sizeContainer) {
    const sizeValueEl = sizeContainer.querySelector('dd span span');
    if (sizeValueEl) {
      size = sizeValueEl.textContent.trim();
      console.log(`Found size: ${size}`);
    }
  }
  
  // Find color directly
  let color = '';
  const colorElements = Array.from(item.querySelectorAll('dl div'));
  const colorContainer = colorElements.find(el =>
    el.textContent.includes('Color') ||
    el.querySelector('dt span')?.textContent.includes('Color')
  );
  
  if (colorContainer) {
    const colorValueEl = colorContainer.querySelector('dd span span');
    if (colorValueEl) {
      color = colorValueEl.textContent.trim();
      console.log(`Found color: ${color}`);
    }
  }
  
  // Store references to quantity elements for deletion
  let decreaseButton = null;
  let quantityInput = null;
  
  // Find the decrease button by text content or SVG path
  const decreaseButtons = Array.from(item.querySelectorAll('button'));
  decreaseButton = decreaseButtons.find(btn => {
    const hasDecreaseText = btn.textContent.includes('Decrease quantity');
    const hasSvgPath = btn.querySelector('svg path[d="M2 11.25h20v1.5H2v-1.5Z"]');
    return hasDecreaseText || hasSvgPath;
  });
  
  if (decreaseButton) {
    console.log('Found decrease button');
    // Also find the quantity input for reference
    quantityInput = item.querySelector('input[data-testid="quantity-input"]');
    if (quantityInput) {
      console.log(`Current quantity: ${quantityInput.value}`);
    }
  }
  
  return {
    imageUrl,
    productName: productName || 'Product',
    price: price || '',
    size: size || '',
    color: color || '',
    decreaseButton, // Store the actual DOM element for later use
    quantityInput   // Store the quantity input for reference
  };
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
      showDebugOverlay("Already initialized, skipping");
      return;
    }

    // Verify we're on a cart page
    if (!checkForCartURL()) {
      console.log("Cart Image Extractor: URL doesn't match cart patterns, aborting");
      showDebugOverlay("URL doesn't match cart patterns, aborting");
      hideCartPanel();
      return;
    }

    // Check for cart elements
    if (checkForCartElements()) {
      hasInitialized = true;
      console.log("Cart Image Extractor: Initializing extension on cart page");
      showDebugOverlay("Initializing extension on cart page");

      // Create panel
      const panel = createBottomPanel();

      // Initialize cart state
      panel.cartState = panel.cartState || {
        items: [],
        currentIndex: 0,
        similarItems: [],
        similarItemsIndex: {},
        wardrobeBottoms: []
      };

      // Fetch wardrobe bottoms
      browser.runtime.sendMessage({ action: "getBottoms" }, function(response) {
        if (response && response.bottoms) {
          panel.cartState.wardrobeBottoms = response.bottoms;
          console.log(`Cart Image Extractor: Fetched ${response.bottoms.length} wardrobe bottoms`);
          showDebugOverlay(`Fetched ${response.bottoms.length} wardrobe bottoms`);
        } else {
          console.error("Cart Image Extractor: Failed to fetch wardrobe bottoms");
          showDebugOverlay("Failed to fetch wardrobe bottoms");
          panel.cartState.wardrobeBottoms = [];
        }

        // Extract cart items and display
        setTimeout(() => {
          extractAndDisplayImages();
          // Set up observation for dynamic changes
          observeCartChanges();
        }, 800);
      });
    } else {
      console.log("Cart Image Extractor: Cart URL but no cart elements yet, waiting");
      showDebugOverlay("Cart URL matched but elements not found yet");

      // Retry after a short delay
      setTimeout(() => {
        if (!hasInitialized && checkForCartURL()) {
          initializeExtension();
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




function getImageUrl(item) {
  if (!currentSiteConfig) return '';
  
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
  
  return imageUrl;
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

// Function to create the full-screen comparison panel

