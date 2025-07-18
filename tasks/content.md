# Feature MVP Documentation: Watchlist & Hidden Items Controls

---

## 1. Vision & Objectives

**Vision:**

Empower users browsing anime listings to curate personalized content directly on the webpage, without leaving the site.

**Objectives:**

- Enable users to mark titles they intend to watch and hide spoilers/unwanted entries.
- Persist user preferences locally for a consistent experience across sessions.
- Provide a simple control to reset hidden items in one action.

**Success Metrics:**

1. **Engagement:** 30% of active users use at least one control (watch or hide) within the first two weeks.
2. **Retention:** 20% increase in return visits of users who added items to the watchlist.
3. **Usability:** <5% error rate on hide/show functionality during QA.

---

## 2. Personas & Use Cases

| Persona           | Goal                                                                 | Scenario                                                                                    |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Casual Fan        | Quickly save interesting titles for later                            | Browsing a long list of shows, clicks **Watch** to compile a quick to-watch list.           |
| Spoiler-sensitive | Conceal titles they’ve already watched or don’t want to see spoilers | After finishing an anime, clicks **Hide** to remove it from future browsing lists.          |
| Power Curator     | Manage a comprehensive watchlist and clear out hidden content easily | Uses both buttons extensively and wants a one-click reset of hidden items between sessions. |

---

## 3. User Stories & Acceptance Criteria

### 3.1. Add to Watchlist

**Story:** As a user, I want to mark an anime to my watchlist so that I can revisit it later.

**Acceptance Criteria:**

1. A **Watch** control appears on each anime card.
2. Clicking **Watch** persists the anime in local storage under the watchlist.
3. Confirmation feedback (e.g., icon change or toast) indicates success.
4. The state remains consistent on page reload.

### 3.2. Add to Hidden List

**Story:** As a user, I want to hide an anime so that it no longer appears in my browsing list.

**Acceptance Criteria:**

1. A **Hide** control appears on each anime card.
2. Clicking **Hide** removes the anime from the view and saves its ID in local storage.
3. Hidden items remain concealed on subsequent page loads.

### 3.3. Clear All Hidden

**Story:** As a user, I want to reset my hidden items in one action so that all previously hidden titles reappear.

**Acceptance Criteria:**

1. A **Clear Hidden** button is placed at the end of the anime list.
2. Clicking it wipes all entries from the hidden list storage.
3. All previously hidden anime cards become visible again immediately.

---

## 4. Feature Breakdown & Prioritization

| Priority | Epic                  | Stories                                                         |
| -------- | --------------------- | --------------------------------------------------------------- |
| P0       | Core Controls         | - Add **Watch** control<br>- Add **Hide** control               |
| P1       | Persistence & State   | - Persist watchlist<br>- Persist hidden list<br>- Restore state |
| P2       | Reset Functionality   | - **Clear Hidden** button and behavior                          |
| P3       | Feedback & Refinement | - Visual feedback on click<br>- Error handling                  |

---

## 5. Dependencies & Assumptions

- The extension’s content script is already injected on target pages.
- Page structure: container `.film_list-wrap`, items `.flw-item`, poster `.film-poster` and title link `.film-name a`.
- Adequate permissions (`chrome.storage.local`) are enabled in the manifest.

---

## 6. Timeline & Milestones

| Sprint            | Goals                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| Sprint 1 (1 week) | - Complete P0 and P1 stories<br>- Validate storage interactions in staging   |
| Sprint 2 (1 week) | - Implement P2 reset functionality<br>- Basic UX feedback for clicks         |
| Sprint 3 (1 week) | - Polish styling, error states, edge-case testing<br>- Prepare release notes |

---

## 7. Definition of Done

- All acceptance criteria for each story are met and verified.
- No critical or high-severity bugs in QA.
- Documentation and usage notes updated.
- Demo confirmed by stakeholder.

---

_Prepared by: Product Owner_

---

## 8. Development Instructions for Coding Agent

**Note:** The coding agent should review the existing codebase structure and conventions and adapt these guidelines accordingly. Avoid introducing assumptions about file names or modules—leverage the current architecture.

### 8.1. Codebase Familiarization

- Identify where the content script logic currently resides (e.g., `content.ts/js`, a framework component, or utility module).
- Understand existing patterns for DOM selection, event binding, and storage abstractions.
- Locate and follow the project’s TypeScript configuration, linting rules, and build process.

### 8.2. Module Organization

- Group new functionality into logical units (e.g.,
    - **DOM utilities:** querying wrapper and item elements
    - **UI controls:** button creation, styling, and injection
    - **Data management:** reading from and writing to storage
    - **Event handlers:** encapsulating watch, hide, and clear actions  
      ) while aligning with the project’s current module organization.

### 8.3. Styling & Design Compliance

- Use the established design system or CSS modules already in place.
- Apply existing token names, class naming conventions, and theming mechanisms as per the design guide.
- Ensure accessibility by following ARIA guidelines and the project’s a11y standards.
- **Prefer CSS interactions over JS:** avoid using JavaScript mouse events like `mouseenter`/`mouseleave`; implement hover, focus, and transition effects using CSS (`:hover`, `:focus`, `transition`) wherever possible.

### 8.4. Storage & State Management

- Utilize the existing storage abstraction or API wrapper (e.g., Chrome storage, IndexedDB, or a state management library).
- Respect error handling and retry patterns already implemented in the codebase.

### 8.5. Event Wiring & Initialization

- Follow the current initialization lifecycle (e.g., on DOM ready, route change hooks, or framework mount events).
- Attach event listeners in a manner consistent with the framework or vanilla code patterns in use (e.g., delegation vs. direct binding).

### 8.6. Testing Practices

- Write new tests using the existing test suite framework (Jest, Mocha, or Cypress).
- Mock storage and DOM where appropriate, reusing utility test helpers.
- Include accessibility checks if the codebase integrates with tools like axe or jest-axe.

### 8.7. Logging & Error Handling

- Adopt the project’s logging approach (e.g., a centralized logger, console wrapping, or external service).
- Surface non-blocking errors in diagnostics without disrupting the user experience.

---

_End of Development Instructions_
