//
//  WelcomeScreen.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/7/25.
//
import SwiftUI

struct WelcomeScreen: View {
    var onSignUpTap: () -> Void
    var onSignInTap: () -> Void
    
    @AppStorage("hasSeenWelcomePage") var hasSeenWelcomePage = false
    @State private var isShowingSplash = true
    
    var body: some View {
        ZStack {
            AppStyles.Colors.background.edgesIgnoringSafeArea(.all)
            
            if isShowingSplash {
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
                WelcomeView(hasSeenWelcomePage: $hasSeenWelcomePage)
                    .transition(.opacity)
            } else {
                VStack(spacing: AppStyles.Spacing.xlarge) {
                    Spacer()
                    
                    Image(systemName: "bag.fill")
                        .font(.system(size: 70))
                        .foregroundColor(AppStyles.Colors.primary)
                    
                    Text("SkipTheCart")
                        .font(AppStyles.Typography.largeTitle)
                        .foregroundColor(AppStyles.Colors.text)
                    
                    Text("Shop smarter. Save better.")
                        .font(AppStyles.Typography.subtitle)
                        .foregroundColor(AppStyles.Colors.secondaryText)
                        .padding(.bottom, AppStyles.Spacing.medium)
                    
                    Spacer()
                    
                    VStack(spacing: AppStyles.Spacing.medium) {
                        Button(action: onSignUpTap) {
                            Text("Sign Up")
                        }
                        .primaryButtonStyle()
                        
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
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                withAnimation {
                    isShowingSplash = false
                }
            }
        }
    }
}
