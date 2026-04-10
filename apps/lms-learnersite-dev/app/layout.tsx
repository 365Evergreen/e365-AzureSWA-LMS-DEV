import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';
import { AppNav } from '../components/AppNav';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'LMS Learner',
  description: 'Course player and progress tracking',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app-shell">
            <AppNav />
            <main className="app-main">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
