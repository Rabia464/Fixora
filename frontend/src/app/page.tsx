"use client"
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { TicketModal } from '../components/TicketModal';
import { Sparkles, CheckCircle2, Zap, ShieldCheck, Send, Cpu, Wrench } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className={`animate-pop-in ${styles.home}`}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <Sparkles size={14} /> Smart Hostel Complaints
        </div>
        <h1 className={styles.headline}>
          Hostel Maintenance System
        </h1>
      </section>

      {/* Stats Grid */}
      <section className={styles.statsGrid}>
        <GlassCard accent="mint" className={styles.statTile}>
          <div className={styles.statIcon} style={{ background: 'var(--color-mint-bg)', color: 'var(--color-mint)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statNumber} style={{ color: 'var(--color-mint)' }}>342</div>
          <div className={styles.statLabel}>Issues Fixed</div>
        </GlassCard>

        <GlassCard accent="cyan" className={styles.statTile}>
          <div className={styles.statIcon} style={{ background: 'var(--color-cyan-bg)', color: 'var(--color-cyan)' }}>
            <Zap size={24} />
          </div>
          <div className={styles.statNumber} style={{ color: 'var(--color-cyan)' }}>&lt; 15m</div>
          <div className={styles.statLabel}>Avg AI Response</div>
        </GlassCard>

        <GlassCard accent="purple" className={styles.statTile}>
          <div className={styles.statIcon} style={{ background: 'var(--color-indigo-bg)', color: 'var(--color-indigo)' }}>
            <ShieldCheck size={24} />
          </div>
          <div className={styles.statNumber} style={{ color: 'var(--color-indigo)' }}>99.2%</div>
          <div className={styles.statLabel}>Resolution Rate</div>
        </GlassCard>
      </section>

      {/* Premium How It Works Section */}
      <section className={styles.premiumSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>The Fixora Experience</h2>
          <p className={styles.sectionSubtitle}>Seamless. Intelligent. Lightning fast.</p>
        </div>
        
        <div className={styles.stepContainer}>
          <div className={styles.stepCard}>
            <div className={styles.stepGlow} style={{ background: 'var(--color-cyan)' }}></div>
            <div className={styles.stepContent}>
              <div className={styles.stepIconWrapper}>
                <Send size={28} color="var(--color-cyan)" />
              </div>
              <h3 className={styles.stepHeading}>1. Submit</h3>
              <p className={styles.stepDesc}>Log your issue with zero friction. Seamlessly syncs with your hostel dashboard.</p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepGlow} style={{ background: 'var(--color-indigo)' }}></div>
            <div className={styles.stepContent}>
              <div className={styles.stepIconWrapper}>
                <Cpu size={28} color="var(--color-indigo)" />
              </div>
              <h3 className={styles.stepHeading}>2. AI Routing</h3>
              <p className={styles.stepDesc}>Our intelligence engine instantly categorizes and prioritizes your ticket.</p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepGlow} style={{ background: 'var(--color-mint)' }}></div>
            <div className={styles.stepContent}>
              <div className={styles.stepIconWrapper}>
                <Wrench size={28} color="var(--color-mint)" />
              </div>
              <h3 className={styles.stepHeading}>3. Resolve</h3>
              <p className={styles.stepDesc}>Maintenance is dispatched immediately. You get notified upon completion.</p>
            </div>
          </div>
        </div>
      </section>

      <TicketModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
