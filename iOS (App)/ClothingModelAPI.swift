//
//  ClothingModelAPI.swift
//  SkipTheCart
//
//  Created by Prafull Sharma on 5/10/25.
//

import CoreML
import Vision
import UIKit

struct ColorRange {
    let lowerH: CGFloat
    let upperH: CGFloat
    let lowerS: CGFloat
    let upperS: CGFloat
    let lowerV: CGFloat
    let upperV: CGFloat
}

class ClothingModelAPI {
    private let model: VNCoreMLModel?
    private let labelNames: [Int: String] = [
        5: "Tops", 6: "Dresses",
        7: "Coats", 9: "Bottoms", 12: "Skirts",
        18: "Left Shoes", 19: "Right Shoes"
    ]
    private let segFormerToLabel: [Int: Int] = [
        4: 5,   // Upper-clothes to Tops
        7: 6,   // Dress to Dresses
        6: 9,   // Pants to Bottoms
        5: 12,  // Skirt to Skirts
        9: 18,  // Left-shoe to Left Shoes
        10: 19  // Right-shoe to Right Shoes
    ]
    private let includedLabels: Set<Int> = [5, 6, 7, 9, 12]
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

    init() {
        do {
            let config = MLModelConfiguration()
            let segFormerModel = try SegFormerClothes(configuration: config)
            self.model = try VNCoreMLModel(for: segFormerModel.model)
        } catch {
            print("Error loading model: \(error)")
            self.model = nil
        }
    }

    func processImage(_ image: UIImage, originalFilename: String, originalSize: CGSize) async throws -> [PreviewItem] {
        guard let model = model else {
            throw NSError(domain: "ClothingModelAPI", code: 1, userInfo: [NSLocalizedDescriptionKey: "Model not loaded"])
        }
        return try await Task.detached {
            let resizedImage = self.resizeImage(image, to: CGSize(width: 512, height: 512))
            guard let cgImage = resizedImage.cgImage else {
                throw NSError(domain: "ClothingModelAPI", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to get CGImage"])
            }
            let request = VNCoreMLRequest(model: model)
            let handler = VNImageRequestHandler(cgImage: cgImage)
            try handler.perform([request])
            guard let results = request.results as? [VNCoreMLFeatureValueObservation],
                  let firstResult = results.first,
                  let multiArray = firstResult.featureValue.multiArrayValue else {
                throw NSError(domain: "ClothingModelAPI", code: 3, userInfo: [NSLocalizedDescriptionKey: "No results from model"])
            }
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
                        let maskedImage = self.createMaskedImage(labels: labels, width: width, height: height, for: label, originalImage: resizedImage)
                        if let maskedImage = maskedImage {
                            let (color, colorLabel) = self.getDominantColorAndLabelFromMaskedImage(maskedImage)
                            let previewItem = PreviewItem(category: name, image: maskedImage, colorLabel: colorLabel, originalImageFilename: originalFilename, boundingBox: boundingBoxOriginal)
                            previewItems.append(previewItem)
                        }
                    }
                }
            }
            return previewItems
        }.value
    }

    private func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }

    private func createMaskedImage(labels: [[Int]], width: Int, height: Int, for label: Int, originalImage: UIImage) -> UIImage? {
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

    private func getDominantColorAndLabelFromMaskedImage(_ image: UIImage) -> (color: UIColor, label: String) {
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
}
