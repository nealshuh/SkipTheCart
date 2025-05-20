import SwiftUI

struct PendingItemsView: View {
    @EnvironmentObject var processingManager: ProcessingManager
    @State private var selectedItemIds: Set<UUID> = []
    @State private var showUnknownColorAlert = false
    @Environment(\.dismiss) var dismiss
    let selectableColors = ["white", "black", "gray", "yellow", "red", "blue", "green", "brown", "pink", "orange", "purple", "multicolor"]

    var body: some View {
        if processingManager.isProcessing {
            VStack {
                Text("Processing images...")
                    .font(.headline)
                if processingManager.currentBatchSize > 0 {
                    ProgressView(value: Double(processingManager.processedInBatch), total: Double(processingManager.currentBatchSize))
                        .padding()
                } else {
                    ProgressView()
                        .padding()
                }
            }
        } else {
            ScrollView {
                VStack {
                    Text("• Tap to select (blue border)\n• Tap color to change\n• 'Unknown color'? Pick one\n• All items need a color to save")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .padding()
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 20) {
                        ForEach(processingManager.pendingItems) { item in
                            PendingItemView(item: item, selectedItemIds: $selectedItemIds, selectableColors: selectableColors)
                        }
                    }
                    .padding()
                    if hasSelectedItemsWithUnknownColor {
                        Text("Please assign a color to all selected items.")
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(.top, 5)
                    }
                    Button("Add Selected to Wardrobe") {
                        addSelectedToWardrobe()
                    }
                    .primaryButtonStyle()
                    .padding()
                    .disabled(selectedItemIds.isEmpty || hasSelectedItemsWithUnknownColor)
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

    private var hasSelectedItemsWithUnknownColor: Bool {
        processingManager.pendingItems.contains { item in
            selectedItemIds.contains(item.id) && item.colorLabel == "unknown color"
        }
    }

    private func addSelectedToWardrobe() {
        let selectedItems = processingManager.pendingItems.filter { selectedItemIds.contains($0.id) }
        if hasSelectedItemsWithUnknownColor {
            showUnknownColorAlert = true
        } else {
            let wardrobeItems = selectedItems.map { item in
                WardrobeItem(
                    image: item.image,
                    categoryName: item.category,
                    colorLabel: item.colorLabel,
                    originalImageFilename: item.originalImageFilename,
                    boundingBox: item.boundingBox
                )
            }
            WardrobeManager.shared.addItems(wardrobeItems)
            processingManager.pendingItems = []
            selectedItemIds = []
            dismiss()
        }
    }
}

struct PendingItemView: View {
    let item: PreviewItem
    @Binding var selectedItemIds: Set<UUID>
    let selectableColors: [String]
    @EnvironmentObject var processingManager: ProcessingManager

    var body: some View {
        VStack {
            Image(uiImage: item.image)
                .resizable()
                .scaledToFit()
                .frame(width: 100, height: 100)
                .border(selectedItemIds.contains(item.id) ? Color.blue : Color.clear, width: 2)
            Text(item.category)
                .font(.caption)
            Menu {
                ForEach(selectableColors, id: \.self) { color in
                    Button(color) {
                        if let index = processingManager.pendingItems.firstIndex(where: { $0.id == item.id }) {
                            processingManager.pendingItems[index].colorLabel = color
                        }
                    }
                }
            } label: {
                Label(item.colorLabel, systemImage: "paintbrush")
                    .padding(5)
                    .background(RoundedRectangle(cornerRadius: 5).fill(Color.gray.opacity(0.2)))
                    .font(.caption)
                    .foregroundColor(item.colorLabel == "unknown color" ? .red : .black)
            }
        }
        .onTapGesture {
            if selectedItemIds.contains(item.id) {
                selectedItemIds.remove(item.id)
            } else {
                selectedItemIds.insert(item.id)
            }
        }
    }
}
