# Tasks Index — Planning v1

**Project**: Portail Client V2 — Secure Multi-Tenant Isolation  
**Phase**: PLAN (Architecture & Decomposition)  
**Date**: 2026-04-26  
**Total Tasks**: 40 (1 assembly + 39 implementation)

---

## Summary

This index lists all implementation tasks generated during Phase PLAN. Each task is fully self-contained (BMAD principle) and includes:
- Complete specification context
- Code references from existing codebase
- Acceptance criteria and DoD
- No dependencies on other tasks (except sequential order)

**Total Estimated Effort**: 32-38 hours over 5-6 days

---

## Task Manifest

### Assembly Task (1)

| ID | Title | Epic | Hours | Status |
|----|-------|------|-------|--------|
| **TASK-0000** | [project-setup](TASK-0000-project-setup.md) | Setup | 2 | TODO |

### Epic 1 — RLS Foundation (4 US, 9 tasks)

| ID | Title | User Story | Hours | Status |
|----|-------|---|-------|--------|
| TASK-0001 | Audit playbook_processes schema | US-001 | 1 | TODO |
| TASK-0002 | Backfill playbook_processes client_id | US-001 | 2 | TODO |
| TASK-0003 | Enable RLS on playbook_processes | US-001 | 1 | TODO |
| TASK-0004 | Verify RLS and document rollback | US-001 | 1 | TODO |
| TASK-0005 | Audit playbook_steps schema | US-002 | 1 | TODO |
| TASK-0006 | Backfill playbook_steps client_id | US-002 | 1 | TODO |
| TASK-0007 | Enable RLS on playbook_steps (cascading) | US-002 | 1 | TODO |
| TASK-0008 | Audit and enable RLS on playbook_owners | US-003 | 1 | TODO |
| TASK-0009 | Configure admin switcher RLS policy | US-004 | 2 | TODO |

**Epic 1 Subtotal**: 11 hours

### Epic 2 — Backend Implementation (4 US, 8 tasks)

| ID | Title | User Story | Hours | Status |
|----|-------|---|-------|--------|
| TASK-0010 | Implement SELECT policy on playbook_processes | US-005 | 2 | TODO |
| TASK-0011 | Implement SELECT policy on playbook_steps | US-005 | 2 | TODO |
| TASK-0012 | Implement SELECT policy on playbook_owners | US-005 | 1 | TODO |
| TASK-0013 | Test cross-tenant isolation | US-005 | 1 | TODO |
| TASK-0014 | Implement INSERT policies | US-006 | 2 | TODO |
| TASK-0015 | Implement UPDATE policies | US-006 | 2 | TODO |
| TASK-0016 | Implement DELETE policies | US-006 | 2 | TODO |
| TASK-0017 | Test write operation access control | US-006 | 1 | TODO |
| TASK-0018 | Implement admin switcher RLS policy | US-007 | 1 | TODO |
| TASK-0019 | Deploy all RLS policies to production | US-008 | 1 | TODO |
| TASK-0020 | Verify production data isolation | US-008 | 1 | TODO |

**Epic 2 Subtotal**: 16 hours

### Epic 3 — Frontend Refactoring (6 US, 14 tasks)

| ID | Title | User Story | Hours | Status |
|----|-------|---|-------|--------|
| TASK-0021 | Implement getUserClient pattern | US-009 | 1 | TODO |
| TASK-0022 | Refactor playbook_processes query pattern | US-010 | 2 | TODO |
| TASK-0023 | Refactor playbook_steps cascading query | US-010 | 2 | TODO |
| TASK-0024 | Implement createProcess pattern | US-011 | 1 | TODO |
| TASK-0025 | Implement updateProcess pattern | US-012 | 1 | TODO |
| TASK-0026 | Implement deleteProcess pattern | US-013 | 1 | TODO |
| TASK-0027 | Design admin switcher UI | US-014 | 2 | TODO |
| TASK-0028 | Implement switcher logic | US-014 | 2 | TODO |
| TASK-0029 | Test switcher on mobile and desktop | US-014 | 1 | TODO |

**Epic 3 Subtotal**: 13 hours

### Epic 4 — Integration & Validation (4 US, 8 tasks)

| ID | Title | User Story | Hours | Status |
|----|-------|---|-------|--------|
| TASK-0030 | Test SELECT isolation across tenants | US-015 | 2 | TODO |
| TASK-0031 | Test INSERT policy enforcement | US-015 | 1 | TODO |
| TASK-0032 | Test UPDATE immutability | US-015 | 1 | TODO |
| TASK-0033 | Test getUserClient pattern | US-016 | 1 | TODO |
| TASK-0034 | Test query patterns | US-016 | 1 | TODO |
| TASK-0035 | Test error handling | US-016 | 1 | TODO |
| TASK-0036 | Test admin switching functionality | US-017 | 1 | TODO |
| TASK-0037 | Conduct security audit | US-018 | 2 | TODO |
| TASK-0038 | Verify all acceptance criteria met | US-018 | 1 | TODO |
| TASK-0039 | Performance baseline test | US-018 | 1 | TODO |

**Epic 4 Subtotal**: 12 hours

---

## Total Breakdown

| Category | Count | Hours |
|----------|-------|-------|
| Assembly | 1 | 2 |
| Epic 1 | 9 | 11 |
| Epic 2 | 11 | 16 |
| Epic 3 | 9 | 13 |
| Epic 4 | 10 | 12 |
| **TOTAL** | **40** | **54** |

**Realistic Timeline** (with reviews, rework, testing): 5-6 days (32-38 hours of productive work)

---

## Task Dependencies

### Sequential Path

```
TASK-0000 (Setup) → 2h
  ↓
TASK-0001 to TASK-0009 (Epic 1 — RLS Foundation) → 11h
  ↓
TASK-0010 to TASK-0020 (Epic 2 — RLS Policies) → 16h
  ↓
TASK-0021 to TASK-0029 (Epic 3 — Frontend) → 13h
  ↓
TASK-0030 to TASK-0039 (Epic 4 — Testing) → 12h
```

### Critical Path

- **Blocking**: TASK-0000 (must complete before epic 1)
- **Blocking**: Epic 1 → Epic 2 (schema before policies)
- **Blocking**: Epic 2 → Epic 3 (policies before frontend)
- **Blocking**: Epic 3 → Epic 4 (features before testing)

### No Parallel Opportunities

All tasks are sequential due to tight dependencies. Parallelization not recommended for first implementation pass.

---

## Task Principles (BMAD)

Each task is designed following these principles:

### Self-Contained (No Hidden Dependencies)

✅ Every TASK-XXXX includes:
- Complete specification context (no "read US-YYY" required)
- Code references with line numbers
- Acceptance criteria specific to the task
- Clear DoD items

❌ Tasks do NOT assume knowledge of:
- Previous tasks
- Other epics
- External documentation (unless explicitly quoted)

### Development-Ready

✅ Each task includes:
- Specification summary (what to build and why)
- Code patterns to follow
- Testing strategy
- Acceptance criteria checkboxes

❌ Developers should NOT need to:
- Ask questions about requirements
- Infer acceptance criteria
- Search for code patterns

### Implementation Order

✅ Tasks are designed for sequential execution:
1. TASK-0000: Setup environment
2. Epic 1: Foundation (database layer)
3. Epic 2: Policies (enforcement layer)
4. Epic 3: Frontend (application layer)
5. Epic 4: Testing (validation layer)

---

## How to Use This Index

### For Developers

1. **Get assigned a task**: "I'm on TASK-0015"
2. **Open the task file**: `docs/planning/v1/tasks/TASK-0015.md`
3. **Read the entire task**: Top to bottom, no jumps
4. **Implement acceptance criteria**: Check boxes as you go
5. **Mark DoD complete**: Before requesting code review
6. **Commit with task ID**: `git commit -m "TASK-0015: ..."`

### For Project Managers

1. **Track progress**: Update status in this index as tasks complete
2. **Identify blockers**: Use Dependencies section to find critical path issues
3. **Report burndown**: Hours remaining = sum of TODO hours
4. **Escalate delays**: If task exceeds estimated hours by 50%+

### For Tech Leads

1. **Review task contents**: Ensure specifications are clear before assigning
2. **Approve task completion**: Verify DoD checklist complete before merge
3. **Escalate ambiguity**: If task is unclear, create clarification PR before implementation starts

---

## Handoff Checklist

Before Phase BUILD begins:

- [ ] All 40 tasks generated and validated
- [ ] Developers have access to task files
- [ ] Estimated hours per epic reviewed and approved
- [ ] Dependencies clearly communicated
- [ ] Rollback procedures documented (Epic 1-2)
- [ ] Security considerations highlighted (Epic 2-4)
- [ ] Q&A session held with full team

---

## Risk & Contingency

### High-Risk Tasks (Require Extra Attention)

| Task | Risk | Mitigation |
|------|------|-----------|
| TASK-0002 | Backfill data complexity | Start early; automate if possible |
| TASK-0010-0012 | RLS policy testing | Use Supabase Playground extensively |
| TASK-0022-0026 | JavaScript refactoring | Comprehensive integration testing |
| TASK-0037 | Security audit | Dedicated security specialist |

### Contingency Plan

If task is blocked or stalled:
1. Escalate to tech lead immediately
2. Re-estimate remaining hours
3. Identify blocking task (use Dependencies)
4. Create clarification issue if spec is unclear
5. Do NOT skip DoD items or tasks to "catch up"

---

## References

- **Brief**: `docs/brief.md`
- **Scope**: `docs/scope.md`
- **Acceptance**: `docs/acceptance.md`
- **System Spec**: `docs/specs/system.md`
- **Domain Spec**: `docs/specs/domain.md`
- **API Spec**: `docs/specs/api.md`
- **ADR-0001**: `docs/adr/ADR-0001-rls-isolation.md`
- **Rules**: `.claude/rules/rls-isolation.md`
- **CLAUDE.md**: `.claude/CLAUDE.md`

---

**Generated by**: Factory Pipeline — Phase PLAN (Planning)  
**Status**: Ready for Phase BUILD  
**Last Updated**: 2026-04-26
