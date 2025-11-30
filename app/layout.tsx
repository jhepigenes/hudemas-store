import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./components/ThemeProvider";
import ClientLayout from "./ClientLayout";
import { GoogleAnalytics } from '@next/third-parties/google';

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hudemas - The Art of Gobelin",
    template: "%s | Hudemas"
  },
  description: "A legacy of artistry in every stitch. Discover premium Gobelin kits, authentic Romanian tapestries, and a community of passionate needlepoint artists.",
  keywords: ["gobelin", "tapestry", "needlepoint", "romania", "art", "handcrafted", "kit", "embroidery"],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hudemas-store.vercel.app',
    siteName: 'Hudemas',
    images: [
      {
        url: '/stitched_gobelin_sample_1_1764415137741.png', // Use our local asset
        width: 1200,
        height: 630,
        alt: 'Hudemas Gobelin Art',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${playfair.variable} ${inter.variable} font-sans antialiased bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 selection:bg-stone-900 selection:text-stone-50 dark:selection:bg-stone-50 dark:selection:text-stone-900 transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </CartProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-HUDEMAS01" />
      </body>
    </html>
  );
}
