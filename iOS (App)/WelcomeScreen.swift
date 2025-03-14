//
//  WelcomeScreen.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/7/25.
//

import SwiftUI

struct WelcomeScreen: View {
    // Actions
    var onSignUpTap: () -> Void
    var onSignInTap: () -> Void
    
    // Add the AppStorage binding here
    @AppStorage("hasSeenWelcomePage") var hasSeenWelcomePage = false
    
    // Only need one state variable for splash control
    @State private var isShowingSplash = true
    
    var body: some View {
        ZStack {
            // Background
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            
            if isShowingSplash {
                // Splash screen - shown every time the app launches
                VStack {
                    Image(systemName: "bag.fill")
                        .font(.system(size: 70))
                        .foregroundColor(AppStyles.Colors.primary)
                    
                    Text("SkipTheCart")
                        .font(AppStyles.Typography.largeTitle)
                        .foregroundColor(AppStyles.Colors.text)
                }
                .transition(.opacity)
            } else if !hasSeenWelcomePage {
                // Welcome slideshow - shown only once
                WelcomeView(hasSeenWelcomePage: $hasSeenWelcomePage)
                .transition(.opacity)
            } else {
                // Authentication screen
                VStack(spacing: AppStyles.Spacing.xlarge) {
                    Spacer()
                    
                    // App logo
                    Image(systemName: "bag.fill")
                        .font(.system(size: 70))
                        .foregroundColor(AppStyles.Colors.primary)
                    
                    // App name
                    Text("SkipTheCart")
                        .font(AppStyles.Typography.largeTitle)
                        .foregroundColor(AppStyles.Colors.text)
                    
                    // App tagline
                    Text("Shop smarter. Save better.")
                        .font(AppStyles.Typography.subtitle)
                        .foregroundColor(AppStyles.Colors.secondaryText)
                        .padding(.bottom, AppStyles.Spacing.medium)
                    
                    Spacer()
                    
                    // Auth buttons
                    VStack(spacing: AppStyles.Spacing.medium) {
                        // Sign Up button
                        Button(action: onSignUpTap) {
                            Text("Sign Up")
                        }
                        .primaryButtonStyle()
                        
                        // Sign In button
                        Button(action: onSignInTap) {
                            Text("Sign In")
                        }
                        .secondaryButtonStyle()
                    }
                    .padding(.horizontal, AppStyles.Layout.horizontalPadding)
                    .padding(.bottom, AppStyles.Spacing.xxlarge)
                    .responsiveWidth()
                }
                .transition(.opacity)
            }
        }
        .onAppear {
            // Show splash for 1 second, then transition to the appropriate next view
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                withAnimation {
                    isShowingSplash = false
                }
            }
        }
    }
}
