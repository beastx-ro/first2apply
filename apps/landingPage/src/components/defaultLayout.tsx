import { Footer } from './footer';
import { Navbar } from './navbar';

export function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="product" className="min-h-screenpt-12 pt-14 md:pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
