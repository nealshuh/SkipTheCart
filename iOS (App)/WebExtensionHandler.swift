//
//  WebExtensionHandler.swift
//  SkipTheCart
//
//  Created by Prafull Sharma on 5/25/25.
//


import Foundation
import SafariServices

class WebExtensionHandler: NSObject, NSExtensionRequestHandling {
    private let defaults = UserDefaults(suiteName: "group.com.example.app")
    private let sharedContainerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.example.app")
    
    func beginRequest(with context: NSExtensionContext) {
        guard let item = context.inputItems.first as? NSExtensionItem,
              let message = item.userInfo?[SFExtensionMessageKey] as? [String: Any],
              let action = message["action"] as? String else {
            context.completeRequest(returningItems: [], completionHandler: nil)
            return
        }
        
        if action == "getBottoms" {
            guard let savedItems = defaults?.data(forKey: "wardrobe_items"),
                  let decodedItems = try? JSONDecoder().decode([WardrobeItem].self, from: savedItems) else {
                context.completeRequest(returningItems: [], completionHandler: nil)
                return
            }
            let bottoms = decodedItems.filter { $0.categoryName == "Bottoms" }
            var bottomsData: [[String: Any]] = []
            for bottom in bottoms {
                let imageURL = sharedContainerURL?.appendingPathComponent(bottom.imageFilename)
                let base64Image = loadImageAsBase64(from: imageURL)
                bottomsData.append([
                    "id": bottom.id.uuidString,
                    "categoryName": bottom.categoryName,
                    "colorLabel": bottom.colorLabel,
                    "dateAdded": bottom.dateAdded.description,
                    "image": base64Image ?? ""
                ])
            }
            let response = ["bottoms": bottomsData]
            let responseItem = NSExtensionItem()
            responseItem.userInfo = [SFExtensionMessageKey: response]
            context.completeRequest(returningItems: [responseItem], completionHandler: nil)
        } else {
            context.completeRequest(returningItems: [], completionHandler: nil)
        }
    }
    
    private func loadImageAsBase64(from url: URL?) -> String? {
        guard let url = url, let data