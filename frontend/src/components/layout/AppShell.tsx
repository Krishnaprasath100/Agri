'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { TamilKeyboard } from '@/components/keyboard/TamilKeyboard';

interface AppShellProps {
  children: React.ReactNode;
  hideTopNavOnMobile?: boolean;
  cornerMenuOnlyOnMobile?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  hideTopNavOnMobile = false,
  cornerMenuOnlyOnMobile = false,
}) => {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [mobileUpperBarOpen, setMobileUpperBarOpen] = useState(false);

  // Strictly enable keyboard and mobile-specific controls only on mobile app / phones (<= 767px)
  // Desktop and Tab view (website) are completely excluded.
  useEffect(() => {
    const check = () => {
      setIsMobileScreen(typeof window !== 'undefined' && window.innerWidth <= 767);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // On mobile app, the upper bar is closed as default on all pages.
  // It ONLY opens when the customer explicitly clicks the open button (->).
  useEffect(() => {
    setMobileUpperBarOpen(false);
  }, [pathname]);

  const isUpperBarClosed = isMobileScreen && !mobileUpperBarOpen;

  return (
    <div className="app-container">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div
        className={`main-content${
          hideTopNavOnMobile ? ' hide-topnav-mobile' : ''
        }${isUpperBarClosed ? ' mobile-upperbar-closed' : ''}`}
      >
        <TopNav
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          isMobileScreen={isMobileScreen}
          mobileUpperBarOpen={mobileUpperBarOpen}
          onToggleUpperBar={setMobileUpperBarOpen}
        />
        <main className="page-body">{children}</main>
        {isMobileScreen && <TamilKeyboard />}
      </div>
    </div>
  );
};
