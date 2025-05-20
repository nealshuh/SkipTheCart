import SwiftUI
import PhotosUI

struct ModelTestView: View {
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var showProcessingAlert: Bool = false
    @State private var isInstructionsExpanded = true
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: AppStyles.Spacing.large) {
                instructionSection
                photosPickerView
            }
        }
        .onChange(of: selectedItems) { newItems in
            if !newItems.isEmpty {
                Task {
                    var imagesToProcess: [ImageToProcess] = []
                    for item in newItems {
                        if let data = try? await item.loadTransferable(type: Data.self),
                           let image = UIImage(data: data) {
                            let filename = "original_\(UUID().uuidString).jpg"
                            WardrobeManager.shared.saveImage(image, filename: filename)
                            let size = image.size
                            let imageToProcess = ImageToProcess(image: image, filename: filename, size: size)
                            imagesToProcess.append(imageToProcess)
                        }
                    }
                    ProcessingManager.shared.addImagesToProcess(imagesToProcess)
                    await MainActor.run {
                        showProcessingAlert = true
                    }
                }
            }
        }
        .alert("Processing", isPresented: $showProcessingAlert) {
            Button("OK") {
                selectedItems = []
                dismiss()
            }
        } message: {
            Text("Your images are being processed in the background. You will be notified when they are ready.")
        }
    }

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
                    Text("For best results, upload full body pics with good lighting! Mirror selfies work great too.")
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
}
