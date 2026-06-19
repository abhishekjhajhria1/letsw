import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./ServiceWorkerRegister";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://lwts.site"),
  title: "LWTS — Let's Win. Together.",
  description:
    "Invite-only accountability. Pair up, commit to a session, and track each other's progress. You don't quit on your partner.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "LWTS", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    title: "LWTS — Let's Win. Together.",
    description: "Invite-only accountability. Pair up, commit, and don't quit on your partner.",
    url: "https://lwts.site",
    siteName: "LWTS",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5efe2" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0b1c" },
  ],
};

// set theme before paint (avoids flash)
const themeInit = `(function(){try{var t=localStorage.getItem('lwts_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
