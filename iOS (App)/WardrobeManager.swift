//
//  WardrobeManager.swift
//  SkipTheCart
//
//  Created on 3/16/25.
//

import SwiftUI
import Combine

// Extended WardrobeItem to support Codable for persistence
struct WardrobeItem: Identifiable, Codable {
    var id = UUID()
    var imageFilename: String
    var categoryName: String
    var dateAdded: Date
    
    // Computed property for the image (not stored in Codable)
    var image: UIImage {
        get {
            WardrobeManager.shared.loadImage(filename: imageFilename) ?? UIImage(systemName: "photo")!
        }
    }
    
    // Init for creating a new item from an image
    init(image: UIImage, categoryName: String, dateAdded: Date = Date()) {
        self.imageFilename = UUID().uuidString
        self.categoryName = categoryName
        self.dateAdded = dateAdded
        
        // Save the image to disk
        WardrobeManager.shared.saveImage(image, filename: self.imageFilename)
    }
    
    // Init for loading from Codable
    init(id: UUID = UUID(), imageFilename: String, categoryName: String, dateAdded: Date) {
        self.id = id
        self.imageFilename = imageFilename
        self.categoryName = categoryName
        self.dateAdded = dateAdded
    }
}

class WardrobeManager: ObservableObject {
    static let shared = WardrobeManager()
    
    @Published var items: [WardrobeItem] = []
    private let itemsKey = "wardrobe_items"
    
    private init() {
        loadItems()
    }
    
    // MARK: - Item Management
    
    func addItems(_ newItems: [WardrobeItem]) {
        items.append(contentsOf: newItems)
        saveItems()
    }
    
    func removeItem(at index: Int) {
        if index < items.count {
            // Delete the image file
            let filename = items[index].imageFilename
            deleteImage(filename: filename)
            
            // Remove from array
            items.remove(at: index)
            saveItems()
        }
    }
    
    func removeItem(withID id: UUID) {
        if let index = items.firstIndex(where: { $0.id == id }) {
            removeItem(at: index)
        }
    }
    
    // MARK: - Persistence
    
    private func saveItems() {
        if let encoded = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(encoded, forKey: itemsKey)
        }
    }
    
    private func loadItems() {
        if let data = UserDefaults.standard.data(forKey: itemsKey),
           let decoded = try? JSONDecoder().decode([WardrobeItem].self, from: data) {
            items = decoded
        }
    }
    
    // MARK: - Image Handling
    
    func saveImage(_ image: UIImage, filename: String) -> Bool {
        guard let data = image.jpegData(compressionQuality: 0.7) else { return false }
        guard let directory = try? FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true) else { return false }
        
        do {
            try data.write(to: directory.appendingPathComponent(filename))
            return true
        } catch {
            print("Error saving image: \(error)")
            return false
        }
    }
    
    func loadImage(filename: String) -> UIImage? {
        guard let directory = try? FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false) else { return nil }
        let fileURL = directory.appendingPathComponent(filename)
        
        do {
            let imageData = try Data(contentsOf: fileURL)
            return UIImage(data: imageData)
        } catch {
            print("Error loading image: \(error)")
            return nil
        }
    }
    
    private func deleteImage(filename: String) {
        guard let directory = try? FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false) else { return }
        let fileURL = directory.appendingPathComponent(filename)
        
        do {
            try FileManager.default.removeItem(at: fileURL)
        } catch {
            print("Error deleting image: \(error)")
        }
    }
    
    // MARK: - Wardrobe Analysis
    
    // Get counts by category
    func getCategoryCounts() -> [String: Int] {
        var counts: [String: Int] = [:]
        
        for item in items {
            counts[item.categoryName, default: 0] += 1
        }
        
        return counts
    }
    
    // Get most recent items (limited to count)
    func getRecentItems(count: Int = 5) -> [WardrobeItem] {
        return Array(items.sorted(by: { $0.dateAdded > $1.dateAdded }).prefix(count))
    }
}
