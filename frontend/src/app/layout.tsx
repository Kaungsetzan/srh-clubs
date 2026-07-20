import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';
import NavTabs from '@/components/NavTabs';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SRH Clubs',
  description: 'Propose, vote on, and discover student clubs at SRH University.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={geist.variable}>
      <body suppressHydrationWarning>
        <header className="srh-header">
          <div className="srh-header-inner">
            <Link href="/" className="srh-logo">
              <span className="srh-logo-srh">SRH</span>
              <span className="srh-logo-clubs">Clubs</span>
            </Link>
            <nav className="srh-nav">
              <NavTabs />
            </nav>
            <div className="srh-nav-auth">
              {user ? (
                <>
                  <span className="srh-nav-username">{user.username}</span>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="srh-btn-outline">Log in</Link>
              )}
            </div>
          </div>
        </header>
        <main className="srh-main">{children}</main>
        <footer className="srh-footer">
          <p>© {new Date().getFullYear()} SRH University · Student Clubs Platform</p>
        </footer>
      </body>
    </html>
  );
}
