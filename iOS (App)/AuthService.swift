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
}
