'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
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
              viewBox="0 0 1024 1024"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Blue Leaves App Logo */}
              <path
                d="M 147,289 L 163,313 L 180,352 L 198,416 L 216,465 L 237,503 L 267,538 L 296,560 L 329,576 L 370,587 L 412,591 L 411,567 L 405,530 L 386,473 L 372,446 L 356,422 L 334,397 L 309,376 L 311,375 L 349,403 L 372,427 L 395,459 L 411,489 L 423,518 L 436,564 L 438,579 L 437,538 L 441,499 L 448,466 L 460,429 L 451,405 L 440,385 L 413,353 L 385,332 L 355,316 L 327,305 L 298,297 L 258,290 L 224,287 Z"
                fill="#0a7dda"
                fillRule="evenodd"
              />
              <path
                d="M 876,287 L 839,283 L 765,284 L 721,289 L 667,300 L 617,317 L 577,337 L 544,360 L 519,384 L 499,411 L 486,435 L 468,491 L 463,530 L 463,577 L 473,639 L 455,740 L 485,738 L 518,591 L 536,545 L 561,499 L 589,461 L 618,431 L 669,394 L 675,393 L 645,416 L 612,451 L 592,479 L 571,518 L 559,547 L 545,596 L 537,643 L 536,672 L 592,667 L 648,651 L 702,621 L 737,589 L 767,549 L 788,509 L 809,452 L 839,351 L 860,308 Z"
                fill="#0a7dda"
                fillRule="evenodd"
              />
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
      </div>
    </main>
  );
}
