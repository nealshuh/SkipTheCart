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
        
        // For now just log the URL
        if url.scheme == "skipthecart" {
            print("This is a skipthecart deep link")
            
            // We'll implement the notification in a later step
        }
    }
}
