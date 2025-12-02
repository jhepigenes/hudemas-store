'use client';

import { usePathname } from 'next/navigation';
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import CustomCursor from "./components/CustomCursor";
import NoiseOverlay from "./components/NoiseOverlay";
import NewsletterPopup from "./components/NewsletterPopup";
import StickyPhone from "./components/StickyPhone";
import { LanguageProvider } from "./context/LanguageContext";
import { CurrencyProvider } from "./context/CurrencyContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <LanguageProvider>
      <CurrencyProvider>
        {!isAdmin && <Header />}
        {children}
        {!isAdmin && <Footer />}
        {!isAdmin && <CustomCursor />}
        <NoiseOverlay />
        {!isAdmin && <CartDrawer />}
        {!isAdmin && <NewsletterPopup />}
        {!isAdmin && <StickyPhone />}
      </CurrencyProvider>
    </LanguageProvider>
  );
}
