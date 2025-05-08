import SwiftUI
import PhotosUI
import CoreML
import Vision

struct ColorLabel {
    let name: String
    let color: UIColor
}

struct PreviewItem: Identifiable {
    let id = UUID()
    let category: String
    let image: UIImage
    let color: UIColor
    var colorLabel: String
    let originalImageFilename: String
    let boundingBox: CGRect
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
    @State private var showUnknownColorAlert = false

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

    let selectableColors = ["white", "black", "gray", "yellow", "red", "blue", "green", "brown", "pink", "orange", "purple", "multicolor"]

    private struct ColorRange {
        let lowerH: CGFloat
        let upperH: CGFloat
        let lowerS: CGFloat
        let upperS: CGFloat
        let lowerV: CGFloat
        let upperV: CGFloat
    }

    private let colorRanges: [(name: String, range: ColorRange)] = [
        (name: "white", range: ColorRange(lowerH: 0 * 2, upperH: 179 * 2, lowerS: 0.0 / 255.0, upperS: 18.0 / 255.0, lowerV: 231.0 / 255.0, upperV: 255.0 / 255.0)),
        (name: "black", range: ColorRange(lowerH: 0 * 2, upperH: 179 * 2, lowerS: 0.0 / 255.0, upperS: 255.0 / 255.0, lowerV: 0.0 / 255.0, upperV: 30.0 / 255.0)),
        (name: "gray", range: ColorRange(lowerH: 0 * 2, upperH: 179 * 2, lowerS: 0.0 / 255.0, upperS: 18.0 / 255.0, lowerV: 40.0 / 255.0, upperV: 230.0 / 255.0)),
        (name: "yellow", range: ColorRange(lowerH: 25 * 2, upperH: 35 * 2, lowerS: 50.0 / 255.0, upperS: 255.0 / 255.0, lowerV: 70.0 / 255.0, upperV: 255.0 / 255.0)),
        (name: "red", range: ColorRange(lowerH: 0 * 2, upperH: 9 * 2, lowerS: 50.0 / 255.0, upperS: 255.0 / 255.0, lowerV: 70.0 / 255.0, upperV: 255.0 / 255.0)),
        (name: "red", range: ColorRange(lowerH: 159 * 2, upperH: 179 * 2, lowerS: 50.0 / 255.0, upperS: 255.0 / 255.0, lowerV: 70.0 / 255.0, upperV: 255.0 / 255.0)),
        (name: "blue", range: ColorRange(lowerH: 90 * 2, upperH: 128 * 2, lowerS: 50.0 / 255.0, upperS: 255.0 / 255.0, lowerV: 70.0 / 255.0, upperV: 255.0 / 255.0)),
        (name: "green", range: ColorRange(lowerH: 36 * 2, upperH: 89 * 2, lowerS: 50.0 / 255.0, upperS: 255.0 / 255.0, lowerV: 70.0 / 255.0, upperV: 255.0 / 255.0)),
        (name: "brown", range: ColorRange(lowerH: 10 * 2, upperH: 20 * 2, lowerS: 100.0 / 255.0, upperS: 255.0 / 255.0, lowerV: 20.0 / 255.0, upperV: 200.0 / 255.0)),
        (name: "pink", range: ColorRange(lowerH: 160 * 2, upperH: 179 * 2, lowerS: 20.0 / 255.0, upperS: 100.0 / 255.0, lowerV: 180.0 / 255.0, upperV: 255.0 / 255.0)),
        (name: "orange", range: ColorRange(lowerH: 10 * 2, upperH: 24 * 2, lowerS: 50.0 / 255.0, upperS: 255.0 / 255.0, lowerV: 70.0 / 255.0, upperV: 255.0 / 255.0)),
        (name: "purple", range: ColorRange(lowerH: 129 * 2, upperH: 158 * 2, lowerS: 50.0 / 255.0, upperS: 255.0 / 255.0, lowerV: 70.0 / 255.0, upperV: 255.0 / 255.0))
    ]

    var body: some View {
        NavigationView {
            ZStack {
                AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
                ScrollView {
                    VStack(spacing: AppStyles.Spacing.large) {
                        photosPickerView
                        contentView
                        Spacer()
                    }
                    .padding(.bottom, AppStyles.Spacing.xlarge)
                }
                .navigationTitle("Upload")
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
            .alert(isPresented: $showUnknownColorAlert) {
                Alert(
                    title: Text("Invalid Color Selection"),
                    message: Text("Please choose a valid color for all selected items before adding to wardrobe."),
                    dismissButton: .default(Text("OK"))
                )
            }
        }
    }

    private var photosPickerView: some View {
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
    }

    private var contentView: some View {
        Group {
            if isProcessing {
                processingView
            } else if !previewItems.isEmpty {
                VStack(spacing: AppStyles.Spacing.medium) {
                    instructionsView
                    gridView
                    if hasSelectedItemsWithUnknownColor {
                        unknownColorWarningView
                    }
                    addButtonView
                }
            } else {
                emptyStateView
            }
        }
    }

    private var processingView: some View {
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
    }

    private var instructionsView: some View {
        Text("• Tap to select (👆 blue border)\n• Tap color to change 🎨\n• 'Unknown color'? Pick one\n• All items need a color to save ✅")
                .font(AppStyles.Typography.body)
                .foregroundColor(AppStyles.Colors.secondaryText)
                .multilineTextAlignment(.leading)
                .padding(.horizontal, AppStyles.Spacing.medium)
                .padding(.top, AppStyles.Spacing.medium)
    }

    private var gridView: some View {
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
                        Menu {
                            ForEach(selectableColors, id: \.self) { color in
                                Button(color) {
                                    if let index = previewItems.firstIndex(where: { $0.id == item.id }) {
                                        previewItems[index].colorLabel = color
                                    }
                                }
                            }
                        } label: {
                            Label(item.colorLabel, systemImage: "paintbrush")
                                .padding(5)
                                .background(RoundedRectangle(cornerRadius: 5).fill(Color.gray.opacity(0.2)))
                                .font(AppStyles.Typography.caption)
                                .foregroundColor(item.colorLabel == "unknown color" ? .red : AppStyles.Colors.text)
                                .accessibilityLabel("Change color for \(item.category), currently \(item.colorLabel)")
                        }
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
    }

    private var unknownColorWarningView: some View {
        Text("Please assign a color to all selected items.")
            .font(.caption)
            .foregroundColor(.red)
            .padding(.top, 5)
    }

    private var addButtonView: some View {
        Button(action: {
            print("Adding \(selectedPreviewItems.count) items")
            let selected = previewItems.filter { selectedPreviewItems.contains($0.id) }
            for item in selected {
                let wardrobeItem = WardrobeItem(
                    image: item.image,
                    categoryName: item.category,
                    colorLabel: item.colorLabel,
                    originalImageFilename: item.originalImageFilename,
                    boundingBox: item.boundingBox
                )
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
        .disabled(selectedPreviewItems.isEmpty || hasSelectedItemsWithUnknownColor)
        .onTapGesture {
            if hasSelectedItemsWithUnknownColor {
                showUnknownColorAlert = true
            }
        }
    }

    private var emptyStateView: some View {
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

    private var hasSelectedItemsWithUnknownColor: Bool {
        previewItems.contains { item in
            selectedPreviewItems.contains(item.id) && item.colorLabel == "unknown color"
        }
    }

    private func processSelectedItems(_ items: [PhotosPickerItem]) async {
        previewItems = []
        totalImages = items.count
        currentProcessingIndex = 0
        isProcessing = true
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let originalImage = UIImage(data: data) {
                let originalFilename = "original_\(UUID().uuidString).jpg"
                let originalSize = originalImage.size
                WardrobeManager.shared.saveImage(originalImage, filename: originalFilename)
                
                let resizedImage = resizeImage(originalImage, to: CGSize(width: 512, height: 512))
                if let resizedImage = resizedImage {
                    let processedItems = await withCheckedContinuation { continuation in
                        processImage(resizedImage, originalFilename: originalFilename, originalSize: originalSize) { previewItems in
                            continuation.resume(returning: previewItems)
                        }
                    }
                    self.previewItems.append(contentsOf: processedItems)
                }
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

    func processImage(_ image: UIImage, originalFilename: String, originalSize: CGSize, completion: @escaping ([PreviewItem]) -> Void) {
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
                    let uniqueLabels = Set(labels.flatMap { $0 }).intersection(self.includedLabels)
                    var previewItems: [PreviewItem] = []
                    let scaleX = originalSize.width / CGFloat(width)
                    let scaleY = originalSize.height / CGFloat(height)
                    for label in uniqueLabels {
                        if let name = self.labelNames[label] {
                            var minX = width, minY = height, maxX = 0, maxY = 0
                            for i in 0..<height {
                                for j in 0..<width {
                                    if labels[i][j] == label {
                                        minX = min(minX, j)
                                        minY = min(minY, i)
                                        maxX = max(maxX, j)
                                        maxY = max(maxY, i)
                                    }
                                }
                            }
                            if minX <= maxX && minY <= maxY {
                                let boundingBoxResized = CGRect(x: CGFloat(minX), y: CGFloat(minY), width: CGFloat(maxX - minX + 1), height: CGFloat(maxY - minY + 1))
                                let boundingBoxOriginal = CGRect(x: boundingBoxResized.origin.x * scaleX, y: boundingBoxResized.origin.y * scaleY, width: boundingBoxResized.size.width * scaleX, height: boundingBoxResized.size.height * scaleY)
                                let maskedImage = self.createMaskedImage(labels: labels, width: width, height: height, for: label, originalImage: image)
                                if let maskedImage = maskedImage {
                                    let (color, colorLabel) = self.getDominantColorAndLabelFromMaskedImage(maskedImage)
                                    let previewItem = PreviewItem(category: name, image: maskedImage, color: color, colorLabel: colorLabel, originalImageFilename: originalFilename, boundingBox: boundingBoxOriginal)
                                    previewItems.append(previewItem)
                                }
                            }
                        }
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

    func getDominantColorAndLabelFromMaskedImage(_ image: UIImage) -> (color: UIColor, label: String) {
        guard let cgImage = image.cgImage else { return (UIColor.gray, "unknown color") }
        let width = cgImage.width
        let height = cgImage.height
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bytesPerPixel = 4
        let bytesPerRow = bytesPerPixel * width
        let bitsPerComponent = 8
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue
        guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: bitsPerComponent, bytesPerRow: bytesPerRow, space: colorSpace, bitmapInfo: bitmapInfo),
              let data = context.data else {
            return (UIColor.gray, "unknown color")
        }
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        let buffer = data.bindMemory(to: UInt8.self, capacity: width * height * bytesPerPixel)
        var totalR: CGFloat = 0, totalG: CGFloat = 0, totalB: CGFloat = 0
        var pixelCount = 0
        
        for y in 0..<height {
            for x in 0..<width {
                let offset = (y * width + x) * bytesPerPixel
                let alpha = CGFloat(buffer[offset + 3]) / 255.0
                if alpha > 0 {
                    let r = CGFloat(buffer[offset]) / 255.0
                    let g = CGFloat(buffer[offset + 1]) / 255.0
                    let b = CGFloat(buffer[offset + 2]) / 255.0
                    totalR += r
                    totalG += g
                    totalB += b
                    pixelCount += 1
                }
            }
        }
        
        if pixelCount == 0 { return (UIColor.gray, "unknown color") }
        
        let avgR = totalR / CGFloat(pixelCount)
        let avgG = totalG / CGFloat(pixelCount)
        let avgB = totalB / CGFloat(pixelCount)
        let color = UIColor(red: avgR, green: avgG, blue: avgB, alpha: 1.0)
        
        var (h, s, v): (CGFloat, CGFloat, CGFloat) = (0, 0, 0)
        color.getHue(&h, saturation: &s, brightness: &v, alpha: nil)
        h *= 360
        
        for (name, range) in colorRanges {
            if (range.lowerH <= h && h <= range.upperH) || (range.lowerH > range.upperH && (h >= range.lowerH || h <= range.upperH)) {
                if range.lowerS <= s && s <= range.upperS && range.lowerV <= v && v <= range.upperV {
                    return (color, name)
                }
            }
        }
        return (color, "unknown color")
    }

    func createMaskedImage(labels: [[Int]], width: Int, height: Int, for label: Int, originalImage: UIImage) -> UIImage? {
        guard let cgImage = originalImage.cgImage else { return nil }
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bytesPerPixel = 4
        let bytesPerRow = bytesPerPixel * width
        let bitsPerComponent = 8
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue
        
        guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: bitsPerComponent, bytesPerRow: bytesPerRow, space: colorSpace, bitmapInfo: bitmapInfo),
              let data = context.data else {
            return nil
        }
        
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        let buffer = data.bindMemory(to: UInt8.self, capacity: width * height * bytesPerPixel)
        
        for y in 0..<height {
            for x in 0..<width {
                if labels[y][x] != label {
                    let offset = (y * width + x) * bytesPerPixel
                    buffer[offset + 3] = 0
                }
            }
        }
        
        guard let maskedCGImage = context.makeImage() else { return nil }
        return UIImage(cgImage: maskedCGImage, scale: originalImage.scale, orientation: originalImage.imageOrientation)
    }
}
