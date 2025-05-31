//
//  itemProcessors.js
//  SkipTheCart
//
//  Created by Prafull Sharma on 5/30/25.
//
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
