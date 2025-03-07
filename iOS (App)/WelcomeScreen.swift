//
//  WelcomeScreen.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/7/25.
//

import SwiftUI

struct WelcomeScreen: View {
    // Colors
    let primaryColor = Color(red: 187/255, green: 143/255, blue: 206/255) // Light Purple
    let secondaryColor = Color.white
    
    // Actions
    var onSignUpTap: () -> Void
    var onSignInTap: () -> Void
    
    var body: some View {
        ZStack {
            // Background
            secondaryColor.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 30) {
                Spacer()
                
                // App logo
                Image(systemName: "bag.fill")
                    .font(.system(size: 70))
                    .foregroundColor(primaryColor)
                
                // App name
                Text("PursePause")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(Color.black.opacity(0.8))
                
                // App tagline
                Text("Shop smarter. Save better.")
                    .font(.system(size: 18))
                    .foregroundColor(Color.black.opacity(0.6))
                    .padding(.bottom, 40)
                
                Spacer()
                
                // Auth buttons
                VStack(spacing: 16) {
                    // Sign Up button
                    Button(action: onSignUpTap) {
                        Text("Sign Up")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(primaryColor)
                            )
                    }
                    
                    // Sign In button
                    Button(action: onSignInTap) {
                        Text("Sign In")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(primaryColor)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(primaryColor, lineWidth: 1.5)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(secondaryColor)
                                    )
                            )
                    }
                }
                .padding(.horizontal, 30)
                .padding(.bottom, 50)
            }
        }
    }
}
