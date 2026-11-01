"use client"
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { BubblyButton } from './BubblyButton';

interface LoadErrorProps {
  message: string;
  onRetry: () => void;
}

/** Shown in place of a list when loading fails, so a failure never reads as "nothing to do". */
export const LoadError: React.FC<LoadErrorProps> = ({ message, onRetry }) => (
  <GlassCard accent="coral" role="alert" style={{ textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
    <AlertTriangle size={40} color="var(--color-coral)" style={{ margin: '0 auto 12px' }} />
    <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Couldn&rsquo;t load tickets</h2>
    <p style={{ color: 'var(--color-text-muted)', fontWeight: 500, margin: '6px 0 16px' }}>{message}</p>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <BubblyButton variant="primary" onClick={onRetry}>
        <RefreshCw size={15} /> Try again
      </BubblyButton>
    </div>
  </GlassCard>
);
