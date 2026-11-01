import { describe, expect, it } from 'vitest';
import { classifyComplaint } from '../classifier';

const cat = (text: string) => classifyComplaint(text, '').category;
const pri = (text: string) => classifyComplaint(text, '').priority;

describe('classifyComplaint', () => {
  it('categorises by keyword, including plural and -ing forms', () => {
    expect(cat('Leaking pipes in washroom')).toBe('Plumbing');
    expect(cat('Lights flickering')).toBe('Electrical');
    expect(cat('No electricity since morning')).toBe('Electrical');
    expect(cat('Broken chairs')).toBe('Furniture');
    expect(cat('Cockroaches in corridor')).toBe('Sanitation');
  });

  it('does not match keywords inside other words', () => {
    expect(cat('My laptop charger is missing')).toBe('General'); // "tap"
    expect(cat('Room is slightly cramped')).toBe('General'); // "light"
    expect(cat('Bedroom ceiling paint peeling')).toBe('General'); // "bed"
    expect(cat('Fancy new curtains requested')).toBe('General'); // "fan"
    expect(cat('Noise from Block C at night')).toBe('General'); // "lock"
  });

  it('routes to the department for the category', () => {
    expect(classifyComplaint('Tap leaking', '').department).toBe('Plumbing');
    expect(classifyComplaint('Door hinge broken', '').department).toBe('Maintenance');
    expect(classifyComplaint('Garbage not collected', '').department).toBe('Sanitation');
  });

  it('assigns priority', () => {
    expect(pri('Sparks from socket')).toBe('Critical');
    expect(pri('Room flooded')).toBe('Critical');
    expect(pri('Window broken')).toBe('High');
    expect(pri('Minor scratch on desk')).toBe('Low');
    expect(pri('Fan makes noise')).toBe('Medium');
  });
});
