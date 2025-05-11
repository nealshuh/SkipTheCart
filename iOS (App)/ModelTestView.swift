import SwiftUI
import PhotosUI

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
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var wardrobeManager: WardrobeManager
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var previewItems: [PreviewItem] = []
    @State private var selectedPreviewItems: Set<UUID> = []
    @State private var isProcessing: Bool = false
    @State private var currentProcessingIndex: Int = 0
    @State private var totalImages: Int = 0
    @State private var showUnknownColorAlert = false
    @State private var isInstructionsExpanded = true // State for collapsible instructions

    private let clothingModelAPI = ClothingModelAPI()
    let selectableColors = ["white", "black", "gray", "yellow", "red", "blue", "green", "brown", "pink", "orange", "purple", "multicolor"]

    var body: some View {
        ZStack {
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            ScrollView {
                VStack(spacing: AppStyles.Spacing.large) {
                    instructionSection
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
                        dismiss()
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

    // MARK: - Instruction Section
    private var instructionSection: some View {
        DisclosureGroup(
            isExpanded: $isInstructionsExpanded,
            content: {
                VStack(alignment: .leading, spacing: AppStyles.Spacing.small) {
                    Image("uploadpic")
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, AppStyles.Spacing.medium)
                    Text("Follow these steps to ensure your images are processed accurately.")
                        .font(AppStyles.Typography.body)
                        .foregroundColor(AppStyles.Colors.secondaryText)
                }
            },
            label: {
                Text("How to Upload Pictures Correctly")
                    .font(AppStyles.Typography.heading)
                    .foregroundColor(AppStyles.Colors.text)
            }
        )
        .padding()
        .background(AppStyles.Colors.secondaryBackground)
        .cornerRadius(AppStyles.Layout.cornerRadius)
        .padding(.horizontal, AppStyles.Spacing.medium)
        .accessibilityLabel("Instructions for uploading pictures correctly")
    }

    // MARK: - Photos Picker View
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

    // MARK: - Content View
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

    // MARK: - Processing View
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

    // MARK: - Instructions View
    private var instructionsView: some View {
        Text("• Tap to select (👆 blue border)\n• Tap color to change 🎨\n• 'Unknown color'? Pick one\n• All items need a color to save ✅")
            .font(AppStyles.Typography.body)
            .foregroundColor(AppStyles.Colors.secondaryText)
            .multilineTextAlignment(.leading)
            .padding(.horizontal, AppStyles.Spacing.medium)
            .padding(.top, AppStyles.Spacing.medium)
    }

    // MARK: - Grid View
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

    // MARK: - Unknown Color Warning View
    private var unknownColorWarningView: some View {
        Text("Please assign a color to all selected items.")
            .font(.caption)
            .foregroundColor(.red)
            .padding(.top, 5)
    }

    // MARK: - Add Button View
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
            dismiss()
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

    // MARK: - Empty State View
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

    // MARK: - Helper Properties
    private var hasSelectedItemsWithUnknownColor: Bool {
        previewItems.contains { item in
            selectedPreviewItems.contains(item.id) && item.colorLabel == "unknown color"
        }
    }

    // MARK: - Image Processing
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
                
                do {
                    let processedItems = try await clothingModelAPI.processImage(originalImage, originalFilename: originalFilename, originalSize: originalSize)
                    self.previewItems.append(contentsOf: processedItems)
                } catch {
                    print("Error processing image: \(error)")
                }
            }
            self.currentProcessingIndex += 1
        }
        isProcessing = false
    }
}
