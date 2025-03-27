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
    @State private var selectedImage: UIImage?
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
            .sheet(isPresented: $showImagePicker) {
                ImagePicker(selectedImage: $selectedImage, isPresented: $showImagePicker)
                    .onDisappear {
                        if selectedImage != nil {
                            showImagePreview = true
                        }
                    }
            }
            .sheet(isPresented: $showImagePreview) {
                SimpleImagePreviewSheet(image: selectedImage)
            }
        }
    }
}

// Simplified sheet to preview just the uploaded image at 473x473
struct SimpleImagePreviewSheet: View {
    let image: UIImage?
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                // Just show the image at 473x473
                if let uploadedImage = image {
                    Image(uiImage: uploadedImage)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 473, height: 473)
                        .clipShape(Rectangle())
                        .padding()
                } else {
                    Text("No image selected")
                        .font(AppStyles.Typography.body)
                        .foregroundColor(AppStyles.Colors.secondaryText)
                }
                
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
