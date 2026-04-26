# User Story — US-016 JavaScript Client Integration Tests

**Epic**: Epic 4 — Integration & Validation  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 5

---

## User Story

As a **QA Engineer**, I want to **test JavaScript patterns end-to-end** so that **frontend correctly respects RLS**.

---

## Acceptance Criteria

### AC-1: getUserClient pattern verified

**Given** user authenticates  
**When** pattern executes  
**Then** client_id is correctly fetched and stored

### AC-2: Query patterns include filtering

**Given** queries execute  
**When** patterns are tested  
**Then** .eq('client_id') filtering is applied

### AC-3: Error handling for RLS violations

**Given** RLS rejects a query  
**When** error is caught  
**Then** graceful error message displayed

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0033 | Test getUserClient pattern | TODO |
| TASK-0034 | Test query patterns | TODO |
| TASK-0035 | Test error handling | TODO |

---

## Definition of Done (DoD)

- [ ] All JS patterns tested
- [ ] Error handling verified
- [ ] No console errors
- [ ] Commit message: "US-016: JS integration tests"

---

**Epic**: Epic 4 — Integration & Validation
