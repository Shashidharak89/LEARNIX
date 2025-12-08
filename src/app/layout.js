// app/layout.js
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import Footer from "./components/Footer";
import NotificationPermission from "./components/NotificationPermission";

export const metadata = {
  title: "Learnix",
  description: "Learnix is a learning platform where students can share their homework, explore solutions, and make learning referable and collaborative.",
  keywords: [
    "Learnix",
    "student homework",
    "learning platform",
    "share homework",
    "study resources",
    "online learning"
  ],
  authors: [{ name: "Shashidhara K." }],
  openGraph: {
    title: "Learnix - Share and Explore Student Homework",
    description: "Collaborative platform for students to share homework and learning resources.",
    url: "https://learnix.shashi-k.in",
    siteName: "Learnix",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learnix - Share and Explore Student Homework",
    description: "Collaborative platform for students to share homework and learning resources.",
    creator: "@YourTwitterHandle", // optional
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-4934238485595915" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4934238485595915" crossOrigin="anonymous"></script>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4934238485595915"
          crossorigin="shashidhara k"></script>
      </head>
      <body>
        <ThemeProvider>
          <NotificationPermission />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
