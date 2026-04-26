# Task — TASK-[XXXX] [Task Title]

**User Story**: [US-XXX: Story Title]  
**Epic**: [Epic Name]  
**Status**: IN PROGRESS  
**Complexity**: [LOW / MEDIUM / HIGH]  
**Estimated Hours**: [Hours]

---

## Overview

[Brief description of what this task accomplishes]

---

## Acceptance Criteria (AC)

### AC-1: [Criterion Title]

**Given** [Initial Context]  
**When** [Condition]  
**Then** [Expected Outcome]

**Verification**: [ ] Code review, [ ] Automated test, [ ] Manual test

### AC-2: [Criterion Title]

**Given** [Initial Context]  
**When** [Condition]  
**Then** [Expected Outcome]

**Verification**: [ ] Code review, [ ] Automated test, [ ] Manual test

---

## Definition of Done (DoD)

- [ ] All acceptance criteria met
- [ ] Code follows project patterns and style
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing completed on mobile + desktop
- [ ] No console errors or warnings
- [ ] RLS policies verified (if applicable)
- [ ] Performance impact assessed
- [ ] Code review approved
- [ ] Commit message: "TASK-XXXX: [description]"
- [ ] Documentation updated
- [ ] Merged to main branch

---

## Specification Context

### System Requirements

**From `docs/specs/system.md`**:
- [Relevant FR or NFR]
- [Relevant FR or NFR]

**Key Requirement**: [Citation or summary]

### Domain Context

**From `docs/specs/domain.md`**:
- [Relevant entity or business rule]
- [Relevant entity or business rule]

**Key Concept**: [Citation or summary]

### API / Technical Specification

**From `docs/specs/api.md`**:
- [Relevant SQL policy or JS pattern]
- [Relevant SQL policy or JS pattern]

**Key Pattern**: [Citation with code snippet]

### Rules & Standards

**From `.claude/rules/rls-isolation.md`**:
- [Relevant rule or pattern]
- [Relevant rule or pattern]

**Code Pattern to Follow**: [Pattern name]

---

## Implementation Details

### What to Build

[Detailed description of what needs to be implemented]

### Files to Create/Modify

| File | Action | Status |
|------|--------|--------|
| `file1.js` | Create | TODO |
| `file2.js` | Modify | TODO |
| `file3.html` | Create | TODO |

### Code References from Existing Codebase

[List relevant code excerpts with line numbers that should be reused or as reference]

**Example from `js/client/actions.js` (lines 45-67)**:
```javascript
// Code snippet for reference
async function loadData() {
  // ...
}
```

---

## Test Plan

### Unit Tests

```javascript
describe('TASK-XXXX: [Task Title]', () => {
  test('AC-1: [Criterion]', () => {
    // Test implementation
  });

  test('AC-2: [Criterion]', () => {
    // Test implementation
  });
});
```

### Integration Tests

- [ ] Test: [Description]
- [ ] Test: [Description]

### Manual Test Steps

1. **Precondition**: [Setup state]
2. **Step 1**: [User action]
3. **Expected**: [Result]
4. **Step 2**: [User action]
5. **Expected**: [Result]

---

## Dependencies & Order

### Previous Tasks (Must Complete First)

- TASK-[YYYY]: [Task Title] — [Dependency reason]

### Blocks These Tasks

- TASK-[ZZZZ]: [Task Title] — [Blocking reason]

### External Dependencies

- [Any external service, API, or system dependency]

---

## Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| [Risk] | [LOW/MED/HIGH] | [LOW/MED/HIGH] | [Mitigation plan] |

---

## Delivery Checklist

- [ ] Task assigned to developer
- [ ] Developer reviews specifications
- [ ] Feature branch created
- [ ] Code implemented
- [ ] Tests written and passing
- [ ] Manual testing completed
- [ ] Code review requested
- [ ] Feedback incorporated
- [ ] Merged to main
- [ ] Verified on staging/production
- [ ] Task marked complete

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

## Notes

[Any additional notes or comments about this task]
