browser.browserAction.onClicked.addListener(function(tab) {
    console.log("Extension icon clicked, sending message to content script");
    
    browser.tabs.sendMessage(tab.id, { action: "showInterface" })
        .then(response => {
            console.log("Content script responded:", response);
        })
        .catch(error => {
            console.error("Error sending message to content script:", error);
        });
});

// Handle messages from content script
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Background script received request:", request);
    
    if (request.greeting === "hello") {
        console.log("Handling 'hello' greeting");
        sendResponse({ farewell: "goodbye" });
        
    } else if (request.action === "getBottoms") {
        console.log("Handling getBottoms request");
        console.log("Returning fake data for testing");
        
        // Send response the SAME WAY as the test button (which works)
        const fakeData = {
            bottoms: [
                {
                    id: "test-123",
                    categoryName: "Test Jeans",
                    colorLabel: "Blue",
                    dateAdded: "2025-01-26",
                    image: null
                },
                {
                    id: "test-456",
                    categoryName: "Test Shorts",
                    colorLabel: "Black",
                    dateAdded: "2025-01-25",
                    image: null
                }
            ]
        };
        
        console.log("Sending fake data:", fakeData);
        sendResponse(fakeData);
        
    } else {
        console.log("Unknown request action:", request.action);
        sendResponse({ error: "Unknown action" });
    }
});
