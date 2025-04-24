import SwiftUI

struct ContentView: View {
    // Original variable for onboarding tutorial
    
    // Authentication state
    @State var isUserAuthenticated = false
    @State private var isCheckingAuth = true
    
    // Auth state tracking
    @State private var showSignIn = false
    @State private var showSignUp = false
    @State private var showSettings = false
    
    // Email verification states
    @State private var needsEmailVerification = false
    @State private var userEmail = ""
    
    // New state for email confirmation success
    @State private var showEmailConfirmationSuccess = false
    
    // Handle direct navigation from email verification to welcome screen
    @State private var cleanReturnToWelcome = false
    
    // Tab selection state
    @State private var selectedTab: Int = 0
    
    var body: some View {
        ZStack {
            if isCheckingAuth {
                // Loading view
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
                    .scaleEffect(1.5)
            } else if showEmailConfirmationSuccess {
                // New email confirmation success view
                EmailConfirmationSuccessView(isAuthenticated: $isUserAuthenticated)
                    .transition(.opacity)
                    .onChange(of: isUserAuthenticated) { newValue in
                        if !newValue {
                            // Reset our state when authentication changes to false
                            showEmailConfirmationSuccess = false
                        }
                    }
            } else if needsEmailVerification {
                // Email verification view when user is signed in but email not verified
                EmailConfirmationView(isAuthenticated: $isUserAuthenticated, email: userEmail)
                    .transition(.opacity)
                    .onChange(of: isUserAuthenticated) { newValue in
                        if !newValue {
                            // Reset our state when authentication changes to false
                            needsEmailVerification = false
                        }
                    }
                    .onDisappear {
                        // When this view disappears, make sure we reset verification state
                        checkAuthStatus() // Recheck auth status when the view disappears
                    }
            } else if isUserAuthenticated {
                // Main app content with tab view
                TabView(selection: $selectedTab) {
                    // Home tab
                    homeView
                        .tabItem {
                            Label("Home", systemImage: "house.fill")
                        }
                        .tag(0)
                    
                    // Wardrobe tab
                    WardrobeView()
                        .tabItem {
                            Label("Wardrobe", systemImage: "tshirt.fill")
                        }
                        .tag(1)
                }
                .accentColor(AppStyles.Colors.primary)
                .sheet(isPresented: $showSettings) {
                    SettingsView(isAuthenticated: $isUserAuthenticated)
                }
            } else {
                // Authentication welcome screen
                WelcomeScreen(
                    onSignUpTap: {
                        showSignUp = true
                    },
                    onSignInTap: {
                        showSignIn = true
                    }
                )
                .sheet(isPresented: $showSignIn) {
                    // Sign in screen with ability to set isUserAuthenticated to true
                    SignInView(isAuthenticated: $isUserAuthenticated)
                }
                .sheet(isPresented: $showSignUp) {
                    // Sign up screen with ability to set isUserAuthenticated to true
                    SignUpView(isAuthenticated: $isUserAuthenticated)
                }
            }
        }
        .onAppear {
            checkAuthStatus()
            
            // Set up notification observer for direct return to welcome screen
            NotificationCenter.default.addObserver(forName: NSNotification.Name("ReturnToWelcomeScreen"), object: nil, queue: .main) { _ in
                cleanReturnToWelcome = true
                // Reset all sheets and views
                showSignIn = false
                showSignUp = false
                needsEmailVerification = false
                showEmailConfirmationSuccess = false
                
                // Add a small delay to ensure smooth transition
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    cleanReturnToWelcome = false
                }
            }
            
            // Add a new notification for email verification success
            NotificationCenter.default.addObserver(forName: NSNotification.Name("EmailVerificationSuccess"), object: nil, queue: .main) { _ in
                DispatchQueue.main.async {
                    showEmailConfirmationSuccess = true
                    needsEmailVerification = false
                }
            }
        }
        .onChange(of: isUserAuthenticated) { newValue in
            if newValue {
                // When authentication state changes to true, check email verification
                checkEmailVerification()
            } else {
                // When authentication changes to false, make sure we reset verification state
                needsEmailVerification = false
                showEmailConfirmationSuccess = false
                if !cleanReturnToWelcome {
                    // Only reset these if not triggered by our special notification
                    showSignIn = false
                    showSignUp = false
                }
            }
        }
    }
    
    // Extracted home view to keep code organized
    private var homeView: some View {
        VStack(spacing: AppStyles.Spacing.medium) {
            HStack {
                Text("SkipTheCart")
                    .font(AppStyles.Typography.largeTitle)
                    .foregroundColor(AppStyles.Colors.text)
                
                Spacer()
                
                // Settings button
                Button(action: {
                    showSettings = true
                }) {
                    Image(systemName: "gear")
                        .font(.system(size: 22))
                        .foregroundColor(AppStyles.Colors.primary)
                }
                .padding(.trailing, 4)
            }
            .padding(.horizontal)
            
            Spacer()
            
            // App explanation
            Text("This extension shows items in your online shopping cart and compares them to what you already own.")
                .font(AppStyles.Typography.body)
                .foregroundColor(AppStyles.Colors.secondaryText)
                .multilineTextAlignment(.center)
                .padding()
            
            // Safari Extension instructions
            VStack(alignment: .leading, spacing: AppStyles.Spacing.small) {
                Text("To enable the extension:")
                    .font(AppStyles.Typography.heading)
                    .foregroundColor(AppStyles.Colors.text)
                
                VStack(alignment: .leading, spacing: AppStyles.Spacing.xsmall) {
                    Text("1. Open Safari")
                    Text("2. Tap the 'aA' button in the address bar")
                    Text("3. Select 'Manage Extensions'")
                    Text("4. Enable 'SkipTheCart'")
                    Text("5. Visit shopping carts on your favorite stores")
                }
                .font(AppStyles.Typography.body)
                .foregroundColor(AppStyles.Colors.secondaryText)
                
                // Add extension button moved here, right after the instructions
                Button(action: {
                    if let url = URL(string: "https://skipthecart.carrd.co/") {
                        UIApplication.shared.open(url)
                    }
                }) {
                    Text("Add SkipTheCart Extension")
                }
                .primaryButtonStyle()
                .padding(.top, AppStyles.Spacing.medium)
            }
            .padding()
            .background(AppStyles.Colors.secondaryBackground)
            .cornerRadius(AppStyles.Layout.cornerRadius)
            
            // Wardrobe prompt
            VStack(alignment: .leading, spacing: AppStyles.Spacing.small) {
                Text("Build Your Digital Wardrobe")
                    .font(AppStyles.Typography.heading)
                    .foregroundColor(AppStyles.Colors.text)
                
                Text("Add photos of your clothing to get accurate comparisons when shopping online.")
                    .font(AppStyles.Typography.body)
                    .foregroundColor(AppStyles.Colors.secondaryText)
                
                Button(action: {
                    selectedTab = 1  // Switch to wardrobe tab
                }) {
                    Text("Go to My Wardrobe")
                }
                .primaryButtonStyle()
                .padding(.top, AppStyles.Spacing.small)
            }
            .padding()
            .background(AppStyles.Colors.secondaryBackground)
            .cornerRadius(AppStyles.Layout.cornerRadius)
            
            Spacer()
        }
        .padding()
    }
    
    // Check if user is already authenticated
    private func checkAuthStatus() {
        Task {
            let authenticated = await AuthService.shared.isAuthenticated()
            
            if authenticated {
                // Get the user's email if authenticated
                do {
                    let email = try await AuthService.shared.getCurrentUserEmail()
                    DispatchQueue.main.async {
                        userEmail = email
                    }
                } catch {
                    print("Error getting user email: \(error)")
                }
                
                // Check email verification status
                await checkEmailVerificationAsync()
            }
            
            DispatchQueue.main.async {
                isUserAuthenticated = authenticated
                isCheckingAuth = false
            }
        }
    }
    
    // Check if email is verified
    private func checkEmailVerification() {
        Task {
            await checkEmailVerificationAsync()
        }
    }
    
    private func checkEmailVerificationAsync() async {
        do {
            // First get user email if we don't have it yet
            if userEmail.isEmpty {
                do {
                    let email = try await AuthService.shared.getCurrentUserEmail()
                    DispatchQueue.main.async {
                        userEmail = email
                    }
                } catch {
                    print("Error getting user email: \(error)")
                }
            }
            
            let isVerified = try await AuthService.shared.isEmailVerified()
            
            DispatchQueue.main.async {
                // If email is not verified, show email verification screen
                needsEmailVerification = !isVerified
            }
        } catch {
            print("Error checking email verification: \(error)")
            
            DispatchQueue.main.async {
                // On error, assume not verified for safety
                needsEmailVerification = false
            }
        }
    }
    
    // Sign out function
    private func signOut() {
        Task {
            do {
                try await AuthService.shared.signOut()
                
                DispatchQueue.main.async {
                    isUserAuthenticated = false
                    needsEmailVerification = false
                    showEmailConfirmationSuccess = false
                }
            } catch {
                print("Error signing out: \(error)")
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

struct PageInfo: Identifiable {
    let id = UUID()
    let label: String
    let text: String
    let image: ImageResource
}

let pages = [
    PageInfo(label: "Welcome to SkipTheCart! 🛍️", text: "We help you shop smarter by showing how new items fit with what you already own. No more duplicates, no more regrets—just mindful choices.", image: .welcome),
    PageInfo(label: "Sync your wardrobe", text: "Snap photos or upload existing ones. We'll analyze colors, styles, and patterns to build your unique closet profile.", image: .wardrobe),
    PageInfo(label: "Shop Like Always... But Smarter", text: "Visit your favorite stores and add items to your cart. We work seamlessly in the background while you shop!", image: .shop),
    PageInfo(label: "Instant Cart Insights", text: "Before checkout, we scan your cart. See how similar items are to your closet – by color, style, or exact duplicates.", image: .cart),
    PageInfo(label: "Your Money, Your Impact.", text: "Track your savings. See how mindfulness turns into real savings and a clutter-free closet.", image: .insights),
    
]

struct WelcomeView: View {
    @Binding var hasSeenWelcomePage: Bool
    
    var body: some View {
        VStack {
            TabView {
                ForEach(pages) { page in
                    VStack{
                        Text(page.label)
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .multilineTextAlignment(.center)
                            .padding(10)
                        
                        Text(page.text)
                            .fontWeight(.medium)
                            .padding(35)
                        
                        Image(page.image)
                        
                    }
                }
            }
            Button {
                hasSeenWelcomePage.toggle()
                
            } label: {
                Text("OK")
                    .font(.title)
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .padding()
        }
        .interactiveDismissDisabled()
        .tabViewStyle(.page)
        .onAppear{
            UIPageControl.appearance().currentPageIndicatorTintColor = .systemCyan
            UIPageControl.appearance().pageIndicatorTintColor = .systemGray
        }
        
    }
}
