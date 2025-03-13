//
//  SupabaseManager.swift
//  ReturnGuard
//
//  Created by Prafull Sharma on 3/9/25.
//

// SupabaseManager.swift
import Foundation
import Supabase

class SupabaseManager {
    static let shared = SupabaseManager()
    
    private init() {}
    
    // Replace with your Supabase URL and anon key
    private let supabaseURL = URL(string: "https://pcrznprcyevuhrzsyktx.supabase.co")!
    private let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcnpucHJjeWV2dWhyenN5a3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NTQ3NzgsImV4cCI6MjA1NzEzMDc3OH0.Lzme_JZD1uQMz7WH5kgue3H1ZU6y43PF5rK-OdghVK4"
    
    lazy var client = SupabaseClient(
        supabaseURL: supabaseURL,
        supabaseKey: supabaseKey
    )
}
