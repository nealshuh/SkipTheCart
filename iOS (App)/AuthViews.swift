//
//  AuthViews.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/7/25.
//

import SwiftUI

// Sign In View
struct SignInView: View {
    let primaryColor = Color(red: 187/255, green: 143/255, blue: 206/255) // Light Purple
    
    @Binding var isAuthenticated: Bool
    @Environment(\.dismiss) private var dismiss
    
    @State private var email = ""
    @State private var password = ""
    
    var body: some View {
        VStack(spacing: 25) {
            // Header
            Text("Sign In")
                .font(.system(size: 28, weight: .bold))
                .padding(.top, 50)
            
            // Form
            VStack(spacing: 20) {
                // Email field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Email")
                        .font(.system(size: 16, weight: .medium))
                    
                    TextField("your@email.com", text: $email)
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(10)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                }
                
                // Password field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Password")
                        .font(.system(size: 16, weight: .medium))
                    
                    SecureField("Your password", text: $password)
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(10)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            
            // Sign In Button
            Button(action: {
                // In a real app, validate and authenticate here
                isAuthenticated = true
                dismiss()
            }) {
                Text("Sign In")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(primaryColor)
                    )
            }
            .padding(.horizontal, 20)
            .padding(.top, 30)
            
            Spacer()
        }
        .padding()
    }
}

// Sign Up View
struct SignUpView: View {
    let primaryColor = Color(red: 187/255, green: 143/255, blue: 206/255) // Light Purple
    
    @Binding var isAuthenticated: Bool
    @Environment(\.dismiss) private var dismiss
    
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    
    var body: some View {
        VStack(spacing: 25) {
            // Header
            Text("Create Account")
                .font(.system(size: 28, weight: .bold))
                .padding(.top, 50)
            
            // Form
            VStack(spacing: 20) {
                // Email field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Email")
                        .font(.system(size: 16, weight: .medium))
                    
                    TextField("your@email.com", text: $email)
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(10)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                }
                
                // Password field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Password")
                        .font(.system(size: 16, weight: .medium))
                    
                    SecureField("Create a password", text: $password)
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(10)
                }
                
                // Confirm Password field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Confirm Password")
                        .font(.system(size: 16, weight: .medium))
                    
                    SecureField("Confirm your password", text: $confirmPassword)
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(10)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            
            // Sign Up Button
            Button(action: {
                // In a real app, validate and create account here
                isAuthenticated = true
                dismiss()
            }) {
                Text("Create Account")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(primaryColor)
                    )
            }
            .padding(.horizontal, 20)
            .padding(.top, 30)
            
            Spacer()
        }
        .padding()
    }
}
