"use client"
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { BubblyButton } from '../components/BubblyButton';
import { Badge } from '../components/Badge';
import { TicketModal } from '../components/TicketModal';
import styles from './page.module.css';

export default function Home() {
  const [isModalOpen, setModalOpen] = useState(false);

  // Mock live feed data
  const feed = [
    { id: 1, text: "Maintenance just fixed the AC in Hostel A! ❄️", time: "2 mins ago" },
    { id: 2, text: "Plumbing issue resolved in Hostel C! 💧", time: "15 mins ago" },
    { id: 3, text: "New Wi-Fi router installed in Library 🌐", time: "1 hour ago" },
  ];

  return (
    <div className={`animate-pop-in ${styles.home}`}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.headline}>Hostel maintenance, made fun.</h1>
        <p className={styles.subheadline}>
          Earn points by helping us identify broken things. Our AI routes it instantly.
        </p>
        <BubblyButton style={{fontSize: '20px', padding: '16px 40px'}} onClick={() => setModalOpen(true)}>
          Report an Issue
        </BubblyButton>
      </section>

      {/* Stats & Feed */}
      <section className={styles.dashboardGrid}>
        <GlassCard className={styles.statsCard}>
          <h2 style={{color: 'var(--color-primary-dark)', fontSize: '48px', fontWeight: 900}}>342</h2>
          <p style={{fontWeight: 700, color: 'var(--color-text-muted)'}}>Issues Fixed This Month 🎉</p>
        </GlassCard>

        <GlassCard className={styles.feedCard}>
          <h3 style={{marginBottom: '16px'}}>Live Fix Feed</h3>
          <div className={styles.feedList}>
            {feed.map(item => (
              <div key={item.id} className={styles.feedItem}>
                <Badge status="success">Resolved</Badge>
                <div style={{flex: 1}}>
                  <p style={{fontWeight: 600}}>{item.text}</p>
                  <span style={{fontSize: '12px', color: 'var(--color-text-muted)'}}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <TicketModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
