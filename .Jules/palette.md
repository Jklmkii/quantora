## 2025-02-12 - Added ARIA attributes to DailyChallengeCard explanation toggle
**Learning:** Found an accessibility issue where the "Passo a Passo da Resolução" button did not provide standard ARIA states (`aria-expanded` and `aria-controls`), which makes it harder for screen-reader users to understand the component's state (opened/closed).
**Action:** Applied `aria-expanded` reflecting the UI state and `aria-controls` referencing the ID of the expanded content to ensure correct screen reader announcements. This should be a reusable pattern for all custom accordion-like toggles in the application.
## 2024-05-15 - Dynamic IDs for Reusable Inputs
**Learning:** Using optional uid=1001(jules) gid=1001(jules) groups=1001(jules),27(sudo),103(docker) props on reusable input components can leave them inaccessible if the parent component forgets to provide one. Screen readers cannot properly link the label and input without matching  and uid=1001(jules) gid=1001(jules) groups=1001(jules),27(sudo),103(docker) attributes.
**Action:** When creating reusable UI components with forms or labels, use  as a fallback when an explicit ID is missing to ensure accessibility is maintained automatically.
## 2024-05-15 - Dynamic IDs for Reusable Inputs
**Learning:** Using optional `id` props on reusable input components can leave them inaccessible if the parent component forgets to provide one. Screen readers cannot properly link the label and input without matching `htmlFor` and `id` attributes.
**Action:** When creating reusable UI components with forms or labels, use `React.useId()` as a fallback when an explicit ID is missing to ensure accessibility is maintained automatically.
