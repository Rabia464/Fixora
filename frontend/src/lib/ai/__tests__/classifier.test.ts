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


const predict = (title: string, description = '') => classifyComplaint(title, description);

describe('AI triage classifier', () => {
  it.each([
    ['Leaking pipe under sink', 'Plumbing', 'Plumbing'],
    ['Toilet will not flush', 'Plumbing', 'Plumbing'],
    ['Socket not working', 'Electrical', 'Electrical'],
    ['Ceiling fan is making noise', 'Electrical', 'Electrical'],
    ['Door lock jammed', 'Furniture', 'Maintenance'],
    ['Broken chair', 'Furniture', 'Maintenance'],
    ['Garbage not collected', 'Sanitation', 'Sanitation'],
    ['Rodent spotted in corridor', 'Sanitation', 'Sanitation'],
    ['Something odd in my room', 'General', 'Maintenance'],
  ])('%s → %s / %s', (title, category, department) => {
    expect(predict(title)).toMatchObject({ category, department });
  });

  it('reads the description as well as the title', () => {
    expect(predict('Help', 'the tap in room 4 is dripping')).toMatchObject({ category: 'Plumbing' });
  });

  it('is case-insensitive', () => {
    expect(predict('POWER OUTAGE')).toMatchObject({ category: 'Electrical' });
  });

  it('plumbing wins when several categories match', () => {
    // Order of the rules matters: "water" (plumbing) beats "light" (electrical).
    expect(predict('Water dripping on the light')).toMatchObject({ category: 'Plumbing' });
  });

  it.each([
    ['Sparks from the socket', 'Critical'],
    ['Smell of gas in kitchen', 'Critical'],
    ['Short circuit in room', 'Critical'],
    ['No water since morning', 'High'],
    ['Broken window', 'High'],
    ['Minor scratch on desk', 'Low'],
    ['Fan runs slow', 'Low'],
    ['Desk needs repainting', 'Medium'],
  ])('%s → priority %s', (title, priority) => {
    expect(predict(title).priority).toBe(priority);
  });

  it('critical keywords outrank high and low ones', () => {
    expect(predict('Minor leak turned into a flood').priority).toBe('Critical');
  });

  it('handles empty input', () => {
    expect(predict('', '')).toEqual({ category: 'General', priority: 'Medium', department: 'Maintenance' });
  });
});
