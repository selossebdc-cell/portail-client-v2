# User Story — US-010 Refactor Query Playbook Processes Pattern

**Epic**: Epic 3 — Frontend Refactoring  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 5

---

## User Story

As a **Frontend Developer**, I want to **refactor playbook processes query pattern** so that **queries include .eq('client_id') filtering**.

---

## Acceptance Criteria

### AC-1: All process queries include .eq('client_id')

**Given** queries are refactored  
**When** code is reviewed  
**Then** all queries to playbook_processes include client_id filter

### AC-2: Cascading queries include client_id

**Given** playbook_steps queries exist  
**When** steps are queried  
**Then** also include .eq('client_id') defense-in-depth

### AC-3: Comments explain RLS context

**Given** queries are refactored  
**When** code is reviewed  
**Then** each query includes RLS context comment

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0022 | Refactor playbook_processes query pattern | TODO |
| TASK-0023 | Refactor playbook_steps cascading query | TODO |

---

## Definition of Done (DoD)

- [ ] All queries include .eq('client_id', userClientId)
- [ ] Comments explain RLS enforcement
- [ ] Tested with multiple clients
- [ ] Commit message: "US-010: Refactor query patterns"

---

**Epic**: Epic 3 — Frontend Refactoring
