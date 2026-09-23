## 2024-05-18 - React.memo() Performance Optimization
**Learning:** Using React.memo() on complex SVG charting components like `ParabolaChart` is critical when they are children of heavily interactive parents (like a text input component). The parent state changes trigger unnecessary re-renders on the child SVG tree, creating massive bottlenecks.
**Action:** Always consider memoizing pure components rendering heavy SVGs, lists, or complex DOM nodes when they exist in a view with fast-updating UI state (e.g. text inputs on every keystroke).
## 2024-05-19 - React.memo() and useMemo() Optimization in Top-level Navbars
**Learning:** Component `Navbar` was re-rendering excessively when unrelated states updated because it lacked `React.memo` and internal heavy computations (like `levelInfo` and arrays `tabs`) were being recreated on every render.
**Action:** Always verify if global layout components like `Navbar` or `Sidebar` need `React.memo()`. Also memoize objects and arrays constructed within component's scope using `useMemo()` if they're used in the render tree or passed down as props to avoid referential inequality triggering re-renders.
## 2024-05-19 - Zustand useShallow hook for Selective State Subscription
**Learning:** Components subscribing to a Zustand store without using a selector (e.g. `useAppStore()`) or failing to use `useShallow` when selecting objects/multiple fields will re-render whenever *any* state in the store updates. This creates severe performance bottlenecks in highly interactive React applications.
**Action:** When extracting data from `useAppStore`, always write a specific selector and wrap it with `useShallow` (e.g., `useAppStore(useShallow(s => ({ data: s.data })))`) to limit component re-renders strictly to changes in the selected fields.
