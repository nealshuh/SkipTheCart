import SwiftUI
import PhotosUI
import CoreML
import Vision

struct ModelTestView: View {
    // State variables to manage the selected image and the highlighted result
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedImage: UIImage?
    @State private var highlightedImage: UIImage?
    
    var body: some View {
        VStack(spacing: 20) {
            // PhotosPicker to select an image from the photo library
            PhotosPicker(selection: $selectedItem, matching: .images) {
                Text("Select Image")
                    .font(.headline)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            
            // Display the processed image with highlights, or a placeholder text
            if let selectedImage = selectedImage,
               let resizedImage = resizeImage(selectedImage, to: CGSize(width: 473, height: 473)),
               let highlightedImage = highlightedImage {
                ZStack {
                    // Resized original image
                    Image(uiImage: resizedImage)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 300, height: 300)
                    // Highlighted image overlaid on top
                    Image(uiImage: highlightedImage)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 300, height: 300)
                }
            } else {
                Text("Select an image to process")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
        }
        .padding()
        // Handle image selection changes
        .onChange(of: selectedItem) { newItem in
            Task {
                if let data = try? await newItem?.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    selectedImage = uiImage
                    if let resizedImage = resizeImage(uiImage, to: CGSize(width: 473, height: 473)) {
                        processImage(resizedImage)
                    }
                }
            }
        }
    }
    
    /// Resizes a UIImage to the specified size
    func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }
    
    /// Processes the image using the CoreML model and generates the highlighted image
    func processImage(_ image: UIImage) {
        // Load the CoreML model
        guard let model = try? ClothingSegmentation(configuration: MLModelConfiguration()),
              let vnModel = try? VNCoreMLModel(for: model.model),
              let cgImage = image.cgImage else {
            print("Failed to load model or convert image")
            return
        }
        
        // Create a Vision request to run the model
        let request = VNCoreMLRequest(model: vnModel) { request, error in
            if let error = error {
                print("Error processing image: \(error)")
                return
            }
            if let results = request.results as? [VNCoreMLFeatureValueObservation],
               let firstResult = results.first,
               let multiArray = firstResult.featureValue.multiArrayValue {
                // Debug the shape and data type
                print("MultiArray shape: \(multiArray.shape)")
                print("MultiArray data type: \(multiArray.dataType)")
                
                // Extract dimensions (assuming shape is [1, numClasses, height, width])
                let numClasses = multiArray.shape[1].intValue // e.g., 20
                let height = multiArray.shape[2].intValue     // e.g., 473
                let width = multiArray.shape[3].intValue      // e.g., 473
                
                // Initialize the labels array
                var labels = [[Int]](repeating: [Int](repeating: 0, count: width), count: height)
                
                // For each pixel, find the class with the highest score
                for i in 0..<height {
                    for j in 0..<width {
                        var maxScore: Float = -Float.greatestFiniteMagnitude
                        var maxClass = 0
                        for c in 0..<numClasses {
                            let score = multiArray[[0, c, i, j] as [NSNumber]].floatValue
                            if score > maxScore {
                                maxScore = score
                                maxClass = c
                            }
                        }
                        labels[i][j] = maxClass
                    }
                }
                
                // Generate the highlighted image with bounds checking
                let highlightedImage = self.createHighlightedImage(labels: labels, width: width, height: height)
                
                // Update the UI on the main thread
                DispatchQueue.main.async {
                    self.highlightedImage = highlightedImage
                }
            } else {
                print("No results from model")
            }
        }
        
        // Perform the request
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        do {
            try handler.perform([request])
        } catch {
            print("Failed to perform request: \(error)")
        }
    }
    
    /// Creates a highlighted image based on the segmentation labels
    func createHighlightedImage(labels: [[Int]], width: Int, height: Int) -> UIImage {
        // Define clothing class labels based on the model's expected output
        let clothingLabels: Set<Int> = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 19]
        
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height))
        return renderer.image { context in
            let cgContext = context.cgContext
            // Set the highlight color (red with 50% opacity)
            cgContext.setFillColor(UIColor.red.withAlphaComponent(0.5).cgColor)
            // Draw a 1x1 rectangle for each pixel with a clothing label
            for i in 0..<height {
                for j in 0..<width {
                    // Ensure the index is within bounds before accessing
                    if i < labels.count && j < labels[i].count && clothingLabels.contains(labels[i][j]) {
                        cgContext.fill(CGRect(x: j, y: i, width: 1, height: 1))
                    }
                }
            }
        }
    }
}

// Preview provider for SwiftUI canvas
struct ModelTestView_Previews: PreviewProvider {
    static var previews: some View {
        ModelTestView()
    }
}
