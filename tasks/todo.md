# Todo Plan

## 1. Code Refactoring & Cleanup
- [x] Move hardcoded API key from `popup.js` to `config.js` and load it properly.
- [x] Refactor `popup.js` to separate concerns (API calls, UI updates, State management).
- [x] Remove unused functions or redundant code.

## 2. UI/UX Improvements (Responsive Design)
- [x] Update `popup.html` structure for better semantics and layout.
- [x] Improve `style.css` to use CSS Grid/Flexbox for a responsive and modern grid of GIFs.
- [x] Enhance the search bar and buttons styling.
- [x] Improve the Dark/Light mode implementation (use CSS variables).
- [x] Make the favorites section look consistent with the search results.
- [x] Improve the modal design.

## 3. Feature Enhancements
- [x] Add a "Copy Link" or "Copy Image" functionality when clicking a GIF (instead of just opening a modal, or add buttons to the modal).
- [x] Add a loading indicator while fetching GIFs.
- [x] Handle empty states (no results found, no favorites).

## 4. Verification
- [x] Test search functionality.
- [x] Test pagination (infinite scroll).
- [x] Test favorites toggle and display.
- [x] Test dark/light mode.
- [x] Test caching mechanism.
