from app.domain.enums.complaint import ComplaintPriority


class AIService:
    """
    Rule-based recommendation engine for complaint classification.
    Invoked only during complaint creation; can be swapped for ML later.
    """

    def predict(self, title: str, description: str) -> dict:
        try:
            text = f"{title} {description}".lower()

            if any(
                kw in text for kw in ("leak", "pipe", "water", "drain", "tap", "toilet", "washroom")
            ):
                category = "Plumbing"
                department = "Plumbing"
            elif any(
                kw in text
                for kw in ("power", "electric", "light", "socket", "wire", "fan", "short circuit")
            ):
                category = "Electrical"
                department = "Electrical"
            elif any(kw in text for kw in ("door", "window", "bed", "chair", "furniture", "lock")):
                category = "Furniture"
                department = "Maintenance"
            elif any(kw in text for kw in ("clean", "garbage", "pest", "insect", "rodent")):
                category = "Sanitation"
                department = "Sanitation"
            else:
                category = "General"
                department = "Maintenance"

            if any(
                kw in text for kw in ("fire", "gas", "spark", "flood", "emergency", "short circuit")
            ):
                priority = ComplaintPriority.CRITICAL
            elif any(kw in text for kw in ("leak", "no water", "no power", "broken", "unsafe")):
                priority = ComplaintPriority.HIGH
            elif any(kw in text for kw in ("slow", "minor", "small")):
                priority = ComplaintPriority.LOW
            else:
                priority = ComplaintPriority.MEDIUM

            return {
                "category": category,
                "priority": priority,
                "department": department,
            }
        except Exception:
            return {
                "category": None,
                "priority": None,
                "department": None,
            }


ai_service = AIService()
