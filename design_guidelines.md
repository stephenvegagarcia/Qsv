# Quantum Audio Sonar Visualization - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Custom Data Visualization Framework
**Justification:** This is a specialized technical tool focused on real-time audio-spatial mapping with quantum enhancement. The interface prioritizes functional clarity, data visibility, and non-intrusive UI over the primary 3D visualization canvas.

**Key Design Principles:**
1. Canvas-first architecture - maximize 3D visualization space
2. Minimal UI overlay - controls and data shouldn't obstruct the sonar view
3. Information hierarchy - critical metrics prominently displayed
4. Technical precision - clear labeling of quantum processing states and audio metrics

---

## Core Design Elements

### A. Typography

**Font Family:** 
- Primary: `'Inter', sans-serif` (via Google Fonts CDN) - for UI text, metrics, labels
- Monospace: `'JetBrains Mono', monospace` - for numerical data, coordinates, frequencies

**Type Scale:**
- Display (48px/3rem, weight 700): Initialization screen title
- Heading (24px/1.5rem, weight 600): Section headers, modal titles
- Body Large (16px/1rem, weight 500): Primary UI labels, button text
- Body (14px/0.875rem, weight 400): Secondary labels, descriptions
- Small (12px/0.75rem, weight 400): Metric values, status indicators
- Micro (10px/0.625rem, weight 500, uppercase, letter-spacing 0.05em): Category labels

### B. Layout System

**Canvas Structure:**
- Full viewport 3D scene (100vw × 100vh)
- UI elements positioned as absolute overlays
- No container constraints on visualization area

**Spacing Primitives:**
Tailwind units: **2, 4, 6, 8, 12, 16**
- Micro spacing (2): Icon-to-text gaps
- Standard (4): Button padding, card internal spacing
- Medium (8): Between related UI groups
- Large (16): Panel margins from viewport edges

**Grid System:**
- No traditional grid for main canvas
- UI panels use internal 4px grid for alignment precision

---

## Component Library

### 1. Initialization Overlay
**Full-screen centered activation**
- Centered flex container with dark semi-transparent backdrop (backdrop-blur-lg)
- Large activation button (px-12 py-4) with prominent sizing
- Title above button (Display typography)
- Subtle description text below (Body Small)

### 2. HUD (Heads-Up Display) - Top Bar
**Fixed top overlay, full-width, left-aligned content**
- Semi-transparent panel (backdrop-blur-md, p-4)
- Horizontal flex layout with gap-8 between metric groups
- Each metric: label (Micro typography) + value (Body typography)
- Metrics to include:
  - Audio Input Level (real-time bar visualization)
  - Pulse Count / Active Pulses
  - Quantum Processing Status (Ready/Processing/Idle)
  - Detection Range (current max distance in meters)

### 3. Control Panel - Bottom Right
**Fixed bottom-right corner (bottom-8, right-8)**
- Compact vertical panel (p-6, rounded-lg, backdrop-blur-md)
- Maximum width: 280px
- Grouped controls:
  - **Pulse Settings:** FFT size slider, sensitivity threshold
  - **Quantum Parameters:** QML mode toggle, enhancement level
  - **Visualization:** Grid opacity, pulse color intensity
- Each control: label + input/slider with current value display
- Collapsible sections with chevron icons (Heroicons)

### 4. Detection Info - Left Side
**Fixed left position (left-8, top-1/3)**
- Vertical list of detected acoustic reflections (max 5 most recent)
- Each detection card (p-4, mb-2, backdrop-blur-sm):
  - Direction indicator (compass-style arrow icon)
  - Distance value (Large text, monospace)
  - Signal strength bar
  - Timestamp (Micro typography)

### 5. Status Notifications - Bottom Left
**Fixed position (bottom-8, left-8)**
- Toast-style notifications stack (gap-2)
- Auto-dismiss after 3s
- Icons from Heroicons: info-circle, check-circle, exclamation-triangle
- Compact (px-4 py-2, rounded-md)

### 6. Modal Dialogs
**Centered overlay for settings/help**
- Semi-transparent full-screen backdrop with backdrop-blur-sm
- Modal container: max-w-2xl, p-8, rounded-xl
- Header with close button (top-right, X icon)
- Content area with scrollable sections
- Footer with action buttons (right-aligned)

---

## 3D Visualization Canvas

**Scene Elements:**
- Dynamic pulse rings emanating from viewer position
- Procedural grid floor extending to horizon
- Instanced geometry for detected objects/surfaces
- Particle effects for active quantum processing visualization

**Camera Controls:**
- OrbitControls for free navigation
- Starting position: [0, 5, 10] looking toward origin
- Smooth damping enabled

**Performance Requirements:**
- Maintain 60fps with up to 1000 instanced objects
- Adaptive quality based on detected frame rate
- Use LOD (Level of Detail) for distant geometry

---

## Animations

**Minimize motion - use only for essential feedback:**

**Essential Only:**
- Pulse ring expansion (shader-based, no JS animation)
- Data value transitions (150ms ease-out) when metrics update
- Toast notification slide-in from bottom (200ms ease-out)
- Panel collapse/expand (250ms ease-in-out)

**Prohibited:**
- Floating/bobbing UI elements
- Continuous rotation animations
- Particle trails (except quantum processing indicator)

---

## Icons

**Library:** Heroicons (via CDN) - outline style
**Common Icons:**
- microphone, speaker-wave: Audio controls
- cpu-chip, beaker: Quantum processing
- chart-bar, signal: Metrics and detection
- cog-6-tooth: Settings
- information-circle: Help/info
- x-mark: Close/dismiss

---

## Images

**No hero images needed** - this is a full-canvas interactive application, not a landing page. All visual content is generated by the 3D sonar visualization in real-time.

---

## Accessibility

- All interactive controls must have visible focus states (2px outline with offset)
- Metric labels must be programmatically associated with values
- Color is never the only indicator of state (use icons + text)
- Minimum touch target size: 44×44px for all buttons
- All panels maintain 4.5:1 contrast ratio for text against backgrounds
- Keyboard navigation: Tab through all controls, Enter to activate, Escape to close modals