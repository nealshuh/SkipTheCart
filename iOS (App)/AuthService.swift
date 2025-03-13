//
//  AuthService.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/9/25.
//


// AuthService.swift
import Foundation
import Supabase
import Combine

class AuthService {
    static let shared = AuthService()
    
    private let supabase = SupabaseManager.shared.client
    private var cancellables = Set<AnyCancellable>()
    
    // Sign up with email and password
    func signUp(email: String, password: String) async throws {
        try await supabase.auth.signUp(
            email: email,
            password: password
        )
    }
    
    // Sign in with email and password
    func signIn(email: String, password: String) async throws {
        try await supabase.auth.signIn(
            email: email,
            password: password
        )
    }
    
    // Sign out
    func signOut() async throws {
        try await supabase.auth.signOut()
    }
    
    // Check if user is signed in
    func isAuthenticated() async -> Bool {
        do {
            // If accessing the session doesn't throw an error, the user is authenticated
            _ = try await supabase.auth.session
            return true
        } catch {
            // If accessing the session throws an error, the user is not authenticated
            return false
        }
    }
    
    // Check if email is verified
    func isEmailVerified() async throws -> Bool {
        do {
            // First check if we're authenticated at all
            guard await isAuthenticated() else {
                // Not authenticated, so not verified
                throw NSError(domain: "AuthService",
                             code: 1,
                             userInfo: [NSLocalizedDescriptionKey: "User is not authenticated"])
            }
            
            let session = try await supabase.auth.session
            
            // Access the user metadata to check if email is confirmed
            let user = session.user
            // Check if emailConfirmedAt exists and is not nil
            if user.emailConfirmedAt != nil {
                return true
            }
            
            return false
        } catch {
            // Log the error for debugging
            print("Email verification check error: \(error)")
            throw error
        }
    }
    
    // Resend verification email
    func resendVerificationEmail() async throws {
        do {
            let session = try await supabase.auth.session
            
            guard let email = session.user.email else {
                throw NSError(domain: "AuthService", code: 1, userInfo: [NSLocalizedDescriptionKey: "No email found for current user"])
            }
            
            // Call Supabase to resend the verification email
            try await supabase.auth.resend(
                email: email,
                type: .signup
            )
        } catch {
            throw error
        }
    }
    
    // Get current user's email
    func getCurrentUserEmail() async throws -> String {
        do {
            let session = try await supabase.auth.session
            guard let email = session.user.email else {
                throw NSError(domain: "AuthService", code: 1, userInfo: [NSLocalizedDescriptionKey: "No email found for current user"])
            }
            return email
        } catch {
            throw error
        }
    }
    
    // Delete current user account
    func deleteAccount() async throws {
        // Get the current session to obtain the access token
        // Since session is not optional in your SDK version
        let session = try await supabase.auth.session
        
        // Define response structure to match what your function returns
        struct DeleteResponse: Decodable {
            let message: String?
            let error: String?
        }
        
        // Call the edge function
        do {
            let response: DeleteResponse = try await supabase.functions.invoke(
                "delete-current-user",
                options: FunctionInvokeOptions(
                    headers: ["Authorization": "Bearer \(session.accessToken)"]
                )
            )
            
            // Check for error in response
            if let errorMessage = response.error {
                throw NSError(domain: "AuthService", code: 2, userInfo: [NSLocalizedDescriptionKey: errorMessage])
            }
            
            // If we reach here, the operation was successful
        } catch {
            print("Error calling delete-current-user function: \(error)")
            throw error
        }
    }
}
