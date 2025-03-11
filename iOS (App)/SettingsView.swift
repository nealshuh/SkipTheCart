//
//  SettingsView.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/10/25.
//

import SwiftUI

struct SettingsView: View {
    @Binding var isAuthenticated: Bool
    @Environment(\.dismiss) private var dismiss
    
    @State private var showDeleteConfirmation = false
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            List {
                // Account Section
                Section(header: Text("Account")) {
                    Button(action: {
                        // Sign out
                        signOut()
                    }) {
                        HStack {
                            Text("Sign Out")
                                .foregroundColor(AppStyles.Colors.text)
                            Spacer()
                            Image(systemName: "arrow.right.square")
                                .foregroundColor(AppStyles.Colors.primary)
                        }
                    }
                    
//                    Button(action: {
//                        showDeleteConfirmation = true
//                    }) {
//                        HStack {
//                            Text("Delete Account")
//                                .foregroundColor(AppStyles.Colors.error)
//                            Spacer()
//                            Image(systemName: "trash")
//                                .foregroundColor(AppStyles.Colors.error)
//                        }
//                    }
                }
                
                // App Information
                Section(header: Text("About")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(AppStyles.Colors.secondaryText)
                    }
                    
                    NavigationLink(destination: Text("Privacy Policy would go here")
                        .padding()
                        .navigationTitle("Privacy Policy")) {
                        Text("Privacy Policy")
                    }
                    
                    NavigationLink(destination: Text("Terms of Service would go here")
                        .padding()
                        .navigationTitle("Terms of Service")) {
                        Text("Terms of Service")
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("Settings")
            .navigationBarItems(
                trailing: Button(action: {
                    dismiss()
                }) {
                    Image(systemName: "xmark")
                        .foregroundColor(AppStyles.Colors.secondaryText)
                }
            )
            .alert(isPresented: $showDeleteConfirmation) {
                Alert(
                    title: Text("Delete Account"),
                    message: Text("Are you sure you want to delete your account? This action cannot be undone."),
                    primaryButton: .destructive(Text("Delete")) {
                        deleteAccount()
                    },
                    secondaryButton: .cancel()
                )
            }
            .overlay(
                isLoading ?
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.3))
                        .edgesIgnoringSafeArea(.all)
                    : nil
            )
            
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
    
    private func signOut() {
        isLoading = true
        
        Task {
            do {
                try await AuthService.shared.signOut()
                
                DispatchQueue.main.async {
                    isLoading = false
                    isAuthenticated = false
                    dismiss()
                }
            } catch {
                DispatchQueue.main.async {
                    isLoading = false
                    showError(message: "Error signing out: \(error.localizedDescription)")
                }
            }
        }
    }
    
    private func deleteAccount() {
        isLoading = true
        
        Task {
            do {
                try await AuthService.shared.deleteAccount()
                
                // Clear local session
                try await AuthService.shared.signOut()
                
                DispatchQueue.main.async {
                    isLoading = false
                    isAuthenticated = false
                    dismiss()
                }
            } catch {
                DispatchQueue.main.async {
                    isLoading = false
                    showError(message: "Deletion failed: \(error.localizedDescription)")
                }
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

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView(isAuthenticated: .constant(true))
    }
}
