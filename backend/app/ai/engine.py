from dataclasses import dataclass
import re

@dataclass
class Prediction:
    category: str
    priority: str
    department: str

class AIEngine:
    """
    Rule-based AI classification engine for Phase 1.
    Uses keyword matching to suggest category, priority, and department.
    Designed to be easily swappable with an ML model in the future.
    """
    
    def predict(self, description: str) -> Prediction:
        text = description.lower()
        
        category = "General"
        priority = "Low"
        department = "Hostel Admin"

        # Department & Category Rules
        if re.search(r'\b(leak|pipe|water|washroom|tap|sink)\b', text):
            category = "Plumbing"
            department = "Maintenance"
        elif re.search(r'\b(wire|spark|light|fan|socket|electricity|power)\b', text):
            category = "Electrical"
            department = "Maintenance"
        elif re.search(r'\b(bed|door|window|desk|chair|wood|lock)\b', text):
            category = "Carpentry"
            department = "Maintenance"
        elif re.search(r'\b(wifi|internet|network|router)\b', text):
            category = "IT"
            department = "IT Support"
            
        # Priority Rules
        if re.search(r'\b(emergency|spark|fire|flood|continuous|urgent|immediately)\b', text):
            priority = "Critical"
        elif re.search(r'\b(broken|not working|cannot use)\b', text):
            priority = "High"
        elif re.search(r'\b(slow|noise|flickering)\b', text):
            priority = "Medium"
            
        return Prediction(
            category=category,
            priority=priority,
            department=department
        )
