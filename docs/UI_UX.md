# UI/UX Design Language

## Concept
The Fixora UI merges the approachability of **Duolingo** with the premium feel of **Apple's Liquid Glass (iOS 27)**. The goal is to make reporting and managing hostel complaints a frictionless, almost joyful experience, counteracting the usual frustration associated with maintenance issues.

## Design Tokens

### 1. Colors (Colourful Pastels)
- **Backgrounds:** Soft animated gradient meshes (Peach to Mint Green to Baby Blue).
- **Primary Action (Brand):** Vibrant Pastel Blue (`#74C0FC`).
- **Success (Resolved):** Soft Mint Green (`#8CE99A`).
- **Warning/High Priority:** Pastel Orange/Yellow (`#FFD43B`).
- **Critical/Error:** Soft Coral/Pink (`#FFA8A8`).
- **Surfaces:** Translucent White (`rgba(255, 255, 255, 0.4)`).

### 2. Glassmorphism (Liquid Glass)
- **Backdrop Filter:** Extensive use of `backdrop-filter: blur(24px) saturate(180%)` to create the liquid glass effect.
- **Borders:** Subtle, 1px solid white borders with 30-50% opacity to define edges.
- **Shadows:** Soft, diffused drop shadows (e.g., `box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15)`).
- **Corner Radii:** Exaggerated rounded corners (24px to 32px) for cards and buttons.

### 3. Animations & Interactions (Bubbly)
- **Spring Physics:** Buttons depress visually when clicked (translating down with a smaller box-shadow) and spring back up (`transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)`).
- **Hover States:** Elements gently float upwards and increase glow.
- **Page Transitions:** Soft fade-ins and scale-ups (pop-ins) for modals and new pages.

## Layout Principles
- **Mobile-First Reactivity:** All dashboards are single-column on mobile and expand to grid masonry or sidebars on desktop.
- **Sleek & Lightweight:** Heavy use of CSS variables and native CSS modules. Avoid heavy JS-based animation libraries where CSS transitions suffice to maintain a snappy, non-buggy feel.
