export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AIPrediction {
  category: string;
  priority: ComplaintPriority;
  department: string;
}

export class AIService {
  /**
   * Rule-based recommendation engine for complaint classification.
   * Analyzes title and description to predict category, priority, and routing department.
   */
  public predict(title: string, description: string): AIPrediction {
    try {
      const text = `${title} ${description}`.toLowerCase();

      let category = 'General';
      let department = 'Maintenance';

      if (['leak', 'pipe', 'water', 'drain', 'tap', 'toilet', 'washroom'].some((kw) => text.includes(kw))) {
        category = 'Plumbing';
        department = 'Plumbing';
      } else if (['power', 'electric', 'light', 'socket', 'wire', 'fan', 'short circuit'].some((kw) => text.includes(kw))) {
        category = 'Electrical';
        department = 'Electrical';
      } else if (['door', 'window', 'bed', 'chair', 'furniture', 'lock'].some((kw) => text.includes(kw))) {
        category = 'Furniture';
        department = 'Maintenance';
      } else if (['clean', 'garbage', 'pest', 'insect', 'rodent'].some((kw) => text.includes(kw))) {
        category = 'Sanitation';
        department = 'Sanitation';
      }

      let priority: ComplaintPriority = 'Medium';

      if (['fire', 'gas', 'spark', 'flood', 'emergency', 'short circuit'].some((kw) => text.includes(kw))) {
        priority = 'Critical';
      } else if (['leak', 'no water', 'no power', 'broken', 'unsafe'].some((kw) => text.includes(kw))) {
        priority = 'High';
      } else if (['slow', 'minor', 'small'].some((kw) => text.includes(kw))) {
        priority = 'Low';
      }

      return {
        category,
        priority,
        department,
      };
    } catch {
      return {
        category: 'General',
        priority: 'Medium',
        department: 'Maintenance',
      };
    }
  }
}

export const aiService = new AIService();
