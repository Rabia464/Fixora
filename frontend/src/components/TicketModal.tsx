"use client"
import React, { useState } from 'react';
import { BubblyButton } from './BubblyButton';
import { ProgressBar } from './ProgressBar';
import { MascotWidget } from './MascotWidget';
import { Wrench, Search, MapPin, Sparkles, CheckCircle2, ArrowRight, Camera, Trash2, AlertCircle } from 'lucide-react';
import styles from './TicketModal.module.css';
import { complaintsApi } from '../lib/api/complaints';

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      setImagePreview(null);
      setStep(1);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit complaint. Please try again.');
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

  return (
    <div className={styles.overlay}>
      <div className={`animate-pop-in ${styles.modal}`}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={20} color="var(--color-cyan)" />
            <h2 className={styles.title}>Report an Issue</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.stepIndicator}>
          <ProgressBar progress={(step / 3) * 100} color="cyan" />
        </div>

        <MascotWidget message={getMascotMessage()} icon={getStepIcon()} />

        {errorMessage && (
          <div style={{ margin: '12px 24px 0', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className={styles.stepContent}>
          {step === 1 && (
            <div className="animate-pop-in">
              <label className={styles.label}>Issue Title (min 5 characters)</label>
              <input 
                className={styles.input} 
                placeholder="e.g. Leaking Washroom Sink" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                autoFocus 
              />
            </div>
          )}
          
          {step === 2 && (
            <div className="animate-pop-in">
              <label className={styles.label}>Location (min 3 characters)</label>
              <input 
                className={styles.input} 
                placeholder="e.g. Room 304, 3rd Floor" 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                autoFocus 
              />
            </div>
          )}

          {step === 3 && (
            <div className="animate-pop-in">
              <label className={styles.label}>Description (min 10 characters)</label>
              <textarea 
                className={styles.textarea} 
                placeholder="Describe the issue in detail..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                autoFocus 
              />

              <label className={styles.label} style={{ marginTop: '14px' }}>Attach Photo (Optional)</label>
              
              {!imagePreview ? (
                <label className={styles.uploadBox}>
                  <Camera size={24} color="var(--color-text-muted)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Click to upload photo of broken item
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                  <button 
                    type="button" 
                    onClick={() => setImagePreview(null)}
                    style={{ position: 'absolute', top: '16px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '6px', color: 'white', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 1 ? (
            <BubblyButton variant="ghost" onClick={handleBack}>Back</BubblyButton>
          ) : <div />}
          
          {step < 3 ? (
            <BubblyButton variant="primary" onClick={handleNext} disabled={(step === 1 && title.trim().length < 5) || (step === 2 && location.trim().length < 3)}>
              Next <ArrowRight size={16} />
            </BubblyButton>
          ) : (
            <BubblyButton variant="secondary" onClick={handleSubmit} disabled={description.trim().length < 10 || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'} <CheckCircle2 size={16} />
            </BubblyButton>
          )}
        </div>
      </div>
    </div>
  );
};
