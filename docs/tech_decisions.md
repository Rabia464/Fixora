# Technical Decisions & ADRs

## 1. Clean Architecture for Backend
**Context:** Need a maintainable backend that can scale and easily swap the AI engine.
**Decision:** Adopted Clean Architecture (Routes -> Services -> Repositories -> Models). This isolates the `AIEngine` so replacing it with ML later requires zero changes to the API or DB layers.

## 2. Next.js App Router for Frontend
**Context:** Need a modern, fast React frontend.
**Decision:** Used Next.js 14+ App Router. Provides excellent file-based routing and allows for future Server-Side Rendering (SSR) optimizations.

## 3. Vanilla CSS Modules
**Context:** The highly specific "iOS Glassmorphism + Duolingo Bubbly Animations" requested by the stakeholder is difficult to achieve cleanly with utility classes alone.
**Decision:** Avoided Tailwind. Relied on Vanilla CSS Modules to encapsulate complex `backdrop-filter`, multi-layered `box-shadow`, and spring physics keyframes cleanly within components.

## 4. Rule-Based AI First
**Context:** ML models require data. We have none.
**Decision:** Built a Regex/Keyword-based AI engine for V1 to bootstrap the data collection process. Supervisor overrides will act as the labeled dataset for V2.
