// app/layout.js
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import Footer from "./components/Footer";
import Script from "next/script";

export const metadata = {
  title: "Learnix",
  description: "Learnix is a learning platform where students can share their study resources, explore solutions, and make learning referable and collaborative.",
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
    title: "Learnix - Learn Smarter",
    description: "Collaborative platform for students to share homework and learning resources.",
    url: "https://learnix.dev",
    siteName: "Learnix",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learnix - Learn Smarter",
    description: "Collaborative platform for students to share Resources and learning resources.",
    creator: "", // optional
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="2bbd1296af2eb5ebd68ec42b6afb506d0261227a" content="2bbd1296af2eb5ebd68ec42b6afb506d0261227a" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <meta name="google-adsense-account" content="ca-pub-4934238485595915" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4934238485595915" crossOrigin="anonymous"></script>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4934238485595915"
          crossorigin="shashidhara k"></script>
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BWQ2CZRBZE"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-BWQ2CZRBZE');
            `,
          }}
        />

        {/* Infolinks Ads */}
        <Script
          id="infolinks-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var infolinks_pid = 3442499;
              var infolinks_wsid = 0;
            `,
          }}
        />
        <Script
          src="https://resources.infolinks.com/js/infolinks_main.js"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
