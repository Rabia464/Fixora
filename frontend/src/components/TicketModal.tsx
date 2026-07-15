"use client"
import React, { useState } from 'react';
import { BubblyButton } from './BubblyButton';
import styles from './TicketModal.module.css';
import { useRouter } from 'next/navigation';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, location })
      });
      
      if (res.ok) {
        onClose();
        router.push('/dashboard/student');
        router.refresh();
      } else {
        // If not logged in, API returns 401
        if (res.status === 401) {
          router.push('/login');
        } else {
          throw new Error("API failed");
        }
      }
    } catch (err) {
      console.warn("Failed ticket submission", err);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`animate-pop-in ${styles.modal}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Report an Issue</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.stepIndicator}>
          {[1, 2, 3].map(i => (
            <div key={i} className={`${styles.dot} ${step >= i ? styles.active : ''}`} />
          ))}
        </div>

        <div className={styles.stepContent}>
          {step === 1 && (
            <div className="animate-pop-in">
              <label className={styles.label}>What's broken?</label>
              <p style={{color: 'var(--color-text-muted)', marginBottom: '16px'}}>Give it a short, catchy title.</p>
              <input className={styles.input} placeholder="e.g. Broken AC" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            </div>
          )}
          
          {step === 2 && (
            <div className="animate-pop-in">
              <label className={styles.label}>Where is it?</label>
              <p style={{color: 'var(--color-text-muted)', marginBottom: '16px'}}>Be as specific as possible!</p>
              <input className={styles.input} placeholder="e.g. Room 402, Hostel A" value={location} onChange={e => setLocation(e.target.value)} autoFocus />
            </div>
          )}

          {step === 3 && (
            <div className="animate-pop-in">
              <label className={styles.label}>Describe it</label>
              <p style={{color: 'var(--color-text-muted)', marginBottom: '16px'}}>Our AI loves details to route it faster!</p>
              <textarea className={styles.textarea} placeholder="The AC is making a weird buzzing noise..." value={description} onChange={e => setDescription(e.target.value)} autoFocus />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 1 ? (
            <BubblyButton variant="secondary" onClick={handleBack}>Back</BubblyButton>
          ) : <div></div>}
          
          {step < 3 ? (
            <BubblyButton onClick={handleNext} disabled={(step === 1 && !title) || (step === 2 && !location)}>Next</BubblyButton>
          ) : (
            <BubblyButton onClick={handleSubmit} disabled={!description}>Submit!</BubblyButton>
          )}
        </div>
      </div>
    </div>
  );
};
