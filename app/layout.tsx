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
  title: "Hudemas - The Art of Gobelin",
  description: "A legacy of artistry in every stitch.",
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
