import SwiftUI
import PhotosUI
import CoreML
import Vision

struct PreviewItem: Identifiable {
    let id = UUID()
    let category: String
    let image: UIImage
}

struct ModelTestView: View {
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var wardrobeManager: WardrobeManager
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var previewItems: [PreviewItem] = []
    @State private var selectedPreviewItems: Set<UUID> = []
    @State private var isProcessing: Bool = false
    @State private var currentProcessingIndex: Int = 0
    @State private var totalImages: Int = 0

    let labelNames: [Int: String] = [
        5: "Tops", 6: "Dresses",
        7: "Coats", 9: "Bottoms", 12: "Skirts",
        18: "Left Shoes", 19: "Right Shoes"
    ]

    let segFormerToLabel: [Int: Int] = [
        4: 5,   // Upper-clothes to Tops
        7: 6,   // Dress to Dresses
        6: 9,   // Pants to Bottoms
        5: 12,  // Skirt to Skirts
        9: 18,  // Left-shoe to Left Shoes
        10: 19  // Right-shoe to Right Shoes
    ]

    let nameToLabel: [String: Int] = [
        "Tops": 5,
        "Dresses": 6,
        "Coats": 7,
        "Bottoms": 9,
        "Skirts": 12,
        "Left Shoes": 18,
        "Right Shoes": 19
    ]

    let includedLabels: Set<Int> = [5, 6, 7, 9, 12]

    var body: some View {
        NavigationView {
            ZStack {
                AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
                ScrollView {
                    VStack(spacing: AppStyles.Spacing.large) {
                        Text("Clothing Detection")
                            .font(AppStyles.Typography.title)
                            .foregroundColor(AppStyles.Colors.text)
                            .padding(.top, AppStyles.Spacing.large)
                        PhotosPicker(selection: $selectedItems, matching: .images) {
                            HStack {
                                Image(systemName: "photo.fill")
                                    .font(.system(size: 18))
                                Text("Select Images")
                                    .font(AppStyles.Typography.heading)
                            }
                            .padding(.horizontal, AppStyles.Spacing.large)
                        }
                        .primaryButtonStyle()
                        .padding(.horizontal, AppStyles.Spacing.xlarge)
                        if isProcessing {
                            VStack(spacing: AppStyles.Spacing.medium) {
                                ProgressView()
                                    .scaleEffect(1.5)
                                    .padding()
                                Text("Processing image \(currentProcessingIndex + 1) of \(totalImages)")
                                    .font(AppStyles.Typography.body)
                                    .foregroundColor(AppStyles.Colors.secondaryText)
                            }
                            .frame(height: 300)
                            .frame(maxWidth: .infinity)
                            .cardStyle()
                        } else if !previewItems.isEmpty {
                            Text("Select the clothing items you wish to add by tapping on them. Selected items will have a blue border. Then, click 'Add Selected to Wardrobe' to save them.")
                                .font(AppStyles.Typography.body)
                                .foregroundColor(AppStyles.Colors.secondaryText)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, AppStyles.Spacing.medium)
                                .padding(.top, AppStyles.Spacing.medium)
                            ScrollView {
                                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 20) {
                                    ForEach(previewItems) { item in
                                        VStack {
                                            Image(uiImage: item.image)
                                                .resizable()
                                                .scaledToFit()
                                                .frame(width: 100, height: 100)
                                                .border(selectedPreviewItems.contains(item.id) ? Color.blue : Color.clear, width: 2)
                                            Text(item.category)
                                                .font(AppStyles.Typography.caption)
                                        }
                                        .onTapGesture {
                                            if selectedPreviewItems.contains(item.id) {
                                                selectedPreviewItems.remove(item.id)
                                            } else {
                                                selectedPreviewItems.insert(item.id)
                                            }
                                        }
                                    }
                                }
                                .padding()
                            }
                            Button(action: {
                                print("Adding \(selectedPreviewItems.count) items")
                                let selected = previewItems.filter { selectedPreviewItems.contains($0.id) }
                                for item in selected {
                                    let wardrobeItem = WardrobeItem(image: item.image, categoryName: item.category)
                                    wardrobeManager.addItems([wardrobeItem])
                                }
                                presentationMode.wrappedValue.dismiss()
                            }) {
                                Text("Add Selected to Wardrobe")
                                    .font(AppStyles.Typography.heading)
                                    .frame(maxWidth: .infinity)
                            }
                            .primaryButtonStyle()
                            .padding(.top, AppStyles.Spacing.medium)
                            .padding(.horizontal, AppStyles.Spacing.medium)
                            .disabled(selectedPreviewItems.isEmpty)
                        } else {
                            VStack(spacing: AppStyles.Spacing.medium) {
                                Image(systemName: "tshirt.fill")
                                    .font(.system(size: 60))
                                    .foregroundColor(AppStyles.Colors.primary.opacity(0.7))
                                    .padding(.bottom, AppStyles.Spacing.small)
                                Text(selectedItems.isEmpty ? "Select Images" : "No Clothing Items Detected")
                                    .font(AppStyles.Typography.heading)
                                    .foregroundColor(AppStyles.Colors.text)
                                Text(selectedItems.isEmpty ? "Select images to analyze clothing items" : "No clothing items were detected in the selected images")
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
                .navigationTitle("Clothing Detection")
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Done") {
                            presentationMode.wrappedValue.dismiss()
                        }
                    }
                }
            }
            .onChange(of: selectedItems) { newItems in
                if !newItems.isEmpty {
                    Task {
                        await processSelectedItems(newItems)
                    }
                }
            }
        }
    }

    private func processSelectedItems(_ items: [PhotosPickerItem]) async {
        previewItems = []
        totalImages = items.count
        currentProcessingIndex = 0
        isProcessing = true
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let uiImage = UIImage(data: data),
               let resizedImage = resizeImage(uiImage, to: CGSize(width: 512, height: 512)) {
                let processedItems = await withCheckedContinuation { continuation in
                    processImage(resizedImage) { previewItems in
                        continuation.resume(returning: previewItems)
                    }
                }
                self.previewItems.append(contentsOf: processedItems)
            }
            self.currentProcessingIndex += 1
        }
        isProcessing = false
    }

    func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }

    func processImage(_ image: UIImage, completion: @escaping ([PreviewItem]) -> Void) {
        do {
            let model = try SegFormerClothes(configuration: MLModelConfiguration())
            let vnModel = try VNCoreMLModel(for: model.model)
            guard let cgImage = image.cgImage else {
                completion([])
                return
            }
            let request = VNCoreMLRequest(model: vnModel) { request, error in
                if let error = error {
                    print("Error processing image: \(error.localizedDescription)")
                    completion([])
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
                    let detectedItemsWithColors = self.extractDetectedItemsWithColors(labels: labels, image: image)
                    var maskedImagesTemp: [String: UIImage] = [:]
                    for item in detectedItemsWithColors {
                        if let label = self.nameToLabel[item.name] {
                            if let maskedImage = self.createMaskedImage(labels: labels, width: width, height: height, for: label, originalImage: image) {
                                maskedImagesTemp[item.name] = maskedImage
                            }
                        }
                    }
                    var previewItems: [PreviewItem] = []
                    for (name, maskedImage) in maskedImagesTemp {
                        let previewItem = PreviewItem(category: name, image: maskedImage)
                        previewItems.append(previewItem)
                    }
                    completion(previewItems)
                } else {
                    completion([])
                }
            }
            let handler = VNImageRequestHandler(cgImage: cgImage)
            do {
                try handler.perform([request])
            } catch {
                print("Failed to perform request: \(error.localizedDescription)")
                completion([])
            }
        } catch {
            print("Error loading model or creating VNCoreMLModel: \(error.localizedDescription)")
            completion([])
        }
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

struct ModelTestView_Previews: PreviewProvider {
    static var previews: some View {
        ModelTestView().environmentObject(WardrobeManager.shared)
    }
}
