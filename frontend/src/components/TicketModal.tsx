"use client"
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BubblyButton } from './BubblyButton';
import { ProgressBar } from './ProgressBar';
import { MascotWidget } from './MascotWidget';
import { Wrench, Search, MapPin, Sparkles, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import styles from './TicketModal.module.css';
import { complaintsApi } from '../lib/api/complaints';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const canAdvance =
    (step === 1 && title.trim().length >= 5) || (step === 2 && location.trim().length >= 3);
  const canSubmit = description.trim().length >= 10 && !isSubmitting;

  const handleNext = () => {
    if (canAdvance) setStep(s => s + 1);
  };
  const handleBack = () => setStep(s => s - 1);

  // Pressing Enter in a single-line field moves to the next step.
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await complaintsApi.createComplaint({
        title,
        description,
        location,
      });

      if (onSuccess) onSuccess(`Ticket "${title}" submitted successfully!`);
      // Reset form
      setTitle('');
      setLocation('');
      setDescription('');
      setStep(1);
      onClose();
    } catch (err) {
      setErrorMessage((err instanceof Error ? err.message : 'Failed to submit complaint. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMascotMessage = () => {
    if (step === 1) return "What needs fixing? Give it a clear title so our AI can route it efficiently.";
    if (step === 2) return "Where is the issue located? Specify room number or area.";
    return "Describe the problem in detail to help maintenance fix it faster!";
  };

  const getStepIcon = () => {
    if (step === 1) return <Search size={18} color="var(--color-cyan)" />;
    if (step === 2) return <MapPin size={18} color="var(--color-cyan)" />;
    return <Sparkles size={18} color="var(--color-cyan)" />;
  };

  // Portal to <body> so the fixed overlay covers the whole viewport.
  return createPortal(
    <div className={styles.overlay}>
      <div
        className={`animate-pop-in ${styles.modal}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-modal-title"
      >
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={20} color="var(--color-cyan)" />
            <h2 className={styles.title} id="ticket-modal-title">Report an Issue</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.stepIndicator} aria-label={`Step ${step} of 3`}>
          <ProgressBar progress={(step / 3) * 100} color="cyan" />
        </div>

        <MascotWidget message={getMascotMessage()} icon={getStepIcon()} />

        {errorMessage && (
          <div role="alert" style={{ margin: '12px 24px 0', padding: '10px 14px', background: 'var(--color-coral-bg)', border: '1px solid var(--color-coral)', borderRadius: '8px', color: 'var(--color-coral)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className={styles.stepContent}>
          {step === 1 && (
            <div className="animate-pop-in">
              <label className={styles.label} htmlFor="ticket-title">Issue Title (min 5 characters)</label>
              <input 
                id="ticket-title"
                className={styles.input} 
                onKeyDown={handleInputKeyDown}
                placeholder="e.g. Leaking Washroom Sink" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                autoFocus 
              />
            </div>
          )}
          
          {step === 2 && (
            <div className="animate-pop-in">
              <label className={styles.label} htmlFor="ticket-location">Location (min 3 characters)</label>
              <input 
                id="ticket-location"
                className={styles.input} 
                onKeyDown={handleInputKeyDown}
                placeholder="e.g. Room 304, 3rd Floor" 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                autoFocus 
              />
            </div>
          )}

          {step === 3 && (
            <div className="animate-pop-in">
              <label className={styles.label} htmlFor="ticket-description">Description (min 10 characters)</label>
              <textarea 
                id="ticket-description"
                className={styles.textarea} 
                placeholder="Describe the issue in detail..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                autoFocus 
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 1 ? (
            <BubblyButton variant="ghost" onClick={handleBack}>Back</BubblyButton>
          ) : <div />}
          
          {step < 3 ? (
            <BubblyButton variant="primary" onClick={handleNext} disabled={!canAdvance}>
              Next <ArrowRight size={16} />
            </BubblyButton>
          ) : (
            <BubblyButton variant="secondary" onClick={handleSubmit} disabled={!canSubmit}>
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'} <CheckCircle2 size={16} />
            </BubblyButton>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
