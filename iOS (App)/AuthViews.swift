//
//  AuthViews.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/7/25.
//

import SwiftUI

// MARK: - Sign In View

struct SignInView: View {
    @Binding var isAuthenticated: Bool
    @Environment(\.dismiss) private var dismiss
    
    @State private var email = ""
    @State private var password = ""
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        ZStack {
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            
            VStack(alignment: .center, spacing: AppStyles.Spacing.large) {
                // Header
                Text("Sign In")
                    .font(AppStyles.Typography.title)
                    .foregroundColor(AppStyles.Colors.text)
                    .padding(.top, AppStyles.Spacing.xxlarge)
                
                // Form
                VStack(spacing: AppStyles.Spacing.large) {
                    // Email field
                    StyledTextField(
                        label: "Email",
                        placeholder: "your@email.com",
                        text: $email,
                        keyboardType: .emailAddress,
                        autocapitalization: .never
                    )
                    
                    // Password field
                    StyledSecureField(
                        label: "Password",
                        placeholder: "Your password",
                        text: $password
                    )
                    
                    // Forgot Password
                    HStack {
                        Spacer()
                        Button("Forgot Password?") {}
                            .textButtonStyle()
                    }
                    .padding(.top, -AppStyles.Spacing.small)
                }
                .padding(.top, AppStyles.Spacing.large)
                
                // Sign In Button
                Button(action: signIn) {
                    Text("Sign In")
                }
                .primaryButtonStyle()
                .padding(.top, AppStyles.Spacing.large)
                
                Spacer()
                
                // Developer shortcut button
                Button(action: {
                    isAuthenticated = true
                    dismiss()
                }) {
                    Text("DEV: Quick Login")
                        .font(AppStyles.Typography.caption)
                }
                .padding(.vertical, AppStyles.Spacing.small)
                .padding(.horizontal, AppStyles.Spacing.medium)
                .background(Color.gray.opacity(0.2))
                .cornerRadius(AppStyles.Layout.smallCornerRadius)
                .padding(.bottom, AppStyles.Spacing.medium)
                
                // Developer shortcut button
                
            }
            .padding(.horizontal, AppStyles.Layout.horizontalPadding)
            .responsiveWidth()
            
            // Error message
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
        .navigationBarItems(
            trailing: Button(action: {
                dismiss()
            }) {
                Image(systemName: "xmark")
                    .foregroundColor(AppStyles.Colors.secondaryText)
            }
        )
    }
    
    private func signIn() {
        // Validate input
        guard !email.isEmpty else {
            showError(message: "Please enter your email")
            return
        }
        
        guard !password.isEmpty else {
            showError(message: "Please enter your password")
            return
        }
        
        // In a real app, perform authentication here
        
        // For demo purposes, always authenticate
        isAuthenticated = true
        dismiss()
    }
    
    private func showError(message: String) {
        errorMessage = message
        withAnimation {
            showError = true
        }
    }
}

// MARK: - Sign Up View

struct SignUpView: View {
    @Binding var isAuthenticated: Bool
    @Environment(\.dismiss) private var dismiss
    
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        ZStack {
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            
            VStack(alignment: .center, spacing: AppStyles.Spacing.large) {
                // Header
                Text("Create Account")
                    .font(AppStyles.Typography.title)
                    .foregroundColor(AppStyles.Colors.text)
                    .padding(.top, AppStyles.Spacing.xxlarge)
                
                // Form
                VStack(spacing: AppStyles.Spacing.large) {
                    // Email field
                    StyledTextField(
                        label: "Email",
                        placeholder: "your@email.com",
                        text: $email,
                        keyboardType: .emailAddress,
                        autocapitalization: TextInputAutocapitalization.never
                    )
                    
                    // Password field
                    StyledSecureField(
                        label: "Password",
                        placeholder: "Create a password",
                        text: $password
                    )
                    
                    // Confirm Password field
                    StyledSecureField(
                        label: "Confirm Password",
                        placeholder: "Confirm your password",
                        text: $confirmPassword
                    )
                }
                .padding(.top, AppStyles.Spacing.large)
                
                // Terms and Privacy
                Text("By creating an account, you agree to our Terms of Service and Privacy Policy")
                    .font(AppStyles.Typography.small)
                    .foregroundColor(AppStyles.Colors.secondaryText)
                    .multilineTextAlignment(.center)
                    .padding(.top, AppStyles.Spacing.medium)
                
                // Sign Up Button
                Button(action: signUp) {
                    Text("Create Account")
                }
                .primaryButtonStyle()
                .padding(.top, AppStyles.Spacing.large)
                
                Spacer()
            }
            .padding(.horizontal, AppStyles.Layout.horizontalPadding)
            .responsiveWidth()
            
            // Error message
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
        .navigationBarItems(
            trailing: Button(action: {
                dismiss()
            }) {
                Image(systemName: "xmark")
                    .foregroundColor(AppStyles.Colors.secondaryText)
            }
        )
    }
    
    private func signUp() {
        // Validate input
        guard !email.isEmpty else {
            showError(message: "Please enter your email")
            return
        }
        
        guard !password.isEmpty else {
            showError(message: "Please enter a password")
            return
        }
        
        guard password == confirmPassword else {
            showError(message: "Passwords don't match")
            return
        }
        
        // In a real app, create account here
        
        // For demo purposes, always authenticate
        isAuthenticated = true
        dismiss()
    }
    
    private func showError(message: String) {
        errorMessage = message
        withAnimation {
            showError = true
        }
    }
}

// MARK: - Preview Providers

struct SignInView_Previews: PreviewProvider {
    static var previews: some View {
        SignInView(isAuthenticated: .constant(false))
    }
}

struct SignUpView_Previews: PreviewProvider {
    static var previews: some View {
        SignUpView(isAuthenticated: .constant(false))
    }
}
