//
//  ModelTestView.swift
//  SkipTheCart
//
//  Created on 3/27/25.
//

import SwiftUI
import UIKit

struct ModelTestView: View {
    @State private var showImagePicker = false
    @State private var selectedImage: UIImage? = nil
    @State private var showImagePreview = false
    
    var body: some View {
        NavigationView {
            ZStack {
                AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
                
                VStack(spacing: AppStyles.Spacing.large) {
                    // Header
                    HStack {
                        Text("Test Model")
                            .font(AppStyles.Typography.title)
                            .foregroundColor(AppStyles.Colors.text)
                        
                        Spacer()
                    }
                    .padding(.horizontal)
                    .padding(.top)
                    
                    Spacer()
                    
                    // Model testing instructions
                    VStack(spacing: AppStyles.Spacing.medium) {
                        Image(systemName: "camera.viewfinder")
                            .font(.system(size: 70))
                            .foregroundColor(AppStyles.Colors.secondaryText.opacity(0.3))
                        
                        Text("Test item similarity detection")
                            .font(AppStyles.Typography.heading)
                            .foregroundColor(AppStyles.Colors.text)
                        
                        Text("Upload a photo of an item to see how it appears in the model.")
                            .font(AppStyles.Typography.body)
                            .foregroundColor(AppStyles.Colors.secondaryText)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                    }
                    
                    // Upload button
                    Button(action: {
                        selectedImage = nil // Clear any previous selection
                        showImagePicker = true
                    }) {
                        Label("Upload Photo", systemImage: "plus.viewfinder")
                    }
                    .primaryButtonStyle()
                    .padding(.horizontal, 60)
                    .padding(.top, AppStyles.Spacing.large)
                    
                    Spacer()
                }
            }
            .navigationBarHidden(true)
            .fullScreenCover(isPresented: $showImagePicker) {
                ImagePickerView(image: $selectedImage, onDismiss: { success in
                    showImagePicker = false
                    if success && selectedImage != nil {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            showImagePreview = true
                        }
                    }
                })
            }
            .sheet(isPresented: $showImagePreview) {
                if let image = selectedImage {
                    SimpleImagePreviewSheet(image: image)
                }
            }
        }
    }
}

// Full screen image picker view
struct ImagePickerView: View {
    @Binding var image: UIImage?
    var onDismiss: (Bool) -> Void
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        ZStack {
            ModelImagePicker(selectedImage: $image, onComplete: { success in
                onDismiss(success)
            })
            .edgesIgnoringSafeArea(.all)
            
            VStack {
                HStack {
                    Spacer()
                    Button(action: {
                        onDismiss(false)
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 30))
                            .foregroundColor(.white)
                            .padding()
                            .shadow(radius: 2)
                    }
                }
                Spacer()
            }
            .padding(.top, 20)
        }
    }
}

// Image picker for ModelTestView
struct ModelImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    var onComplete: (Bool) -> Void
    
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
        var parent: ModelImagePicker
        
        init(_ parent: ModelImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let selectedImage = info[.originalImage] as? UIImage {
                // Set the image first
                parent.selectedImage = selectedImage
                
                // Store callback to avoid capture issues
                let callback = parent.onComplete
                DispatchQueue.main.async {
                    callback(true)
                }
            } else {
                let callback = parent.onComplete
                DispatchQueue.main.async {
                    callback(false)
                }
            }
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            let callback = parent.onComplete
            DispatchQueue.main.async {
                callback(false)
            }
        }
    }
}

// Simplified sheet to preview just the uploaded image at 473x473
struct SimpleImagePreviewSheet: View {
    let image: UIImage
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                // Show the image at 473x473
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 473, height: 473)
                    .clipShape(Rectangle())
                    .padding()
                
                Spacer()
                
                // Close button
                Button(action: {
                    dismiss()
                }) {
                    Text("Close")
                }
                .primaryButtonStyle()
                .padding(.horizontal, 60)
                .padding(.bottom)
            }
            .navigationBarHidden(true)
            .background(AppStyles.Colors.background.edgesIgnoringSafeArea(.all))
        }
    }
}

struct ModelTestView_Previews: PreviewProvider {
    static var previews: some View {
        ModelTestView()
    }
}
