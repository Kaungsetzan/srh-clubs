'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Clubs', href: '/clubs' },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Projects', href: '/projects' },
  { label: 'Ambassadors', href: '/ambassadors' },
];

export default function NavTabs() {
  const pathname = usePathname();
  return (
    <>
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={pathname.startsWith(tab.href) ? 'srh-nav-tab srh-nav-tab-active' : 'srh-nav-tab'}
        >
          {tab.label}
        </Link>
      ))}
    </>
  );
}
