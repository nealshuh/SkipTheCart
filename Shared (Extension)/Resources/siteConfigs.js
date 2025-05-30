//
//  siteConfigs.js
//  SkipTheCart
//
//  Created by Prafull Sharma on 5/30/25.
//

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


