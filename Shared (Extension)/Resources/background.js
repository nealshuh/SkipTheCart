//browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
//    console.log("Received request: ", request);
//
//    if (request.greeting === "hello")
//        return Promise.resolve({ farewell: "goodbye" });
//});


browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Received request: ", request);

    if (request.greeting === "hello") {
        sendResponse({ farewell: "goodbye" });
    } else if (request.action === "getBottoms") {
        browser.runtime.sendNativeMessage("com.NealAndPrafull.ReturnGuard", { action: "getBottoms" }, function(response) {
            if (browser.runtime.lastError) {
                console.error("Error: ", browser.runtime.lastError.message);
                sendResponse({ error: "Failed to get bottoms" });
            } else {
                sendResponse({ bottoms: response.bottoms });
            }
        });
        return true; // Indicates asynchronous response
    }
});
