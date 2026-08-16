"use client"
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Cpu,
  UserCheck,
  Wrench,
  CheckCircle,
  ArrowRight,
  Tag,
  AlertTriangle,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { Footer } from '../../components/Footer';
import styles from './about.module.css';

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── AI analysis row ──────────────────────────────────────────────────────────
function AIRow({ icon, label, value, delay, visible }: {
  icon: React.ReactNode; label: string; value: string; delay: number; visible: boolean;
}) {
  return (
    <div
      className={styles.aiRow}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.45s ease, transform 0.45s ease`,
        transitionDelay: `${delay}ms`,
      }}
    >
      <span className={styles.aiRowIcon}>{icon}</span>
      <span className={styles.aiRowLabel}>{label}</span>
      <ChevronRight size={13} className={styles.aiRowChevron} />
      <span className={styles.aiRowValue}>{value}</span>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
type PillStatus = 'Forwarded' | 'InProgress' | 'Resolved';
function StatusPill({ status, active, delay, visible }: {
  status: PillStatus; active: boolean; delay: number; visible: boolean;
}) {
  const label = status === 'InProgress' ? 'In Progress' : status;
  return (
    <div
      className={styles.pillWrapper}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.45s ease, transform 0.45s ease`,
        transitionDelay: `${delay}ms`,
      }}
    >
      <span className={`${styles.pill} ${styles[`pill${status}`]} ${active ? styles.pillActive : ''}`}>
        {label}
      </span>
      {active && <span className={styles.pillDot} />}
    </div>
  );
}

// ─── Lifecycle step ───────────────────────────────────────────────────────────
function LifecycleStep({ num, label, icon, active }: {
  num: string; label: string; icon: React.ReactNode; active: boolean;
}) {
  return (
    <div className={`${styles.stepItem} ${active ? styles.stepItemActive : ''}`}>
      <div className={`${styles.stepCircle} ${active ? styles.stepCircleActive : ''}`}>
        {icon}
      </div>
      <span className={styles.stepNum}>{num}</span>
      <span className={styles.stepLabel}>{label}</span>
    </div>
  );
}

// ─── Reveal section wrapper ───────────────────────────────────────────────────
function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {children}
    </div>
  );
}

// ─── Main About page ──────────────────────────────────────────────────────────
export default function AboutPage() {
  // Lifecycle animation
  const { ref: lifecycleRef, visible: lifecycleVisible } = useReveal(0.2);
  const [activeStep, setActiveStep] = useState(-1);
  useEffect(() => {
    if (!lifecycleVisible) return;
    [0, 1, 2, 3, 4].forEach((step, i) => {
      setTimeout(() => setActiveStep(step), i * 750);
    });
  }, [lifecycleVisible]);

  // AI section
  const { ref: aiRef, visible: aiVisible } = useReveal();

  // Maintenance pills
  const { ref: maintRef, visible: maintVisible } = useReveal();
  const [activePill, setActivePill] = useState(-1);
  useEffect(() => {
    if (!maintVisible) return;
    [0, 1, 2].forEach((pill, i) => {
      setTimeout(() => setActivePill(pill), i * 900);
    });
  }, [maintVisible]);

  return (
    <>
      <div className={`animate-pop-in ${styles.page}`}>

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          GIKI Hostel Maintenance Platform
        </div>
        <h1 className={styles.heroTitle}>About Fixora</h1>
        <p className={styles.heroSub}>
          A smarter way to report, route, and resolve hostel maintenance problems
          — connecting students, supervisors, and maintenance teams through one
          transparent workflow.
        </p>
        <div className={styles.heroActions}>
          <Link href="/login">
            <button className={styles.ctaBtn}>
              Login to Fixora <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>



      {/* ── 3. AI ANALYSIS ──────────────────────────────────────────────────── */}
      <RevealSection className={`${styles.section} ${styles.sectionAlt}`}>
        <p className={styles.eyebrow}>Intelligent Assessment</p>
        <h2 className={styles.sectionTitle}>AI-Powered Triage</h2>
        <p className={styles.sectionBody}>
          Our proprietary engine instantly categorizes, prioritizes, and routes maintenance requests with high precision, ensuring faster resolution times.
        </p>
        <div ref={aiRef}>
          <div className={`glass-panel ${styles.aiCard}`}>
            <p className={styles.aiCardEyebrow}>System assessment</p>
            <AIRow icon={<Tag size={13} />} label="Category" value="Electrical" delay={0} visible={aiVisible} />
            <AIRow icon={<AlertTriangle size={13} />} label="Priority" value="Critical" delay={200} visible={aiVisible} />
            <AIRow icon={<Building2 size={13} />} label="Department" value="Electrical Maintenance" delay={400} visible={aiVisible} />
          </div>
        </div>
      </RevealSection>

      {/* ── 4. SUPERVISOR REVIEW ────────────────────────────────────────────── */}
      <RevealSection className={styles.section}>
        <p className={styles.eyebrow}>Human-in-the-Loop Validation</p>
        <h2 className={styles.sectionTitle}>Augmented Decision Making</h2>
        <p className={styles.sectionBody}>
          Supervisors maintain full control while benefiting from AI-driven insights, seamlessly validating suggestions before dispatching to specialized teams.
        </p>
        <div className={styles.handoffRow}>
          <div className={`glass-panel ${styles.handoffCard}`}>
            <div className={styles.handoffCardHead}>
              <div className={styles.handoffIcon}><Cpu size={14} /></div>
              <span className={styles.handoffCardTitle}>System suggestion</span>
            </div>
            <div className={styles.handoffDetails}>
              <p>Category: <strong>Electrical</strong></p>
              <p>Priority: <strong>Critical</strong></p>
              <p>Department: <strong>Electrical Maint.</strong></p>
            </div>
          </div>
          <ArrowRight size={20} className={styles.handoffArrow} />
          <div className={`glass-panel ${styles.handoffCard}`}>
            <div className={styles.handoffCardHead}>
              <div className={styles.handoffIcon}><UserCheck size={14} /></div>
              <span className={styles.handoffCardTitle}>Supervisor validated</span>
            </div>
            <p className={styles.handoffDesc}>
              Assessment confirmed. Complaint forwarded to{' '}
              <strong>Electrical Maintenance</strong> team with{' '}
              <strong>Critical</strong> priority.
            </p>
            <div className={styles.handoffSuccess}>
              <CheckCircle size={13} /> Dispatched
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── 5. MAINTENANCE RESOLUTION ───────────────────────────────────────── */}
      <RevealSection className={`${styles.section} ${styles.sectionAlt}`}>
        <p className={styles.eyebrow}>Streamlined Resolution</p>
        <h2 className={styles.sectionTitle}>End-to-End Visibility</h2>
        <p className={styles.sectionBody}>
          Maintenance professionals receive prioritized tickets instantly, allowing real-time progress tracking and automated stakeholder notifications throughout the lifecycle.
        </p>
        <div ref={maintRef} className={styles.pillsRow}>
          <StatusPill status="Forwarded" active={activePill >= 0} delay={0} visible={maintVisible} />
          <div
            className={styles.pillConnector}
            style={{ opacity: maintVisible && activePill >= 0 ? 1 : 0, transition: 'opacity 0.4s ease 0.3s' }}
          />
          <StatusPill status="InProgress" active={activePill >= 1} delay={400} visible={maintVisible} />
          <div
            className={styles.pillConnector}
            style={{ opacity: maintVisible && activePill >= 1 ? 1 : 0, transition: 'opacity 0.4s ease 0.7s' }}
          />
          <StatusPill status="Resolved" active={activePill >= 2} delay={800} visible={maintVisible} />
        </div>
        <div
          className={`glass-panel ${styles.resolvedNote}`}
          style={{ opacity: maintVisible && activePill >= 2 ? 1 : 0, transform: maintVisible && activePill >= 2 ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.5s ease 1.6s, transform 0.5s ease 1.6s' }}
        >
          <div className={styles.resolvedNoteHead}>
            <Wrench size={13} /> Maintenance update
          </div>
          <p>Socket replaced and earthing tested. Issue fully resolved.</p>
          <p className={styles.resolvedNoteFooter}>Student notified via platform notification.</p>
        </div>
      </RevealSection>

      {/* ── 6. LIFECYCLE OVERVIEW ───────────────────────────────────────────── */}
      <RevealSection className={styles.section}>
        <p className={styles.eyebrow}>The Complete Lifecycle</p>
        <h2 className={styles.sectionTitle}>One complaint. One transparent journey.</h2>
        <div ref={lifecycleRef} className={styles.lifecycle}>
          {[
            { num: '01', label: 'Report',   icon: <MessageSquare size={16} /> },
            { num: '02', label: 'Analyze',  icon: <Cpu size={16} /> },
            { num: '03', label: 'Review',   icon: <UserCheck size={16} /> },
            { num: '04', label: 'Dispatch', icon: <Wrench size={16} /> },
            { num: '05', label: 'Resolve',  icon: <CheckCircle size={16} /> },
          ].map((step, i) => (
            <React.Fragment key={step.num}>
              <LifecycleStep {...step} active={activeStep >= i} />
              {i < 4 && (
                <div
                  className={styles.lifecycleConnector}
                  style={{ backgroundColor: activeStep > i ? 'var(--color-cyan)' : 'rgba(0,0,0,0.1)', transition: 'background-color 0.4s ease' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </RevealSection>

      {/* ── 7. PRODUCT VALUE ────────────────────────────────────────────────── */}
      <RevealSection className={`${styles.section} ${styles.sectionAlt}`}>
        <p className={styles.eyebrow}>Engineered for Scale</p>
        <h2 className={styles.sectionTitle}>Seamless Integration for Every Stakeholder</h2>
        <div className={styles.valueGrid}>
          {[
            { label: 'Students', desc: 'Experience frictionless reporting with an intuitive interface. Gain complete visibility from submission to resolution.' },
            { label: 'Supervisors', desc: 'Leverage AI triage to eliminate bottlenecks. Make informed decisions and route issues with unprecedented efficiency.' },
            { label: 'Maintenance Teams', desc: 'Focus on fixing, not administration. Access prioritized workloads and update statuses with a single tap.' },
          ].map(({ label, desc }) => (
            <div key={label} className={`glass-panel ${styles.valueItem}`}>
              <div className={styles.valueBar} />
              <h3 className={styles.valueLabel}>{label}</h3>
              <p className={styles.valueDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ── 8. FINAL CTA ────────────────────────────────────────────────────── */}
      <RevealSection className={styles.section}>
        <div className={`glass-panel ${styles.ctaBlock}`}>
          <h2 className={styles.ctaTitle}>Ready to report a problem?</h2>
          <p className={styles.ctaSub}>Sign in to your Fixora account and submit a maintenance complaint.</p>
          <Link href="/login">
            <button className={styles.ctaBtn}>
              Login to Fixora <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </RevealSection>

      </div>

      <Footer />
    </>
  );
}
