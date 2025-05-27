// content.js - Wardrobe interface injected into web pages

console.log("Wardrobe content script loaded");

// Create the wardrobe interface
function createWardrobeInterface() {
    // Check if interface already exists
    if (document.getElementById('wardrobe-extension-interface')) {
        console.log("Wardrobe interface already exists, toggling visibility");
        toggleWardrobeInterface();
        return;
    }

    console.log("Creating wardrobe interface");

    // Create toggle button (always visible)
    const toggleButton = document.createElement('div');
    toggleButton.id = 'wardrobe-toggle-button';
    toggleButton.innerHTML = '👕 Wardrobe';
    toggleButton.title = 'Toggle Wardrobe Extension';

    // Create main container (initially hidden)
    const wardrobeContainer = document.createElement('div');
    wardrobeContainer.id = 'wardrobe-extension-interface';
    wardrobeContainer.style.display = 'none'; // Start hidden
    wardrobeContainer.innerHTML = `
        <div id="wardrobe-header">
            <h3>👕 Wardrobe Extension</h3>
            <div>
                <button id="wardrobe-minimize">−</button>
                <button id="wardrobe-close">×</button>
            </div>
        </div>
        <div id="wardrobe-content">
            <button id="wardrobe-view-bottoms">View Bottoms</button>
            <button id="wardrobe-test">Test Connection</button>
            <div id="wardrobe-log">
                <p>🟢 Wardrobe interface loaded and ready!</p>
            </div>
            <div id="wardrobe-results"></div>
            <div id="wardrobe-error"></div>
        </div>
    `;

    // Add CSS styles
    const styles = `
        #wardrobe-toggle-button {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            background: #007AFF !important;
            color: white !important;
            border: none !important;
            padding: 12px 16px !important;
            border-radius: 25px !important;
            cursor: pointer !important;
            z-index: 999999 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3) !important;
            transition: all 0.3s ease !important;
            user-select: none !important;
        }
        
        #wardrobe-toggle-button:hover {
            background: #0056b3 !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 25px rgba(0, 123, 255, 0.4) !important;
        }
        
        #wardrobe-extension-interface {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-height: 60vh !important;
            background: white !important;
            border-top: 3px solid #007AFF !important;
            box-shadow: 0 -4px 30px rgba(0,0,0,0.15) !important;
            z-index: 999998 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            font-size: 14px !important;
            animation: slideUp 0.3s ease-out !important;
        }
        
        @keyframes slideUp {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        #wardrobe-header {
            background: #007AFF !important;
            color: white !important;
            padding: 15px 20px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-bottom: 1px solid rgba(255,255,255,0.2) !important;
        }
        
        #wardrobe-header h3 {
            margin: 0 !important;
            font-size: 18px !important;
            font-weight: 600 !important;
        }
        
        #wardrobe-header div {
            display: flex !important;
            gap: 8px !important;
        }
        
        #wardrobe-minimize, #wardrobe-close {
            background: rgba(255,255,255,0.2) !important;
            border: none !important;
            color: white !important;
            font-size: 18px !important;
            cursor: pointer !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            width: 30px !important;
            height: 30px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: background 0.2s ease !important;
        }
        
        #wardrobe-minimize:hover, #wardrobe-close:hover {
            background: rgba(255,255,255,0.3) !important;
        }
        
        #wardrobe-content {
            padding: 20px !important;
            max-height: calc(60vh - 70px) !important;
            overflow-y: auto !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: auto auto 1fr !important;
            gap: 15px !important;
        }
        
        #wardrobe-content button {
            background: #007AFF !important;
            color: white !important;
            border: none !important;
            padding: 12px 20px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
        }
        
        #wardrobe-content button:hover {
            background: #0056b3 !important;
            transform: translateY(-1px) !important;
        }
        
        #wardrobe-log {
            grid-column: 1 / -1 !important;
            background: #f8f9fa !important;
            border: 1px solid #e9ecef !important;
            border-radius: 8px !important;
            padding: 15px !important;
            max-height: 150px !important;
            overflow-y: auto !important;
            font-size: 12px !important;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace !important;
        }
        
        #wardrobe-log p {
            margin: 4px 0 !important;
            color: #495057 !important;
            line-height: 1.4 !important;
        }
        
        #wardrobe-log .error {
            color: #dc3545 !important;
            font-weight: 500 !important;
        }
        
        #wardrobe-results {
            grid-column: 1 / -1 !important;
            max-height: 250px !important;
            overflow-y: auto !important;
            border: 1px solid #e9ecef !important;
            border-radius: 8px !important;
            background: #ffffff !important;
        }
        
        #wardrobe-results > div {
            margin: 0 !important;
            padding: 15px !important;
            border-bottom: 1px solid #f8f9fa !important;
            display: flex !important;
            gap: 15px !important;
            align-items: flex-start !important;
        }
        
        #wardrobe-results > div:last-child {
            border-bottom: none !important;
        }
        
        #wardrobe-results img {
            max-width: 80px !important;
            height: auto !important;
            border-radius: 6px !important;
            flex-shrink: 0 !important;
        }
        
        #wardrobe-results .item-info {
            flex: 1 !important;
        }
        
        #wardrobe-results .item-info p {
            margin: 2px 0 !important;
            font-size: 13px !important;
            color: #495057 !important;
        }
        
        #wardrobe-results .item-info strong {
            color: #212529 !important;
        }
        
        #wardrobe-error {
            grid-column: 1 / -1 !important;
            color: #dc3545 !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            padding: 10px !important;
            background: #f8d7da !important;
            border: 1px solid #f5c6cb !important;
            border-radius: 6px !important;
            display: none !important;
        }
        
        #wardrobe-error:not(:empty) {
            display: block !important;
        }
    `;

    // Add styles to page
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Add both toggle button and interface to page
    document.body.appendChild(toggleButton);
    document.body.appendChild(wardrobeContainer);

    // Add event listeners
    setupWardrobeEventListeners();
}

// Toggle interface visibility
function toggleWardrobeInterface() {
    const interface = document.getElementById('wardrobe-extension-interface');
    if (interface) {
        if (interface.style.display === 'none') {
            interface.style.display = 'block';
        } else {
            interface.style.display = 'none';
        }
    }
}

// Setup event listeners for the interface
function setupWardrobeEventListeners() {
    const logContainer = document.getElementById('wardrobe-log');
    const resultsContainer = document.getElementById('wardrobe-results');
    const errorContainer = document.getElementById('wardrobe-error');

    // Logging function
    const logMessage = (message, isError = false) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[Wardrobe] ${message}`);
        
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${timestamp}] ${message}`;
        if (isError) logEntry.className = 'error';
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    };

    logMessage("Event listeners setting up");

    // Toggle button click
    document.getElementById('wardrobe-toggle-button').addEventListener('click', () => {
        logMessage("Toggle button clicked");
        toggleWardrobeInterface();
    });

    // Minimize button
    document.getElementById('wardrobe-minimize').addEventListener('click', () => {
        logMessage("Minimizing wardrobe interface");
        document.getElementById('wardrobe-extension-interface').style.display = 'none';
    });

    // Close button
    document.getElementById('wardrobe-close').addEventListener('click', () => {
        logMessage("Closing wardrobe interface");
        document.getElementById('wardrobe-extension-interface').remove();
        document.getElementById('wardrobe-toggle-button').remove();
    });

    // Test button
    document.getElementById('wardrobe-test').addEventListener('click', () => {
        logMessage("Test button clicked");
        errorContainer.textContent = '';
        
        // Test message to background script
        if (typeof browser !== 'undefined' && browser.runtime) {
            logMessage("Testing connection to background script");
            browser.runtime.sendMessage({ greeting: "hello" }, (response) => {
                if (browser.runtime.lastError) {
                    logMessage("Test error: " + browser.runtime.lastError.message, true);
                    errorContainer.textContent = "Test failed: " + browser.runtime.lastError.message;
                } else {
                    logMessage("Test response: " + JSON.stringify(response));
                }
            });
        } else {
            logMessage("Browser runtime API not available", true);
            errorContainer.textContent = "Browser API not available";
        }
    });

    // View bottoms button - EXACT COPY of test button pattern
    document.getElementById('wardrobe-view-bottoms').addEventListener('click', () => {
        logMessage("View bottoms button clicked");
        errorContainer.textContent = '';
        
        // Test message to background script - EXACT SAME AS TEST BUTTON
        if (typeof browser !== 'undefined' && browser.runtime) {
            logMessage("Sending getBottoms request");
            browser.runtime.sendMessage({ action: "getBottoms" }, (response) => {
                if (browser.runtime.lastError) {
                    logMessage("Runtime error: " + browser.runtime.lastError.message, true);
                    errorContainer.textContent = "Runtime error: " + browser.runtime.lastError.message;
                } else {
                    logMessage("Response received: " + JSON.stringify(response));
                    
                    // Now handle the bottoms data
                    if (response && response.bottoms) {
                        const bottoms = response.bottoms;
                        logMessage(`Bottoms received: ${bottoms.length} items`);
                        
                        resultsContainer.innerHTML = '';
                        bottoms.forEach((bottom, index) => {
                            logMessage(`Rendering bottom ${index + 1}`);
                            const item = document.createElement("div");
                            item.innerHTML = `
                                <div class="item-info">
                                    <p><strong>ID:</strong> ${bottom.id}</p>
                                    <p><strong>Category:</strong> ${bottom.categoryName}</p>
                                    <p><strong>Color:</strong> ${bottom.colorLabel}</p>
                                    <p><strong>Date Added:</strong> ${bottom.dateAdded}</p>
                                </div>
                            `;
                            resultsContainer.appendChild(item);
                        });
                        logMessage("Finished rendering bottoms");
                    } else {
                        logMessage("No bottoms data in response", true);
                        errorContainer.textContent = "No bottoms data received";
                    }
                }
            });
        } else {
            logMessage("Browser runtime API not available", true);
            errorContainer.textContent = "Browser API not available";
        }
    });

    logMessage("Event listeners attached successfully");
}

// Show interface when extension icon is clicked
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showInterface") {
        console.log("Received showInterface message");
        createWardrobeInterface();
        sendResponse({ success: true });
    }
});

// Create interface immediately when content script loads
// Auto-show for testing - you can remove this line later if you only want it to show when clicking the extension icon
setTimeout(() => {
    createWardrobeInterface();
    console.log("🟢 Wardrobe extension loaded! Look for the blue button in the bottom-right corner.");
}, 1000);
 
