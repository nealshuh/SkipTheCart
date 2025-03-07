import SwiftUI

struct ContentView: View {
    
    // boolean tracking seen welcome page
    @AppStorage("hasSeenWelcomePage") var hasSeenWelcomePage = true
    
    var body: some View {
        VStack(spacing: 20) {
            Text("PursePause")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Spacer()
            
            // App explanation
            Text("This extension shows items in your Zara shopping cart at the bottom of the screen.")
                .multilineTextAlignment(.center)
                .padding()
            
            // Safari Extension instructions
            VStack(alignment: .leading, spacing: 10) {
                Text("To enable the extension:")
                    .font(.headline)
                
                Text("1. Open Safari")
                Text("2. Tap the 'aA' button in the address bar")
                Text("3. Select 'Manage Extensions'")
                Text("4. Enable 'PursePause'")
                Text("5. Visit Zara.com shopping cart")
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            Spacer()
            
            // Opens Safari Settings
            Button("Add PursePause Extension") {
                if let url = URL(string: "https://pursepause.carrd.co/") {
                    UIApplication.shared.open(url)
                }
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(8)
        }
        .sheet(isPresented: $hasSeenWelcomePage) {
            WelcomeView(hasSeenWelcomePage: $hasSeenWelcomePage)
        }
    }
}

#Preview {
    WelcomeView(hasSeenWelcomePage: .constant(true))
}

struct PageInfo: Identifiable {
    let id = UUID()
    let label: String
    let text: String
    let image: ImageResource
}

let pages = [
    PageInfo(label: "Welcome to PursePause! 🛍️", text: "We help you shop smarter by showing how new items fit with what you already own. No more duplicates, no more regrets—just mindful choices.", image: .welcome),
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
