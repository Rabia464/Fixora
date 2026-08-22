"use client"
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Cpu, UserCheck, Wrench, CheckCircle,
  ArrowRight, Zap, Shield, SearchCheck, Blocks, Activity
} from 'lucide-react';
import { Footer } from '../../components/Footer';
import styles from './about.module.css';

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function RevealSection({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.revealSection} ${visible ? styles.visible : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// Animated counter
function AnimatedNumber({ to, suffix = '', duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = to / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

export default function AboutPage() {
  const { ref: lcRef, visible: lcVisible } = useReveal(0.25);
  const [activeStep, setActiveStep] = useState(-1);
  useEffect(() => {
    if (!lcVisible) return;
    [0,1,2,3,4].forEach((_, i) => setTimeout(() => setActiveStep(i), i * 500));
  }, [lcVisible]);

  const steps = [
    { label: 'Report',   icon: <MessageSquare size={20} /> },
    { label: 'Analyse',  icon: <Cpu size={20} /> },
    { label: 'Review',   icon: <UserCheck size={20} /> },
    { label: 'Dispatch', icon: <Wrench size={20} /> },
    { label: 'Done',     icon: <CheckCircle size={20} /> },
  ];

  return (
    <>
      <div className={`animate-pop-in ${styles.page}`}>

        {/* ── HERO ── */}
        <section className={styles.heroSection}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              GIKI Hostel Maintenance Platform
            </div>
            <h1 className={styles.heroTitle}>
              Fix it,<br />
              <span className={styles.heroTitleAccent}>faster.</span>
            </h1>
            <p className={styles.heroSub}>
              One transparent workflow connecting students, supervisors, and maintenance teams. Say goodbye to manual sorting and lost tickets.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login">
                <button className={styles.primaryBtn}>
                  Get started <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── AI TRIAGE SECTION (Alternating Row) ── */}
        <section className={styles.featureRow}>
          <RevealSection className={styles.featureText}>
            <div className={styles.featureIcon}><Cpu size={24} /></div>
            <h2 className={styles.featureTitle}>AI-Powered Triage</h2>
            <p className={styles.featureDesc}>
              Our engine instantly classifies, prioritises, and routes every complaint the moment it's submitted.
            </p>
            <div className={styles.statsFlex}>
              <div className={styles.statBox}>
                <div className={styles.statNum}><AnimatedNumber to={3} suffix="s" /></div>
                <div className={styles.statLabel}>Avg. categorisation</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}><AnimatedNumber to={98} suffix="%" /></div>
                <div className={styles.statLabel}>Routing accuracy</div>
              </div>
            </div>
          </RevealSection>
          
          <RevealSection className={styles.featureVisual}>
            <div className={styles.abstractGraphic}>
               <div className={styles.floatCard} style={{ top: '10%', left: '10%', animationDelay: '0s' }}>
                 <Zap size={16} color="#F9D342" /> Priority: Critical
               </div>
               <div className={styles.floatCard} style={{ top: '45%', right: '5%', animationDelay: '1s' }}>
                 <Wrench size={16} color="#F9D342" /> Electrical Team
               </div>
               <div className={styles.floatCard} style={{ bottom: '15%', left: '20%', animationDelay: '2s' }}>
                 <SearchCheck size={16} color="#F9D342" /> Verified
               </div>
            </div>
          </RevealSection>
        </section>

        {/* ── TIMELINE SECTION ── */}
        <section className={styles.timelineSection}>
          <RevealSection>
            <div className={styles.timelineHeader}>
              <h2 className={styles.featureTitle}>Complaint Lifecycle</h2>
              <p className={styles.featureDesc}>Full end-to-end visibility. No blind spots.</p>
            </div>
            
            <div ref={lcRef} className={styles.lifecycleContainer}>
              {steps.map((s, i) => (
                <React.Fragment key={s.label}>
                  <div className={`${styles.stepItem} ${activeStep >= i ? styles.stepActive : ''}`}>
                    <div className={styles.stepCircle}>{s.icon}</div>
                    <span className={styles.stepLabel}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={styles.stepLineWrapper}>
                      <div
                        className={styles.stepLine}
                        style={{
                          opacity: activeStep > i ? 1 : 0.15,
                          transform: `scaleX(${activeStep > i ? 1 : 0})`,
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ── ROLES GRID SECTION ── */}
        <section className={styles.rolesSection}>
          <RevealSection>
            <div className={styles.rolesHeader}>
              <h2 className={styles.featureTitle}>One platform.<br/>Three roles.</h2>
            </div>
            <div className={styles.rolesGrid}>
              {[
                { icon: <MessageSquare size={24}/>, label: 'Students',     sub: 'Submit & track complaints in seconds without chasing anyone.' },
                { icon: <Shield size={24}/>,        label: 'Supervisors',  sub: 'AI-assisted review and instant one-click dispatch to the right team.' },
                { icon: <Wrench size={24}/>,        label: 'Maintenance',  sub: 'Prioritised task queue means teams always know what to fix next.' },
              ].map(r => (
                <div key={r.label} className={styles.roleBlock}>
                  <div className={styles.roleBlockIcon}>{r.icon}</div>
                  <h3 className={styles.roleBlockTitle}>{r.label}</h3>
                  <p className={styles.roleBlockSub}>{r.sub}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ── FINAL CTA ── */}
        <section className={styles.ctaSection}>
          <RevealSection>
            <div className={styles.ctaBox}>
              <h2 className={styles.ctaTitle}>Ready to report a problem?</h2>
              <p className={styles.ctaSub}>Sign in and submit a maintenance complaint in under 30 seconds.</p>
              <Link href="/login">
                <button className={styles.primaryBtn}>
                  Login to Fixora <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </RevealSection>
        </section>

      </div>
      <Footer />
    </>
  );
}
