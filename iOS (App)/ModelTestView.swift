import SwiftUI
import PhotosUI
import CoreML
import Vision

struct ModelTestView: View {
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedImage: UIImage?
    @State private var highlightedImage: UIImage?
    @State private var detectedItems: [(name: String, color: UIColor)] = []
    @State private var isProcessing: Bool = false
    @State private var segmentationColors: [String: UIColor] = [:]

    // Modified labelNames dictionary - removed Hat, Gloves, Sunglasses, Socks, Jumpsuits, and Scarf
    let labelNames: [Int: String] = [
        5: "Upper Clothes", 6: "Dress",
        7: "Coat", 9: "Pants", 12: "Skirt",
        18: "Left Shoe", 19: "Right Shoe"
    ]

    var body: some View {
        ZStack {
            // Background
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            
            ScrollView {
                VStack(spacing: AppStyles.Spacing.large) {
                    // Header
                    Text("Clothing Detection")
                        .font(AppStyles.Typography.title)
                        .foregroundColor(AppStyles.Colors.text)
                        .padding(.top, AppStyles.Spacing.large)
                    
                    // Select Image Button
                    PhotosPicker(selection: $selectedItem, matching: .images) {
                        HStack {
                            Image(systemName: "photo.fill")
                                .font(.system(size: 18))
                            Text("Select Image")
                                .font(AppStyles.Typography.heading)
                        }
                        .padding(.horizontal, AppStyles.Spacing.large)
                    }
                    .primaryButtonStyle()
                    .padding(.horizontal, AppStyles.Spacing.xlarge)
                    
                    // Image and Results Section
                    if let selectedImage = selectedImage {
                        VStack(spacing: AppStyles.Spacing.medium) {
                            if isProcessing {
                                // Loading View
                                VStack(spacing: AppStyles.Spacing.medium) {
                                    ProgressView()
                                        .scaleEffect(1.5)
                                        .padding()
                                    
                                    Text("Analyzing clothing...")
                                        .font(AppStyles.Typography.body)
                                        .foregroundColor(AppStyles.Colors.secondaryText)
                                }
                                .frame(height: 300)
                                .frame(maxWidth: .infinity)
                                .cardStyle()
                            } else if let resizedImage = resizeImage(selectedImage, to: CGSize(width: 473, height: 473)),
                                      let highlightedImage = highlightedImage {
                                // Result View
                                VStack(spacing: AppStyles.Spacing.medium) {
                                    // Image Display
                                    ZStack {
                                        Image(uiImage: resizedImage)
                                            .resizable()
                                            .scaledToFit()
                                            .cornerRadius(AppStyles.Layout.smallCornerRadius)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: AppStyles.Layout.smallCornerRadius)
                                                    .stroke(AppStyles.Colors.formBorder, lineWidth: 1)
                                            )
                                        
                                        Image(uiImage: highlightedImage)
                                            .resizable()
                                            .scaledToFit()
                                            .cornerRadius(AppStyles.Layout.smallCornerRadius)
                                    }
                                    .padding(.horizontal, AppStyles.Spacing.medium)
                                    .frame(maxHeight: 350)

                                    // Color Legend
                                    if !detectedItems.isEmpty {
                                        // Results Card
                                        VStack(alignment: .leading, spacing: AppStyles.Spacing.medium) {
                                            // Title
                                            Text("Detection Results")
                                                .font(AppStyles.Typography.heading)
                                                .foregroundColor(AppStyles.Colors.text)
                                                .padding(.bottom, AppStyles.Spacing.small)
                                            
                                            Divider()
                                                .background(AppStyles.Colors.formBorder)
                                            
                                            // Color Legend Section
                                            VStack(alignment: .leading, spacing: AppStyles.Spacing.small) {
                                                Text("Color Legend:")
                                                    .font(AppStyles.Typography.body)
                                                    .foregroundColor(AppStyles.Colors.text)
                                                    .fontWeight(.medium)
                                                
                                                if detectedItems.isEmpty {
                                                    Text("No items detected")
                                                        .font(AppStyles.Typography.caption)
                                                        .foregroundColor(AppStyles.Colors.secondaryText)
                                                        .padding(.top, AppStyles.Spacing.small)
                                                } else {
                                                    // Legend Grid - only shows detected items
                                                    LazyVGrid(columns: [
                                                        GridItem(.flexible()),
                                                        GridItem(.flexible())
                                                    ], spacing: AppStyles.Spacing.small) {
                                                        ForEach(detectedItems, id: \.name) { item in
                                                            HStack {
                                                                RoundedRectangle(cornerRadius: 4)
                                                                    .fill(Color(segmentationColors[item.name] ?? .clear))
                                                                    .frame(width: 20, height: 20)
                                                                    .overlay(
                                                                        RoundedRectangle(cornerRadius: 4)
                                                                            .stroke(Color.black.opacity(0.2), lineWidth: 1)
                                                                    )
                                                                Text(item.name)
                                                                    .font(AppStyles.Typography.caption)
                                                                    .foregroundColor(AppStyles.Colors.text)
                                                            }
                                                            .padding(.vertical, 2)
                                                        }
                                                    }
                                                }
                                            }
                                            
                                            // Divider
                                            Divider()
                                                .background(AppStyles.Colors.formBorder)
                                                .padding(.vertical, AppStyles.Spacing.small)
                                            
                                            // Detected Items Section with Actual Colors
                                            VStack(alignment: .leading, spacing: AppStyles.Spacing.small) {
                                                Text("Actual Colors:")
                                                    .font(AppStyles.Typography.body)
                                                    .foregroundColor(AppStyles.Colors.text)
                                                    .fontWeight(.medium)
                                                
                                                if detectedItems.isEmpty {
                                                    Text("No clothing items detected")
                                                        .font(AppStyles.Typography.caption)
                                                        .foregroundColor(AppStyles.Colors.secondaryText)
                                                        .padding(.top, AppStyles.Spacing.small)
                                                } else {
                                                    // Detected Items Grid
                                                    LazyVGrid(columns: [
                                                        GridItem(.flexible()),
                                                        GridItem(.flexible())
                                                    ], spacing: AppStyles.Spacing.small) {
                                                        ForEach(detectedItems, id: \.name) { item in
                                                            HStack {
                                                                RoundedRectangle(cornerRadius: 4)
                                                                    .fill(Color(item.color))
                                                                    .frame(width: 20, height: 20)
                                                                    .overlay(
                                                                        RoundedRectangle(cornerRadius: 4)
                                                                            .stroke(Color.black.opacity(0.2), lineWidth: 1)
                                                                    )
                                                                Text(item.name)
                                                                    .font(AppStyles.Typography.caption)
                                                                    .foregroundColor(AppStyles.Colors.text)
                                                            }
                                                            .padding(.vertical, 2)
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        .padding(AppStyles.Spacing.medium)
                                        .background(AppStyles.Colors.secondaryBackground)
                                        .cornerRadius(AppStyles.Layout.cornerRadius)
                                        .padding(.horizontal, AppStyles.Spacing.medium)
                                    }
                                }
                            }
                        }
                    } else {
                        // Empty State
                        VStack(spacing: AppStyles.Spacing.medium) {
                            Image(systemName: "tshirt.fill")
                                .font(.system(size: 60))
                                .foregroundColor(AppStyles.Colors.primary.opacity(0.7))
                                .padding(.bottom, AppStyles.Spacing.small)
                            
                            Text("No Image Selected")
                                .font(AppStyles.Typography.heading)
                                .foregroundColor(AppStyles.Colors.text)
                            
                            Text("Select an image to analyze clothing items")
                                .font(AppStyles.Typography.body)
                                .foregroundColor(AppStyles.Colors.secondaryText)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, AppStyles.Spacing.xlarge)
                                .padding(.bottom, AppStyles.Spacing.medium)
                        }
                        .frame(height: 300)
                        .frame(maxWidth: .infinity)
                        .background(AppStyles.Colors.secondaryBackground)
                        .cornerRadius(AppStyles.Layout.cornerRadius)
                        .padding(.horizontal, AppStyles.Spacing.medium)
                    }
                    
                    Spacer()
                }
                .padding(.bottom, AppStyles.Spacing.xlarge)
            }
        }
        .onChange(of: selectedItem) { newItem in
            if newItem != nil {
                // Show loading immediately when item selected
                isProcessing = true
            }
            
            Task {
                if let data = try? await newItem?.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    selectedImage = uiImage
                    if let resizedImage = resizeImage(uiImage, to: CGSize(width: 473, height: 473)) {
                        processImage(resizedImage)
                    }
                } else {
                    isProcessing = false
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
            isProcessing = false
            return
        }

        let request = VNCoreMLRequest(model: vnModel) { request, error in
            if let error = error {
                print("Error processing image: \(error)")
                DispatchQueue.main.async {
                    self.isProcessing = false
                }
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

                let (highlightedImage, colorMap) = self.createHighlightedImage(labels: labels, width: width, height: height)
                let detectedItemsWithColors = self.extractDetectedItemsWithColors(labels: labels, image: image)

                // Add slight delay to make loading animation visible even for fast processing
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self.highlightedImage = highlightedImage
                    self.segmentationColors = colorMap
                    self.detectedItems = detectedItemsWithColors
                    self.isProcessing = false
                }
            } else {
                DispatchQueue.main.async {
                    self.isProcessing = false
                }
            }
        }

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        do {
            try handler.perform([request])
        } catch {
            print("Failed to perform request: \(error)")
            DispatchQueue.main.async {
                self.isProcessing = false
            }
        }
    }

    /// Creates a highlighted image from the segmentation labels
    func createHighlightedImage(labels: [[Int]], width: Int, height: Int) -> (UIImage, [String: UIColor]) {
        // Modified clothingLabels array - removed ID 1 (Hat), 3, 4, 8, 10, 11 (Gloves, Sunglasses, Socks, Jumpsuits, Scarf)
        let clothingLabels = [5, 6, 7, 9, 12, 18, 19]
        let numColors = clothingLabels.count
        let colors: [UIColor] = (0..<numColors).map { i in
            let hue = CGFloat(i) / CGFloat(numColors)
            return UIColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: 0.5)
        }

        var labelColors = [CGColor](repeating: UIColor.clear.cgColor, count: 20)
        for (index, label) in clothingLabels.enumerated() {
            labelColors[label] = colors[index].cgColor
        }
        
        // Create color mapping for legend display
        var colorMap: [String: UIColor] = [:]
        for (index, label) in clothingLabels.enumerated() {
            if let name = labelNames[label] {
                colorMap[name] = colors[index]
            }
        }

        let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height))
        let image = renderer.image { context in
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
        
        return (image, colorMap)
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
    
    /// Returns only the clothing items that were detected in the current image
    func getLegendColors() -> [(String, UIColor)] {
        // Get only the detected item names
        let detectedItemNames = Set(detectedItems.map { $0.name })
        
        // Filter segmentationColors to only include detected items
        let filteredColors = segmentationColors.filter { detectedItemNames.contains($0.key) }
        
        // Convert to array and sort
        let items = filteredColors.map { ($0.key, $0.value) }
        return items.sorted { $0.0 < $1.0 } // Sort by clothing item name
    }
}
