# AI Bible Study Guide Plan

## Product Structure
- **Core Experience:** Landing hero -> onboarding survey (intent, translation depth, cadence) -> personalized dashboard with Today's Study, AI Companion, Saved Insights.
- **Primary Flows:** Guided Study Sessions, AI Companion Chat, Library & Plans, Community & Collaboration, Profile & Settings.
- **Information Architecture:** Global nav (Dashboard, Study Sessions, AI Companion, Library, Community, Profile); floating quick actions; modal verse detail and translation drawers.
- **Feature Highlights:** Multi-translation engine (modern + original language studies), AI explainer modes (scholarly/devotional), Context Layers timeline, saved insights with exports, ambient streaks/milestones, offline-friendly PWA shell.
- **Data Hooks:** Verse/plan metadata service, user insight store, AI conversation history, engagement analytics for adaptive suggestions.

## Design System Direction
- **Visual Language:** Modern-minimal 2025 aesthetic, soft gradients, light glassmorphism panels, volumetric glows, abundant whitespace.
- **Color Palette:** Base #F8FBFF background, #FFFFFF cards with translucent borders, aurora gradient accent (#1A1F4B -> #5D5FEF -> #FFCBA3), neutrals (#6B6E80, #9AA0B5), success #44C6A7, warning #FFB347.
- **Typography:** Serif (Lora Variable/Fraunces) for scripture; geometric grotesk (Sohne/Aeonik Pro) for UI; fluid clamp scaling, generous line-height, optical sizing for emphasis.
- **Components:** Glass cards with dual shadows, gradient pill buttons, translation toggles, timeline chips, stacked avatar rings, Context Layer tabs, mic-enabled input, inline-tag note editor, progress rings.
- **Motion & Micro-interactions:** 250-350 ms ease curves, springy card transitions, verse highlight shimmer, AI typing pulse, parallax hero, micro 3D tilt (about 6 degrees) with shadow morph, reduced-motion fallback.
- **3D/Shaders:** Lightweight WebGL or Lottie glows, parchment folds, floating particles triggered on hero/AI states with performance safeguards.
- **Responsive Guidance:** Mobile bottom nav + floating CTA, stacked cards with collapsible sidebars, 48 px touch targets, CSS clamp spacing, low-power animation degradations.
- **Accessibility:** WCAG 2.1 AA contrast, focus-visible styles, dynamic font scaling, language switcher, content warnings toggle for sensitive passages.
