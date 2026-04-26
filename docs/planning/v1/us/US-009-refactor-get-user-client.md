# User Story — US-009 Refactor getUserClient Pattern

**Epic**: Epic 3 — Frontend Refactoring  
**Status**: TODO  
**Priority**: HIGH  
**Story Points**: 3

---

## User Story

As a **Frontend Developer**, I want to **refactor getUserClient pattern** so that **JavaScript respects RLS by storing and using client_id**.

---

## Acceptance Criteria

### AC-1: Fetch user's client_id on login

**Given** user authenticates  
**When** app initializes  
**Then** client_id is fetched and stored in sessionStorage

### AC-2: Pattern follows specification

**Given** pattern is implemented  
**When** code is reviewed  
**Then** matches Pattern A from `.claude/rules/rls-isolation.md`

### AC-3: Tested on mobile and desktop

**Given** pattern is implemented  
**When** tested in browser  
**Then** works correctly across devices

---

## Tasks

| ID | Title | Status |
|----|-------|--------|
| TASK-0021 | Implement getUserClient pattern | TODO |

---

## Definition of Done (DoD)

- [ ] Pattern implemented per spec
- [ ] client_id stored in sessionStorage
- [ ] Tested on mobile and desktop
- [ ] Commit message: "US-009: Refactor getUserClient pattern"

---

**Epic**: Epic 3 — Frontend Refactoring
