import { Geist, Geist_Mono, Public_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import "./globals.css";


// Configure Public Sans as the primary design system font token
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// App-specific optimized SEO metadata configuration
export const metadata = {
  title: {
    default: "ChitChat",
    template: "%s | ChitChat",
  },
  description: "Stay connected with your friends and sync your updates in real-time.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        publicSans.variable,
        geistSans.variable,
        geistMono.variable
      )}
      suppressHydrationWarning
    >
      <body 
        className={cn(
          "min-h-full flex flex-col",
          "font-sans bg-background text-foreground", // Binds primary font and prevents background flashes
          "selection:bg-primary/20 selection:text-primary" // Custom text highlight styling
        )}
      >
        {/* Global application entry context injection */}
        {children}

        {/* Global Notification Orchestrator Provider */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            className: "border border-border/60 bg-background/95 text-foreground backdrop-blur-md rounded-xl text-sm font-medium shadow-md",
            success: {
              iconTheme: {
                primary: "rgb(16 185 129)", // emerald-500 matching layout theme colors
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}