import SwiftUI
import UIKit

struct WardrobeView: View {
    @ObservedObject private var wardrobeManager = WardrobeManager.shared
    @State private var selectedCategory: String = ""
    @State private var showDeleteConfirmation = false
    @State private var itemToDelete: UUID? = nil
    @State private var showActionSheet = false
    @State private var showModelTestView = false
    @State private var selectedItem: WardrobeItem? = nil

    let categories = ["Tops", "Bottoms", "Dresses", "Skirts"]

    // Function to get the singular form of the category
    func singularCategory(_ category: String) -> String {
        switch category {
        case "Tops": return "top"
        case "Bottoms": return "bottom"
        case "Dresses": return "dress"
        case "Skirts": return "skirt"
        default: return category.lowercased()
        }
    }

    // Computed property to generate items with unique display names
    var itemsWithDisplayNames: [(item: WardrobeItem, displayName: String)] {
        // Group items by their color and category
        var groupedItems: [String: [WardrobeItem]] = [:]
        for item in wardrobeManager.items {
            let key = "\(item.colorLabel)-\(item.categoryName)"
            groupedItems[key, default: []].append(item)
        }
        
        // Sort each group by dateAdded and assign numbers
        var displayNames: [UUID: String] = [:]
        for (key, items) in groupedItems {
            let sortedItems = items.sorted { $0.dateAdded < $1.dateAdded }
            for (index, item) in sortedItems.enumerated() {
                let baseName = "\(item.colorLabel) \(singularCategory(item.categoryName))"
                let displayName = index == 0 ? baseName : "\(baseName) (\(index + 1))"
                displayNames[item.id] = displayName
            }
        }
        
        // Create the list of (item, displayName) tuples
        return wardrobeManager.items.map { item in
            (item, displayNames[item.id] ?? "\(item.colorLabel) \(singularCategory(item.categoryName))")
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
                VStack(spacing: 0) {
                    // Header
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
                    // Category Filter
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
                    // Wardrobe Content
                    if wardrobeManager.items.isEmpty {
                        emptyStateView
                    } else {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 0) {
                                if selectedCategory.isEmpty {
                                    ForEach(categories, id: \.self) { category in
                                        SectionHeaderView(title: category)
                                        let categoryItems = itemsInCategory(category)
                                        ForEach(categoryItems, id: \.item.id) { itemTuple in
                                            ItemRowView(
                                                item: itemTuple.item,
                                                displayName: itemTuple.displayName,
                                                onTap: { selectedItem = itemTuple.item },
                                                onDelete: {
                                                    itemToDelete = itemTuple.item.id
                                                    showDeleteConfirmation = true
                                                }
                                            )
                                        }
                                    }
                                } else {
                                    SectionHeaderView(title: selectedCategory)
                                    let categoryItems = filteredItems
                                    ForEach(categoryItems, id: \.item.id) { itemTuple in
                                        ItemRowView(
                                            item: itemTuple.item,
                                            displayName: itemTuple.displayName,
                                            onTap: { selectedItem = itemTuple.item },
                                            onDelete: {
                                                itemToDelete = itemTuple.item.id
                                                showDeleteConfirmation = true
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .sheet(item: $selectedItem) { item in
                Image(uiImage: item.image)
                    .resizable()
                    .scaledToFit()
            }
            .actionSheet(isPresented: $showActionSheet) {
                ActionSheet(
                    title: Text("Add Item"),
                    buttons: [
                        .default(Text("Select from library")) {
                            showModelTestView = true
                        },
                        .default(Text("Use camera")) {
                            print("Camera option selected")
                        },
                        .cancel()
                    ]
                )
            }
            .sheet(isPresented: $showModelTestView) {
                ModelTestView()
                    .environmentObject(wardrobeManager)
            }
            .alert(isPresented: $showDeleteConfirmation) {
                Alert(
                    title: Text("Delete Item"),
                    message: Text("Are you sure you want to remove this item from your wardrobe?"),
                    primaryButton: .destructive(Text("Delete")) {
                        if let id = itemToDelete {
                            wardrobeManager.removeItem(withID: id)
                        }
                    },
                    secondaryButton: .cancel()
                )
            }
        }
    }

    // Empty state view
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

    // Data Helpers
    private var filteredItems: [(item: WardrobeItem, displayName: String)] {
        if selectedCategory.isEmpty {
            return itemsWithDisplayNames
        } else {
            return itemsWithDisplayNames.filter { $0.item.categoryName == selectedCategory }
        }
    }

    private func itemsInCategory(_ category: String) -> [(item: WardrobeItem, displayName: String)] {
        return itemsWithDisplayNames.filter { $0.item.categoryName == category }
    }
}

// Section Header View
struct SectionHeaderView: View {
    let title: String
    var body: some View {
        Text(title)
            .font(.headline)
            .padding(.leading)
            .padding(.top, 10)
    }
}

// Item Row View (Updated to accept displayName)
struct ItemRowView: View {
    let item: WardrobeItem
    let displayName: String
    let onTap: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                Text(displayName)
                Spacer()
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(8)
        }
        .contextMenu {
            Button("Delete", role: .destructive) {
                onDelete()
            }
        }
    }
}

// Category Button Component
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

struct WardrobeView_Previews: PreviewProvider {
    static var previews: some View {
        WardrobeView()
    }
}
