# User Story — US-017 Admin Switcher Functional Tests

**Epic**: Epic 4 — Integration & Validation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 3

---

## User Story

As a **QA Engineer**, I want to **test admin switcher end-to-end** so that **admins can safely switch between clients**.

---

## Acceptance Criteria

### AC-1: Admin can switch client

**Given** admin user is logged in  
**When** admin selects new client and submits  
**Then** playbook data updates to show new client

### AC-2: Non-admin cannot switch

**Given** non-admin user is logged in  
**When** user attempts switcher  
**Then** switcher is hidden or request is rejected

### AC-3: Session context updated

**Given** admin switches client  
**When** subsequent queries execute  
**Then** use new client_id

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0036 | Test admin switching functionality | TODO |

---

## Definition of Done (DoD)

- [ ] Admin switching works correctly
- [ ] Non-admin access blocked
- [ ] Session context updated
- [ ] Commit message: "US-017: Admin switcher functional tests"

---

**Epic**: Epic 4 — Integration & Validation
