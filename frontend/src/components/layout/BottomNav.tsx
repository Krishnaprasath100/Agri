'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import {
  BookOpen,
  PlusCircle,
  Sprout,
  FileText,
  Users,
} from 'lucide-react';

const bottomNavItems = [
  { label: 'Ledger', href: '/ledger', icon: BookOpen },
  { label: 'Crops', href: '/crops', icon: Sprout },
  { label: 'New Entry', href: '/entry', icon: PlusCircle, primary: true },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Persons', href: '/persons', icon: Users },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="bottom-nav">
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.primary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bottom-nav-fab"
              aria-label={t(item.label)}
            >
              <Icon size={26} />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            aria-label={t(item.label)}
          >
            <Icon size={22} />
            <span>{t(item.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
