
## 2026-10-16 - Settings Grid Accessibility
**Learning:** Custom multi-option toggle grid buttons (like in settings modals) without `aria-pressed` state are announced as generic unpressed buttons, making it impossible for screen reader users to know which option is active.
**Action:** Always add `aria-pressed={isActive}` to custom segmented controls or grid-based option buttons.
