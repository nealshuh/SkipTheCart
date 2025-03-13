//
//  EmailConfirmationView.swift
//  ReturnGuard
//
//  Created on 3/10/25.
//

import SwiftUI
import Combine

struct EmailConfirmationView: View {
    @Binding var isAuthenticated: Bool
    @State private var email: String
    @State private var isEmailVerified = false
    @State private var isCheckingStatus = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var timer: Timer.TimerPublisher = Timer.publish(every: 5, on: .main, in: .common)
    @State private var timerCancellable: Cancellable?
    @Environment(\.presentationMode) private var presentationMode
    
    init(isAuthenticated: Binding<Bool>, email: String) {
        self._isAuthenticated = isAuthenticated
        self._email = State(initialValue: email)
    }
    
    var body: some View {
        ZStack {
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: AppStyles.Spacing.large) {
                Spacer()
                
                // Email icon
                Image(systemName: "envelope.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(AppStyles.Colors.primary)
                    .padding(.bottom, AppStyles.Spacing.medium)
                
                // Title
                Text("Verify Your Email")
                    .font(AppStyles.Typography.title)
                    .foregroundColor(AppStyles.Colors.text)
                
                // Instructions
                VStack(spacing: AppStyles.Spacing.small) {
                    Text("We've sent a verification link to:")
                        .font(AppStyles.Typography.body)
                        .foregroundColor(AppStyles.Colors.secondaryText)
                    
                    Text(email)
                        .font(AppStyles.Typography.subtitle)
                        .foregroundColor(AppStyles.Colors.primary)
                        .padding(.top, AppStyles.Spacing.xsmall)
                    
                    Text("After verifying your email, sign in to continue.")
                        .font(AppStyles.Typography.body)
                        .foregroundColor(AppStyles.Colors.secondaryText)
                        .multilineTextAlignment(.center)
                        .padding(.top, AppStyles.Spacing.medium)
                    
                }
                .padding(.horizontal, AppStyles.Spacing.large)
                
                Spacer()
                
                // Actions
                VStack(spacing: AppStyles.Spacing.medium) {
                    // Check status button
//                    Button(action: {
//                        checkEmailVerification(automatic: false)
//                    }) {
//                        Text(isCheckingStatus ? "Checking..." : "I've Verified My Email")
//                    }
//                    .primaryButtonStyle()
//                    .disabled(isCheckingStatus)
//                    
//                    // Resend email button
//                    Button(action: resendVerificationEmail) {
//                        Text("Resend Verification Email")
//                    }
//                    .secondaryButtonStyle()
//                    .disabled(isCheckingStatus)
//                    
                    // Back to Sign In button - Fixed to properly return to welcome screen
                    Button(action: backToSignIn) {
                        Text("Back to Sign In")
                    }
                    .textButtonStyle()
                    .padding(.top, AppStyles.Spacing.small)
                }
                .padding(.horizontal, AppStyles.Layout.horizontalPadding)
                .padding(.bottom, AppStyles.Spacing.xxlarge)
                .responsiveWidth()
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
        .onAppear {
            startEmailVerificationTimer()
        }
        .onDisappear {
            stopEmailVerificationTimer()
        }
    }
    
    private func startEmailVerificationTimer() {
        timer = Timer.publish(every: 10, on: .main, in: .common)
        timerCancellable = timer.connect()
        
        // Set up a timer to periodically check email verification status
        Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { _ in
            checkEmailVerification(automatic: true)
        }
    }
    
    private func stopEmailVerificationTimer() {
        timerCancellable?.cancel()
    }
    
    private func checkEmailVerification(automatic: Bool = false) {
        if !automatic {
            isCheckingStatus = true
        }
        
        Task {
            do {
                // First check if we're authenticated
                let isAuth = await AuthService.shared.isAuthenticated()
                
                if !isAuth {
                    if automatic {
                        // For automatic checks, just silently stop the timer
                        DispatchQueue.main.async {
                            stopEmailVerificationTimer()
                        }
                    } else {
                        // For manual checks, show error and redirect
                        DispatchQueue.main.async {
                            isCheckingStatus = false
                            showError(message: "Please sign in again to verify your email status")
                            
                            // After a short delay, go back to sign in
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                backToSignIn()
                            }
                        }
                    }
                    return
                }
                
                // Now check verification since we're authenticated
                let verified = try await AuthService.shared.isEmailVerified()
                
                DispatchQueue.main.async {
                    isCheckingStatus = false
                    
                    if verified {
                        isEmailVerified = true
                        isAuthenticated = true
                    } else if !automatic {
                        // Only show error for manual checks
                        showError(message: "Email not verified yet. Please check your inbox and click the verification link.")
                    }
                }
            } catch {
                // Print the error for debugging
                print("Email verification check error: \(error)")
                
                if automatic {
                    // For automatic checks, just silently stop the timer
                    DispatchQueue.main.async {
                        stopEmailVerificationTimer()
                    }
                } else {
                    DispatchQueue.main.async {
                        isCheckingStatus = false
                        showError(message: "Unable to verify email. Please sign in again after verifying your email.")
                        
                        // After a short delay, go back to sign in
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            backToSignIn()
                        }
                    }
                }
            }
        }
    }
    
    private func resendVerificationEmail() {
        isCheckingStatus = true
        
        Task {
            do {
                // Call a method in AuthService to resend verification email
                try await AuthService.shared.resendVerificationEmail()
                
                DispatchQueue.main.async {
                    isCheckingStatus = false
                    // Show success message
                    errorMessage = "Verification email sent again. Please check your inbox."
                    withAnimation {
                        showError = true
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    isCheckingStatus = false
                    showError(message: "Failed to resend verification email: \(error.localizedDescription)")
                }
            }
        }
    }
    
    // New implementation for back to sign in
    private func backToSignIn() {
        Task {
            // First sign out if the user is authenticated
            do {
                try await AuthService.shared.signOut()
            } catch {
                print("Error during sign out: \(error)")
                // Continue even if there's an error - we want to return to sign in regardless
            }
            
            // Update the UI state
            DispatchQueue.main.async {
                // Set authenticated to false which will return to welcome screen
                // We do this first before dismissing any views to avoid animations
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

struct EmailConfirmationView_Previews: PreviewProvider {
    static var previews: some View {
        EmailConfirmationView(isAuthenticated: .constant(false), email: "user@example.com")
    }
}
