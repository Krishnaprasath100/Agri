'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { TamilKeyboard } from '@/components/keyboard/TamilKeyboard';

interface AppShellProps {
  children: React.ReactNode;
  hideTopNavOnMobile?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  hideTopNavOnMobile = false,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

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

  return (
    <div className="app-container">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className={`main-content${hideTopNavOnMobile ? ' hide-topnav-mobile' : ''}`}>
        <TopNav onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="page-body">{children}</main>
        {isMobileScreen && <TamilKeyboard />}
      </div>
    </div>
  );
};
