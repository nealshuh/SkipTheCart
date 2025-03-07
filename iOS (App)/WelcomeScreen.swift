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
    
    var body: some View {
        ZStack {
            // Background
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: AppStyles.Spacing.xlarge) {
                Spacer()
                
                // App logo
                Image(systemName: "bag.fill")
                    .font(.system(size: 70))
                    .foregroundColor(AppStyles.Colors.primary)
                
                // App name
                Text("PursePause")
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
        }
    }
}

// Preview
struct WelcomeScreen_Previews: PreviewProvider {
    static var previews: some View {
        WelcomeScreen(
            onSignUpTap: {},
            onSignInTap: {}
        )
    }
}
