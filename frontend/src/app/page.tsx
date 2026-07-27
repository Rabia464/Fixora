"use client"
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { BubblyButton } from '../components/BubblyButton';
import { Badge } from '../components/Badge';
import { TicketModal } from '../components/TicketModal';
import { Snowflake, Droplets, Wifi, Sparkles, CheckCircle2, Zap, Wrench, Activity, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const [isModalOpen, setModalOpen] = useState(false);

  const feed = [
    { id: 1, text: "Maintenance just resolved the AC in Hostel A", time: "2 mins ago", icon: <Snowflake size={15} />, status: 'success' as const },
    { id: 2, text: "Plumbing ticket completed in Hostel C", time: "15 mins ago", icon: <Droplets size={15} />, status: 'info' as const },
    { id: 3, text: "New Wi-Fi router configured in Library", time: "1 hour ago", icon: <Wifi size={15} />, status: 'purple' as const },
  ];

  return (
    <div className={`animate-pop-in ${styles.home}`}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <Sparkles size={14} /> Smart Hostel Complaints
        </div>
        <h1 className={styles.headline}>
          Hostel maintenance, <span className={styles.highlightText}>simplified & transparent.</span>
        </h1>
        <p className={styles.subheadline}>
          Report issues in seconds. Our AI instantly classifies, prioritizes, and routes your complaint directly to the maintenance team.
        </p>
        <div className={styles.heroActions}>
          <BubblyButton variant="primary" onClick={() => setModalOpen(true)}>
            <Wrench size={18} /> Report an Issue Now
          </BubblyButton>
        </div>
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

      {/* Live Activity & System Info Grid */}
      <section className={styles.dashboardGrid}>
        <GlassCard className={styles.feedCard}>
          <div className={styles.feedHeader}>
            <h3 className={styles.feedTitle}>
              <Activity size={20} color="var(--color-cyan)" /> Live Resolution Activity
            </h3>
            <Badge status="success">Live Feed</Badge>
          </div>
          <div className={styles.feedList}>
            {feed.map(item => (
              <div key={item.id} className={styles.feedItem}>
                <Badge status={item.status}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.icon} Fixed
                  </span>
                </Badge>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-main)' }}>{item.text}</p>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard accent="cyan" className={styles.feedCard}>
          <div className={styles.feedHeader}>
            <h3 className={styles.feedTitle}>
              <Clock size={20} color="var(--color-indigo)" /> How Fixora Works
            </h3>
            <Badge status="purple">AI Powered</Badge>
          </div>
          <div className={styles.feedList}>
            <div className={styles.feedItem}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-cyan-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-cyan)' }}>
                1
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '14px' }}>Submit Issue</p>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Provide title, location & description</span>
              </div>
            </div>

            <div className={styles.feedItem}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-indigo-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-indigo)' }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '14px' }}>AI Routing & Review</p>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Instant category tag & supervisor review</span>
              </div>
            </div>

            <div className={styles.feedItem}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-mint-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-mint)' }}>
                3
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '14px' }}>Maintenance Dispatch</p>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Assigned to staff & marked resolved</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      <TicketModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
