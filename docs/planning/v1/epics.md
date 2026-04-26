# Planning v1 — Epics & Roadmap Overview

**Project**: Portail Client V2 — Secure Multi-Tenant Isolation  
**Phase**: PLAN (Architecture & Decomposition)  
**Date**: 2026-04-26  
**Evolution**: Greenfield V1  
**Status**: IN PROGRESS

---

## Executive Summary

This planning phase decomposes the Phase MODEL specifications into 4 epics spanning database-layer RLS implementation, backend policy deployment, frontend refactoring, and integration testing.

**Total Scope**:
- 4 Epics
- 18 User Stories
- 25 Implementation Tasks (+ 1 assembly task)
- Estimated Duration: 5-6 days (32-38 hours)

---

## Epic Structure

### Epic 1: RLS Foundation — Database Layer Preparation

**Description**: Enable and configure Row Level Security on all playbook tables. This epic establishes the PostgreSQL-level isolation that protects data from unauthorized access.

**Key Objective**: Prepare database schema and RLS infrastructure without breaking existing UI.

**User Stories**:
- US-001: Enable RLS on playbook_processes table
- US-002: Enable RLS on playbook_steps table
- US-003: Enable RLS on playbook_owners table
- US-004: Admin Switcher Database Infrastructure

**Dependencies**: None (greenfield, no blocking prerequisites)

**Success Criteria**:
- [ ] All 3 tables have `client_id` column (added if missing)
- [ ] RLS is enabled on all 3 tables
- [ ] Database schema passes audit checks
- [ ] No breaking changes to existing queries
- [ ] Rollback plan documented

**Timeline**: 1-2 days (6-8 hours)

**Risk**: Schema changes may require backfill for legacy rows without `client_id`

---

### Epic 2: Backend Implementation — RLS Policies & Deployment

**Description**: Implement all 13 RLS policies in Supabase and deploy to production. This epic enforces the actual isolation rules at the database layer.

**Key Objective**: Enforce multi-tenant isolation at database layer; prevent cross-tenant access.

**User Stories**:
- US-005: Implement RLS SELECT Policies
- US-006: Implement RLS INSERT/UPDATE/DELETE Policies
- US-007: Implement Admin Switcher RLS Policy
- US-008: Deploy RLS Policies to Production

**Dependencies**:
- Requires: Epic 1 (RLS Foundation) complete

**Success Criteria**:
- [ ] All 13 RLS policies deployed and active
- [ ] SELECT policy prevents cross-tenant reads
- [ ] INSERT policy enforces `client_id` in payload
- [ ] UPDATE policy protects `client_id` immutability
- [ ] DELETE policy respects `client_id` ownership
- [ ] Admin switcher policy enables role='admin' only
- [ ] Policies tested in Supabase Playground
- [ ] Production deployment verified

**Timeline**: 1-2 days (8-10 hours)

**Risk**: Policies may reject legacy queries; requires frontend refactoring in parallel

---

### Epic 3: Frontend Refactoring — JavaScript Layer Alignment

**Description**: Refactor JavaScript queries to align with RLS policies and implement defense-in-depth filtering at the application layer.

**Key Objective**: Replace `.select('*')` + client-side filtering with server-side `.eq('client_id')` filtering.

**User Stories**:
- US-009: Refactor getUserClient Pattern
- US-010: Refactor Query Playbook Processes Pattern
- US-011: Refactor Create Process Pattern
- US-012: Refactor Update Process Pattern
- US-013: Refactor Delete Process Pattern
- US-014: Implement Admin Switcher UI

**Dependencies**:
- Requires: Epic 2 (RLS Policies) deployed
- Blocks: Epic 4 (Integration Testing)

**Success Criteria**:
- [ ] All 7 patterns refactored per `.claude/rules/rls-isolation.md`
- [ ] All queries include `.eq('client_id', userClientId)`
- [ ] INSERT queries include `client_id` in payload
- [ ] UPDATE queries never modify `client_id`
- [ ] All queries include RLS context comments
- [ ] Admin switcher UI implemented and functional
- [ ] No console errors or warnings
- [ ] Mobile + desktop testing complete

**Timeline**: 2-3 days (10-12 hours)

**Risk**: Refactoring may uncover bugs in existing logic; requires careful testing

---

### Epic 4: Integration & Validation — End-to-End Testing

**Description**: Execute comprehensive integration tests, security validation, and production readiness checks.

**Key Objective**: Verify isolation is enforced end-to-end and application is production-ready.

**User Stories**:
- US-015: RLS Policy Integration Tests
- US-016: JavaScript Client Integration Tests
- US-017: Admin Switcher Functional Tests
- US-018: Security Audit & Production Readiness

**Dependencies**:
- Requires: Epic 3 (Frontend Refactoring) complete

**Success Criteria**:
- [ ] All RLS policies tested in Supabase Playground
- [ ] Cross-tenant isolation verified (Taïna cannot see Face Soul Yoga data)
- [ ] All acceptance criteria (AC-001 through AC-021) met
- [ ] Security audit passed
- [ ] Performance impact <5% latency increase
- [ ] Rollback procedure documented and tested
- [ ] Production deployment approved

**Timeline**: 1-2 days (6-8 hours)

**Risk**: Integration testing may reveal edge cases; requires iteration

---

## Cross-Epic Dependencies

| From | To | Type | Description |
|------|----|----|---|
| Epic 1 | Epic 2 | Blocks | RLS policies require database schema changes |
| Epic 2 | Epic 3 | Blocks | RLS policies must be deployed before frontend refactoring |
| Epic 3 | Epic 4 | Blocks | Integration testing requires all features implemented |

---

## Timeline & Sequencing

```
Day 1-2: Epic 1 (RLS Foundation) — 6-8 hours
  │
  └─> Day 2-3: Epic 2 (RLS Policies) — 8-10 hours
        │
        └─> Day 3-5: Epic 3 (Frontend Refactoring) — 10-12 hours
              │
              └─> Day 5-6: Epic 4 (Integration & Testing) — 6-8 hours

Total Duration: 5-6 days (32-38 hours)
Critical Path: Epic 1 → Epic 2 → Epic 3 → Epic 4
Parallel Opportunity: None (sequential gate at each epic)
```

---

## Success Metrics

### By Epic

| Epic | Success Metric | Target |
|------|---|--------|
| Epic 1 | Schema readiness (RLS enabled) | 100% tables enabled |
| Epic 2 | Policies deployed to production | 13/13 policies active |
| Epic 3 | Queries refactored | 7/7 patterns refactored |
| Epic 4 | Integration tests passing | 100% test pass rate |

### Overall Project

| Metric | Target | Verification |
|--------|--------|--------------|
| Cross-tenant isolation | Zero cross-tenant access | Supabase Playground test |
| Code quality | No console errors | Browser dev tools |
| Performance | <5% latency increase | Load test baseline |
| Security | ANON key cannot bypass RLS | Penetration test |
| Acceptance criteria | 100% met | AC-001 through AC-021 |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Legacy rows without `client_id` break RLS | HIGH | MEDIUM | Backfill strategy in Epic 1 |
| RLS policies conflict with existing queries | MEDIUM | HIGH | Epic 2 testing in Supabase Playground |
| Admin switcher UI is buggy | MEDIUM | MEDIUM | Comprehensive testing in US-014 |
| Performance regression | LOW | MEDIUM | Performance baseline + monitoring |
| Team unfamiliar with RLS concepts | MEDIUM | MEDIUM | Pattern documentation + code reviews |

---

## Deliverables Summary

### By Phase

| Phase | Deliverable | Count |
|-------|---|--------|
| Planning (PLAN) | Epics, User Stories, Task Specifications | 1 + 18 + 25 |
| Implementation (BUILD) | Feature commits, RLS policies, refactored JS | TBD |
| Testing (QA) | Integration test results, security audit | TBD |

### Documentation Artifacts

- `docs/planning/v1/epics.md` (this file)
- `docs/planning/v1/us/US-001.md` through `US-018.md`
- `docs/planning/v1/tasks/TASK-0000-app-assembly.md`
- `docs/planning/v1/tasks/TASK-0001.md` through `TASK-0025.md`

---

## References

- **Brief**: `docs/brief.md` — Problem statement and business context
- **Scope**: `docs/scope.md` — Scope boundaries and exclusions
- **Acceptance**: `docs/acceptance.md` — Acceptance criteria (AC-001 through AC-021)
- **System Spec**: `docs/specs/system.md` — Functional requirements (FR-001 through FR-007)
- **Domain Spec**: `docs/specs/domain.md` — Domain model and business rules
- **API Spec**: `docs/specs/api.md` — RLS policies and JavaScript patterns
- **ADR-0001**: `docs/adr/ADR-0001-rls-isolation.md` — Architectural decision
- **Rules**: `.claude/rules/rls-isolation.md` — Code patterns and development rules
- **Project Config**: `project-config.json` — Project metadata

---

## Next Steps

1. **Phase BUILD**: Assign epic owners; begin Epic 1 implementation
2. **Parallel**: Prepare test environment; schedule Supabase Playground sessions
3. **Communication**: Daily standup to track epic progress and risks
4. **Quality Gate**: Gate 3 (Build) verification before Phase QA

---

**Generated by**: Factory Pipeline — Phase PLAN (Planning)  
**Status**: ACTIVE (Ready for Phase BUILD)  
**Last Updated**: 2026-04-26
