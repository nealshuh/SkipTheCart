//
//  EmailConfirmationSuccessView.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/12/25.
//


//
//  EmailConfirmationSuccessView.swift
//  ReturnGuard
//
//  Created on 3/12/25.
//

import SwiftUI

struct EmailConfirmationSuccessView: View {
    @Binding var isAuthenticated: Bool
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var isLoading = false
    
    var body: some View {
        ZStack {
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: AppStyles.Spacing.large) {
                Spacer()
                
                // Success icon
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(AppStyles.Colors.success)
                    .padding(.bottom, AppStyles.Spacing.medium)
                
                // Title
                Text("Email Verified!")
                    .font(AppStyles.Typography.title)
                    .foregroundColor(AppStyles.Colors.text)
                
                // Success message
                VStack(spacing: AppStyles.Spacing.small) {
                    Text("Your email has been successfully verified.")
                        .font(AppStyles.Typography.body)
                        .foregroundColor(AppStyles.Colors.secondaryText)
                        .multilineTextAlignment(.center)
                    
                    Text("You can now sign in to your account.")
                        .font(AppStyles.Typography.body)
                        .foregroundColor(AppStyles.Colors.secondaryText)
                        .multilineTextAlignment(.center)
                        .padding(.top, AppStyles.Spacing.xsmall)
                }
                .padding(.horizontal, AppStyles.Spacing.large)
                
                Spacer()
                
                // Sign in button
                Button(action: backToSignIn) {
                    Text("Back to Sign In")
                }
                .primaryButtonStyle()
                .padding(.horizontal, AppStyles.Layout.horizontalPadding)
                .padding(.bottom, AppStyles.Spacing.xxlarge)
                .responsiveWidth()
                .disabled(isLoading)
                .overlay(
                    isLoading ?
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        : nil
                )
            }
            
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
    }
    
    private func backToSignIn() {
        isLoading = true
        
        Task {
            // Sign out if the user is authenticated
            do {
                try await AuthService.shared.signOut()
            } catch {
                print("Error during sign out: \(error)")
                // Continue even if there's an error - we want to return to sign in regardless
            }
            
            // Update the UI state
            DispatchQueue.main.async {
                isLoading = false
                
                // Set authenticated to false which will return to welcome screen
                // We do this first before dismissing any views to avoid animation issues
                isAuthenticated = false
                
                // Post a notification that will be captured by ContentView to reset sheets
                NotificationCenter.default.post(name: NSNotification.Name("ReturnToWelcomeScreen"), object: nil)
            }
        }
    }
    
    private func showError(message: String) {
        errorMessage = message
        withAnimation {
            showError = true
        }
    }
}

struct EmailConfirmationSuccessView_Previews: PreviewProvider {
    static var previews: some View {
        EmailConfirmationSuccessView(isAuthenticated: .constant(false))
    }
}