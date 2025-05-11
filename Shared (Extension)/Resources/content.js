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
      ],
      deleteButton: [
        'button[data-qa-action="remove-order-item"]',
        '.shop-cart-item-actions__dismiss'
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
      ],
      deleteButton: [
        'button[aria-label*="Decrease quantity"]',  // Target by aria-label content
        'button:has(svg[viewBox="0 0 24 24"] path[d="M2 11.25h20v1.5H2v-1.5Z"])', // Target by SVG path content
        'button:has(span:contains("Decrease quantity"))', // Target by text content
        '.fccc97 > button:first-child' // Target by position in cart item
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
      ],
      deleteButton: [
        'button[data-testid="remove-product-item-button"]',
        'button[aria-label="Remove"]',
        'button._1sj10sn2 button' // This is a fallback that might find the button based on its container
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
      ],
      deleteButton: [
        '.close button',
        '.product-template-item .close button',
        'button[aria-label="close"]',
        '.close-button'
      ]
    }
  },
  
  // Edikted configuration
  edikted: {
    cartDetection: {
      urlPatterns: ['/cart', '/checkout'], // Covers main cart page and possible checkout variations
      domSelectors: [
        '.cart__items',           // Main cart items container
        '.cart__items-header',    // Header shown in your HTML
        '[class*="cart"]',        // Broad match for cart-related elements
        '[data-cart-items]'       // Common data attribute pattern
      ],
      textIndicators: ['shopping cart', 'cart', 'basket', 'items'] // Common cart-related text
    },
    itemSelectors: {
      container: [
        '.cart__items > div:not(.cart__items-header)', // Direct children of cart__items excluding header
        '.cart__items .cart-item',                     // Common pattern for cart items
        '.cart__items [class*="item"]',                // Broad match for item classes
        '.cart__items article'                         // Alternative common structure
      ],
      image: [
        '.cart__items img',                            // Any image within cart items
        '[class*="item-image"] img',                  // Common class pattern
        'img[src*="/products/"]',                     // Images with product path
        '.cart__items .image-container img'           // Possible image container
      ],
      name: [
        '.cart__items .cart-item .name',              // Specific name class
        '.cart__items [class*="title"]',             // Common title pattern
        '.cart__items h3',                           // Possible heading for names
        '.cart__items [class*="product"]'            // Broad product name match
      ],
      price: [
        '.cart__items .price',                        // Direct price class
        '[class*="item-price"]',                     // Common price class pattern
        '.cart__items [data-price]',                 // Possible data attribute
        '.cart__items .amount'                       // Alternative price class
      ],
      size: [
        '.cart__items .size',                         // Direct size class
        '[class*="variant"]',                        // Common variant pattern
        '.cart__items [data-size]',                  // Possible data attribute
        '.cart__items .spec'                         // Alternative spec class
      ],
      color: [
        '.cart__items .color',                        // Direct color class
        '[class*="swatch"]',                         // Common color swatch pattern
        '.cart__items [data-color]',                 // Possible data attribute
        '.cart__items .variant-color'                // Alternative color class
      ],
      deleteButton: [
        '.cart-item__remove-btn',  // This is the key selector for delete buttons
        'a[data-ajax-cart-request-button]',
        'a[href*="/cart/change"][href*="quantity=0"]'
      ]
    }
  },
  
  // Princess Polly configuration
  princessPolly: {
    cartDetection: {
      urlPatterns: ['/cart', '/checkout'],
      domSelectors: [
        '.shopping-cart__container',
        '.shopping-cart__form',
        '[data-cart-container]',
        '[data-cart-list]',
        '.responsive-table'
      ],
      textIndicators: ['shopping cart', 'bag', 'checkout', 'subtotal']
    },
    itemSelectors: {
      container: [
        '.responsive-table-row',
        'tr[class*="responsive-table"]',
        '[data-cart-list] > tr'
      ],
      image: [
        '.shopping-cart__td--image img',
        '.shopping-cart__image-link img',
        'img.vue-lazy'
      ],
      name: [
        '.shopping-cart__product-name-text',
        '.shopping-cart__product-name span',
        '.shopping-cart__product a'
      ],
      price: [
        '.shopping-cart__td--price span[data-currency-conversion]',
        '.shopping-cart__product-price span[data-currency-conversion]',
        '[data-currency-conversion]'
      ],
      size: [
        '.shopping-cart__product-variant',
        'span.shopping-cart__product-variant'
      ],
      color: [
        '.shopping-cart__product-variant',
        'span.shopping-cart__product-variant'
      ],
      deleteButton: [
        '.cart-incrementor__button--minus',
        'button[title="Remove one"]',
        '.shopping-cart__td--quantity button:first-child'
      ]
    }
  },
    // Revolve configuration update
    revolve: {
      cartDetection: {
        urlPatterns: ['/ShoppingBag.jsp', '/r/ShoppingBag.jsp', '/r/mobile/ShoppingBag.jsp', '/checkout'],
        domSelectors: [
          '.shopping-bag__row',
          '.js-cart-item',
          '.shopping-bag__container',
          'tr.shopping-bag__item-body'
        ],
        textIndicators: ['shopping bag', 'bag', 'checkout', 'cart', 'items in your cart']
      },
      itemSelectors: {
        container: [
          'tr.shopping-bag__row',
          '.js-cart-item',
          'tr.shopping-bag__item-body'
        ],
        image: [
          '.shopping-bag__image img',
          '.shopping-bag__image-placeholder img',
          'img[srcset*="revolveassets"]'
        ],
        name: [
          '.shopping-bag__body a strong',
          '.shopping-bag__body .u-block strong',
          '.shopping-bag__prod-info a strong'
        ],
        price: [
          'span.js-price',
          '.shopping-bag__pri .price__retail',
          '.shopping-bag__price-wrap .price__retail'
        ],
        size: [
          '.shopbag_item_size .sb_display',
          'span[data]',
          'span.sb_display[data]'
        ],
        color: [
          '.u-float--left:contains("Color:")',
          '.shopping-bag__body span:contains("Color:")'
        ],
        deleteButton: [
          'button.js-track-remove',
          'button[onclick*="removeBagProduct"]',
          '.u-float--left button.link:contains("remove")'
        ]
      }
    },
  
  // OhPolly configuration
  ohpolly: {
    cartDetection: {
      urlPatterns: ['/cart', '/checkout', '/checkouts/', '/bag'],
      domSelectors: [
        '.crt-Cart',
        '.crt-Cart_Products',
        '.crt-Products_Items',
        '[data-cart-item-external-el="cart"]',
        '[data-section-type="cart-items"]'
      ],
      textIndicators: ['items in your bag', 'bag', 'checkout', 'order summary']
    },
    itemSelectors: {
      container: [
        '.crt-Products_Item',
        'cart-item',
        '.crt-Product'
      ],
      image: [
        '.crt-Product_ImageContainer img',
        '.rsp-Image_Image',
        'img[loading="lazy"]'
      ],
      name: [
        '.crt-Product_TitleLink',
        '.crt-Product_Title',
        '.crt-Product_Strapline + .crt-Product_Title'
      ],
      price: [
        '.crt-Product_Price',
        'p.crt-Product_Price',
        'span.crt-Product_Price'
      ],
      size: [
        '.crt-Product_TitleLink',
        '.crt-Product_Title'
      ],
      color: [
        '.crt-Product_TitleLink',
        '.crt-Product_Title'
      ],
      deleteButton: [
        '.crt-Product_Button-remove',
        'button[data-cart-item-el="remove"]',
        'button.crt-Product_Button-remove'
      ]
    }
  },
    fashionNova: {
      cartDetection: {
        urlPatterns: ['/cart', '/checkout'],
          domSelectors: [
                'div[data-testid="cart-lines"]',
                'ul.flex',
                '[data-testid="cart-line-item"]'
              ],
        textIndicators: ['cart', 'bag', 'checkout', 'wishlist']
      },
      itemSelectors: {
        container: [
          'li.cart-line',
          '.cart-line',
          'ul.flex > li'
        ],
        image: [
          'a[data-testid="cart-line-link"] img',
          'img[data-testid="cart-line-image"]',
          '.cart-line img'
        ],
        name: [
          'a[data-testid="cart-line-title-link"]',
          '.body-xs.overflow-hidden',
          '.cart-line a'
        ],
        price: [
          'div[data-testid="cart-line-price"] span.body-md-bold',
          '.body-md-bold.leading-[15px]',
          'span.body-md-bold'
        ],
        size: [
          'button[data-testid="size-selector"] span',
          '.body-xs span',
          '[data-testid="size-selector"]'
        ],
        color: [
          // Color is usually part of the product name for Fashion Nova
          // Try to extract from product name
          'a[data-testid="cart-line-title-link"]'
        ],
        deleteButton: [
          'button[data-testid="remove-item"]',
          'button[aria-label="Remove item"]',
          'form input[value*="LinesRemove"] + button'
        ]
      }
    },
    urbanOutfitters: {
      cartDetection: {
        urlPatterns: ['/cart', '/checkout'],
        domSelectors: [
          '.c-pwa-cart-transactional__items',
          '.c-pwa-cart-transactional__item',
          '.c-pwa-cart-item',
          'div[role="listitem"]'
        ],
        textIndicators: ['shopping bag', 'checkout', 'order summary']
      },
      itemSelectors: {
        container: [
          '.c-pwa-cart-transactional__item',
          '.c-pwa-cart-item',
          'div[role="listitem"]'
        ],
        image: [
          '.o-pwa-item-thumbnail__image',
          '.o-pwa-image__img',
          'picture.o-pwa-image img'
        ],
        name: [
          '.c-pwa-item-title__link',
          'h2.c-pwa-item-title a',
          '.c-pwa-item-title a'
        ],
        price: [
          '.c-pwa-item-price__unit',
          '.c-pwa-item-price__line',
          '[data-qa-item-total-price]',
          '[data-qa-item-unit-price]'
        ],
        size: [
          'li[data-qa-item-label="cc_size_label"]',
          '.c-pwa-item-attributes__attribute:contains("Size")',
          '.c-pwa-item-attributes span.c-pwa-item-attributes__label:contains("Size") + *'
        ],
        color: [
          'li[data-qa-item-label="cc_color_label"]',
          '.c-pwa-item-attributes__attribute:contains("Color")',
          '.c-pwa-item-attributes span.c-pwa-item-attributes__label:contains("Color") + *'
        ],
        deleteButton: [
          'button[aria-label^="Remove"]',
          'button[data-qa-item-remove]',
          '.c-pwa-cart-item-actions__action button'
        ]
      }
    },
    brandyMelville: {
      cartDetection: {
        urlPatterns: ['/cart', '/checkout'],
        domSelectors: [
          '.cart-items',
          '.cart-item',
          'table.cart-items',
          '[id^="CartItem-"]',
          'cart-items-wrapper'
        ],
        textIndicators: ['shopping cart', 'cart', 'bag', 'items in your cart']
      },
      itemSelectors: {
        container: [
          '.cart-item',
          'tr.cart-item',
          '[id^="CartItem-"]'
        ],
        image: [
          '.cart-item__image',
          '.cart-item__media img',
          'img[class*="cart-item"]'
        ],
        name: [
          '.cart-item__name',
          'a.cart-item__name',
          '.cart-item__details a'
        ],
        price: [
          '.price.price--end',
          '.cart-item__price-wrapper .price',
          'span[data-uw-rm-sr]'
        ],
        size: [
          '.product-option dt:contains("Size") + dd',
          'dl .product-option:contains("Size") dd',
          'dl div[class*="product-option"]:nth-child(2) dd'
        ],
        color: [
          '.product-option dt:contains("Color") + dd',
          'dl .product-option:contains("Color") dd',
          'dl div[class*="product-option"]:nth-child(1) dd'
        ],
        deleteButton: [
            'cart-remove-button a',
            '.button.button--tertiary[href*="quantity=0"]',
            'a[aria-label^="Remove"]',
            '.cart-item__quantity a[href*="quantity=0"]'
        ]
      }
    }
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

function processUrbanOutfittersItem(item, index) {
  console.log(`Processing Urban Outfitters item ${index}`);
  
  // Find image
  let imageUrl = '';
  const imgEl = item.querySelector('.o-pwa-item-thumbnail__image');
  if (imgEl && imgEl.src) {
    imageUrl = imgEl.src;
    console.log(`Found image: ${imageUrl}`);
  }
  
  // Find product name
  let productName = '';
  const nameEl = item.querySelector('.c-pwa-item-title__link');
  if (nameEl) {
    productName = nameEl.textContent.trim();
    console.log(`Found name: ${productName}`);
  }
  
  // Find price
  let price = '';
  const priceEl = item.querySelector('[data-qa-item-total-price]');
  if (priceEl) {
    price = priceEl.textContent.trim();
    console.log(`Found price: ${price}`);
  } else {
    // Try alternative price selector
    const altPriceEl = item.querySelector('.c-pwa-item-price__unit');
    if (altPriceEl) {
      price = altPriceEl.textContent.trim().replace('Item Price', '');
      console.log(`Found price (alternative): ${price}`);
    }
  }
  
  // Find size
  let size = '';
  const sizeEl = item.querySelector('li[data-qa-item-label="cc_size_label"]');
  if (sizeEl) {
    size = sizeEl.textContent.replace('Size', '').trim();
    console.log(`Found size: ${size}`);
  }
  
  // Find color
  let color = '';
  const colorEl = item.querySelector('li[data-qa-item-label="cc_color_label"]');
  if (colorEl) {
    color = colorEl.textContent.replace('Color', '').trim();
    console.log(`Found color: ${color}`);
  }
  
  // Find delete button
  const deleteButton = item.querySelector('button[aria-label^="Remove"]') ||
                       item.querySelector('button[data-qa-item-remove]');
  
  if (deleteButton) {
    console.log(`Found delete button for Urban Outfitters item`);
  }
  
  return {
    imageUrl,
    productName: productName || 'Product',
    price: price || '',
    size: size || '',
    color: color || '',
    deleteButton // Include the delete button reference
  };
}

  // Function to process OhPolly items specifically
  function processOhPollyItem(item, index) {
    console.log(`Processing OhPolly item ${index}`);
    
    // Find image directly
    let imageUrl = '';
    const imgEl = item.querySelector('.rsp-Image_Image');
    if (imgEl && imgEl.src) {
      imageUrl = imgEl.src;
      console.log(`Found image: ${imageUrl}`);
    }
    
    // Find product name directly - OhPolly has a strapline (brand/collection) and a title
    let strapline = '';
    const straplineEl = item.querySelector('.crt-Product_Strapline');
    if (straplineEl) {
      strapline = straplineEl.textContent.trim();
      console.log(`Found strapline: ${strapline}`);
    }
    
    // Find product title - this contains name, color and size
    let fullTitle = '';
    const titleEl = item.querySelector('.crt-Product_TitleLink, .crt-Product_Title');
    if (titleEl) {
      fullTitle = titleEl.textContent.trim();
      console.log(`Found full title: ${fullTitle}`);
    }
    
    // Extract product name, color and size from the title
    // Format is typically "Product Name in Color - Size"
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
    
    return {
      imageUrl,
      strapline,
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
    
    // Process all items using a unified approach
    cartItems.forEach((item, index) => {
        try {
            console.log(`Cart Image Extractor: Processing item ${index+1}`);
            showDebugOverlay(`Processing item ${index+1}`);
            
            // Get product info - use special processing for certain sites if needed
            let productInfo;
            let itemData = {};
            
            if (window.location.hostname.includes('abercrombie.com')) {
                productInfo = processAbercrombieItem(item, index);
            } else if (window.location.hostname.includes('ohpolly.com')) {
                productInfo = processOhPollyItem(item, index);
            } else if (window.location.hostname.includes('revolve.com')){
                productInfo = processRevolveItem(item, index);
            } else if (window.location.hostname.includes('hm.com')) {
                productInfo = processHMItem(item, index);  // Make sure this line is present
            } else if (window.location.hostname.includes('princesspolly.com')) {
                productInfo = processPrincessPollyItem(item, index);
            } else if (window.location.hostname.includes('aritzia.com')) {
                productInfo = processAritziaItem(item, index);
            } else if (window.location.hostname.includes('urbanoutfitters.com')) {
                productInfo = processUrbanOutfittersItem(item, index);
            } else if (window.location.hostname.includes('fashionnova.com')) {
                productInfo = processFashionNovaItem(item, index);
            } else if (window.location.hostname.includes('brandymelville.com')) {
                productInfo = processBrandyMelvilleItem(item, index);
            } else {
                // Generic processing for other sites
                itemData.imageUrl = getImageUrl(item);
                itemData.productName = getTextFromSelectors('name', item) || 'Product';
                itemData.price = getTextFromSelectors('price', item) || '';
                itemData.size = getTextFromSelectors('size', item) || '';
                itemData.color = getTextFromSelectors('color', item) || '';
                productInfo = itemData;
            }
            
            if (!productInfo.imageUrl) {
                console.log(`Cart Image Extractor: No image found for item ${index+1}`);
                showDebugOverlay(`No image found for item ${index+1}`);
                return;
            }
            
            console.log(`Cart Image Extractor: Found image for item ${index+1}: ${productInfo.imageUrl}`);
            
            // Create item container
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.setAttribute('data-item-index', index);
            
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
            
            if (productInfo.brand) {
                const brandDiv = document.createElement('div');
                brandDiv.className = 'item-brand';
                brandDiv.style.fontSize = '10px';
                brandDiv.style.color = '#666';
                brandDiv.textContent = productInfo.brand;
                detailsElement.appendChild(brandDiv);
                
                detailsElement.appendChild(nameDiv);
            } else {
                detailsElement.appendChild(nameDiv);
            }
            
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
            
            // Add delete button if site config has delete selectors
            if (currentSiteConfig.itemSelectors.deleteButton &&
                currentSiteConfig.itemSelectors.deleteButton.length > 0) {
                
                // Create delete button
        const deleteItemBtn = document.createElement('button');
        deleteItemBtn.className = 'item-delete-button';
        deleteItemBtn.textContent = 'Delete';
        
        // Add event listener to the delete button
        deleteItemBtn.addEventListener('click', function() {
            // Try to find the delete button in the original item
            let deleteButton = null;
            
            if (window.location.hostname.includes('hm.com')) {
                console.log(`Cart Image Extractor: Using two-step deletion for H&M item ${index+1}`);
                
                // Step 1: Find and click the "Decrease quantity by 1" button
                const decreaseButton = Array.from(document.querySelectorAll('button'))
                .find(btn => btn.textContent.includes('Decrease quantity by 1'));
                
                if (decreaseButton) {
                    console.log(`Cart Image Extractor: Found decrease button for H&M, starting deletion process`);
                    
                    // Click the decrease button
                    decreaseButton.click();
                    
                    // Step 2: Wait for the confirmation dialog and click "Remove"
                    const interval = setInterval(() => {
                        const removeButton = Array.from(document.querySelectorAll('button'))
                        .find(btn => btn.textContent.includes('Remove'));
                        
                        if (removeButton) {
                            console.log(`Cart Image Extractor: Found Remove confirmation button, completing deletion`);
                            removeButton.click();
                            clearInterval(interval);
                            
                            // Remove the item from our panel
                            itemElement.remove();
                            
                            // Check if cart is empty
                            setTimeout(() => {
                                if (imageContainer.children.length === 0) {
                                    const emptyMessage = document.createElement('div');
                                    emptyMessage.className = 'panel-message';
                                    emptyMessage.textContent = 'Your cart is empty';
                                    imageContainer.appendChild(emptyMessage);
                                }
                            }, 100);
                        }
                    }, 100); // Check every 100ms
                    
                    // Safety timeout to prevent infinite checking
                    setTimeout(() => {
                        clearInterval(interval);
                    }, 5000);
                    
                    return; // Exit early
                } else {
                    console.log(`Cart Image Extractor: Could not find decrease button for H&M item`);
                }
            }
            
            if (window.location.hostname.includes('princesspolly.com')) {
                console.log(`Cart Image Extractor: Using special handling for Princess Polly item ${index+1}`);
                
                // Find the decrement button
                const decreaseButton = item.querySelector('.cart-incrementor__button--minus') ||
                                       item.querySelector('button[title="Remove one"]');
                
                // Find quantity display to check if this is the last item
                const quantityDisplay = item.querySelector('.cart-incrementor__amount');
                let quantity = 1;
                
                if (quantityDisplay) {
                    quantity = parseInt(quantityDisplay.textContent.trim(), 10) || 1;
                    console.log(`Cart Image Extractor: Item quantity is ${quantity}`);
                }
                
                if (decreaseButton) {
                    // Click the decrease button
                    decreaseButton.click();
                    console.log(`Cart Image Extractor: Clicked decrease button for Princess Polly item`);
                    
                    // If this was the last item (quantity=1), remove from our panel
                    if (quantity <= 1) {
                        itemElement.remove();
                        
                        // Check if cart is empty
                        setTimeout(() => {
                            if (imageContainer.children.length === 0) {
                                const emptyMessage = document.createElement('div');
                                emptyMessage.className = 'panel-message';
                                emptyMessage.textContent = 'Your cart is empty';
                                imageContainer.appendChild(emptyMessage);
                            }
                        }, 100);
                    } else {
                        // If quantity was > 1, show message that quantity was decreased
                        const notification = document.createElement('div');
                        notification.className = 'item-notification';
                        notification.textContent = 'Quantity decreased. Click again to remove.';
                        notification.style.fontSize = '10px';
                        notification.style.color = '#e55';
                        notification.style.marginTop = '5px';
                        detailsElement.appendChild(notification);
                        
                        // Refresh panel after a short delay
                        setTimeout(() => {
                            extractAndDisplayImages();
                        }, 2000);
                    }
                } else {
                    console.log(`Cart Image Extractor: Could not find decrease button for Princess Polly item`);
                }
                
                return; // Exit early
            }
            
            // Special handling for Brandy Melville
            if (window.location.hostname.includes('brandymelville.com')) {
                console.log(`Cart Image Extractor: Using special handling for Brandy Melville item ${index+1}`);
                
                // Brandy Melville uses links instead of buttons for deletion
                if (productInfo.deleteLink) {
                    console.log(`Cart Image Extractor: Found delete link, navigating to it`);
                    // Instead of clicking, we need to use the href since it's a navigation link
                    window.location.href = productInfo.deleteLink.href;
                    return; // Exit early as we're navigating away
                } else {
                    // Try to find any remove link directly
                    const removeLink = item.querySelector('cart-remove-button a, a[href*="quantity=0"]');
                    if (removeLink) {
                        console.log(`Cart Image Extractor: Found remove link directly, navigating to it`);
                        window.location.href = removeLink.href;
                        return; // Exit early as we're navigating away
                    } else {
                        // Final attempt - look through all cart-remove-button elements
                        const allRemoveButtons = document.querySelectorAll('cart-remove-button a');
                        if (allRemoveButtons.length > index) {
                            console.log(`Cart Image Extractor: Found remove link by index, navigating to it`);
                            window.location.href = allRemoveButtons[index].href;
                            return; // Exit early as we're navigating away
                        }
                        
                        console.log(`Cart Image Extractor: Could not find any remove links for Brandy Melville`);
                        // No navigation will happen, so we can continue with panel updates
                    }
                }
                
                // Since we're using navigation, we don't need to update the panel UI here
                // The page will reload after deletion
            }
            
            if (window.location.hostname.includes('ohpolly.com')) {
                console.log(`Cart Image Extractor: Using special handling for OhPolly item ${index+1}`);
                
                // Get the delete button from productInfo if it was processed by processOhPollyItem
                if (productInfo.deleteButton) {
                    deleteButton = productInfo.deleteButton;
                } else {
                    // Otherwise try to find it directly in the item
                    deleteButton = item.querySelector('.crt-Product_Button-remove') ||
                                  item.querySelector('button[data-cart-item-el="remove"]');
                }
                
                if (deleteButton) {
                    console.log(`Cart Image Extractor: Found delete button for OhPolly, clicking it`);
                    
                    // Click the delete button
                    deleteButton.click();
                    
                    // Remove the item from our panel
                    itemElement.remove();
                    
                    // Check if cart is empty
                    setTimeout(() => {
                        if (imageContainer.children.length === 0) {
                            const emptyMessage = document.createElement('div');
                            emptyMessage.className = 'panel-message';
                            emptyMessage.textContent = 'Your cart is empty';
                            imageContainer.appendChild(emptyMessage);
                        }
                    }, 100);
                    
                    return; // Exit early
                } else {
                    console.log(`Cart Image Extractor: Could not find delete button for OhPolly item directly`);
                    
                    // Try an alternative approach - get all remove buttons and click the one at this index
                    const allRemoveButtons = document.querySelectorAll('.crt-Product_Button-remove');
                    if (allRemoveButtons.length > index) {
                        console.log(`Cart Image Extractor: Found delete button by index, clicking it`);
                        allRemoveButtons[index].click();
                        
                        // Remove the item from our panel
                        itemElement.remove();
                        return; // Exit early
                    }
                    
                    console.log(`Cart Image Extractor: No matching button found for OhPolly item`);
                    
                    // Fallback - refresh cart panel
                    setTimeout(() => {
                        extractAndDisplayImages();
                    }, 2000);
                }
                
                return; // Exit early
            }

            // Special handling for Aritzia
            if (window.location.hostname.includes('aritzia.com')) {
                console.log(`Cart Image Extractor: Using special handling for Aritzia item ${index+1}`);
                
                // Try to find the remove button by data-testid
                const removeButton = document.querySelector(`button[data-testid="remove-product-item-button"]`);
                
                if (removeButton) {
                    console.log(`Cart Image Extractor: Found remove button for Aritzia, clicking it`);
                    removeButton.click();
                    
                    // Remove the item from our panel
                    itemElement.remove();
                    
                    // Check if cart is empty
                    setTimeout(() => {
                        if (imageContainer.children.length === 0) {
                            const emptyMessage = document.createElement('div');
                            emptyMessage.className = 'panel-message';
                            emptyMessage.textContent = 'Your cart is empty';
                            imageContainer.appendChild(emptyMessage);
                        }
                    }, 100);
                } else {
                    console.log(`Cart Image Extractor: Could not find remove button for Aritzia item`);
                    
                    // Fallback - try to find by aria-label or SVG title
                    const removeButtonsByAriaLabel = Array.from(document.querySelectorAll('button[aria-label="Remove"]'));
                    
                    if (removeButtonsByAriaLabel.length > index) {
                        console.log(`Cart Image Extractor: Found remove button by aria-label, clicking it`);
                        removeButtonsByAriaLabel[index].click();
                        
                        // Remove the item from our panel
                        itemElement.remove();
                    } else {
                        console.log(`Cart Image Extractor: Could not find any remove buttons for Aritzia`);
                        
                        // Fallback - refresh cart panel
                        setTimeout(() => {
                            extractAndDisplayImages();
                        }, 2000);
                    }
                }
                
                return; // Exit early
            }
            
            if (window.location.hostname.includes('urbanoutfitters.com')) {
                console.log(`Cart Image Extractor: Using special handling for Urban Outfitters item ${index+1}`);
                
                // If we have the delete button from processing, use it directly
                if (productInfo.deleteButton) {
                    console.log(`Cart Image Extractor: Found delete button reference, clicking it`);
                    productInfo.deleteButton.click();
                } else {
                    // Otherwise try to find it in the cart item
                    const removeButton = item.querySelector('button[aria-label^="Remove"]');
                    
                    if (removeButton) {
                        console.log(`Cart Image Extractor: Found remove button, clicking it`);
                        removeButton.click();
                    } else {
                        console.log(`Cart Image Extractor: Trying to find remove button by direct DOM query`);
                        
                        // Try a more general search across the page if we can't find it in this specific item
                        const allRemoveButtons = document.querySelectorAll('button[aria-label^="Remove"]');
                        if (allRemoveButtons.length > index) {
                            console.log(`Cart Image Extractor: Found remove button by index, clicking it`);
                            allRemoveButtons[index].click();
                        } else {
                            console.log(`Cart Image Extractor: Could not find any remove buttons`);
                            // Fallback - refresh cart panel
                            setTimeout(() => {
                                extractAndDisplayImages();
                            }, 2000);
                        }
                    }
                }
                
                // Remove the item from our panel
                itemElement.remove();
                
                // Check if cart is empty
                setTimeout(() => {
                    if (imageContainer.children.length === 0) {
                        const emptyMessage = document.createElement('div');
                        emptyMessage.className = 'panel-message';
                        emptyMessage.textContent = 'Your cart is empty';
                        imageContainer.appendChild(emptyMessage);
                    }
                }, 100);
                
                return; // Exit early
            }
            
            // Special handling for Fashion Nova's two-step delete process
            if (window.location.hostname.includes('fashionnova.com')) {
                console.log(`Cart Image Extractor: Using special handling for Fashion Nova item ${index+1}`);
                
                // Step 1: Click the remove button to open the confirmation dialog
                const removeButton = item.querySelector('button[data-testid="remove-item"]') ||
                                     item.querySelector('button[aria-label="Remove item"]');
                
                if (removeButton) {
                    console.log(`Cart Image Extractor: Found remove button for Fashion Nova, clicking it to open confirmation`);
                    removeButton.click();
                    
                    // Step 2: Wait for the confirmation dialog and click the "Remove" button
                    setTimeout(() => {
                        // Find the confirmation dialog's Remove button
                        const confirmRemoveButton = document.querySelector('aside button.button-primary:not([disabled])');
                        
                        if (confirmRemoveButton) {
                            console.log(`Cart Image Extractor: Found confirmation Remove button, completing deletion`);
                            confirmRemoveButton.click();
                            
                            // Remove the item from our panel
                            itemElement.remove();
                            
                            // Check if cart is empty
                            setTimeout(() => {
                                if (imageContainer.children.length === 0) {
                                    const emptyMessage = document.createElement('div');
                                    emptyMessage.className = 'panel-message';
                                    emptyMessage.textContent = 'Your cart is empty';
                                    imageContainer.appendChild(emptyMessage);
                                }
                            }, 500);
                        } else {
                            console.log(`Cart Image Extractor: Confirmation dialog not found or Remove button not available`);
                            
                            // Try an alternative approach - submit the form directly
                            if (productInfo.removeForm && productInfo.removeForm.form) {
                                console.log(`Cart Image Extractor: Attempting to submit remove form directly`);
                                productInfo.removeForm.form.submit();
                                
                                // Remove the item from our panel
                                itemElement.remove();
                            } else {
                                console.log(`Cart Image Extractor: No alternative removal method available`);
                                // Fallback - refresh the cart panel
                                setTimeout(() => {
                                    extractAndDisplayImages();
                                }, 2000);
                            }
                        }
                    }, 500); // Give the dialog time to appear
                } else {
                    console.log(`Cart Image Extractor: Could not find remove button for Fashion Nova item`);
                    showDebugOverlay(`Could not find remove button for Fashion Nova item ${index+1}`);
                    
                    // Fallback - refresh the cart panel
                    setTimeout(() => {
                        extractAndDisplayImages();
                    }, 2000);
                }
                
                return; // Exit early
            }
            
            // Standard approach for other sites
            for (const selector of currentSiteConfig.itemSelectors.deleteButton) {
                deleteButton = item.querySelector(selector);
                if (deleteButton) {
                    console.log(`Cart Image Extractor: Found delete button with selector "${selector}"`);
                    break;
                }
            }
            
            if (deleteButton) {
                console.log(`Cart Image Extractor: Clicking delete button for item ${index+1}`);
                showDebugOverlay(`Clicking delete button for item ${index+1}`);
                
                // Click the delete button
                deleteButton.click();
                
                // Remove the item from our panel
                itemElement.remove();
                
                // Update panel if no items left
                setTimeout(() => {
                    if (imageContainer.children.length === 0) {
                        const emptyMessage = document.createElement('div');
                        emptyMessage.className = 'panel-message';
                        emptyMessage.textContent = 'Your cart is empty';
                        imageContainer.appendChild(emptyMessage);
                    }
                }, 100);
            } else {
                console.log(`Cart Image Extractor: Could not find delete button for item ${index+1}`);
                showDebugOverlay(`Could not find delete button for item ${index+1}`);
                
                // Fallback - refresh the cart panel to reflect server-side changes
                setTimeout(() => {
                    extractAndDisplayImages();
                }, 2000);
            }
        });
        detailsElement.appendChild(deleteItemBtn);
    }
    
    itemElement.appendChild(imgContainer);
    itemElement.appendChild(detailsElement);

    // Add item to the image container
    imageContainer.appendChild(itemElement);
    } catch (error) {
            console.error('Cart Image Extractor: Error processing item details:', error);
            showDebugOverlay('Error processing item details: ' + error.message);
    }
    }); // <-- This closing brace and parenthesis is missing for the forEach
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
        position: relative;
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
      
      /* New styles for delete button */
      .item-delete-button {
        margin-top: 8px;
        padding: 4px 8px;
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 3px;
        font-size: 10px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .item-delete-button:hover {
        background-color: #d32f2f;
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

// Function to create the full-screen comparison panel
function createFullScreenComparisonPanel() {
  try {
    // Add CSS styles for the full-screen panel
    const style = document.createElement('style');
    style.textContent = `
      #cart-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: white;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        transition: transform 0.3s ease;
        overflow: hidden;
      }
      
      #cart-panel.hidden {
        transform: translateY(100%);
      }
      
      .panel-header {
        background-color: black;
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .panel-header h1 {
        margin: 0;
        font-size: 18px;
        font-weight: bold;
      }
      
      .panel-nav {
        background-color: #f1f1f1;
        padding: 8px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .panel-nav-button {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
      }
      
      .panel-nav-button[disabled] {
        color: #ccc;
        cursor: default;
      }
      
      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
      }
      
      .cart-item-section {
        margin-bottom: 24px;
      }
      
      .section-title {
        text-align: center;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #666;
      }
      
      .image-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-bottom: 8px;
      }
      
      .image-container {
        width: 192px;
        height: 224px;
        background-color: #f9f9f9;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        position: relative;
      }
      
      .image-container img {
        max-height: 100%;
        max-width: 100%;
        object-fit: contain;
      }
      
      .item-match-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background-color: #4caf50;
        color: white;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 9999px;
      }
      
      .item-details {
        text-align: center;
      }
      
      .item-name {
        font-size: 16px;
        font-weight: 500;
      }
      
      .item-meta {
        font-size: 14px;
        color: #666;
        margin: 4px 0;
      }
      
      .item-price {
        font-weight: bold;
        margin-top: 4px;
      }
      
      .similar-section {
        position: relative;
      }
      
      .similar-hint {
        text-align: center;
        margin-bottom: 4px;
        font-size: 12px;
        color: #999;
      }
      
      .nav-arrow {
        position: absolute;
        top: 50%;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        padding: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        z-index: 2;
        transform: translateY(-50%);
        border: none;
      }
      
      .nav-arrow-left {
        left: 0;
      }
      
      .nav-arrow-right {
        right: 0;
      }
      
      .dots-indicator {
        display: flex;
        justify-content: center;
        margin-top: 8px;
      }
      
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ddd;
        margin: 0 4px;
      }
      
      .dot.active {
        background-color: #000;
      }
      
      .panel-footer {
        border-top: 1px solid #eee;
        padding: 16px;
      }
      
      .footer-message {
        text-align: center;
        font-size: 14px;
        color: #666;
        margin-bottom: 12px;
      }
      
      .footer-button {
        width: 100%;
        padding: 12px 16px;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        margin-bottom: 8px;
      }
      
      .primary-button {
        background-color: black;
        color: white;
        border: none;
      }
      
      .secondary-button {
        background-color: white;
        color: black;
        border: 1px solid black;
      }
      
      .panel-toggle-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 16px;
        background-color: black;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        z-index: 9998;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      
      .close-button {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
      }
    `;
    document.head.appendChild(style);
    
    // Create the panel
    const panel = document.createElement('div');
    panel.id = 'cart-panel';
    panel.className = 'cart-panel';
    document.body.appendChild(panel);
    
    // Initialize cart state management
    panel.cartState = {
      items: [], // Will be populated from extracted cart items
      currentIndex: 0,
      similarItems: [ /* Will be populated with mock wardrobe items */ ],
      similarItemsIndex: {}  // Tracks the current index of similar items for each cart item
    };
    
    console.log("Cart Image Extractor: Full-screen comparison panel created");
    showDebugOverlay("Full-screen comparison panel created");
    
    return panel;
  } catch (error) {
    showDebugOverlay("ERROR in createFullScreenComparisonPanel: " + error.message);
    console.error("Error in createFullScreenComparisonPanel:", error);
    // Create a simple fallback panel in case of error
    const fallbackPanel = document.createElement('div');
    fallbackPanel.id = 'cart-panel';
    document.body.appendChild(fallbackPanel);
    return fallbackPanel;
  }
}

// Function to render the comparison panel content
function renderComparisonPanel(panel, cartItems) {
  try {
    if (!panel || !panel.cartState) return;
    
    // Clear existing content
    panel.innerHTML = '';
    
    // Initialize panel state if this is first render
    if (panel.cartState.items.length === 0 && cartItems.length > 0) {
      // Convert extracted cart items to our format
      panel.cartState.items = cartItems.map((item, index) => {
        // Extract data from the cart item
        let imageUrl = '';
        let productName = '';
        let price = '';
        let size = '';
        let color = '';
        
        // Process based on site-specific extraction logic
        if (typeof item.querySelector === 'function') {
          // This is a DOM element from the cart
          if (window.location.hostname.includes('abercrombie.com')) {
            const processed = processAbercrombieItem(item, index);
            imageUrl = processed.imageUrl;
            productName = processed.productName;
            price = processed.price;
            size = processed.size;
            color = processed.color;
          } else if (window.location.hostname.includes('revolve.com')) {
            const processed = processRevolveItem(item, index);
            imageUrl = processed.imageUrl;
            productName = processed.productName;
            price = processed.price;
            size = processed.size;
            color = processed.color;
          } else {
            // Generic processing
            imageUrl = getImageUrl(item);
            productName = getTextFromSelectors('name', item) || 'Product';
            price = getTextFromSelectors('price', item) || '';
            size = getTextFromSelectors('size', item) || '';
            color = getTextFromSelectors('color', item) || '';
          }
        } else {
          // Already processed item
          imageUrl = item.imageUrl || '';
          productName = item.productName || 'Product';
          price = item.price || '';
          size = item.size || '';
          color = item.color || '';
        }
        
        // Add similar items data based on item characteristics
        generateSimilarItems(panel, index, productName, size, color);
        
        return {
          id: index,
          imageUrl: imageUrl,
          productName: productName,
          price: price,
          size: size,
          color: color,
          currentSimilarIndex: 0
        };
      });
    }
    
    // Get current cart item
    const currentIndex = panel.cartState.currentIndex;
    const currentItem = panel.cartState.items[currentIndex] || {};
    
    // Get similar items for current cart item
    const similarItems = panel.cartState.similarItems.filter(item =>
      item.cartItemId === currentItem.id
    );
    
    // Get current similar item
    const currentSimilarIndex = panel.cartState.similarItemsIndex[currentItem.id] || 0;
    const currentSimilarItem = similarItems.length > 0 ?
      similarItems[currentSimilarIndex] : null;
    
    // Create header
    const header = document.createElement('div');
    header.className = 'panel-header';
    
    const title = document.createElement('h1');
    title.textContent = 'Similar Items Found';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', function() {
      panel.classList.add('hidden');
      createToggleButton();
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    panel.appendChild(header);
    
    // Create navigation bar
    const nav = document.createElement('div');
    nav.className = 'panel-nav';
    
    const prevButton = document.createElement('button');
    prevButton.className = 'panel-nav-button';
    prevButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>';
    prevButton.disabled = panel.cartState.items.length <= 1;
    prevButton.addEventListener('click', function() {
      if (panel.cartState.items.length <= 1) return;
      panel.cartState.currentIndex = (currentIndex > 0) ?
        currentIndex - 1 : panel.cartState.items.length - 1;
      renderComparisonPanel(panel, []);
    });
    
    const navInfo = document.createElement('div');
    navInfo.className = 'panel-nav-info';
    navInfo.textContent = `Item ${currentIndex + 1} of ${panel.cartState.items.length}`;
    
    const nextButton = document.createElement('button');
    nextButton.className = 'panel-nav-button';
    nextButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>';
    nextButton.disabled = panel.cartState.items.length <= 1;
    nextButton.addEventListener('click', function() {
      if (panel.cartState.items.length <= 1) return;
      panel.cartState.currentIndex = (currentIndex < panel.cartState.items.length - 1) ?
        currentIndex + 1 : 0;
      renderComparisonPanel(panel, []);
    });
    
    nav.appendChild(prevButton);
    nav.appendChild(navInfo);
    nav.appendChild(nextButton);
    panel.appendChild(nav);
    
    // Create main content area
    const content = document.createElement('div');
    content.className = 'panel-content';
    
    // Cart item section
    const cartItemSection = document.createElement('div');
    cartItemSection.className = 'cart-item-section';
    
    const cartItemTitle = document.createElement('div');
    cartItemTitle.className = 'section-title';
    cartItemTitle.textContent = 'In Your Shopping Cart';
    
    const cartImageWrapper = document.createElement('div');
    cartImageWrapper.className = 'image-wrapper';
    
    const cartImageContainer = document.createElement('div');
    cartImageContainer.className = 'image-container';
    
    const cartImage = document.createElement('img');
    cartImage.src = currentItem.imageUrl || '/api/placeholder/200/250';
    cartImage.alt = currentItem.productName || 'Product';
    cartImage.onerror = function() {
      this.src = '/api/placeholder/200/250';
    };
    
    cartImageContainer.appendChild(cartImage);
    cartImageWrapper.appendChild(cartImageContainer);
    
    const cartItemDetails = document.createElement('div');
    cartItemDetails.className = 'item-details';
    
    const cartItemName = document.createElement('div');
    cartItemName.className = 'item-name';
    cartItemName.textContent = currentItem.productName || 'Product';
    
    const cartItemMeta = document.createElement('div');
    cartItemMeta.className = 'item-meta';
    cartItemMeta.textContent = `${currentItem.size || ''} | ${currentItem.color || ''}`;
    
    const cartItemPrice = document.createElement('div');
    cartItemPrice.className = 'item-price';
    cartItemPrice.textContent = currentItem.price || '';
    
    cartItemDetails.appendChild(cartItemName);
    cartItemDetails.appendChild(cartItemMeta);
    cartItemDetails.appendChild(cartItemPrice);
    
    cartItemSection.appendChild(cartItemTitle);
    cartItemSection.appendChild(cartImageWrapper);
    cartItemSection.appendChild(cartItemDetails);
    
    content.appendChild(cartItemSection);
    
    // Similar items section
    const similarSection = document.createElement('div');
    similarSection.className = 'similar-section';
    
    const similarTitle = document.createElement('div');
    similarTitle.className = 'section-title';
    similarTitle.textContent = 'Similar Items in Your Wardrobe';
    
    if (currentSimilarItem) {
      const similarHint = document.createElement('div');
      similarHint.className = 'similar-hint';
      similarHint.textContent = similarItems.length > 1 ?
        `Swipe to see ${similarItems.length} similar items` :
        '1 similar item found';
      
      const similarImageWrapper = document.createElement('div');
      similarImageWrapper.className = 'image-wrapper';
      
      // Navigation arrows for similar items
      if (similarItems.length > 1) {
        const prevSimilarButton = document.createElement('button');
        prevSimilarButton.className = 'nav-arrow nav-arrow-left';
        prevSimilarButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>';
        prevSimilarButton.addEventListener('click', function() {
          const itemId = currentItem.id;
          const similarCount = similarItems.length;
          const currentSimilarIdx = panel.cartState.similarItemsIndex[itemId] || 0;
          
          panel.cartState.similarItemsIndex[itemId] = (currentSimilarIdx > 0) ?
            currentSimilarIdx - 1 : similarCount - 1;
          
          renderComparisonPanel(panel, []);
        });
        
        const nextSimilarButton = document.createElement('button');
        nextSimilarButton.className = 'nav-arrow nav-arrow-right';
        nextSimilarButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>';
        nextSimilarButton.addEventListener('click', function() {
          const itemId = currentItem.id;
          const similarCount = similarItems.length;
          const currentSimilarIdx = panel.cartState.similarItemsIndex[itemId] || 0;
          
          panel.cartState.similarItemsIndex[itemId] = (currentSimilarIdx < similarCount - 1) ?
            currentSimilarIdx + 1 : 0;
          
          renderComparisonPanel(panel, []);
        });
        
        similarImageWrapper.appendChild(prevSimilarButton);
        similarImageWrapper.appendChild(nextSimilarButton);
      }
      
      const similarImageContainer = document.createElement('div');
      similarImageContainer.className = 'image-container';
      
      const similarImage = document.createElement('img');
      similarImage.src = currentSimilarItem.imageUrl || '/api/placeholder/200/250';
      similarImage.alt = currentSimilarItem.category || 'Product';
      similarImage.onerror = function() {
        this.src = '/api/placeholder/200/250';
      };
      
      const matchBadge = document.createElement('div');
      matchBadge.className = 'item-match-badge';
      matchBadge.textContent = `${Math.round(currentSimilarItem.similarityScore * 100)}% Match`;
      
      similarImageContainer.appendChild(similarImage);
      similarImageContainer.appendChild(matchBadge);
      similarImageWrapper.appendChild(similarImageContainer);
      
      const similarItemDetails = document.createElement('div');
      similarItemDetails.className = 'item-details';
      
      const similarItemName = document.createElement('div');
      similarItemName.className = 'item-name';
      similarItemName.textContent = currentSimilarItem.category || 'Product';
      
      const similarItemMeta = document.createElement('div');
      similarItemMeta.className = 'item-meta';
      similarItemMeta.textContent = `Last worn: ${currentSimilarItem.lastWorn}`;
      
      similarItemDetails.appendChild(similarItemName);
      similarItemDetails.appendChild(similarItemMeta);
      
      // Dots indicator for multiple similar items
      if (similarItems.length > 1) {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'dots-indicator';
        
        for (let i = 0; i < similarItems.length; i++) {
          const dot = document.createElement('div');
          dot.className = i === currentSimilarIndex ? 'dot active' : 'dot';
          dotsContainer.appendChild(dot);
        }
        
        similarItemDetails.appendChild(dotsContainer);
      }
      
      similarSection.appendChild(similarTitle);
      similarSection.appendChild(similarHint);
      similarSection.appendChild(similarImageWrapper);
      similarSection.appendChild(similarItemDetails);
    } else {
      // No similar items found
      const noSimilarMessage = document.createElement('div');
      noSimilarMessage.className = 'item-details';
      noSimilarMessage.style.padding = '32px 0';
      noSimilarMessage.textContent = 'No similar items found in your wardrobe';
      
      similarSection.appendChild(similarTitle);
      similarSection.appendChild(noSimilarMessage);
    }
    
    content.appendChild(similarSection);
    panel.appendChild(content);
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'panel-footer';
    
    if (currentSimilarItem) {
      const footerMessage = document.createElement('div');
      footerMessage.className = 'footer-message';
      footerMessage.textContent = `You already own ${similarItems.length} item(s) similar to this.`;
      footer.appendChild(footerMessage);
    }
    
    const continueButton = document.createElement('button');
    continueButton.className = 'footer-button primary-button';
    continueButton.textContent = 'Continue Shopping';
    continueButton.addEventListener('click', function() {
      panel.classList.add('hidden');
      createToggleButton();
    });
    
    const seeAllButton = document.createElement('button');
    seeAllButton.className = 'footer-button secondary-button';
    seeAllButton.textContent = 'See All Wardrobe Items';
    seeAllButton.addEventListener('click', function() {
      // Navigate to wardrobe view or show all similar items
      alert('Wardrobe view not implemented');
    });
    
    footer.appendChild(continueButton);
    footer.appendChild(seeAllButton);
    panel.appendChild(footer);
    
    // Show panel
    panel.classList.remove('hidden');
    
  } catch (error) {
    showDebugOverlay("ERROR in renderComparisonPanel: " + error.message);
    console.error("Error in renderComparisonPanel:", error);
  }
}

// Function to generate similar wardrobe items based on cart item
function generateSimilarItems(panel, itemId, productName, size, color) {
  try {
    // Skip if already generated
    if (panel.cartState.similarItems.some(item => item.cartItemId === itemId)) {
      return;
    }
    
    // Generate 0-3 similar items based on the product name
    const similarCount = Math.floor(Math.random() * 4);
    
    // Initialize similar index for this item
    panel.cartState.similarItemsIndex[itemId] = 0;
    
    // Skip if no similar items to generate
    if (similarCount === 0) {
      return;
    }
    
    // Generate some basic categories based on product name
    let category = '';
    let similarWords = [];
    
    if (productName.toLowerCase().includes('shirt') ||
        productName.toLowerCase().includes('top') ||
        productName.toLowerCase().includes('blouse')) {
      category = 'Tops';
      similarWords = ['Shirt', 'Blouse', 'Top', 'Button-Down', 'Tee'];
    } else if (productName.toLowerCase().includes('jean') ||
               productName.toLowerCase().includes('pant') ||
               productName.toLowerCase().includes('trouser')) {
      category = 'Bottoms';
      similarWords = ['Jeans', 'Pants', 'Trousers', 'Slacks', 'Chinos'];
    } else if (productName.toLowerCase().includes('dress') ||
               productName.toLowerCase().includes('gown')) {
      category = 'Dresses';
      similarWords = ['Dress', 'Midi Dress', 'Maxi Dress', 'Mini Dress', 'Gown'];
    } else if (productName.toLowerCase().includes('sweater') ||
               productName.toLowerCase().includes('cardigan') ||
               productName.toLowerCase().includes('sweatshirt')) {
      category = 'Sweaters';
      similarWords = ['Sweater', 'Cardigan', 'Pullover', 'Hoodie', 'Sweatshirt'];
    } else if (productName.toLowerCase().includes('jacket') ||
               productName.toLowerCase().includes('coat')) {
      category = 'Outerwear';
      similarWords = ['Jacket', 'Coat', 'Blazer', 'Parka', 'Windbreaker'];
    } else {
      category = 'Clothing';
      similarWords = ['Item', 'Piece', 'Garment', 'Article', 'Attire'];
    }
    
    // Adjectives for color
    let colorAdjectives = [];
    if (color.toLowerCase().includes('white')) {
      colorAdjectives = ['White', 'Ivory', 'Cream', 'Off-white', 'Eggshell'];
    } else if (color.toLowerCase().includes('black')) {
      colorAdjectives = ['Black', 'Charcoal', 'Onyx', 'Jet black', 'Midnight'];
    } else if (color.toLowerCase().includes('blue')) {
      colorAdjectives = ['Blue', 'Navy', 'Denim', 'Sky blue', 'Royal blue'];
    } else if (color.toLowerCase().includes('red')) {
      colorAdjectives = ['Red', 'Crimson', 'Burgundy', 'Maroon', 'Scarlet'];
    } else if (color.toLowerCase().includes('green')) {
      colorAdjectives = ['Green', 'Olive', 'Emerald', 'Sage', 'Forest green'];
    } else if (color.toLowerCase().includes('yellow')) {
      colorAdjectives = ['Yellow', 'Gold', 'Mustard', 'Maize', 'Lemon'];
    } else if (color.toLowerCase().includes('purple')) {
      colorAdjectives = ['Purple', 'Lavender', 'Violet', 'Plum', 'Lilac'];
    } else if (color.toLowerCase().includes('pink')) {
      colorAdjectives = ['Pink', 'Rose', 'Blush', 'Fuchsia', 'Coral'];
    } else if (color.toLowerCase().includes('brown')) {
      colorAdjectives = ['Brown', 'Tan', 'Camel', 'Khaki', 'Taupe'];
    } else {
      colorAdjectives = ['Colored', 'Tinted', 'Shaded', 'Hued', 'Toned'];
    }
    
    // Generate similar items
    for (let i = 0; i < similarCount; i++) {
      // Create a random similarity score between 0.7 and 0.95
      const similarityScore = 0.7 + (Math.random() * 0.25);
      
      // Pick random adjective and type
      const randomColor = colorAdjectives[Math.floor(Math.random() * colorAdjectives.length)];
      const randomWord = similarWords[Math.floor(Math.random() * similarWords.length)];
      
      // Create a category name
      const itemCategory = `${randomColor} ${randomWord}`;
      
      // Generate a "last worn" date
      const timeframes = ['2 days ago', '1 week ago', '2 weeks ago', '1 month ago', '2 months ago'];
      const lastWorn = timeframes[Math.floor(Math.random() * timeframes.length)];
      
      // Add to similar items
      panel.cartState.similarItems.push({
        id: panel.cartState.similarItems.length + 1,
        cartItemId: itemId,
        imageUrl: '/api/placeholder/200/250',
        category: itemCategory,
        similarityScore: similarityScore,
        lastWorn: lastWorn
      });
    }
  } catch (error) {
    showDebugOverlay("ERROR in generateSimilarItems: " + error.message);
    console.error("Error in generateSimilarItems:", error);
  }
}


