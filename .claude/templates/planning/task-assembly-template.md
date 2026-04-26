# Task — TASK-0000-app-assembly [Project Setup & Assembly]

**Project**: [Project Name]  
**Phase**: PLAN  
**Status**: TODO  
**Complexity**: MEDIUM  
**Duration**: 2-3 hours

---

## Overview

Initial project setup and assembly task. This task ensures all dependencies are installed, configurations are in place, and the project builds/tests successfully.

**Purpose**: To verify the development environment is correctly configured before implementing feature tasks.

---

## Acceptance Criteria

### AC-1: Dependencies Installed

**Given** a clean project directory  
**When** running the dependency installation command  
**Then** all packages are installed with exact versions from stack reference

**Verification**: [ ] Manual installation, [ ] Package lock verified

### AC-2: Configuration Files Created

**Given** all dependencies installed  
**When** creating configuration files  
**Then** all required configs exist and match reference specification

**Verification**: [ ] Files exist, [ ] Content matches template

### AC-3: Build Passes

**Given** all dependencies and configs in place  
**When** running the build command  
**Then** build completes without errors or warnings

**Verification**: [ ] No build errors, [ ] Bundle size acceptable

### AC-4: Tests Pass

**Given** clean build  
**When** running the test suite  
**Then** all tests pass (or are skipped if not applicable)

**Verification**: [ ] Test output shows passing, [ ] Coverage acceptable

---

## Definition of Done (DoD)

- [ ] Read `docs/specs/stack-reference.md` completely
- [ ] Install EXACTLY the packages listed in stack-reference.md (versions must match)
- [ ] Create configuration files EXACTLY as shown in stack-reference.md templates
- [ ] Verify `pnpm build` completes without errors
- [ ] Verify `pnpm test` completes without errors
- [ ] Document any deviations from stack-reference (escalate to PM if necessary)
- [ ] Verify development server starts (`pnpm dev` if applicable)
- [ ] Commit assembly task completion with message: "TASK-0000: app-assembly - Project setup complete"
- [ ] Create a summary: List all installed packages and configs created

---

## Implementation Steps

### Step 1: Read Stack Reference

Read the complete file: `docs/specs/stack-reference.md`

This file is the **source of truth** for:
- Package names and versions
- Configuration file templates
- Build/test commands

**Do NOT invent versions or configurations** — use only what stack-reference.md specifies.

### Step 2: Install Dependencies

Run the package manager installation:

```bash
pnpm install
```

**Verification**:
- [ ] `pnpm-lock.yaml` (or equivalent) created/updated
- [ ] `node_modules/` directory exists
- [ ] No resolution errors
- [ ] Lockfile shows exact versions from stack-reference.md

### Step 3: Create Configuration Files

For each configuration file in stack-reference.md, create it with exact content:

```bash
# Create .env (if needed)
cp .env.example .env  # OR create manually from template

# Create other configs (tailwind.config.js, vite.config.js, etc.)
# See stack-reference.md for exact content
```

**Verification**:
- [ ] All config files exist in project root
- [ ] Content matches stack-reference.md exactly
- [ ] No missing configuration keys

### Step 4: Build Project

```bash
pnpm build
```

**Expected Output**:
- Build completes successfully
- No errors or warnings (or documented acceptable warnings)
- Output files created in expected location (e.g., `dist/`, `.next/`, `build/`)

**If Build Fails**:
1. Read the error message carefully
2. Check stack-reference.md for build configuration
3. If unsure, escalate to tech lead (do NOT guess fixes)

### Step 5: Run Tests

```bash
pnpm test
```

**Expected Output**:
- All tests pass (or are skipped if not applicable)
- Test coverage meets project requirements
- No test errors

**If Tests Fail**:
1. Review test output for failing tests
2. Check if tests are environment-dependent (missing .env, etc.)
3. If unsure, escalate (do NOT modify tests without PM/tech lead approval)

### Step 6: Document & Summarize

Create a summary file: `ASSEMBLY-SUMMARY.md`

```markdown
# Assembly Task Completion Summary

**Date**: [Today's Date]  
**Duration**: [Hours Spent]

## Dependencies Installed

| Package | Version | Source |
|---------|---------|--------|
| [pkg] | [version] | stack-reference.md |

**Total Packages**: [N]

## Configuration Files Created

| File | Location | Template Source |
|------|----------|-----------------|
| [config] | [path] | stack-reference.md |

**Total Files**: [N]

## Build & Test Results

- [ ] `pnpm build` ✅ PASSED
- [ ] `pnpm test` ✅ PASSED
- [ ] No console errors
- [ ] Environment ready for feature development

## Notes

[Any issues encountered, workarounds applied, escalations made]

## Timestamp

- Assembly started: [HH:MM]
- Assembly completed: [HH:MM]
- Duration: [HH:MM]
```

---

## References

- **Stack Reference**: `docs/specs/stack-reference.md` ← SOURCE OF TRUTH
- **Brief**: `docs/brief.md`
- **Scope**: `docs/scope.md`
- **Project Config**: `project-config.json`
- **CLAUDE.md**: `.claude/CLAUDE.md`

---

## Critical Notes

🚨 **DO NOT**:
- Install packages not in stack-reference.md
- Use different versions than specified in stack-reference.md
- Guess at configurations — follow stack-reference.md exactly
- Skip tests or build steps
- Merge without all DoD items checked

✅ **DO**:
- Read stack-reference.md completely before starting
- Document any deviations (and escalate)
- Verify each step before moving to the next
- Ask questions if anything is unclear
- Ensure all teams are using the same versions

---

## Success Indicators

After completing this task, the project should be:

1. **Ready to Build**: `pnpm build` completes successfully
2. **Ready to Test**: `pnpm test` completes successfully
3. **Ready to Develop**: Developers can implement feature tasks without environment issues
4. **Version Locked**: All packages and configs are pinned to exact versions
5. **Documented**: ASSEMBLY-SUMMARY.md created with full record

**Next Step**: Implement feature tasks (TASK-0001 onwards)
