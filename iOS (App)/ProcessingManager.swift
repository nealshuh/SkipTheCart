import SwiftUI
import Combine
import UIKit

struct PreviewItem: Identifiable {
    let id = UUID()
    let category: String
    let image: UIImage
    var colorLabel: String
    let originalImageFilename: String
    let boundingBox: CGRect
}

struct ImageToProcess {
    let image: UIImage
    let filename: String
    let size: CGSize
}

class ProcessingManager: ObservableObject {
    static let shared = ProcessingManager()
    
    @Published var isProcessing = false
    @Published var pendingItems: [PreviewItem] = []
    @Published private(set) var currentBatchSize: Int = 0
    @Published private(set) var processedInBatch: Int = 0
    
    private var imageQueue: [ImageToProcess] = []
    private let clothingModelAPI = ClothingModelAPI()
    
    private init() {}
    
    func addImagesToProcess(_ images: [ImageToProcess]) {
        imageQueue.append(contentsOf: images)
        if !isProcessing {
            currentBatchSize = imageQueue.count
            processedInBatch = 0
            isProcessing = true
            processNextImage()
        }
    }
    
    private func processNextImage() {
        guard !imageQueue.isEmpty else {
            isProcessing = false
            currentBatchSize = 0
            processedInBatch = 0
            return
        }
        let imageToProcess = imageQueue.removeFirst()
        Task {
            do {
                let processedItems = try await clothingModelAPI.processImage(imageToProcess.image, originalFilename: imageToProcess.filename, originalSize: imageToProcess.size)
                await MainActor.run {
                    self.pendingItems.append(contentsOf: processedItems)
                    self.processedInBatch += 1
                    self.processNextImage()
                }
            } catch {
                print("Error processing image: \(error)")
                await MainActor.run {
                    self.processedInBatch += 1
                    self.processNextImage()
                }
            }
        }
    }
    
    func removePendingItems(withIDs ids: [UUID]) {
        pendingItems.removeAll { item in ids.contains(item.id) }
    }
}
