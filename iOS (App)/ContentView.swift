import SwiftUI

struct ContentView: View {
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
        .padding()
    }
}
