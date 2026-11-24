'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Menu,
  Calendar,
  LogIn,
  UserPlus,
  LogOut,
  X,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface TopNavProps {
  onToggleSidebar?: () => void;
  isMobileScreen?: boolean;
  mobileUpperBarOpen?: boolean;
  onToggleUpperBar?: (open: boolean) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleSidebar,
  isMobileScreen = false,
  mobileUpperBarOpen = true,
  onToggleUpperBar,
}) => {
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirmLogout) {
        setShowConfirmLogout(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirmLogout]);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleLogoutClick = () => {
    setShowConfirmLogout(true);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout('/login');
    } finally {
      setLoggingOut(false);
      setShowConfirmLogout(false);
    }
  };

  return (
    <>
      {/* Three-arrow toggle button when upper bar is hidden on mobile (->) */}
      {isMobileScreen && !mobileUpperBarOpen && (
        <div className="mobile-upperbar-closed-dock">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="mobile-dock-menu-btn"
            aria-label="Open Navigation Menu"
            title="Menu"
          >
            <Menu size={16} strokeWidth={2.2} />
          </button>
          <div className="mobile-dock-divider" />
          <button
            type="button"
            className="mobile-upperbar-toggle-btn is-closed"
            onClick={() => onToggleUpperBar?.(true)}
            aria-label="Display upper bar (->)"
            title="Display upper bar (->)"
          >
            <span className="three-arrow-icon" aria-hidden="true">
              <ChevronRight size={13} strokeWidth={2.4} />
              <ChevronRight size={13} strokeWidth={2.4} style={{ marginLeft: -8 }} />
              <ChevronRight size={13} strokeWidth={2.4} style={{ marginLeft: -8 }} />
            </span>
          </button>
        </div>
      )}

      <header className={`app-topnav${isMobileScreen && !mobileUpperBarOpen ? ' is-mobile-collapsed' : ''}`}>
        <div className="app-topnav-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Three-arrow close button when upper bar is displayed on mobile (<-) */}
          {isMobileScreen && mobileUpperBarOpen && (
            <button
              type="button"
              className="mobile-upperbar-toggle-btn is-open"
              onClick={() => onToggleUpperBar?.(false)}
              aria-label="Close upper bar (<-)"
              title="Close upper bar (<-)"
            >
              <span className="three-arrow-icon" aria-hidden="true">
                <ChevronLeft size={13} strokeWidth={2.4} />
                <ChevronLeft size={13} strokeWidth={2.4} style={{ marginLeft: -8 }} />
                <ChevronLeft size={13} strokeWidth={2.4} style={{ marginLeft: -8 }} />
              </span>
            </button>
          )}

          {/* Desktop/tablet sidebar toggle (hidden on mobile app upper bar per user request) */}
          {!isMobileScreen && (
            <button
              onClick={onToggleSidebar}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                color: 'var(--text-main)',
              }}
              className="mobile-toggle-btn"
              aria-label="Toggle Navigation"
            >
              <Menu size={22} />
            </button>
          )}

          <div className="app-topnav-user-info">
            <div suppressHydrationWarning style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-900)' }}>
              {mounted && user?.fullName ? user.fullName : 'AgriTrack Farm Suite'}
            </div>
            <div
              suppressHydrationWarning
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Calendar size={12} /> {mounted ? today : ''}
            </div>
          </div>
        </div>

        <div className="app-topnav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            title={language === 'en' ? 'தமிழில் மாற்றவும்' : 'Switch to English'}
            aria-label="Change application language"
            className="language-toggle"
          >
            {language === 'en' ? 'தமிழ்' : 'English'}
          </button>

          {/* Auth Button: If logged in, show Log Out with confirmation. If not logged in, show Login and Sign Up. */}
          <div>
            {mounted && user ? (
              <button
                type="button"
                onClick={handleLogoutClick}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#dc2626',
                  borderColor: '#fca5a5',
                  backgroundColor: '#fef2f2',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.15s ease',
                }}
                title="Sign Out of Account"
              >
                <LogOut size={14} /> Log Out
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  href="/login"
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  <LogIn size={13} /> Login
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  <UserPlus size={13} /> Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        <style jsx global>{`
          @media (max-width: 992px) {
            .mobile-toggle-btn {
              display: block !important;
            }
          }
        `}</style>
      </header>

      {/* Confirmation Modal for Logout */}
      {showConfirmLogout && (
        <div
          onClick={() => !loggingOut && setShowConfirmLogout(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
            animation: 'fadeIn 0.18s ease',
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
                onClick={handleConfirmLogout}
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

export default TopNav;
