import UIKit
import SwiftUI

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Create the SwiftUI view
        let contentView = ContentView()

        // Use a UIHostingController as window root view controller
        if let windowScene = scene as? UIWindowScene {
            let window = UIWindow(windowScene: windowScene)
            window.rootViewController = UIHostingController(rootView: contentView)
            self.window = window
            window.makeKeyAndVisible()
        }
        
        // Handle any deep links that were passed when launching the app
        if let urlContext = connectionOptions.urlContexts.first {
            handleDeepLink(url: urlContext.url)
        }
    }
    
    // Handle deep links when app is already running
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if let urlContext = URLContexts.first {
            handleDeepLink(url: urlContext.url)
        }
    }
    
    private func handleDeepLink(url: URL) {
        print("Handling deep link: \(url.absoluteString)")
        
        // Check if this is our custom URL scheme
        if url.scheme == "skipthecart" {
            print("This is a skipthecart deep link")
            
            // Parse the path and parameters
            let path = url.host
            let queryItems = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems
            
            // Handle email confirmation links
            if path == "email-confirmation" || path == "verify-email" {
                // Check for success or failure parameters
                let isSuccess = queryItems?.first(where: { $0.name == "status" })?.value == "success"
                
                if isSuccess {
                    // Notify the app to show the email confirmation success view
                    DispatchQueue.main.async {
                        NotificationCenter.default.post(
                            name: NSNotification.Name("EmailVerificationSuccess"),
                            object: nil
                        )
                    }
                }
            }
        }
    }
}
