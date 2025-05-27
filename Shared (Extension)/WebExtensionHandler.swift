import Foundation
import SafariServices
import UIKit

class WebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    func beginRequest(with context: NSExtensionContext) {
        print("[SafariWebExtensionHandler] 🟢 Received request at \(Date())")
        
        guard let item = context.inputItems.first as? NSExtensionItem else {
            print("[SafariWebExtensionHandler] ❌ No input items in request")
            completeRequest(context: context, response: ["error": "No input items"])
            return
        }
        
        guard let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any] else {
            print("[SafariWebExtensionHandler] ❌ No message in userInfo")
            completeRequest(context: context, response: ["error": "No message in userInfo"])
            return
        }
        
        print("[SafariWebExtensionHandler] 📩 Message received: \(message)")
        
        guard let action = message["action"] as? String else {
            print("[SafariWebExtensionHandler] ❌ No action in message")
            completeRequest(context: context, response: ["error": "No action specified"])
            return
        }
        
        print("[SafariWebExtensionHandler] 🎯 Action: \(action)")
        
        switch action {
        case "getBottoms":
            handleGetBottoms(context: context)
        case "getAllItems":
            handleGetAllItems(context: context)
        default:
            print("[SafariWebExtensionHandler] ❌ Unknown action: \(action)")
            completeRequest(context: context, response: ["error": "Unknown action: \(action)"])
        }
    }
    
    private func handleGetBottoms(context: NSExtensionContext) {
        print("[SafariWebExtensionHandler] 👖 Handling getBottoms request")
        
        // Get bottoms from the real App Group data
        let allItems = loadItemsFromAppGroup()
        let bottoms = allItems.filter { item in
            // Filter for bottom categories - adjust these categories as needed
            let bottomCategories = ["pants", "jeans", "shorts", "trousers", "chinos", "leggings", "bottoms"]
            return bottomCategories.contains(item.categoryName.lowercased())
        }
        
        print("[SafariWebExtensionHandler] Found \(bottoms.count) bottoms out of \(allItems.count) total items")
        
        // Convert to format expected by browser extension
        let bottomsData = bottoms.map { item -> [String: Any] in
            var itemDict: [String: Any] = [
                "id": item.id.uuidString,
                "categoryName": item.categoryName,
                "colorLabel": item.colorLabel,
                "dateAdded": ISO8601DateFormatter().string(from: item.dateAdded),
                "source": "app_group_wardrobe"
            ]
            
            // Add image as base64 if available
            if let image = loadImageFromAppGroup(filename: item.imageFilename) {
                if let imageData = image.jpegData(compressionQuality: 0.8) {
                    itemDict["image"] = imageData.base64EncodedString()
                }
            }
            
            return itemDict
        }
        
        let response: [String: Any] = [
            "bottoms": bottomsData,
            "success": true,
            "totalItems": allItems.count,
            "bottomsCount": bottoms.count,
            "timestamp": Date().timeIntervalSince1970,
            "source": "WardrobeManager"
        ]
        
        print("[SafariWebExtensionHandler] ✅ Sending response with \(bottomsData.count) bottoms")
        completeRequest(context: context, response: response)
    }
    
    private func handleGetAllItems(context: NSExtensionContext) {
        print("[SafariWebExtensionHandler] 👕 Handling getAllItems request")
        
        let allItems = loadItemsFromAppGroup()
        
        let itemsData = allItems.map { item -> [String: Any] in
            var itemDict: [String: Any] = [
                "id": item.id.uuidString,
                "categoryName": item.categoryName,
                "colorLabel": item.colorLabel,
                "dateAdded": ISO8601DateFormatter().string(from: item.dateAdded),
                "source": "app_group_wardrobe"
            ]
            
            // Add image as base64 if available
            if let image = loadImageFromAppGroup(filename: item.imageFilename) {
                if let imageData = image.jpegData(compressionQuality: 0.8) {
                    itemDict["image"] = imageData.base64EncodedString()
                }
            }
            
            return itemDict
        }
        
        let response: [String: Any] = [
            "items": itemsData,
            "success": true,
            "totalCount": allItems.count,
            "timestamp": Date().timeIntervalSince1970,
            "source": "WardrobeManager"
        ]
        
        print("[SafariWebExtensionHandler] ✅ Sending response with \(itemsData.count) items")
        completeRequest(context: context, response: response)
    }
    
    // MARK: - App Group Data Loading
    
    private func loadItemsFromAppGroup() -> [WardrobeItem] {
        guard let defaults = UserDefaults(suiteName: "group.com.NealAndPrafull.ReturnGuard") else {
            print("[SafariWebExtensionHandler] ❌ Failed to access App Group UserDefaults")
            return []
        }
        
        guard let data = defaults.data(forKey: "wardrobe_items") else {
            print("[SafariWebExtensionHandler] ⚠️ No wardrobe items found in App Group")
            return []
        }
        
        do {
            let items = try JSONDecoder().decode([WardrobeItem].self, from: data)
            print("[SafariWebExtensionHandler] ✅ Loaded \(items.count) items from App Group")
            return items
        } catch {
            print("[SafariWebExtensionHandler] ❌ Failed to decode wardrobe items: \(error)")
            return []
        }
    }
    
    private func loadImageFromAppGroup(filename: String) -> UIImage? {
        guard let sharedURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.NealAndPrafull.ReturnGuard") else {
            print("[SafariWebExtensionHandler] ❌ Failed to access App Group container")
            return nil
        }
        
        let fileURL = sharedURL.appendingPathComponent(filename)
        
        do {
            let imageData = try Data(contentsOf: fileURL)
            return UIImage(data: imageData)
        } catch {
            print("[SafariWebExtensionHandler] ⚠️ Failed to load image \(filename): \(error)")
            return nil
        }
    }
    
    private func completeRequest(context: NSExtensionContext, response: [String: Any]) {
        print("[SafariWebExtensionHandler] 📤 Completing request with response keys: \(response.keys)")
        
        let responseItem = NSExtensionItem()
        responseItem.userInfo = [SFExtensionMessageKey: response]
        
        context.completeRequest(returningItems: [responseItem]) { success in
            print("[SafariWebExtensionHandler] 🏁 Request completed. Success: \(success)")
        }
    }
}

// MARK: - WardrobeItem struct (copy from your main app)

struct WardrobeItem: Codable {
    let id: UUID
    let imageFilename: String
    let categoryName: String
    let colorLabel: String
    let dateAdded: Date
    let originalImageFilename: String?
    let boundingBoxX: CGFloat?
    let boundingBoxY: CGFloat?
    let boundingBoxWidth: CGFloat?
    let boundingBoxHeight: CGFloat?

    enum CodingKeys: String, CodingKey {
        case id, imageFilename, categoryName, colorLabel, dateAdded, originalImageFilename, boundingBoxX, boundingBoxY, boundingBoxWidth, boundingBoxHeight
    }
}
