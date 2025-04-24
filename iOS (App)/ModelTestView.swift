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
    @State private var maskedImages: [String: UIImage] = [:]
    @State private var showingIndividualItems = false

    let labelNames: [Int: String] = [
        5: "Upper Clothes", 6: "Dress",
        7: "Coat", 9: "Pants", 12: "Skirt",
        18: "Left Shoe", 19: "Right Shoe"
    ]

    let segFormerToLabel: [Int: Int] = [
        4: 5,   // Upper-clothes to Upper Clothes
        7: 6,   // Dress to Dress
        6: 9,   // Pants to Pants
        5: 12,  // Skirt to Skirt
        9: 18,  // Left-shoe to Left Shoe
        10: 19  // Right-shoe to Right Shoe
    ]

    let nameToLabel: [String: Int] = [
        "Upper Clothes": 5,
        "Dress": 6,
        "Coat": 7,
        "Pants": 9,
        "Skirt": 12,
        "Left Shoe": 18,
        "Right Shoe": 19
    ]

    // Excluding shoes (labels 18 and 19)
    let includedLabels: Set<Int> = [5, 6, 7, 9, 12]

    var body: some View {
        ZStack {
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            ScrollView {
                VStack(spacing: AppStyles.Spacing.large) {
                    Text("Clothing Detection")
                        .font(AppStyles.Typography.title)
                        .foregroundColor(AppStyles.Colors.text)
                        .padding(.top, AppStyles.Spacing.large)
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
                    if let selectedImage = selectedImage {
                        VStack(spacing: AppStyles.Spacing.medium) {
                            if isProcessing {
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
                            } else if let resizedImage = resizeImage(selectedImage, to: CGSize(width: 512, height: 512)),
                                      let highlightedImage = highlightedImage {
                                VStack(spacing: AppStyles.Spacing.medium) {
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
                                    if !detectedItems.isEmpty {
                                        VStack(alignment: .leading, spacing: AppStyles.Spacing.medium) {
                                            Text("Detection Results")
                                                .font(AppStyles.Typography.heading)
                                                .foregroundColor(AppStyles.Colors.text)
                                                .padding(.bottom, AppStyles.Spacing.small)
                                            Divider()
                                                .background(AppStyles.Colors.formBorder)
                                            VStack(alignment: .leading, spacing: AppStyles.Spacing.small) {
                                                Text("Color Legend:")
                                                    .font(AppStyles.Typography.body)
                                                    .foregroundColor(AppStyles.Colors.text)
                                                    .fontWeight(.medium)
                                                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppStyles.Spacing.small) {
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
                                            Divider()
                                                .background(AppStyles.Colors.formBorder)
                                                .padding(.vertical, AppStyles.Spacing.small)
                                            VStack(alignment: .leading, spacing: AppStyles.Spacing.small) {
                                                Text("Actual Colors:")
                                                    .font(AppStyles.Typography.body)
                                                    .foregroundColor(AppStyles.Colors.text)
                                                    .fontWeight(.medium)
                                                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppStyles.Spacing.small) {
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
                                            Button(action: {
                                                showingIndividualItems = true
                                            }) {
                                                Text("View Individual Items")
                                                    .font(AppStyles.Typography.heading)
                                                    .frame(maxWidth: .infinity)
                                            }
                                            .primaryButtonStyle()
                                            .padding(.top, AppStyles.Spacing.medium)
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
                isProcessing = true
            }
            Task {
                if let data = try? await newItem?.loadTransferable(type: Data.self),
                   let uiImage = UIImage(data: data) {
                    selectedImage = uiImage
                    if let resizedImage = resizeImage(uiImage, to: CGSize(width: 512, height: 512)) {
                        processImage(resizedImage)
                    }
                } else {
                    isProcessing = false
                }
            }
        }
        .sheet(isPresented: $showingIndividualItems) {
            IndividualItemsView(maskedImages: maskedImages)
        }
    }

    func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }

    func processImage(_ image: UIImage) {
        do {
            let model = try SegFormerClothes(configuration: MLModelConfiguration())
            print("Model loaded successfully")
            do {
                let vnModel = try VNCoreMLModel(for: model.model)
                print("VNCoreMLModel created successfully")
                guard let cgImage = image.cgImage else {
                    print("Failed to convert image to CGImage")
                    isProcessing = false
                    return
                }
                let request = VNCoreMLRequest(model: vnModel) { request, error in
                    if let error = error {
                        print("Error processing image: \(error.localizedDescription)")
                        DispatchQueue.main.async {
                            self.isProcessing = false
                        }
                        return
                    }
                    if let results = request.results as? [VNCoreMLFeatureValueObservation],
                       let firstResult = results.first,
                       let multiArray = firstResult.featureValue.multiArrayValue {
                        let height = multiArray.shape[1].intValue
                        let width = multiArray.shape[2].intValue
                        var labels = [[Int]](repeating: [Int](repeating: 0, count: width), count: height)
                        for i in 0..<height {
                            for j in 0..<width {
                                let classIndex = multiArray[[0, i, j] as [NSNumber]].intValue
                                labels[i][j] = self.segFormerToLabel[classIndex] ?? 0
                            }
                        }
                        let (highlightedImage, colorMap) = self.createHighlightedImage(labels: labels, width: width, height: height)
                        let detectedItemsWithColors = self.extractDetectedItemsWithColors(labels: labels, image: image)
                        var maskedImagesTemp: [String: UIImage] = [:]
                        for item in detectedItemsWithColors {
                            if let label = self.nameToLabel[item.name] {
                                if let maskedImage = self.createMaskedImage(labels: labels, width: width, height: height, for: label, originalImage: image) {
                                    maskedImagesTemp[item.name] = maskedImage
                                }
                            }
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            self.highlightedImage = highlightedImage
                            self.segmentationColors = colorMap
                            self.detectedItems = detectedItemsWithColors
                            self.maskedImages = maskedImagesTemp
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
                    print("Failed to perform request: \(error.localizedDescription)")
                    DispatchQueue.main.async {
                        self.isProcessing = false
                    }
                }
            } catch {
                print("Error creating VNCoreMLModel: \(error.localizedDescription)")
                isProcessing = false
                return
            }
        } catch {
            print("Error loading model: \(error.localizedDescription)")
            isProcessing = false
            return
        }
    }

    func createHighlightedImage(labels: [[Int]], width: Int, height: Int) -> (UIImage, [String: UIColor]) {
        let clothingLabels = Array(includedLabels) // Only included labels, excluding shoes
        let numColors = clothingLabels.count
        let colors: [UIColor] = (0..<numColors).map { i in
            let hue = CGFloat(i) / CGFloat(numColors)
            return UIColor(hue: hue, saturation: 1.0, brightness: 1.0, alpha: 0.5)
        }
        var labelColors = [CGColor](repeating: UIColor.clear.cgColor, count: 20)
        for (index, label) in clothingLabels.enumerated() {
            labelColors[label] = colors[index].cgColor
        }
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

    func extractDetectedItemsWithColors(labels: [[Int]], image: UIImage) -> [(name: String, color: UIColor)] {
        guard let cgImage = image.cgImage else { return [] }
        if isGrayscale(cgImage) {
            print("Image is grayscale, cannot extract colors.")
            let uniqueLabels = Set(labels.flatMap { $0 }).intersection(includedLabels)
            return uniqueLabels.map { label in
                (name: labelNames[label] ?? "Unknown", color: UIColor.gray)
            }
        }
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
        guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 4 * width, space: colorSpace, bitmapInfo: bitmapInfo.rawValue) else {
            return []
        }
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let data = context.data?.assumingMemoryBound(to: UInt8.self) else { return [] }
        let uniqueLabels = Set(labels.flatMap { $0 }).intersection(includedLabels)
        var labelPixelColors: [Int: [(r: Float, g: Float, b: Float)]] = [:]
        for i in 0..<height {
            for j in 0..<width {
                if i < labels.count && j < labels[i].count {
                    let label = labels[i][j]
                    if includedLabels.contains(label) {
                        let pixelOffset = (i * width * 4) + (j * 4)
                        let r = Float(data[pixelOffset]) / 255.0
                        let g = Float(data[pixelOffset + 1]) / 255.0
                        let b = Float(data[pixelOffset + 2]) / 255.0
                        labelPixelColors[label, default: []].append((r, g, b))
                    }
                }
            }
        }
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

    func isGrayscale(_ cgImage: CGImage) -> Bool {
        guard let colorSpace = cgImage.colorSpace else { return false }
        return colorSpace.model == .monochrome
    }

    func createMaskedImage(labels: [[Int]], width: Int, height: Int, for label: Int, originalImage: UIImage) -> UIImage? {
        guard let cgImage = originalImage.cgImage else { return nil }
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bytesPerPixel = 4
        let bytesPerRow = bytesPerPixel * width
        let bitsPerComponent = 8
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue
        guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: bitsPerComponent, bytesPerRow: bytesPerRow, space: colorSpace, bitmapInfo: bitmapInfo) else { return nil }
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let data = context.data else { return nil }
        let buffer = data.bindMemory(to: UInt8.self, capacity: width * height * bytesPerPixel)
        for i in 0..<height {
            for j in 0..<width {
                if i < labels.count && j < labels[i].count {
                    let currentLabel = labels[i][j]
                    if currentLabel != label {
                        let pixelOffset = (i * width * bytesPerPixel) + (j * bytesPerPixel)
                        buffer[pixelOffset + 3] = 0
                    }
                }
            }
        }
        guard let outputCGImage = context.makeImage() else { return nil }
        return UIImage(cgImage: outputCGImage)
    }
}

struct IndividualItemsView: View {
    let maskedImages: [String: UIImage]
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 150))], spacing: 20) {
                    ForEach(maskedImages.keys.sorted(), id: \.self) { key in
                        if let image = maskedImages[key] {
                            VStack {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFit()
                                    .frame(height: 200)
                                Text(key)
                                    .font(.headline)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Individual Items")
        }
    }
}
