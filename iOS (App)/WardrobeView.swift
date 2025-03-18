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
    
    let categories = ["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"]
    
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
                    
                    // Wardrobe Grid
                    if wardrobeItems.isEmpty {
                        // Empty state
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
                    } else {
                        // Items grid
                        ScrollView {
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppStyles.Spacing.medium) {
                                ForEach(filteredItems) { item in
                                    WardrobeItemView(item: item) {
                                        // Long press action to delete
                                        itemToDelete = item.id
                                        showDeleteConfirmation = true
                                    }
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingCategoryPicker) {
                if let image = selectedImage {
                    CategorySelectionView(
                        image: image,
                        onComplete: { categoryName in
                            // Create and add new wardrobe item
                            let newItem = WardrobeItem(
                                image: image,
                                categoryName: categoryName
                            )
                            wardrobeManager.addItems([newItem])
                            selectedImage = nil
                        },
                        onCancel: {
                            selectedImage = nil
                        }
                    )
                }
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
            .sheet(isPresented: $showImagePicker) {
                ImagePicker(selectedImage: $selectedImage, isPresented: $showImagePicker)
                    .onDisappear {
                        if selectedImage != nil {
                            showingCategoryPicker = true
                        }
                    }
            }
        }
    }
    
    // Use computed properties to get access to the published items
    private var wardrobeItems: [WardrobeItem] {
        return wardrobeManager.items
    }
    
    // Filter items based on selected category
    var filteredItems: [WardrobeItem] {
        if selectedCategory.isEmpty {
            return wardrobeItems
        } else {
            return wardrobeItems.filter { $0.categoryName == selectedCategory }
        }
    }
}

// UIViewControllerRepresentable for UIImagePickerController
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Binding var isPresented: Bool
    
    class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        var parent: ImagePicker
        
        init(parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.selectedImage = image
            }
            parent.isPresented = false
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.isPresented = false
        }
    }
    
    func makeCoordinator() -> Coordinator {
        return Coordinator(parent: self)
    }
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
}

// Category button component
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

// Item view component
struct WardrobeItemView: View {
    let item: WardrobeItem
    let onLongPress: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppStyles.Spacing.xxsmall) {
            Image(uiImage: item.image)
                .resizable()
                .scaledToFill()
                .frame(height: 180)
                .clipped()
                .cornerRadius(AppStyles.Layout.cornerRadius)
                .contentShape(Rectangle())
                .onLongPressGesture {
                    onLongPress()
                }
            
            HStack {
                Text(item.categoryName)
                    .font(AppStyles.Typography.caption)
                    .foregroundColor(AppStyles.Colors.secondaryText)
                
                Spacer()
                
                Text(item.dateAdded.formatted(.dateTime.month().day()))
                    .font(AppStyles.Typography.small)
                    .foregroundColor(AppStyles.Colors.secondaryText.opacity(0.7))
            }
            .padding(.top, 2)
        }
    }
}

// Simplified Category selection view for newly uploaded photos
struct CategorySelectionView: View {
    let image: UIImage
    let onComplete: (String) -> Void
    let onCancel: () -> Void
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedCategory: String = ""
    @State private var showError = false
    @State private var errorMessage = ""
    
    let categories = ["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"]
    
    var body: some View {
        NavigationView {
            VStack(spacing: AppStyles.Spacing.large) {
                // Title
                Text("Categorize Your Item")
                    .font(AppStyles.Typography.heading)
                    .foregroundColor(AppStyles.Colors.text)
                    .padding(.top)
                
                // Image preview
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 200)
                    .cornerRadius(AppStyles.Layout.cornerRadius)
                    .padding()
                
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
                        onCancel()
                        dismiss()
                    }) {
                        Text("Cancel")
                    }
                    .secondaryButtonStyle()
                    
                    Button(action: {
                        if !selectedCategory.isEmpty {
                            onComplete(selectedCategory)
                            dismiss()
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
    }
    
    private func showErrorMessage(_ message: String) {
        errorMessage = message
        withAnimation {
            showError = true
        }
    }
}

struct WardrobeView_Previews: PreviewProvider {
    static var previews: some View {
        WardrobeView()
    }
}
