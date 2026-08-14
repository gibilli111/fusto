import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AuthGate from "@/components/AuthGate";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "900"],
});

export const metadata: Metadata = {
  title: "Fusto",
  description: "Una foto per ogni birra, tra amici.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fusto",
  },
};

export const viewport: Viewport = {
  themeColor: "#c0392b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${plex.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
