# User Story — US-014 Implement Admin Switcher UI

**Epic**: Epic 3 — Frontend Refactoring  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 5

---

## User Story

As a **Frontend Developer**, I want to **implement the admin switcher UI** so that **admin users can select and switch between clients**.

---

## Acceptance Criteria

### AC-1: Admin switcher dropdown visible to admins only

**Given** user has role='admin'  
**When** app loads  
**Then** client switcher dropdown is visible

### AC-2: Non-admins don't see switcher

**Given** user has role='client'  
**When** app loads  
**Then** switcher is hidden

### AC-3: Switching updates RLS context

**Given** admin selects new client  
**When** switch is submitted  
**Then** server-side UPDATE executes; playbook data refreshes

### AC-4: Tested on mobile and desktop

**Given** UI is implemented  
**When** tested in browser  
**Then** works correctly across devices

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0027 | Design admin switcher UI | TODO |
| TASK-0028 | Implement switcher logic | TODO |
| TASK-0029 | Test on mobile and desktop | TODO |

---

## Definition of Done (DoD)

- [ ] Switcher visible to admins only
- [ ] Non-admins cannot access switcher
- [ ] Switching updates RLS context correctly
- [ ] Tested on mobile and desktop
- [ ] Commit message: "US-014: Admin switcher UI"

---

**Epic**: Epic 3 — Frontend Refactoring
