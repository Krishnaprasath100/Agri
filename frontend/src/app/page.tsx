'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowRight } from 'lucide-react';
import styles from './splash.module.css';

export default function AppIntroPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [redirected, setRedirected] = useState(false);

  // Determine destination based on auth state
  const destination = user ? '/ledger' : '/login';

  const navigateToApp = useCallback(() => {
    if (redirected) return;
    setRedirected(true);
    router.replace(destination);
  }, [redirected, router, destination]);

  useEffect(() => {
    // Prefetch destination for seamless, instant transition
    router.prefetch(destination);

    // Auto-transition after intro animation completes (~2.2s)
    const timer = setTimeout(() => {
      if (!loading) {
        navigateToApp();
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [loading, destination, navigateToApp, router]);

  return (
    <main
      className={styles.splashContainer}
      onClick={navigateToApp}
      role="button"
      tabIndex={0}
      aria-label="AgriTrack App Splash Screen"
    >
      <div className={styles.ambientGlow} />

      <div className={styles.stage}>
        {/* Animated Logo Badge */}
        <div className={styles.logoWrapper}>
          <div className={styles.rippleRing} />
          <div className={styles.logoBadge}>
            <svg
              className={styles.sproutSvg}
              viewBox="0 0 512 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g
                transform="translate(256, 266)"
                stroke="#FFFFFF"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Vertical Stem */}
                <line x1="0" y1="95" x2="0" y2="-20" />
                {/* Ground Line */}
                <line x1="-55" y1="95" x2="55" y2="95" />
                {/* Left Leaf */}
                <path d="M0,-20 C0,-95 -75,-125 -75,-125 C-75,-125 -50,-45 0,-20" />
                {/* Right Leaf */}
                <path d="M0,-20 C0,-95 75,-125 75,-125 C75,-125 50,-45 0,-20" />
              </g>
            </svg>
          </div>
        </div>

        {/* Animated App Name */}
        <div className={styles.titleGroup}>
          <h1 className={styles.appName}>
            <span className={styles.nameAgri}>Agri</span>
            <span className={styles.nameTrack}>Track</span>
          </h1>
          <p className={styles.tagline}>
            <span>{language === 'ta' ? 'விவசாய மேலாண்மை தளம்' : 'Smart Farm Ledger'}</span>
            <span className={styles.taglineDot} />
            <span>{language === 'ta' ? 'கணக்கு பதிவேடு' : 'Crop Lifecycle'}</span>
          </p>
        </div>

        {/* Progress Bar Animation */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar} />
        </div>

        {/* Interactive Tap Pill */}
        <div
          className={styles.actionPill}
          onClick={(e) => {
            e.stopPropagation();
            navigateToApp();
          }}
        >
          <span>{language === 'ta' ? 'தொடர தட்டவும்' : 'Tap to continue'}</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </main>
  );
}
