import SwiftUI

struct ContentView: View {
    // Original variable for onboarding tutorial
    @AppStorage("hasSeenWelcomePage") var hasSeenWelcomePage = true
    
    // Authentication state
    @State var isUserAuthenticated = false
    @State private var isCheckingAuth = true
    
    // Auth state tracking
    @State private var showSignIn = false
    @State private var showSignUp = false
    @State private var showSettings = false
    
    var body: some View {
        ZStack {
            if isCheckingAuth {
                // Loading view
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
                    .scaleEffect(1.5)
            } else if isUserAuthenticated {
                // Main app content
                VStack(spacing: AppStyles.Spacing.large) {
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
                    Text("This extension shows items in your Zara shopping cart at the bottom of the screen.")
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
                            Text("5. Visit Zara.com shopping cart")
                        }
                        .font(AppStyles.Typography.body)
                        .foregroundColor(AppStyles.Colors.secondaryText)
                    }
                    .padding()
                    .background(AppStyles.Colors.secondaryBackground)
                    .cornerRadius(AppStyles.Layout.cornerRadius)
                    
                    Spacer()
                    
                    // Opens Safari Settings
                    Button(action: {
                        if let url = URL(string: "https://skipthecart.carrd.co/") {
                            UIApplication.shared.open(url)
                        }
                    }) {
                        Text("Add SkipTheCart Extension")
                    }
                    .primaryButtonStyle()
                    .padding(.horizontal, AppStyles.Layout.horizontalPadding)
                }
                .padding()
                .sheet(isPresented: $hasSeenWelcomePage) {
                    // Your original onboarding tutorial
                    WelcomeView(hasSeenWelcomePage: $hasSeenWelcomePage)
                }
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
        }
    }
    
    // Check if user is already authenticated
    private func checkAuthStatus() {
        Task {
            let authenticated = await AuthService.shared.isAuthenticated()
            
            DispatchQueue.main.async {
                isUserAuthenticated = authenticated
                isCheckingAuth = false
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

//#Preview {
//    WelcomeView(hasSeenWelcomePage: .constant(true))
//}

struct PageInfo: Identifiable {
    let id = UUID()
    let label: String
    let text: String
    let image: ImageResource
}

let pages = [
    PageInfo(label: "Welcome to SkipTheCart! 🛍️", text: "We help you shop smarter by showing how new items fit with what you already own. No more duplicates, no more regrets—just mindful choices.", image: .welcome),
    PageInfo(label: "Sync your wardrobe", text: "Snap photos or upload existing ones. We’ll analyze colors, styles, and patterns to build your unique closet profile.", image: .wardrobe),
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
