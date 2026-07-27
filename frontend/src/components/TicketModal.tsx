"use client"
import React, { useState } from 'react';
import { BubblyButton } from './BubblyButton';
import { ProgressBar } from './ProgressBar';
import { MascotWidget } from './MascotWidget';
import { Wrench, Search, MapPin, Sparkles, CheckCircle2, ArrowRight, Camera, Upload, Trash2 } from 'lucide-react';
import styles from './TicketModal.module.css';
import { useRouter } from 'next/navigation';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, location })
      });
      
      if (res.ok) {
        if (onSuccess) onSuccess(`Ticket "${title}" submitted successfully!`);
        onClose();
        router.push('/dashboard/student');
        router.refresh();
      } else {
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

  const getMascotMessage = () => {
    if (step === 1) return "What needs fixing? Give it a clear title so our AI can route it efficiently.";
    if (step === 2) return "Where is the issue located? Specify hostel building and room number.";
    return "Describe the problem and attach a photo to help maintenance fix it faster!";
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

        <div className={styles.stepContent}>
          {step === 1 && (
            <div className="animate-pop-in">
              <label className={styles.label}>Issue Title</label>
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
              <label className={styles.label}>Location</label>
              <input 
                className={styles.input} 
                placeholder="e.g. Hostel B, Room 304" 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                autoFocus 
              />
            </div>
          )}

          {step === 3 && (
            <div className="animate-pop-in">
              <label className={styles.label}>Description</label>
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
            <BubblyButton variant="primary" onClick={handleNext} disabled={(step === 1 && !title) || (step === 2 && !location)}>
              Next <ArrowRight size={16} />
            </BubblyButton>
          ) : (
            <BubblyButton variant="secondary" onClick={handleSubmit} disabled={!description}>
              Submit Ticket <CheckCircle2 size={16} />
            </BubblyButton>
          )}
        </div>
      </div>
    </div>
  );
};
