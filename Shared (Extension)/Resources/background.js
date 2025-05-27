browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[background.js] Received request at ${timestamp}: `, request);

    if (request.greeting === "hello") {
        console.log(`[background.js] Handling test greeting at ${timestamp}`);
        sendResponse({ farewell: "goodbye" });
    } else if (request.action === "getBottoms") {
        console.log(`[background.js] Sending native message for getBottoms to com.NealAndPrafull.ReturnGuard at ${timestamp}`);
        try {
            browser.runtime.sendNativeMessage("application", { action: "getBottoms" }, function(response) {
                const responseTime = new Date().toLocaleTimeString();
                if (browser.runtime.lastError) {
                    console.error(`[background.js] Native messaging error at ${responseTime}: `, browser.runtime.lastError.message);
                    sendResponse({ error: "Failed to get bottoms: " + browser.runtime.lastError.message });
                    return;
                }
                console.log(`[background.js] Raw response from native app at ${responseTime}: `, response);
                if (response && typeof response === "object" && Array.isArray(response.bottoms)) {
                    console.log(`[background.js] Valid bottoms array received at ${responseTime}, sending to content script: `, response.bottoms);
                    sendResponse({ bottoms: response.bottoms });
                } else {
                    console.error(`[background.js] Native app returned unexpected data format at ${responseTime}: `, response);
                    sendResponse({ error: "Native app returned unexpected data format: " + (response ? JSON.stringify(response) : "undefined") });
                }
            });
        } catch (error) {
            console.error(`[background.js] Exception in sendNativeMessage at ${timestamp}: `, error.message);
            sendResponse({ error: "Native messaging failed: " + error.message });
        }
        return true; // Indicates asynchronous response
    } else {
        console.log(`[background.js] Unknown request action at ${timestamp}: `, request.action);
        sendResponse({ error: "Unknown action: " + (request.action || "undefined") });
    }
});
