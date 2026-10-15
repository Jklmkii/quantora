## 2025-02-12 - Added ARIA attributes to DailyChallengeCard explanation toggle
**Learning:** Found an accessibility issue where the "Passo a Passo da Resolução" button did not provide standard ARIA states (`aria-expanded` and `aria-controls`), which makes it harder for screen-reader users to understand the component's state (opened/closed).
**Action:** Applied `aria-expanded` reflecting the UI state and `aria-controls` referencing the ID of the expanded content to ensure correct screen reader announcements. This should be a reusable pattern for all custom accordion-like toggles in the application.
## 2024-05-15 - Dynamic IDs for Reusable Inputs
**Learning:** Using optional uid=1001(jules) gid=1001(jules) groups=1001(jules),27(sudo),103(docker) props on reusable input components can leave them inaccessible if the parent component forgets to provide one. Screen readers cannot properly link the label and input without matching  and uid=1001(jules) gid=1001(jules) groups=1001(jules),27(sudo),103(docker) attributes.
**Action:** When creating reusable UI components with forms or labels, use  as a fallback when an explicit ID is missing to ensure accessibility is maintained automatically.
## 2024-05-15 - Dynamic IDs for Reusable Inputs
**Learning:** Using optional `id` props on reusable input components can leave them inaccessible if the parent component forgets to provide one. Screen readers cannot properly link the label and input without matching `htmlFor` and `id` attributes.
**Action:** When creating reusable UI components with forms or labels, use `React.useId()` as a fallback when an explicit ID is missing to ensure accessibility is maintained automatically.
## 2025-03-01 - Daily Challenge Keyboard Accessibility
**Learning:** Adding visible focus states (`focus-visible:ring-*`) to multiple interactive elements (such as accordions, options, and submission buttons) within complex gamification cards drastically improves keyboard navigability, as complex custom UI components often accidentally suppress or obscure default focus styles.
**Action:** When creating or evaluating custom gamification UI elements in the future, always explicitly verify tab-order styling with `focus-visible` classes to ensure screen-reader/keyboard users have clear contextual awareness of their location within the card.
## 2024-10-05 - Missing Focus Styles in Mini-Games
**Learning:** High-intensity interactive components like mini-games (e.g., BlitzGame) often overlook standard accessibility patterns like keyboard focus rings because they are primarily designed for fast-paced touch/mouse interaction.
**Action:** Always ensure fast-paced game UI buttons retain explicit `focus-visible` styles so keyboard users can navigate and interact smoothly.
## 2025-03-02 - Tab Navigation Accessibility
**Learning:** Found an accessibility issue where the main navigation tabs in `ModuleTopBar.tsx` visually indicated the active tab but did not communicate this state to screen readers, making it harder for users to understand their current context.
**Action:** Applied `aria-current="page"` conditionally based on the active tab state (`activeTab === 'tab_name'`). This is a standard ARIA pattern that should be applied to all custom tab or navigation lists to ensure proper contextual feedback for assistive technologies.
