---
name: Vertigo
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c7c6ca'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#919094'
  outline-variant: '#46464a'
  surface-tint: '#c8c6c7'
  primary: '#c8c6c7'
  on-primary: '#313031'
  primary-container: '#080809'
  on-primary-container: '#7a7879'
  inverse-primary: '#5f5e5f'
  secondary: '#bfc2ff'
  on-secondary: '#0c0aa4'
  secondary-container: '#2c31b9'
  on-secondary-container: '#aaaeff'
  tertiary: '#44e335'
  on-tertiary: '#003a00'
  tertiary-container: '#000b00'
  on-tertiary-container: '#008d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e3'
  primary-fixed-dim: '#c8c6c7'
  on-primary-fixed: '#1c1b1d'
  on-primary-fixed-variant: '#474648'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bfc2ff'
  on-secondary-fixed: '#02006d'
  on-secondary-fixed-variant: '#2c31b9'
  tertiary-fixed: '#77ff61'
  tertiary-fixed-dim: '#44e335'
  on-tertiary-fixed: '#002200'
  on-tertiary-fixed-variant: '#005300'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Raleway
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Raleway
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Raleway
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Raleway
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max-width: 1440px
---

## Brand & Style

The design system is engineered for a high-stakes, high-intelligence fintech environment. It balances the data density of a modernized Bloomberg Terminal with the effortless aesthetic of premium consumer electronics. The brand personality is authoritative yet approachable, evoking an emotional response of absolute control and forward-thinking precision.

The visual style is a sophisticated blend of **Minimalism** and **Glassmorphism**. It utilizes multi-layered depth to organize complex financial information without overwhelming the user. Every interface element is treated as a physical object floating in a pressurized, dark space, using subtle light leaks and frosted transparency to guide the eye toward critical data points and AI-driven insights.

## Colors

The palette is anchored in a deep, absolute foundation to minimize eye strain and maximize focus during long-form analysis. 

- **Primary Base (Deep Obsidian):** The core foundation of the UI (#080809), providing a high-contrast backdrop for data.
- **Secondary Accent (Midnight Cobalt):** A deep, saturated blue (#1415a8) reserved for primary actions, active states, and AI-driven focus areas.
- **Tertiary Action (Neon Emerald):** A vibrant green (#1fca17) used for success states, positive financial trends, and specialized growth-oriented callouts.
- **Functional Colors:** Neutral Slate (#94a3b8) for borders, secondary text, and metadata.
- **Surface Strategy:** Backgrounds use #080809. Overlays and panels use a semi-transparent version of the surface color combined with a heavy backdrop-blur (20px-40px) to create the signature glass effect.

## Typography

This design system utilizes a trio of typefaces to distinguish between narrative, data, and system-level information.

1.  **Raleway (Headlines):** An elegant, geometric sans-serif for titles and display numbers. Its unique character gives the system a more refined, upscale personality compared to standard technical fonts.
2.  **Inter (Body):** The workhorse for all prose, descriptions, and standard UI labels. Chosen for its legendary legibility at small sizes.
3.  **JetBrains Mono (Data/Labels):** Monospaced fonts are used specifically for financial digits, tickers, and technical metadata to ensure columnar alignment in data-heavy dashboards.

All display sizes above 32px should decrease letter spacing to -0.04em to maintain a "tight" premium feel.

## Layout & Spacing

The system employs a **fluid grid** strategy based on a 4px baseline unit. 

- **Desktop (1440px+):** 12-column grid with 24px gutters and 48px side margins. 
- **Tablet (768px - 1439px):** 8-column grid with 20px gutters and 32px side margins.
- **Mobile (<767px):** 4-column grid with 16px gutters and 16px side margins.

Layouts should favor high whitespace (breathability) around key charts while maintaining high density within data tables. Use "Staggered Padding" for nested glass containers: an outer container with 32px padding should contain inner elements with 16px or 24px internal spacing to create a sense of nested depth.

## Elevation & Depth

Hierarchy is established through a four-tier elevation model using **Tonal Layers** and **Ambient Shadows**.

1.  **Floor (0dp):** The base obsidian background (#080809).
2.  **Flat (1dp):** Sub-panels with a 1px border (rgba(255,255,255,0.05)) and no background change.
3.  **Floating (2dp):** Standard Glassmorphic panels. Background: rgba(20, 21, 168, 0.1). Backdrop-blur: 24px. Shadow: 0 8px 32px rgba(0,0,0,0.6).
4.  **Interactive (3dp):** Overlays, Modals, and active cards. Background: rgba(20, 21, 168, 0.2). Shadow: 0 20px 48px rgba(0,0,0,0.8).

Each floating element must feature a **top-down inner highlight** (a 1px semi-transparent white border on the top and left edges only) to simulate a physical light source from above.

## Shapes

The design system uses a pronounced **Rounded** language to soften the technical nature of fintech. 

- **Standard Containers:** 16px (rounded-lg) border radius.
- **Buttons and Inputs:** 8px (rounded-md) border radius for a "squircle" feel.
- **Small Components (Chips/Tags):** 4px or fully pill-shaped depending on content.

The use of rounded corners on main dashboard panels creates a friendly, high-end "app" feel reminiscent of modern OS design. All borders on glass elements should be 1px wide with a low-opacity white or secondary-tinted stroke.

## Components

### Buttons
Primary buttons use the Midnight Cobalt solid or gradient fill (#1415a8) with high-contrast white text. Secondary buttons are "ghost" style with a 1px secondary border and a glass background. Tertiary buttons use the Neon Emerald (#1fca17) for confirmation or positive action states.

### Cards & Panels
The core unit of the UI. Cards must utilize `backdrop-filter: blur(20px)` and a subtle `linear-gradient` border. For AI-generated insights, cards should feature a subtle, animating "breathing" glow using the Midnight Cobalt accent.

### Input Fields
Inputs are dark and recessed. On focus, the border transitions to Midnight Cobalt, and a subtle inner shadow is applied to give a "carved" look into the glass surface.

### Data Tables
Tables should use "Zebra-blur" instead of zebra-striping—alternating rows have slightly different levels of transparency rather than different solid colors.

### Progress & Status
Use specialized status colors (Neon Emerald/Green for growth, Error/Red for risk) against the Obsidian background. Sparklines should be anti-aliased and feature a subtle gradient fill underneath the stroke to give a 3D "ribbon" effect.