'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Sprout,
  BookOpen,
  PlusCircle,
  Tag,
  Users,
  Landmark,
  FileText,
  ShieldAlert,
  LogOut,
  Sparkles,
  LucideIcon,
  User,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, role, logout, isPostgresActive } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems: NavItem[] = [
    { label: 'Ledger', href: '/ledger', icon: BookOpen },
    { label: 'New Entry', href: '/entry', icon: PlusCircle },
    { label: 'Plantings', href: '/crops', icon: Sprout },
    { label: 'Expense Types', href: '/expense-types', icon: Tag },
    { label: 'Payees', href: '/payees', icon: Users },
    { label: 'Accounts', href: '/accounts', icon: Landmark },
    { label: 'Persons', href: '/persons', icon: Users },
    { label: 'Reports', href: '/reports', icon: FileText },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  // Admin verification - strictly for administrators
  const isAdmin =
    mounted &&
    (role === 'admin' ||
      user?.role === 'admin' ||
      user?.email?.toLowerCase() === 'krishnaprasath720@gmail.com');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 90,
          }}
        />
      )}

      <aside
        data-open={isOpen ? 'true' : 'false'}
        className={isOpen ? 'sidebar-open' : ''}
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-sidebar)',
          color: '#ffffff',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/ledger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #52b788, #2d6a4f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(82, 183, 136, 0.3)',
              }}
            >
              <Sprout size={22} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading-stack)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                }}
              >
                AgriTrack
              </div>
              <div style={{ fontSize: '0.72rem', color: '#95d5b2' }}>Smart Farm Suite</div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.4)',
              padding: '6px 12px',
            }}
          >
            Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                  backgroundColor: isActive ? 'rgba(82, 183, 136, 0.22)' : 'transparent',
                  border: isActive ? '1px solid rgba(82, 183, 136, 0.35)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} color={isActive ? '#74c69d' : 'rgba(255,255,255,0.6)'} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Admin Navigation Section - strictly visible ONLY when logged in as admin */}
          {isAdmin && (
            <>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255, 255, 255, 0.4)',
                  padding: '14px 12px 6px',
                }}
              >
                Administration
              </div>

              <Link
                href="/admin"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: pathname === '/admin' ? 600 : 500,
                  color: pathname === '/admin' ? '#ffffff' : 'rgba(255, 255, 255, 0.72)',
                  backgroundColor: pathname === '/admin' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                  border:
                    pathname === '/admin' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <ShieldAlert size={18} color={pathname === '/admin' ? '#fbbf24' : '#f59e0b'} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Admin Console</span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background: '#f59e0b',
                      color: '#000',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    ADMIN
                  </span>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* User Profile Footer */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(0, 0, 0, 0.22)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            {/* User Profile Info */}
            <Link
              href="/profile"
              onClick={onClose}
              title="Click to view & edit your profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                minWidth: 0,
                flex: 1,
                textDecoration: 'none',
                padding: '4px 6px',
                margin: '-4px -6px',
                borderRadius: '8px',
                transition: 'background-color 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Avatar Squircle */}
              <div
                suppressHydrationWarning
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                  border: '1px solid rgba(82, 183, 136, 0.35)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  letterSpacing: '0.02em',
                }}
              >
                {mounted && user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Text Info */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  suppressHydrationWarning
                  title={user?.fullName || ''}
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.25,
                  }}
                >
                  {mounted && user?.fullName ? user.fullName : 'Active Farmer'}
                </div>
                <div
                  suppressHydrationWarning
                  title={user?.email || ''}
                  style={{
                    fontSize: '0.72rem',
                    color: '#8fa998',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '2px',
                    lineHeight: 1.2,
                  }}
                >
                  {mounted ? user?.email : ''}
                </div>
              </div>
            </Link>

            {/* Professional Single-Line Logout Button */}
            <button
              type="button"
              onClick={() => setShowConfirmLogout(true)}
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 11px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.16)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                e.currentTarget.style.color = '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#e2e8f0';
              }}
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Confirmation Modal for Sidebar Logout */}
      {showConfirmLogout && (
        <div
          onClick={() => !loggingOut && setShowConfirmLogout(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(12, 43, 29, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '400px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              colorScheme: 'light',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <LogOut size={26} strokeWidth={2.2} />
            </div>

            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '8px',
                letterSpacing: '-0.02em',
              }}
            >
              Confirm Logout
            </h3>

            <p
              style={{
                fontSize: '0.92rem',
                color: '#64748b',
                lineHeight: 1.5,
                marginBottom: '24px',
              }}
            >
              Are you sure you want to log out of your AgriTrack account?
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loggingOut}
                onClick={() => setShowConfirmLogout(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: 650,
                  fontSize: '0.92rem',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={async () => {
                  setLoggingOut(true);
                  try {
                    await logout('/login');
                  } finally {
                    setLoggingOut(false);
                    setShowConfirmLogout(false);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 750,
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  opacity: loggingOut ? 0.8 : 1,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                <LogOut size={15} />
                <span>{loggingOut ? 'Logging out...' : 'Yes, Log Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
