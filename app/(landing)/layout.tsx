import type { ReactNode } from 'react';
import { PublicTopNav } from '@/components/PublicTopNav';
import { ProductFooter } from '@/src/features/marketing/product-page/ProductFooter';
import { productFontVariables } from '@/src/features/marketing/product-page/fonts';
import '@/styles/elimika-product.css';

// Elimika's own chrome wraps the page; only the body between it carries the
// product-page treatment, so the nav keeps the app's typography and sign-in.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <div className={`sw-page ${productFontVariables}`}>
        <main>{children}</main>
        <ProductFooter />
      </div>
    </div>
  );
}
