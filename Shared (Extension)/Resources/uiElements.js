//
//  uiElements.js
//  SkipTheCart
//
//  Created by Prafull Sharma on 5/30/25.
//


// Create a toggle button to reopen the panel
function createToggleButton() {
    try {
      let toggleBtn = document.getElementById('panel-toggle-button');
      
      if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.id = 'panel-toggle-button';
        toggleBtn.textContent = '🛒 Show Cart Items';
        toggleBtn.className = 'panel-toggle-button';
        
        // Style the toggle button
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '70px';
        toggleBtn.style.right = '20px';
        toggleBtn.style.zIndex = '9998';
        toggleBtn.style.padding = '10px 15px';
        toggleBtn.style.backgroundColor = '#6A0DAD';
        toggleBtn.style.color = '#fff';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '8px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        toggleBtn.style.fontSize = '16px'; // Adjust font size if needed
        toggleBtn.style.display = 'flex'; // For aligning emoji and text
        toggleBtn.style.alignItems = 'center'; // Center emoji and text vertically
        toggleBtn.style.gap = '8px'; // Space between emoji and text

        toggleBtn.addEventListener('click', function() {
            const panel = document.getElementById('cart-panel');
            if (panel) {
              panel.classList.remove('hidden');
              toggleBtn.style.display = 'none'; // Hide button when panel is open
            }
        });
                  
        document.body.appendChild(toggleBtn);
    }
                
    // Ensure the button is visible when the panel is hidden
    const panel = document.getElementById('cart-panel');
    if (panel && panel.classList.contains('hidden')) {
      toggleBtn.style.display = 'flex'; // Use 'flex' to maintain alignment
    } else if (!panel) { // If panel doesn't exist yet, show button
       toggleBtn.style.display = 'flex';
    } else { // If panel exists and is visible, hide button
      toggleBtn.style.display = 'none';
    }

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
      /* Full-screen mobile-style cart panel CSS */
      #cart-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: white;
        z-index: 9999;
        padding: 0; /* Remove padding to match mobile design */
        transition: transform 0.3s ease;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
      
      #cart-panel.hidden {
        transform: translateY(100%);
      }
      
      /* Header - black bar with title and close button */
      .panel-header {
        background-color: black;
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .panel-title {
        font-weight: bold;
        font-size: 18px;
        margin: 0;
        text-align: left;
        border: none;
        padding: 0;
      }
      
      /* Navigation bar with item counter */
      .panel-nav {
        background-color: #f1f1f1;
        padding: 8px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eaeaea;
      }
      
      .panel-nav-info {
        font-size: 14px;
        color: #555;
      }
      
      /* Main content area */
      .image-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px;
        gap: 24px;
        overflow-y: auto;
        flex-wrap: nowrap; /* Override previous setting - no wrapping needed for this layout */
        justify-content: flex-start; /* Align to top */
        align-items: center;
      }
      
      /* Cart item section */
      .cart-item-section {
        width: 100%;
        margin-bottom: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .section-title {
        width: 100%;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        color: #666;
        margin-bottom: 8px;
      }
      
      /* Cart item layout */
      .cart-item {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: none;
        padding: 0;
        max-width: none;
        transition: none;
        background-color: transparent;
      }
      
      .cart-item:hover {
        transform: none;
        box-shadow: none;
      }
      
      /* Item image container */
      .item-image-container {
        width: 192px;
        height: 224px;
        background-color: #f9f9f9;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        margin-bottom: 8px;
        position: relative;
      }
      
      .item-image {
        max-height: 100%;
        max-width: 100%;
        object-fit: contain;
      }
      
      /* Item details */
      .item-details {
        width: 100%;
        text-align: center;
        padding: 0;
      }
      
      .item-name {
        font-size: 16px;
        font-weight: 500;
        line-height: 1.3;
        margin-bottom: 4px;
        max-height: none;
        display: block;
        -webkit-line-clamp: none;
        white-space: normal;
      }
      
      .item-price {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin-top: 4px;
      }
      
      .item-specs {
        font-size: 14px;
        color: #666;
        margin: 4px 0;
      }
      
      /* Similar items section */
      .similar-section {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }
      
      .similar-hint {
        font-size: 12px;
        color: #999;
        text-align: center;
        margin-bottom: 4px;
      }
      
      /* Navigation arrows for similar items */
      .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        z-index: 10;
      }
      
      .nav-arrow-left {
        left: 0;
      }
      
      .nav-arrow-right {
        right: 0;
      }
      
      /* Similarity badge */
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
      
      /* Pagination dots */
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
      
      /* Footer */
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
      
      /* Buttons */
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
      
      /* Close button */
      .close-button {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        position: static;
        margin: 0;
      }
      
      /* Toggle button to reopen panel */
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
        font-weight: normal;
        cursor: pointer;
        z-index: 9998;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      
      /* Delete button - make it look more like mobile UI */
      .item-delete-button {
        margin-top: 16px;
        padding: 8px 12px;
        background-color: transparent;
        color: #f44336;
        border: 1px solid #f44336;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .item-delete-button:hover {
        background-color: rgba(244, 67, 54, 0.1);
      }
      
      /* Panel message style */
      .panel-message {
        padding: 32px 16px;
        text-align: center;
        color: #777;
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);
    
    // Create the panel
    const panel = document.createElement('div');
    panel.id = 'cart-panel';
    panel.className = 'cart-panel';
    
    // Initialize cart state management
    panel.cartState = {
      items: [], // Will be populated from extracted cart items
      currentIndex: 0,
      similarItems: [], // Will be populated with mock wardrobe items
      similarItemsIndex: {}  // Tracks the current index of similar items for each cart item
    };
    
    document.body.appendChild(panel);
    
    console.log("Cart Image Extractor: Full screen mobile-style panel created");
    showDebugOverlay("Full screen mobile-style panel created");
    
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
