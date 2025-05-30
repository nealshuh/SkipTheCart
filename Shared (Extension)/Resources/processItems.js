//// Process the cart items
//// Process the cart items to create a mobile-style layout matching the React app


// Process the cart items to create a mobile-style layout matching the React app
function processCartItems(cartItems, panel, usedSelector) {
  try {
    if (!currentSiteConfig) return;

    // Clear existing content - This is okay for the main cart item navigation,
    // but our similar item navigation will use a targeted update.
    panel.innerHTML = '';

    // Initialize cart state if not already done
    panel.cartState = panel.cartState || {
      items: [],
      currentIndex: 0,
      similarItems: [],
      similarItemsIndex: {}, // This might be deprecated if currentSimilarIndex is on each item
      wardrobeBottoms: []
    };

    // --- State Processing: This block now runs only ONCE per set of cart items ---
    // If the cart items in our state are empty OR if we are processing a new set of cartItems
    // (This condition might need refinement if cartItems can change without full re-init,
    // for now, assuming it's for initial load or full refresh of cart)
    if (panel.cartState.items.length === 0 && cartItems.length > 0) {
      // 1. Convert cart items from DOM to our internal state format
      panel.cartState.items = Array.from(cartItems).map((item, index) => {
        let productInfo;
        // This block assumes your site-specific processor functions are available globally
        // or have been moved to a file loaded before content.js
        if (window.location.hostname.includes('abercrombie.com')) {
          productInfo = processAbercrombieItem(item, index);
        } else if (window.location.hostname.includes('ohpolly.com')) {
          productInfo = processOhPollyItem(item, index);
        } else if (window.location.hostname.includes('revolve.com')) {
          productInfo = processRevolveItem(item, index);
        } else if (window.location.hostname.includes('hm.com')) {
          productInfo = processHMItem(item, index);
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
          productInfo = {
            imageUrl: getImageUrl(item), // Assumes getImageUrl is defined
            productName: getTextFromSelectors('name', item) || 'Product', // Assumes getTextFromSelectors is defined
            price: getTextFromSelectors('price', item) || '',
            size: getTextFromSelectors('size', item) || '',
            color: getTextFromSelectors('color', item) || ''
          };
        }
        return {
          id: index, // Or a more unique ID if available from the item
          ...productInfo,
          currentSimilarIndex: 0 // Initialize for each cart item
        };
      });

      // 2. Clear and rebuild the similar items mapping.
      panel.cartState.similarItems = [];
      const wardrobeBottoms = panel.cartState.wardrobeBottoms || [];
      if (wardrobeBottoms.length > 0) {
        panel.cartState.items.forEach((cartItem) => {
          const itemId = cartItem.id;
          wardrobeBottoms.forEach((bottom, bottomIndex) => {
            panel.cartState.similarItems.push({
              id: `${itemId}-bottom-${bottomIndex}`, // Unique ID for the similar item instance
              cartItemId: itemId, // Link back to the cart item
              imageUrl: bottom.image ? `data:image/jpeg;base64,${bottom.image}` : '/api/placeholder/200/250',
              category: bottom.categoryName || 'Bottom',
              similarityScore: 0.8, // Default for MVP
              lastWorn: bottom.dateAdded ? new Date(bottom.dateAdded).toLocaleDateString() : 'Unknown'
            });
          });
        });
      }
    }

    // --- UI Rendering: This section now only reads from the existing state ---

    // Get current cart item
    const currentIndex = panel.cartState.currentIndex;
    const currentItem = panel.cartState.items[currentIndex] || {}; // Fallback to empty if out of bounds

    // Get similar items for current cart item by filtering the pre-built list
    const similarItemsForCurrentCartItem = panel.cartState.similarItems.filter(item => item.cartItemId === currentItem.id);
    const currentSimilarIndexForCartItem = currentItem.currentSimilarIndex || 0;
    const currentSimilarItemToDisplay = similarItemsForCurrentCartItem.length > 0 ? similarItemsForCurrentCartItem[currentSimilarIndexForCartItem] : null;

    // Create header
    const header = document.createElement('div');
    header.className = 'panel-header';
    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Wardrobe Comparison';
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', function() {
      panel.classList.add('hidden');
      createToggleButton(); // Assumes createToggleButton is defined
    });
    header.appendChild(title);
    header.appendChild(closeButton);
    panel.appendChild(header);

    // Create navigation bar for main cart items
    const nav = document.createElement('div');
    nav.className = 'panel-nav';
    const prevButton = document.createElement('button');
    prevButton.className = 'panel-nav-button';
    prevButton.innerHTML = '&larr;';
    prevButton.disabled = panel.cartState.items.length <= 1;
    prevButton.addEventListener('click', function() {
      if (panel.cartState.items.length <= 1) return;
      panel.cartState.currentIndex = currentIndex > 0 ? currentIndex - 1 : panel.cartState.items.length - 1;
      processCartItems(cartItems, panel, usedSelector); // This re-renders for main item change
    });
    const navInfo = document.createElement('div');
    navInfo.className = 'panel-nav-info';
    navInfo.textContent = `Item ${currentIndex + 1} of ${panel.cartState.items.length}`;
    const nextButton = document.createElement('button');
    nextButton.className = 'panel-nav-button';
    nextButton.innerHTML = '&rarr;';
    nextButton.disabled = panel.cartState.items.length <= 1;
    nextButton.addEventListener('click', function() {
      if (panel.cartState.items.length <= 1) return;
      panel.cartState.currentIndex = currentIndex < panel.cartState.items.length - 1 ? currentIndex + 1 : 0;
      processCartItems(cartItems, panel, usedSelector); // This re-renders for main item change
    });
    nav.appendChild(prevButton);
    nav.appendChild(navInfo);
    nav.appendChild(nextButton);
    panel.appendChild(nav);

    // Create main content container
    const content = document.createElement('div');
    content.className = 'image-container';

    // Cart Item Section
    const cartItemSection = document.createElement('div');
    cartItemSection.className = 'cart-item-section';
    const cartSectionTitle = document.createElement('div');
    cartSectionTitle.className = 'section-title';
    cartSectionTitle.textContent = 'In Your Shopping Cart';
    cartItemSection.appendChild(cartSectionTitle);
    const cartItemImageContainer = document.createElement('div');
    cartItemImageContainer.className = 'item-image-container';
    const cartItemImage = document.createElement('img');
    cartItemImage.className = 'item-image';
    cartItemImage.src = currentItem.imageUrl || '/api/placeholder/200/250';
    cartItemImage.alt = currentItem.productName || 'Product';
    cartItemImage.onerror = function() { this.src = '/api/placeholder/200/250'; };
    cartItemImageContainer.appendChild(cartItemImage);
    cartItemSection.appendChild(cartItemImageContainer);
    const cartItemDetails = document.createElement('div');
    cartItemDetails.className = 'item-details';
    const cartItemName = document.createElement('div');
    cartItemName.className = 'item-name';
    cartItemName.textContent = currentItem.productName || 'Product';
    const cartItemSpecs = document.createElement('div');
    cartItemSpecs.className = 'item-specs';
    cartItemSpecs.textContent = `${currentItem.size || ''} | ${currentItem.color || ''}`;
    const cartItemPrice = document.createElement('div');
    cartItemPrice.className = 'item-price';
    cartItemPrice.textContent = currentItem.price || '';
    cartItemDetails.appendChild(cartItemName);
    cartItemDetails.appendChild(cartItemSpecs);
    cartItemDetails.appendChild(cartItemPrice);
    cartItemSection.appendChild(cartItemDetails);
    content.appendChild(cartItemSection);

    // Similar Items Section
    const similarSection = document.createElement('div');
    similarSection.className = 'similar-section';
    const similarSectionTitle = document.createElement('div');
    similarSectionTitle.className = 'section-title';
    similarSectionTitle.textContent = 'Items in Your Wardrobe';
    similarSection.appendChild(similarSectionTitle);

    // Add a wrapper for the content that will be updated by updateSimilarItemsDisplay
    const similarSectionContentWrapper = document.createElement('div');
    similarSectionContentWrapper.id = 'similar-section-content-wrapper'; // ID for easy targeting
    similarSection.appendChild(similarSectionContentWrapper);

    content.appendChild(similarSection);
    panel.appendChild(content);

    // Footer with buttons
    const footer = document.createElement('div');
    footer.className = 'panel-footer';
    if (currentSimilarItemToDisplay) { // Check if there's a similar item to display for the footer message
      const footerMessage = document.createElement('div');
      footerMessage.className = 'footer-message';
      footerMessage.textContent = `You have ${similarItemsForCurrentCartItem.length} bottom(s) in your wardrobe.`;
      footer.appendChild(footerMessage);
    }
    const continueButton = document.createElement('button');
    continueButton.className = 'footer-button primary-button';
    continueButton.textContent = 'Continue Shopping';
    continueButton.addEventListener('click', function() {
      panel.classList.add('hidden');
      createToggleButton(); // Assumes createToggleButton is defined
    });
    const seeAllButton = document.createElement('button');
    seeAllButton.className = 'footer-button secondary-button';
    seeAllButton.textContent = 'See All Wardrobe Items';
    seeAllButton.addEventListener('click', function() {
      alert('Wardrobe view would open here'); // Placeholder
    });
    footer.appendChild(continueButton);
    footer.appendChild(seeAllButton);
    panel.appendChild(footer);

    // Initial population of the similar items section (will be dynamic after this)
    updateSimilarItemsDisplay(panel);

    // Show panel
    panel.classList.remove('hidden');

    console.log("Cart Image Extractor: Mobile panel populated and displayed");
    showDebugOverlay("Mobile panel populated and displayed");
  } catch (error) {
    showDebugOverlay("ERROR in processCartItems: " + error.message);
    console.error("Error in processCartItems:", error);
  }
}




function updateSimilarItemsDisplay(panel) {
  try {
    const currentCartItemIndex = panel.cartState.currentIndex;
    const currentCartItem = panel.cartState.items[currentCartItemIndex];

    if (!currentCartItem) {
      console.warn("No current cart item found in state for updating similar items.");
      const wrapper = document.getElementById('similar-section-content-wrapper');
      if (wrapper) wrapper.innerHTML = '<div class="panel-message" id="no-similar-items-message">No cart item selected.</div>';
      return;
    }

    const allSimilarItemsForCartItem = panel.cartState.similarItems.filter(item => item.cartItemId === currentCartItem.id);
    const currentSimilarItemVisualIndex = currentCartItem.currentSimilarIndex || 0;
    const itemToDisplay = allSimilarItemsForCartItem.length > 0 ? allSimilarItemsForCartItem[currentSimilarItemVisualIndex] : null;

    const wrapper = document.getElementById('similar-section-content-wrapper');
    if (!wrapper) {
      console.error("Similar items section content wrapper not found in DOM for update.");
      return;
    }
    // Clear only the content wrapper before redrawing its specific parts
    wrapper.innerHTML = '';

    if (itemToDisplay) {
      // Create and append the hint
      const similarHint = document.createElement('div');
      similarHint.className = 'similar-hint';
      similarHint.id = 'similar-item-hint'; // Keep ID for consistency if needed elsewhere
      if (allSimilarItemsForCartItem.length > 1) {
        similarHint.textContent = `Swipe to see ${allSimilarItemsForCartItem.length} wardrobe items`;
      } else if (allSimilarItemsForCartItem.length === 1) {
        similarHint.textContent = '1 wardrobe item found';
      } else {
        // This case should ideally be handled by the 'else' block below,
        // but good to have a fallback text if itemToDisplay is somehow true with 0 items.
        similarHint.textContent = 'No wardrobe items to compare for this item.';
      }
      wrapper.appendChild(similarHint);

      // Create and append image wrapper
      const similarImageWrapper = document.createElement('div');
      similarImageWrapper.className = 'similar-image-wrapper';
      similarImageWrapper.style.position = 'relative';
      similarImageWrapper.style.width = '100%';
      similarImageWrapper.style.display = 'flex';
      similarImageWrapper.style.justifyContent = 'center';

      // Add arrows IF more than one similar item
      if (allSimilarItemsForCartItem.length > 1) {
        const prevArrow = document.createElement('button');
        prevArrow.className = 'nav-arrow nav-arrow-left';
        prevArrow.innerHTML = '&lt;';
        prevArrow.addEventListener('click', function() {
          let newIndex = currentSimilarItemVisualIndex - 1;
          if (newIndex < 0) {
            newIndex = allSimilarItemsForCartItem.length - 1;
          }
          panel.cartState.items[currentCartItemIndex].currentSimilarIndex = newIndex;
          updateSimilarItemsDisplay(panel);
        });
        similarImageWrapper.appendChild(prevArrow);

        const nextArrow = document.createElement('button');
        nextArrow.className = 'nav-arrow nav-arrow-right';
        nextArrow.innerHTML = '&gt;';
        nextArrow.addEventListener('click', function() {
          let newIndex = currentSimilarItemVisualIndex + 1;
          if (newIndex >= allSimilarItemsForCartItem.length) {
            newIndex = 0;
          }
          panel.cartState.items[currentCartItemIndex].currentSimilarIndex = newIndex;
          updateSimilarItemsDisplay(panel);
        });
        similarImageWrapper.appendChild(nextArrow);
      }

      // Create and append image container
      const similarImageContainer = document.createElement('div');
      similarImageContainer.className = 'item-image-container';
      similarImageContainer.id = 'similar-item-image-container'; // Keep ID

      const similarImageEl = document.createElement('img');
      similarImageEl.className = 'item-image';
      similarImageEl.id = 'similar-item-image'; // Keep ID
      similarImageEl.src = itemToDisplay.imageUrl || '/api/placeholder/200/250';
      similarImageEl.alt = itemToDisplay.category || 'Wardrobe Item';
      similarImageEl.onerror = function() { this.src = '/api/placeholder/200/250'; };
      similarImageContainer.appendChild(similarImageEl);

      const matchBadge = document.createElement('div');
      matchBadge.className = 'item-match-badge';
      matchBadge.textContent = 'From Wardrobe'; // Or dynamically set if needed
      similarImageContainer.appendChild(matchBadge);
      similarImageWrapper.appendChild(similarImageContainer);
      wrapper.appendChild(similarImageWrapper);

      // Create and append details
      const similarItemDetails = document.createElement('div');
      similarItemDetails.className = 'item-details';

      const similarItemNameEl = document.createElement('div');
      similarItemNameEl.className = 'item-name';
      similarItemNameEl.id = 'similar-item-name'; // Keep ID
      similarItemNameEl.textContent = itemToDisplay.category || 'Wardrobe Item';
      similarItemDetails.appendChild(similarItemNameEl);

      const similarItemLastWornEl = document.createElement('div');
      similarItemLastWornEl.className = 'item-specs';
      similarItemLastWornEl.id = 'similar-item-last-worn'; // Keep ID
      similarItemLastWornEl.textContent = `Added on: ${itemToDisplay.lastWorn}`;
      similarItemDetails.appendChild(similarItemLastWornEl);

      // Create and append dots
      if (allSimilarItemsForCartItem.length > 1) {
        const dotsIndicatorEl = document.createElement('div');
        dotsIndicatorEl.className = 'dots-indicator';
        dotsIndicatorEl.id = 'similar-item-dots-indicator'; // Keep ID
        dotsIndicatorEl.style.marginTop = '8px';
        dotsIndicatorEl.style.display = 'flex';
        dotsIndicatorEl.style.justifyContent = 'center';

        for (let i = 0; i < allSimilarItemsForCartItem.length; i++) {
          const dot = document.createElement('div');
          dot.className = i === currentSimilarItemVisualIndex ? 'dot active' : 'dot';
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.borderRadius = '50%';
          dot.style.margin = '0 4px';
          dot.style.backgroundColor = i === currentSimilarItemVisualIndex ? '#000' : '#ddd';
          dotsIndicatorEl.appendChild(dot);
        }
        similarItemDetails.appendChild(dotsIndicatorEl);
      }
      wrapper.appendChild(similarItemDetails);

    } else {
      // Display "no items" message if no similar item is to be displayed
      const noSimilarMessage = document.createElement('div');
      noSimilarMessage.className = 'panel-message';
      noSimilarMessage.id = 'no-similar-items-message'; // Keep ID
      noSimilarMessage.textContent = 'No bottoms found in your wardrobe to compare.';
      wrapper.appendChild(noSimilarMessage);
    }
  } catch (error) {
    showDebugOverlay("ERROR in updateSimilarItemsDisplay: " + error.message);
    console.error("Error in updateSimilarItemsDisplay:", error);
  }
}
