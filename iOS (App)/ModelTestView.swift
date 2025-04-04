import SwiftUI
import PhotosUI
import CoreML
import Vision

struct ModelTestView: View {
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedImage: UIImage?
    @State private var highlightedImage: UIImage?
    @State private var detectedItems: [(name: String, color: UIColor)] = []

    let labelNames: [Int: String] = [
        1: "Hat", 3: "Gloves", 4: "Sunglasses", 5: "Upper Clothes", 6: "Dress",
        7: "Coat", 8: "Socks", 9: "Pants", 10: "Jumpsuits", 11: "Scarf",
        12: "Skirt", 18: "Left Shoe", 19: "Right Shoe"
    ]

    var body: some View {
        VStack(spacing: 20) {
            PhotosPicker(selection: $selectedItem, matching: .images) {
                Text("Select Image")
                    .font(.headline)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }

            if let selectedImage = selectedImage,
               let resizedImage = resizeImage(selectedImage, to: CGSize(width: 473, height: 473)),
               let highlightedImage = highlightedImage {
                ZStack {
                    Image(uiImage: resizedImage)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 300, height: 300)
                    Image(uiImage: highlightedImage)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 300, height: 300)
                }

                if !detectedItems.isEmpty {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Detected Items:")
                            .font(.headline)
                        ForEach(detectedItems, id: \.name) { item in
                            HStack {
                                Rectangle()
                                    .fill(Color(item.color))
                                    .frame(width: 20, height: 20)
                                    .cornerRadius(4)
                                Text(item.name)
                                    .font(.subheadline)
                            }
                        }
                    }
                    .padding(.top, 10)
                }
            } else {
                Text("Select an image to process")
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
        }
        .padding()
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

    /// Resizes an image to the specified size
    func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }

    /// Processes the image with the CoreML model
    func processImage(_ image: UIImage) {
        guard let model = try? ClothingSegmentation(configuration: MLModelConfiguration()),
              let vnModel = try? VNCoreMLModel(for: model.model),
              let cgImage = image.cgImage else {
            print("Failed to load model or convert image")
            return
        }

        let request = VNCoreMLRequest(model: vnModel) { request, error in
            if let error = error {
                print("Error processing image: \(error)")
                return
            }
            if let results = request.results as? [VNCoreMLFeatureValueObservation],
               let firstResult = results.first,
               let multiArray = firstResult.featureValue.multiArrayValue {
                let numClasses = multiArray.shape[1].intValue
                let height = multiArray.shape[2].intValue
                let width = multiArray.shape[3].intValue

                var labels = [[Int]](repeating: [Int](repeating: 0, count: width), count: height)
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

                let highlightedImage = self.createHighlightedImage(labels: labels, width: width, height: height)
                let detectedItemsWithColors = self.extractDetectedItemsWithColors(labels: labels, image: image)

                DispatchQueue.main.async {
                    self.highlightedImage = highlightedImage
                    self.detectedItems = detectedItemsWithColors
                }
            }
        }

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        do {
            try handler.perform([request])
        } catch {
            print("Failed to perform request: \(error)")
        }
    }

    /// Creates a highlighted image from the segmentation labels
    func createHighlightedImage(labels: [[Int]], width: Int, height: Int) -> UIImage {
        let clothingLabels = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 19]
        let numColors = clothingLabels.count
        let colors: [UIColor] = (0..<numColors).map { i in
            let hue = CGFloat(i) / CGFloat(numColors)
            return UIColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: 0.5)
        }

        var labelColors = [CGColor](repeating: UIColor.clear.cgColor, count: 20)
        for (index, label) in clothingLabels.enumerated() {
            labelColors[label] = colors[index].cgColor
        }

        let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height))
        return renderer.image { context in
            let cgContext = context.cgContext
            for i in 0..<height {
                for j in 0..<width {
                    if i < labels.count && j < labels[i].count {
                        let label = labels[i][j]
                        let color = labelColors[label]
                        cgContext.setFillColor(color)
                        cgContext.fill(CGRect(x: j, y: i, width: 1, height: 1))
                    }
                }
            }
        }
    }

    /// Extracts detected items and their colors using segment masks
    func extractDetectedItemsWithColors(labels: [[Int]], image: UIImage) -> [(name: String, color: UIColor)] {
        guard let cgImage = image.cgImage else { return [] }

        // Check if the image is grayscale
        if isGrayscale(cgImage) {
            print("Image is grayscale, cannot extract colors.")
            let uniqueLabels = Set(labels.flatMap { $0 }).filter { labelNames.keys.contains($0) }
            return uniqueLabels.map { label in
                (name: labelNames[label] ?? "Unknown", color: UIColor.gray)
            }
        }

        // Standardize pixel format
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
        guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 4 * width, space: colorSpace, bitmapInfo: bitmapInfo.rawValue) else {
            return []
        }
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let data = context.data?.assumingMemoryBound(to: UInt8.self) else { return [] }

        // Collect pixel colors for each label
        let uniqueLabels = Set(labels.flatMap { $0 }).filter { labelNames.keys.contains($0) }
        var labelPixelColors: [Int: [(r: Float, g: Float, b: Float)]] = [:]
        for i in 0..<height {
            for j in 0..<width {
                if i < labels.count && j < labels[i].count {
                    let label = labels[i][j]
                    if labelNames.keys.contains(label) {
                        let pixelOffset = (i * width * 4) + (j * 4)
                        let r = Float(data[pixelOffset]) / 255.0
                        let g = Float(data[pixelOffset + 1]) / 255.0
                        let b = Float(data[pixelOffset + 2]) / 255.0
                        labelPixelColors[label, default: []].append((r, g, b))
                    }
                }
            }
        }

        // Compute average color for each label
        var detectedItemsWithColors: [(name: String, color: UIColor)] = []
        for label in uniqueLabels {
            if let pixelColors = labelPixelColors[label], !pixelColors.isEmpty,
               let name = labelNames[label] {
                let totalPixels = Float(pixelColors.count)
                let avgR = pixelColors.reduce(0, { $0 + $1.r }) / totalPixels
                let avgG = pixelColors.reduce(0, { $0 + $1.g }) / totalPixels
                let avgB = pixelColors.reduce(0, { $0 + $1.b }) / totalPixels
                print("Label \(label) (\(name)): R=\(avgR), G=\(avgG), B=\(avgB)")
                let avgColor = UIColor(red: CGFloat(avgR), green: CGFloat(avgG), blue: CGFloat(avgB), alpha: 1.0)
                detectedItemsWithColors.append((name: name, color: avgColor))
            }
        }

        return detectedItemsWithColors
    }

    /// Checks if the image is grayscale
    func isGrayscale(_ cgImage: CGImage) -> Bool {
        guard let colorSpace = cgImage.colorSpace else { return false }
        return colorSpace.model == .monochrome
    }
}
