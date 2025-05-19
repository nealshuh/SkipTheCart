import SwiftUI
import UIKit

struct CategoryButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(AppStyles.Typography.caption)
                .foregroundColor(isSelected ? .white : AppStyles.Colors.primary)
                .padding(.horizontal, AppStyles.Spacing.medium)
                .padding(.vertical, AppStyles.Spacing.small)
                .background(
                    RoundedRectangle(cornerRadius: AppStyles.Layout.smallCornerRadius)
                        .fill(isSelected ? AppStyles.Colors.primary : .clear)
                        .stroke(AppStyles.Colors.primary, lineWidth: isSelected ? 0 : 1)
                )
        }
    }
}

struct CategoryItemsView: View {
    let category: String
    let wardrobeManager: WardrobeManager
    @Binding var selectedItem: WardrobeItem?
    let onDelete: (WardrobeItem) -> Void
    
    private var groupedItems: [String: [WardrobeItem]] {
        let itemsInCategory = wardrobeManager.items.filter { $0.categoryName == category }
        return Dictionary(grouping: itemsInCategory, by: { $0.colorLabel })
    }
    
    private func colorForLabel(_ label: String) -> Color {
        switch label.lowercased() {
        case "red": return .red
        case "blue": return .blue
        case "green": return .green
        case "black": return .black
        case "white": return .white
        case "yellow": return .yellow
        case "purple": return .purple
        case "orange": return .orange
        default: return .gray
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text(category)
                .font(.headline)
                .padding(.leading, 10)
            
            if groupedItems.isEmpty {
                Text("No items in this category")
                    .foregroundColor(.secondary)
                    .padding(.leading, 10)
            } else {
                ForEach(Array(groupedItems.keys).sorted(), id: \.self) { color in
                    VStack(alignment: .leading, spacing: 5) {
                        HStack {
                            Circle()
                                .fill(colorForLabel(color))
                                .frame(width: 10, height: 10)
                            Text("\(color.capitalized) (\(groupedItems[color]!.count))")
                                .font(.subheadline)
                        }
                        .padding(.leading, 10)
                        
                        let columns = [GridItem(.adaptive(minimum: 100), spacing: 10)]
                        LazyVGrid(columns: columns, spacing: 10) {
                            ForEach(groupedItems[color]!, id: \.id) { item in
                                Button(action: {
                                    selectedItem = item
                                }) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(colorForLabel(item.colorLabel).opacity(0.2))
                                        Image(uiImage: getPreviewImage(for: item))
                                            .resizable()
                                            .aspectRatio(contentMode: .fit)
                                            .padding(10)
                                    }
                                    .aspectRatio(1, contentMode: .fit)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                    .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
                                }
                                .contextMenu {
                                    Button("Delete", role: .destructive) {
                                        onDelete(item)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 10)
                    }
                    .padding(.bottom, 20)
                }
            }
        }
    }
    
    private func getPreviewImage(for item: WardrobeItem) -> UIImage {
        if let originalFilename = item.originalImageFilename,
           let x = item.boundingBoxX,
           let y = item.boundingBoxY,
           let width = item.boundingBoxWidth,
           let height = item.boundingBoxHeight,
           let originalImage = wardrobeManager.loadImage(filename: originalFilename) {
            let boundingBox = CGRect(x: x, y: y, width: width, height: height)
            return cropImage(originalImage, to: boundingBox) ?? item.image
        }
        return item.image
    }
    
    private func cropImage(_ image: UIImage, to rect: CGRect) -> UIImage? {
        guard let cgImage = image.cgImage else { return nil }
        let scale = image.scale
        let scaledRect = CGRect(
            x: rect.origin.x * scale,
            y: rect.origin.y * scale,
            width: rect.size.width * scale,
            height: rect.size.height * scale
        )
        guard let croppedCGImage = cgImage.cropping(to: scaledRect) else { return nil }
        return UIImage(cgImage: croppedCGImage, scale: image.scale, orientation: image.imageOrientation)
    }
}

struct WardrobeView: View {
    @EnvironmentObject var processingManager: ProcessingManager
    @ObservedObject private var wardrobeManager = WardrobeManager.shared
    @State private var selectedCategory: String = ""
    @State private var showDeleteConfirmation = false
    @State private var deleteIDs: Set<UUID> = []
    @State private var selectedItem: WardrobeItem?
    @State private var showActionSheet = false
    @State private var navigateToModelTestView = false
    @State private var showPendingItems = false
    @State private var showProcessingCompleteAlert = false
    
    let categories = ["Tops", "Bottoms", "Dresses", "Skirts"]

    func singularCategory(_ category: String) -> String {
        switch category {
        case "Tops": return "top"
        case "Bottoms": return "bottom"
        case "Dresses": return "dress"
        case "Skirts": return "skirt"
        default: return category.lowercased()
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
                VStack(spacing: 0) {
                    HStack {
                        Text("My Wardrobe")
                            .font(AppStyles.Typography.title)
                            .foregroundColor(AppStyles.Colors.text)
                        Spacer()
                        Button(action: {
                            showActionSheet = true
                        }) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(AppStyles.Colors.primary)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top)
                    if processingManager.isProcessing || !processingManager.pendingItems.isEmpty {
                        Button(action: {
                            showPendingItems = true
                        }) {
                            Text(processingManager.isProcessing ? "Processing..." : "Review Processed Items (\(processingManager.pendingItems.count))")
                                .font(AppStyles.Typography.heading)
                                .foregroundColor(.white)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(AppStyles.Colors.primary)
                                .cornerRadius(AppStyles.Layout.cornerRadius)
                        }
                        .padding(.horizontal)
                        .padding(.vertical, AppStyles.Spacing.small)
                    }
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: AppStyles.Spacing.small) {
                            CategoryButton(title: "All", isSelected: selectedCategory.isEmpty) {
                                selectedCategory = ""
                            }
                            ForEach(categories, id: \.self) { category in
                                CategoryButton(title: category, isSelected: selectedCategory == category) {
                                    selectedCategory = category
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.vertical, AppStyles.Spacing.small)
                    }
                    if wardrobeManager.items.isEmpty {
                        emptyStateView
                    } else {
                        ScrollView {
                            if selectedCategory.isEmpty {
                                VStack(alignment: .leading, spacing: 10) {
                                    ForEach(categories, id: \.self) { category in
                                        CategoryItemsView(
                                            category: category,
                                            wardrobeManager: wardrobeManager,
                                            selectedItem: $selectedItem,
                                            onDelete: { item in
                                                deleteIDs = Set([item.id])
                                                showDeleteConfirmation = true
                                            }
                                        )
                                    }
                                }
                                .padding(.vertical, 5)
                            } else {
                                CategoryItemsView(
                                    category: selectedCategory,
                                    wardrobeManager: wardrobeManager,
                                    selectedItem: $selectedItem,
                                    onDelete: { item in
                                        deleteIDs = Set([item.id])
                                        showDeleteConfirmation = true
                                    }
                                )
                                .padding(5)
                            }
                        }
                    }
                }
                NavigationLink(destination: ModelTestView().environmentObject(wardrobeManager), isActive: $navigateToModelTestView) {
                    EmptyView()
                }
            }
            .actionSheet(isPresented: $showActionSheet) {
                ActionSheet(
                    title: Text("Add Item"),
                    buttons: [
                        .default(Text("Select from library")) {
                            navigateToModelTestView = true
                        },
                        .default(Text("Use camera")) {
                            print("Camera option selected")
                        },
                        .cancel()
                    ]
                )
            }
            .sheet(item: $selectedItem) { item in
                NavigationView {
                    VStack(spacing: AppStyles.Spacing.medium) {
                        Text("\(item.colorLabel.capitalized) \(singularCategory(item.categoryName))")
                            .font(AppStyles.Typography.heading)
                            .foregroundColor(AppStyles.Colors.text)
                            .padding(AppStyles.Spacing.small)
                            .background(
                                RoundedRectangle(cornerRadius: AppStyles.Layout.smallCornerRadius)
                                    .fill(AppStyles.Colors.secondaryBackground)
                            )
                            .padding(.top, AppStyles.Spacing.medium)
                        let displayImage: UIImage = {
                            if let originalFilename = item.originalImageFilename,
                               let x = item.boundingBoxX,
                               let y = item.boundingBoxY,
                               let width = item.boundingBoxWidth,
                               let height = item.boundingBoxHeight,
                               let originalImage = wardrobeManager.loadImage(filename: originalFilename) {
                                let boundingBox = CGRect(x: x, y: y, width: width, height: height)
                                return cropImage(originalImage, to: boundingBox) ?? item.image
                            }
                            return item.image
                        }()
                        Image(uiImage: displayImage)
                            .resizable()
                            .scaledToFit()
                            .cardStyle()
                        Spacer()
                    }
                    .padding()
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Done") {
                                selectedItem = nil
                            }
                            .font(AppStyles.Typography.body)
                            .foregroundColor(AppStyles.Colors.primary)
                        }
                    }
                }
            }
            .alert(isPresented: $showDeleteConfirmation) {
                Alert(
                    title: Text("Delete Item\(deleteIDs.count > 1 ? "s" : "")"),
                    message: Text("Are you sure you want to remove \(deleteIDs.count > 1 ? "these items" : "this item") from your wardrobe?"),
                    primaryButton: .destructive(Text("Delete")) {
                        wardrobeManager.removeItems(withIDs: deleteIDs)
                        deleteIDs = []
                        showDeleteConfirmation = false
                    },
                    secondaryButton: .cancel {
                        deleteIDs = []
                        showDeleteConfirmation = false
                    }
                )
            }
            .sheet(isPresented: $showPendingItems) {
                PendingItemsView()
                    .environmentObject(processingManager)
            }
            .alert("Processing Complete", isPresented: $showProcessingCompleteAlert) {
                Button("OK") {}
            } message: {
                Text("Your items are ready to review.")
            }
            .onReceive(processingManager.$isProcessing) { isProcessing in
                if !isProcessing && !processingManager.pendingItems.isEmpty {
                    showProcessingCompleteAlert = true
                }
            }
        }
    }

    private var emptyStateView: some View {
        VStack(spacing: AppStyles.Spacing.medium) {
            Spacer()
            Image(systemName: "tshirt.fill")
                .font(.system(size: 70))
                .foregroundColor(AppStyles.Colors.secondaryText.opacity(0.3))
            Text("Your wardrobe is empty")
                .font(AppStyles.Typography.heading)
                .foregroundColor(AppStyles.Colors.text)
            Text("Add items from your photo library to start comparing with your online shopping")
                .font(AppStyles.Typography.body)
                .foregroundColor(AppStyles.Colors.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Button(action: {
                showActionSheet = true
            }) {
                Label("Add Items", systemImage: "plus")
            }
            .primaryButtonStyle()
            .padding(.horizontal, 60)
            .padding(.top, AppStyles.Spacing.large)
            Spacer()
        }
    }

    private func cropImage(_ image: UIImage, to rect: CGRect) -> UIImage? {
        guard let cgImage = image.cgImage else { return nil }
        let scale = image.scale
        let scaledRect = CGRect(
            x: rect.origin.x * scale,
            y: rect.origin.y * scale,
            width: rect.size.width * scale,
            height: rect.size.height * scale
        )
        guard let croppedCGImage = cgImage.cropping(to: scaledRect) else { return nil }
        return UIImage(cgImage: croppedCGImage, scale: image.scale, orientation: image.imageOrientation)
    }
}

struct WardrobeView_Previews: PreviewProvider {
    static var previews: some View {
        WardrobeView()
            .environmentObject(ProcessingManager.shared)
    }
}

//import SwiftUI
//import UIKit
//
//struct WardrobeView: View {
//    @ObservedObject private var wardrobeManager = WardrobeManager.shared
//    @State private var selectedCategory: String = ""
//    @State private var showDeleteConfirmation = false
//    @State private var deleteIDs: Set<UUID>? = nil
//    @State private var selectedItem: WardrobeItem? = nil
//    @State private var showActionSheet = false
//    @State private var navigateToModelTestView = false // State to trigger navigation
//
//    let categories = ["Tops", "Bottoms", "Dresses", "Skirts"]
//
//    func singularCategory(_ category: String) -> String {
//        switch category {
//        case "Tops": return "top"
//        case "Bottoms": return "bottom"
//        case "Dresses": return "dress"
//        case "Skirts": return "skirt"
//        default: return category.lowercased()
//        }
//    }
//
//    var itemsWithDisplayNames: [(item: WardrobeItem, displayName: String)] {
//        var groupedItems: [String: [WardrobeItem]] = [:]
//        for item in wardrobeManager.items {
//            let key = "\(item.colorLabel)-\(item.categoryName)"
//            groupedItems[key, default: []].append(item)
//        }
//        
//        var displayNames: [UUID: String] = [:]
//        for (key, items) in groupedItems {
//            let sortedItems = items.sorted { $0.dateAdded < $1.dateAdded }
//            for (index, item) in sortedItems.enumerated() {
//                let baseName = "\(item.colorLabel.capitalized) \(singularCategory(item.categoryName))"
//                let displayName = index == 0 ? baseName : "\(baseName) (\(index + 1))"
//                displayNames[item.id] = displayName
//            }
//        }
//        
//        return wardrobeManager.items.map { item in
//            (item, displayNames[item.id] ?? "\(item.colorLabel.capitalized) \(singularCategory(item.categoryName))")
//        }
//    }
//
//    var body: some View {
//        NavigationView {
//            ZStack {
//                AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
//                VStack(spacing: 0) {
//                    HStack {
//                        Text("My Wardrobe")
//                            .font(AppStyles.Typography.title)
//                            .foregroundColor(AppStyles.Colors.text)
//                        Spacer()
//                        Button(action: {
//                            showActionSheet = true
//                        }) {
//                            Image(systemName: "plus.circle.fill")
//                                .font(.system(size: 24))
//                                .foregroundColor(AppStyles.Colors.primary)
//                        }
//                    }
//                    .padding(.horizontal)
//                    .padding(.top)
//                    ScrollView(.horizontal, showsIndicators: false) {
//                        HStack(spacing: AppStyles.Spacing.small) {
//                            CategoryButton(title: "All", isSelected: selectedCategory.isEmpty) {
//                                selectedCategory = ""
//                            }
//                            ForEach(categories, id: \.self) { category in
//                                CategoryButton(title: category, isSelected: selectedCategory == category) {
//                                    selectedCategory = category
//                                }
//                            }
//                        }
//                        .padding(.horizontal)
//                        .padding(.vertical, AppStyles.Spacing.small)
//                    }
//                    if wardrobeManager.items.isEmpty {
//                        emptyStateView
//                    } else {
//                        List {
//                            if selectedCategory.isEmpty {
//                                ForEach(categories, id: \.self) { category in
//                                    Section(header: Text(category)) {
//                                        let categoryItems = itemsInCategory(category)
//                                        ForEach(categoryItems, id: \.item.id) { itemTuple in
//                                            ItemRowView(
//                                                item: itemTuple.item,
//                                                displayName: itemTuple.displayName,
//                                                onSelect: { selectedItem = itemTuple.item },
//                                                onDelete: {
//                                                    deleteIDs = Set([itemTuple.item.id])
//                                                    showDeleteConfirmation = true
//                                                }
//                                            )
//                                        }
//                                    }
//                                }
//                            } else {
//                                Section(header: Text(selectedCategory)) {
//                                    let categoryItems = filteredItems
//                                    ForEach(categoryItems, id: \.item.id) { itemTuple in
//                                        ItemRowView(
//                                            item: itemTuple.item,
//                                            displayName: itemTuple.displayName,
//                                            onSelect: { selectedItem = itemTuple.item },
//                                            onDelete: {
//                                                deleteIDs = Set([itemTuple.item.id])
//                                                showDeleteConfirmation = true
//                                            }
//                                        )
//                                    }
//                                }
//                            }
//                        }
//                    }
//                }
//                // NavigationLink to ModelTestView
//                NavigationLink(destination: ModelTestView().environmentObject(wardrobeManager), isActive: $navigateToModelTestView) {
//                    EmptyView()
//                }
//            }
//            .actionSheet(isPresented: $showActionSheet) {
//                ActionSheet(
//                    title: Text("Add Item"),
//                    buttons: [
//                        .default(Text("Select from library")) {
//                            navigateToModelTestView = true // Navigate to ModelTestView
//                        },
//                        .default(Text("Use camera")) {
//                            print("Camera option selected")
//                        },
//                        .cancel()
//                    ]
//                )
//            }
//            .sheet(item: $selectedItem) { item in
//                NavigationView {
//                    VStack(spacing: AppStyles.Spacing.medium) {
//                        Text("\(item.colorLabel.capitalized) \(singularCategory(item.categoryName))")
//                            .font(AppStyles.Typography.heading)
//                            .foregroundColor(AppStyles.Colors.text)
//                            .padding(AppStyles.Spacing.small)
//                            .background(
//                                RoundedRectangle(cornerRadius: AppStyles.Layout.smallCornerRadius)
//                                    .fill(AppStyles.Colors.secondaryBackground)
//                            )
//                            .padding(.top, AppStyles.Spacing.medium)
//                        
//                        let displayImage: UIImage = {
//                            if let originalFilename = item.originalImageFilename,
//                               let x = item.boundingBoxX,
//                               let y = item.boundingBoxY,
//                               let width = item.boundingBoxWidth,
//                               let height = item.boundingBoxHeight,
//                               let originalImage = WardrobeManager.shared.loadImage(filename: originalFilename),
//                               let croppedImage = cropImage(originalImage, to: CGRect(x: x, y: y, width: width, height: height)) {
//                                return croppedImage
//                            } else {
//                                return item.image
//                            }
//                        }()
//                        Image(uiImage: displayImage)
//                            .resizable()
//                            .scaledToFit()
//                            .cardStyle()
//                        Spacer()
//                    }
//                    .padding()
//                    .toolbar {
//                        ToolbarItem(placement: .navigationBarTrailing) {
//                            Button("Done") {
//                                selectedItem = nil
//                            }
//                            .font(AppStyles.Typography.body)
//                            .foregroundColor(AppStyles.Colors.primary)
//                        }
//                    }
//                }
//            }
//            .alert(isPresented: $showDeleteConfirmation) {
//                Alert(
//                    title: Text("Delete Item\(deleteIDs!.count > 1 ? "s" : "")"),
//                    message: Text("Are you sure you want to remove \(deleteIDs!.count > 1 ? "these items" : "this item") from your wardrobe?"),
//                    primaryButton: .destructive(Text("Delete")) {
//                        print("Deleting items: \(deleteIDs!)")
//                        wardrobeManager.removeItems(withIDs: deleteIDs!)
//                        deleteIDs = nil
//                        showDeleteConfirmation = false
//                    },
//                    secondaryButton: .cancel {
//                        deleteIDs = nil
//                        showDeleteConfirmation = false
//                    }
//                )
//            }
//        }
//    }
//
//    private var emptyStateView: some View {
//        VStack(spacing: AppStyles.Spacing.medium) {
//            Spacer()
//            Image(systemName: "tshirt.fill")
//                .font(.system(size: 70))
//                .foregroundColor(AppStyles.Colors.secondaryText.opacity(0.3))
//            Text("Your wardrobe is empty")
//                .font(AppStyles.Typography.heading)
//                .foregroundColor(AppStyles.Colors.text)
//            Text("Add items from your photo library to start comparing with your online shopping")
//                .font(AppStyles.Typography.body)
//                .foregroundColor(AppStyles.Colors.secondaryText)
//                .multilineTextAlignment(.center)
//                .padding(.horizontal, 40)
//            Button(action: {
//                showActionSheet = true
//            }) {
//                Label("Add Items", systemImage: "plus")
//            }
//            .primaryButtonStyle()
//            .padding(.horizontal, 60)
//            .padding(.top, AppStyles.Spacing.large)
//            Spacer()
//        }
//    }
//
//    private var filteredItems: [(item: WardrobeItem, displayName: String)] {
//        if selectedCategory.isEmpty {
//            return itemsWithDisplayNames
//        } else {
//            return itemsWithDisplayNames.filter { $0.item.categoryName == selectedCategory }
//        }
//    }
//
//    private func itemsInCategory(_ category: String) -> [(item: WardrobeItem, displayName: String)] {
//        return itemsWithDisplayNames.filter { $0.item.categoryName == category }
//    }
//
//    func cropImage(_ image: UIImage, to rect: CGRect) -> UIImage? {
//        guard let cgImage = image.cgImage else { return nil }
//        let scale = image.scale
//        let scaledRect = CGRect(
//            x: rect.origin.x * scale,
//            y: rect.origin.y * scale,
//            width: rect.size.width * scale,
//            height: rect.size.height * scale
//        )
//        guard let croppedCGImage = cgImage.cropping(to: scaledRect) else { return nil }
//        return UIImage(cgImage: croppedCGImage, scale: image.scale, orientation: image.imageOrientation)
//    }
//}
//
//struct ItemRowView: View {
//    let item: WardrobeItem
//    let displayName: String
//    let onSelect: () -> Void
//    let onDelete: () -> Void
//
//    var body: some View {
//        HStack {
//            ZStack {
//                HStack {
//                    Text(displayName)
//                    Spacer()
//                }
//            }
//            .contentShape(Rectangle())
//            .onTapGesture {
//                onSelect()
//            }
//            
//            Image(systemName: "xmark")
//                .foregroundColor(Color(red: 0.333, green: 0.333, blue: 0.333))
//                .font(.system(size: 20))
//                .frame(width: 44, height: 44)
//                .onTapGesture {
//                    print("Trash icon tapped for item: \(item.id)")
//                    onDelete()
//                }
//        }
//        .padding()
//        .background(Color.gray.opacity(0.1))
//        .cornerRadius(8)
//        .contextMenu {
//            Button("Delete", role: .destructive) {
//                onDelete()
//            }
//        }
//    }
//}
//
//struct CategoryButton: View {
//    let title: String
//    let isSelected: Bool
//    let action: () -> Void
//
//    var body: some View {
//        Button(action: action) {
//            Text(title)
//                .font(AppStyles.Typography.caption)
//                .foregroundColor(isSelected ? .white : AppStyles.Colors.primary)
//                .padding(.horizontal, AppStyles.Spacing.medium)
//                .padding(.vertical, AppStyles.Spacing.small)
//                .background(
//                    RoundedRectangle(cornerRadius: AppStyles.Layout.smallCornerRadius)
//                        .fill(isSelected ? AppStyles.Colors.primary : .clear)
//                        .stroke(AppStyles.Colors.primary, lineWidth: isSelected ? 0 : 1)
//                )
//        }
//    }
//}
//
//struct WardrobeView_Previews: PreviewProvider {
//    static var previews: some View {
//        WardrobeView()
//    }
//}
