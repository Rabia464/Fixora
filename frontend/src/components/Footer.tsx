import React from 'react';
import { Mail } from 'lucide-react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <h2 className={styles.brand}>Fixora.</h2>
          <div className={styles.socials}>
            <a href="https://github.com" target="_blank" rel="noreferrer" className={styles.iconLink}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
            <a href="mailto:contact@fixora.com" className={styles.iconLink}>
              <Mail size={20} />
            </a>
          </div>
        </div>
        
        <div className={styles.bottomSection}>
          <div className={styles.copyrightInner}>
            <p className={styles.copyright}>
              &copy; 2026 Fixora. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
