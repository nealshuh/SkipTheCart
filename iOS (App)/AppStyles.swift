//
//  AppStyles.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/7/25.
//

import SwiftUI

/// Central style system for consistent design across the app
struct AppStyles {
    // MARK: - Colors
    struct Colors {
        // Brand colors
        static let primary = Color(red: 187/255, green: 143/255, blue: 206/255) // Light Purple
        static let primaryDark = Color(red: 157/255, green: 113/255, blue: 176/255) // Darker Purple
        static let primaryLight = Color(red: 217/255, green: 183/255, blue: 226/255) // Lighter Purple
        
        // Neutral colors
        static let background = Color.white
        static let secondaryBackground = Color(red: 248/255, green: 248/255, blue: 248/255) // Light Gray
        static let text = Color.black.opacity(0.8)
        static let secondaryText = Color.black.opacity(0.6)
        static let placeholderText = Color.black.opacity(0.4)
        
        // Form colors
        static let formBackground = Color.gray.opacity(0.1)
        static let formBorder = Color.gray.opacity(0.3)
        
        // Status colors
        static let success = Color.green
        static let error = Color.red
        static let warning = Color.orange
    }
    
    // MARK: - Typography
    struct Typography {
        // Text styles
        static let largeTitle = Font.system(size: 36, weight: .bold)
        static let title = Font.system(size: 28, weight: .bold)
        static let subtitle = Font.system(size: 22, weight: .semibold)
        static let heading = Font.system(size: 18, weight: .semibold)
        static let body = Font.system(size: 16, weight: .regular)
        static let caption = Font.system(size: 14, weight: .regular)
        static let small = Font.system(size: 12, weight: .regular)
    }
    
    // MARK: - Spacing
    struct Spacing {
        static let xxsmall: CGFloat = 4
        static let xsmall: CGFloat = 8
        static let small: CGFloat = 12
        static let medium: CGFloat = 16
        static let large: CGFloat = 24
        static let xlarge: CGFloat = 32
        static let xxlarge: CGFloat = 48
    }
    
    // MARK: - Layout
    struct Layout {
        static let cornerRadius: CGFloat = 12
        static let smallCornerRadius: CGFloat = 8
        static let buttonHeight: CGFloat = 52
        static let textFieldHeight: CGFloat = 48
        static let horizontalPadding: CGFloat = 24
        static let contentWidth: CGFloat = 600 // For iPad/larger screens
    }
    
    // MARK: - Button Styles
    
    /// Primary button style with filled background
    struct PrimaryButtonStyle: ButtonStyle {
        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .font(Typography.heading)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: Layout.buttonHeight)
                .background(
                    RoundedRectangle(cornerRadius: Layout.cornerRadius)
                        .fill(configuration.isPressed ? Colors.primaryDark : Colors.primary)
                )
                .opacity(configuration.isPressed ? 0.9 : 1.0)
                .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
                .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
        }
    }
    
    /// Secondary button style with outline
    struct SecondaryButtonStyle: ButtonStyle {
        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .font(Typography.heading)
                .foregroundColor(configuration.isPressed ? Colors.primaryDark : Colors.primary)
                .frame(maxWidth: .infinity)
                .frame(height: Layout.buttonHeight)
                .background(
                    RoundedRectangle(cornerRadius: Layout.cornerRadius)
                        .stroke(configuration.isPressed ? Colors.primaryDark : Colors.primary, lineWidth: 1.5)
                        .background(
                            RoundedRectangle(cornerRadius: Layout.cornerRadius)
                                .fill(Colors.background)
                        )
                )
                .opacity(configuration.isPressed ? 0.9 : 1.0)
                .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
                .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
        }
    }
    
    /// Text button style
    struct TextButtonStyle: ButtonStyle {
        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .font(Typography.body)
                .foregroundColor(configuration.isPressed ? Colors.primaryDark : Colors.primary)
                .opacity(configuration.isPressed ? 0.7 : 1.0)
        }
    }
}

// MARK: - Reusable ViewModifiers

/// Applies the standard form field style
struct FormFieldModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .frame(height: AppStyles.Layout.textFieldHeight)
            .background(AppStyles.Colors.formBackground)
            .cornerRadius(AppStyles.Layout.smallCornerRadius)
    }
}

/// Applies standard form field label style
struct FormLabelModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(AppStyles.Typography.body)
            .foregroundColor(AppStyles.Colors.text)
            .padding(.bottom, AppStyles.Spacing.xxsmall)
    }
}

// MARK: - Reusable Views

/// Styled text field with label
struct StyledTextField: View {
    var label: String
    var placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppStyles.Spacing.xxsmall) {
            Text(label)
                .modifier(FormLabelModifier())
            
            TextField(placeholder, text: $text)
                .keyboardType(keyboardType)
                .textInputAutocapitalization(autocapitalization)
                .modifier(FormFieldModifier())
        }
    }
}

/// Styled secure field with label
struct StyledSecureField: View {
    var label: String
    var placeholder: String
    @Binding var text: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppStyles.Spacing.xxsmall) {
            Text(label)
                .modifier(FormLabelModifier())
            
            SecureField(placeholder, text: $text)
                .modifier(FormFieldModifier())
        }
    }
}

// MARK: - View Extensions

extension View {
    /// Apply primary button style
    func primaryButtonStyle() -> some View {
        self.buttonStyle(AppStyles.PrimaryButtonStyle())
    }
    
    /// Apply secondary button style
    func secondaryButtonStyle() -> some View {
        self.buttonStyle(AppStyles.SecondaryButtonStyle())
    }
    
    /// Apply text button style
    func textButtonStyle() -> some View {
        self.buttonStyle(AppStyles.TextButtonStyle())
    }
    
    /// Apply form field style
    func formFieldStyle() -> some View {
        self.modifier(FormFieldModifier())
    }
    
    /// Apply form label style
    func formLabelStyle() -> some View {
        self.modifier(FormLabelModifier())
    }
    
    /// Apply standard card style
    func cardStyle(padding: CGFloat = AppStyles.Spacing.medium) -> some View {
        self.padding(padding)
            .background(
                RoundedRectangle(cornerRadius: AppStyles.Layout.cornerRadius)
                    .fill(AppStyles.Colors.background)
                    .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 4)
            )
    }
    
    /// Apply responsive width constraint for larger devices
    func responsiveWidth() -> some View {
        self.frame(maxWidth: min(UIScreen.main.bounds.width - AppStyles.Layout.horizontalPadding * 2,
                                 AppStyles.Layout.contentWidth))
    }
}
