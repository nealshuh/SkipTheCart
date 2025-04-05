//
//  WardrobeView.swift
//  SkipTheCart
//
//  Created on 3/16/25.
//

import SwiftUI
import UIKit

struct WardrobeView: View {
    @ObservedObject private var wardrobeManager = WardrobeManager.shared
    @State private var selectedCategory: String = ""
    @State private var showingCategoryPicker = false
    @State private var showDeleteConfirmation = false
    @State private var itemToDelete: UUID? = nil
    @State private var showImagePicker = false
    @State private var selectedImage: UIImage?
    @State private var isImagePickerCompleted = false // Track if picker completed
    
    // Grid layout with 3 items per row
    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]
    
    let categories = ["Tops", "Bottoms", "Jackets"]
    
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
                            showImagePicker = true
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
                    if wardrobeItems.isEmpty {
                        // Empty state
                        emptyStateView
                    } else {
                        // Wardrobe items with appropriate layout based on filter
                        if selectedCategory.isEmpty {
                            // "All" tab with categorized sections
                            categorizedItemsView
                        } else {
                            // Specific category with grid layout
                            filteredItemsGridView
                        }
                    }
                }
            }
            .navigationBarHidden(true)
            .fullScreenCover(isPresented: $showImagePicker) {
                ImagePickerWithCategory(
                    onComplete: { image, category in
                        if let image = image, !category.isEmpty {
                            // Create and add new wardrobe item
                            let newItem = WardrobeItem(
                                image: image,
                                categoryName: category
                            )
                            wardrobeManager.addItems([newItem])
                        }
                    }
                )
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
    
    // MARK: - View Components
    
    // Empty state view when no items exist
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
                showImagePicker = true
            }) {
                Label("Add Items", systemImage: "plus")
            }
            .primaryButtonStyle()
            .padding(.horizontal, 60)
            .padding(.top, AppStyles.Spacing.large)
            
            Spacer()
        }
    }
    
    // Grid view for a specific category
    private var filteredItemsGridView: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(filteredItems) { item in
                    SquareItemView(item: item) {
                        itemToDelete = item.id
                        showDeleteConfirmation = true
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 24)
        }
    }
    
    // Categorized view for "All" tab
    private var categorizedItemsView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Create a section for each category that has items
                ForEach(categoriesWithItems, id: \.self) { category in
                    VStack(alignment: .leading, spacing: 10) {
                        // Category header
                        Text("\(category)")
                            .font(AppStyles.Typography.heading)
                            .foregroundColor(AppStyles.Colors.text)
                            .padding(.leading, 16)
                        
                        // Items grid for this category
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(itemsInCategory(category)) { item in
                                SquareItemView(item: item) {
                                    itemToDelete = item.id
                                    showDeleteConfirmation = true
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                }
            }
            .padding(.top, 16)
            .padding(.bottom, 24)
        }
    }
    
    // MARK: - Data Helpers
    
    // Get all wardrobe items
    private var wardrobeItems: [WardrobeItem] {
        return wardrobeManager.items
    }
    
    // Get items filtered by selected category
    private var filteredItems: [WardrobeItem] {
        if selectedCategory.isEmpty {
            return wardrobeItems
        } else {
            return wardrobeItems.filter { $0.categoryName == selectedCategory }
        }
    }
    
    // Get list of categories that contain items
    private var categoriesWithItems: [String] {
        // Get unique category names from items
        let categoriesWithContent = Set(wardrobeItems.map { $0.categoryName })
        
        // Sort categories in predetermined order (using categories array)
        return categories.filter { categoriesWithContent.contains($0) }
    }
    
    // Get items for a specific category
    private func itemsInCategory(_ category: String) -> [WardrobeItem] {
        return wardrobeItems.filter { $0.categoryName == category }
    }
}

// MARK: - Combined ImagePicker and Category Selection
struct ImagePickerWithCategory: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedImage: UIImage?
    @State private var selectedCategory: String = ""
    @State private var showImagePicker = true
    @State private var showError = false
    @State private var errorMessage = ""
    
    let categories = ["Tops", "Bottoms", "Jackets"]
    let onComplete: (UIImage?, String) -> Void
    
    var body: some View {
        ZStack {
            // Background
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            
            if selectedImage == nil {
                // Show nothing while image picker is active
                Color.clear
                    .sheet(isPresented: $showImagePicker) {
                        StandardImagePicker(selectedImage: $selectedImage)
                            .onDisappear {
                                if selectedImage == nil {
                                    // If user cancelled image picker, dismiss the entire view
                                    dismiss()
                                }
                            }
                    }
            } else {
                // Show category selection once we have an image
                categorySelectionView
            }
        }
    }
    
    // Category selection view
    private var categorySelectionView: some View {
        VStack(spacing: AppStyles.Spacing.large) {
            // Title
            Text("Categorize Your Item")
                .font(AppStyles.Typography.heading)
                .foregroundColor(AppStyles.Colors.text)
                .padding(.top)
            
            // Image preview
            if let image = selectedImage {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 200)
                    .cornerRadius(AppStyles.Layout.cornerRadius)
                    .padding()
            }
            
            // Instruction text
            Text("Select a category for this item")
                .font(AppStyles.Typography.body)
                .foregroundColor(AppStyles.Colors.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            // Category selection
            VStack(alignment: .leading, spacing: AppStyles.Spacing.medium) {
                ForEach(categories, id: \.self) { category in
                    Button(action: {
                        selectedCategory = category
                    }) {
                        HStack {
                            Text(category)
                                .font(AppStyles.Typography.body)
                                .foregroundColor(AppStyles.Colors.text)
                            
                            Spacer()
                            
                            if selectedCategory == category {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(AppStyles.Colors.primary)
                            }
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: AppStyles.Layout.smallCornerRadius)
                                .fill(AppStyles.Colors.secondaryBackground)
                        )
                    }
                }
            }
            .padding(.horizontal)
            
            Spacer()
            
            // Action buttons
            HStack(spacing: AppStyles.Spacing.medium) {
                Button(action: {
                    // Cancel
                    onComplete(nil, "")
                    dismiss()
                }) {
                    Text("Cancel")
                }
                .secondaryButtonStyle()
                
                Button(action: {
                    if !selectedCategory.isEmpty {
                        // Complete with selected image and category
                        onComplete(selectedImage, selectedCategory)
                        dismiss()
                    } else {
                        // Show error if no category selected
                        showErrorMessage("Please select a category")
                    }
                }) {
                    Text("Add to Wardrobe")
                }
                .primaryButtonStyle()
                .disabled(selectedCategory.isEmpty)
            }
            .padding()
        }
        .navigationBarHidden(true)
        .background(AppStyles.Colors.background.edgesIgnoringSafeArea(.all))
        // Error message
        .overlay(
            Group {
                if showError {
                    VStack {
                        Spacer()
                        
                        Text(errorMessage)
                            .font(AppStyles.Typography.body)
                            .foregroundColor(.white)
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: AppStyles.Layout.smallCornerRadius)
                                    .fill(AppStyles.Colors.error)
                            )
                            .padding()
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                            .onAppear {
                                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                    withAnimation {
                                        showError = false
                                    }
                                }
                            }
                    }
                }
            }
        )
    }
    
    private func showErrorMessage(_ message: String) {
        errorMessage = message
        withAnimation {
            showError = true
        }
    }
}

// MARK: - Standard UIKit Image Picker
struct StandardImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let parent: StandardImagePicker
        
        init(_ parent: StandardImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.selectedImage = image
            }
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

// MARK: - Square Item View
// Redesigned item view with square format
struct SquareItemView: View {
    let item: WardrobeItem
    let onLongPress: () -> Void
    
    @State private var isShowingDeleteButton = false
    
    var body: some View {
        VStack(alignment: .center, spacing: 4) {
            // Square image container
            ZStack {
                // Background for consistent square shape
                Rectangle()
                    .fill(Color.gray.opacity(0.1))
                    .aspectRatio(1, contentMode: .fit) // Force square aspect ratio
                
                // Image centered and scaled to fill the square
                Image(uiImage: item.image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: UIScreen.main.bounds.width / 3 - 22, height: UIScreen.main.bounds.width / 3 - 22)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                
                // Delete button - shows when user taps the image
                if isShowingDeleteButton {
                    VStack {
                        HStack {
                            Spacer()
                            
                            Button(action: {
                                onLongPress()
                            }) {
                                Image(systemName: "trash.circle.fill")
                                    .font(.system(size: 28))
                                    .foregroundColor(.white)
                                    .background(
                                        Circle()
                                            .fill(Color.red.opacity(0.8))
                                            .frame(width: 28, height: 28)
                                    )
                                    .shadow(color: Color.black.opacity(0.3), radius: 2, x: 0, y: 1)
                            }
                            .padding(6)
                        }
                        
                        Spacer()
                    }
                }
            }
            .frame(width: UIScreen.main.bounds.width / 3 - 22, height: UIScreen.main.bounds.width / 3 - 22) // Fixed size
            .cornerRadius(10)
            .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
            .contentShape(Rectangle())
            .onTapGesture {
                // Toggle delete button visibility
                withAnimation(.easeInOut(duration: 0.2)) {
                    isShowingDeleteButton.toggle()
                }
                
                // Auto-hide after 3 seconds if showing
                if isShowingDeleteButton {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            isShowingDeleteButton = false
                        }
                    }
                }
            }
            .onLongPressGesture {
                onLongPress()
            }
            // Additional tap area below the image for deleting (optional)
            if isShowingDeleteButton {
                Button(action: {
                    onLongPress()
                }) {
                    Text("Delete")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.red)
                        .padding(.vertical, 2)
                }
                .transition(.opacity)
            }
        }
    }
}

// MARK: - Category Button Component
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
