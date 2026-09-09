import { ProductFooter } from '@/src/features/marketing/product-page/ProductFooter';
import { ProductNav } from '@/src/features/marketing/product-page/ProductNav';
import { productFontVariables } from '@/src/features/marketing/product-page/fonts';
import '@/styles/elimika-product.css';
import type { ReactNode } from 'react';

// This route group carries its own chrome — no MarketingSiteShell / PublicSiteShell.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`sw-page ${productFontVariables}`}>
      <ProductNav />
      <main>{children}</main>
      <ProductFooter />
    </div>
  );
}
