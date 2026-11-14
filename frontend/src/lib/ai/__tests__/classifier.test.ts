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
    expect(cat('My laptop bag is missing')).toBe('General'); // "tap"
    expect(cat('Room is slightly cramped')).toBe('General'); // "light"
    expect(cat('Bedroom ceiling paint peeling')).toBe('General'); // "bed"
    expect(cat('Fancy new posters requested')).toBe('General'); // "fan"
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
    expect(pri('Window glass shattered')).toBe('High');
    expect(pri('Window broken')).toBe('Medium');
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

  it('picks the category with the strongest keywords', () => {
    // "leak" is a strong plumbing word; "light" only says where the water lands.
    expect(predict('Water leaking from the pipe onto the light')).toMatchObject({ category: 'Plumbing' });
    // Title words count double: the description only gives the location.
    expect(predict('Fan not working', 'Room next to the washroom')).toMatchObject({ category: 'Electrical' });
  });

  it('ties go to the specific trade in rule order', () => {
    expect(predict('Light', 'water')).toMatchObject({ category: 'Electrical' });
    expect(predict('Tap and socket')).toMatchObject({ category: 'Plumbing' });
  });

  it('sends structural and safety-equipment complaints to General', () => {
    expect(predict('Crack in the wall')).toMatchObject({ category: 'General', department: 'Maintenance' });
    expect(predict('Lift stuck between floors')).toMatchObject({ category: 'General', priority: 'High' });
    // A specific trade still wins over a passing structural word.
    expect(predict('Ceiling fan stopped')).toMatchObject({ category: 'Electrical' });
  });

  it.each([
    ['Electric shock from the switch', 'Critical'],
    ['Exposed wires in the corridor', 'Critical'],
    ['Burning smell from the switchboard', 'Critical'],
    ['Smoke coming from the store room', 'Critical'],
    ['Pipe burst, washroom flooding', 'Critical'],
    ['Power outage on the whole floor', 'High'],
    ['Toilet blocked and overflowing', 'High'],
    ['Cannot lock my room door', 'High'],
    ['Rats in the room', 'High'],
    ['Plaster falling from the ceiling', 'High'],
    ['Tube light flickering', 'Low'],
    ['Paint peeling off the wall', 'Low'],
    ['Leaking tap', 'Medium'],
  ])('safety-first priority: %s → %s', (title, priority) => {
    expect(predict(title).priority).toBe(priority);
  });

  it.each([
    ['Sparks from the socket', 'Critical'],
    ['Smell of gas in kitchen', 'Critical'],
    ['Short circuit in room', 'Critical'],
    ['No water since morning', 'High'],
    ['Window glass shattered', 'High'],
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
