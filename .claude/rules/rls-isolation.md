# Claude Code Rules — RLS Isolation Architecture

**Project**: Portail Client V2 — Secure Multi-Tenant Isolation  
**Scope**: All Supabase queries and JavaScript refactoring  
**Effective**: 2026-04-26 (Phase MODEL)  
**Status**: ACTIVE

---

## Golden Rules (MUST FOLLOW)

### R1: RLS is the Single Source of Truth

**Rule**: All data isolation is enforced at the PostgreSQL RLS layer. JavaScript filtering is defense-in-depth, not the primary security control.

**Implication**:
- Never assume JavaScript filtering is sufficient
- Always verify that the corresponding RLS policy exists
- If a query can be made safe by RLS alone, do so

**Example**:
```javascript
// ✅ CORRECT: RLS will enforce isolation regardless of .eq() call
const { data } = await supabase
  .from('playbook_processes')
  .select('*')
  .eq('client_id', userClientId);

// ❌ WRONG: Relying on application filtering
const { data } = await supabase.from('playbook_processes').select('*');
const filtered = data.filter(p => p.client_id === userClientId);
```

---

### R2: Every Supabase Query Must Include `.eq('client_id', userClientId)`

**Rule**: All SELECT, UPDATE, and DELETE queries on RLS-protected tables must include explicit `client_id` filtering at the application layer.

**Scope**: Tables with RLS policies:
- `playbook_processes`
- `playbook_steps`
- `playbook_owners`

**Format**:
```javascript
await supabase
  .from('<table>')
  .select('*')
  .eq('client_id', userClientId);  // ← REQUIRED
```

**Exception**: Queries that don't access `client_id` (e.g., reading `clients` table for dropdown) are exempt.

**Code Review**: Grep for `.from('playbook_` queries without `.eq('client_id'` — escalate as security issue.

---

### R3: INSERT Queries Must Include `client_id` in Payload

**Rule**: When inserting into RLS-protected tables, always include the user's `client_id` in the new row.

**Format**:
```javascript
await supabase
  .from('playbook_processes')
  .insert([
    {
      client_id: userClientId,  // ← REQUIRED
      name: 'Process Name',
      // ... other fields
    }
  ])
  .select();
```

**Why**: RLS INSERT policy checks `NEW.client_id` matches user's `client_id`. If omitted, insert fails.

---

### R4: Never Modify `client_id` After Creation

**Rule**: The `client_id` column is immutable after initial INSERT. Do not include it in UPDATE statements.

**Implication**:
- Processes cannot be moved between clients
- Owners cannot change client assignment
- Prevents accidental cross-client data migration

**Correct**:
```javascript
// ✅ UPDATE name, status, but not client_id
await supabase
  .from('playbook_processes')
  .update({ name: 'New Name', status: 'active' })
  .eq('id', processId)
  .eq('client_id', userClientId);
```

**Wrong**:
```javascript
// ❌ Never include client_id in updates
await supabase
  .from('playbook_processes')
  .update({ client_id: 'new-client-id', name: 'New Name' })
  .eq('id', processId);
```

---

### R5: Admin Switcher via RLS-Protected UPDATE

**Rule**: Only users with `role='admin'` can update their own `client_id` to switch clients.

**Implementation**:
```javascript
async function switchAdminClient(newClientId) {
  const userId = supabase.auth.user().id;

  // RLS will enforce: role='admin' + user_id match
  const { error } = await supabase
    .from('profiles')
    .update({ client_id: newClientId })
    .eq('user_id', userId);

  if (error) {
    // User is not an admin, or invalid client_id
    return false;
  }

  // Update session with new client
  sessionStorage.setItem('userClientId', newClientId);
  return true;
}
```

**Security**:
- RLS policy `profiles_admin_switch_client` enforces `role='admin'`
- Non-admin attempts are blocked at database layer
- No role check needed in JavaScript (RLS is source of truth)

---

### R6: Cascading Isolation via FK Inheritance

**Rule**: `playbook_steps` inherit isolation from `playbook_processes` via the FK chain. Queries on steps are automatically scoped to the parent process's `client_id`.

**Understanding the Chain**:
```
playbook_steps.process_id 
  → playbook_processes.id
    → playbook_processes.client_id
      → User's profiles.client_id (RLS check)
```

**Implication**:
- Steps cannot be queried independently of their process
- Deleting a process cascades to delete steps
- RLS subqueries on `playbook_steps` automatically enforce client isolation

**Example**:
```javascript
// ✅ This is safe — RLS will verify steps belong to user's client
const { data } = await supabase
  .from('playbook_steps')
  .select('*')
  .eq('process_id', processId)
  .eq('client_id', userClientId);

// Internally, RLS checks:
// (SELECT client_id FROM playbook_processes WHERE id = process_id)
//   = profiles.client_id
```

---

### R7: Code Comments Explain RLS Context

**Rule**: All Supabase queries must include inline comments explaining the RLS enforcement.

**Pattern**:
```javascript
// RLS enforces client_id filtering at database layer
// This query respects RLS: client_id is immutable
const { data } = await supabase
  .from('playbook_processes')
  .select('*')
  .eq('client_id', userClientId);  // ← RLS double-checks this filter
```

**For Cascading Queries**:
```javascript
// Steps inherit client_id from parent process via FK chain
// RLS subquery: (SELECT client_id FROM playbook_processes WHERE id = process_id) = profiles.client_id
const { data } = await supabase
  .from('playbook_steps')
  .select('*')
  .eq('process_id', processId)
  .eq('client_id', userClientId);  // ← RLS enforces via subquery
```

---

### R8: Legacy Data Without `client_id` is Inaccessible

**Rule**: Rows with `client_id = NULL` (orphaned data) are filtered by RLS and never returned to users.

**Handling**:
- Do not attempt to query with `.eq('client_id', null)` — RLS blocks it
- During migration (Phase BUILD), audit and backfill/delete orphaned rows
- If orphaned rows exist post-deployment, they remain invisible to users (no data loss, just inaccessible)

**Verification**:
```sql
-- To check for orphaned rows (admin query in Supabase console)
SELECT COUNT(*) FROM playbook_processes WHERE client_id IS NULL;
-- Should return 0 after migration
```

---

### R9: Error Handling for RLS Violations

**Rule**: RLS denials appear as database errors with code `42501` (permission denied). Handle them gracefully.

**Pattern**:
```javascript
try {
  const { data, error } = await supabase
    .from('playbook_processes')
    .select('*')
    .eq('client_id', userClientId);

  if (error && error.code === '42501') {
    // RLS policy denied access
    console.error('RLS violation:', error.message);
    showUserMessage('You do not have permission to access this resource');
    return [];
  }

  return data;
} catch (e) {
  console.error('Database error:', e);
  showUserMessage('Failed to fetch data');
  return [];
}
```

**Never Expose RLS Details**: Do not display `error.message` to users; log it for debugging but show a generic message.

---

## Code Patterns (MUST USE)

### Pattern A: Query User's Client

```javascript
async function getUserClient() {
  // RLS: User can only read their own profile
  const { data, error } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('user_id', supabase.auth.user().id)
    .single();

  return data?.client_id;
}

// Call at app startup
const userClientId = await getUserClient();
sessionStorage.setItem('userClientId', userClientId);
```

### Pattern B: Load Playbook Data

```javascript
async function loadPlaybook() {
  const userClientId = sessionStorage.getItem('userClientId');

  // RLS enforces isolation; JS .eq() is defense-in-depth
  const { data: processes, error: procError } = await supabase
    .from('playbook_processes')
    .select('*')
    .eq('client_id', userClientId);

  if (procError) {
    console.error('Failed to load processes:', procError);
    return null;
  }

  // Load steps (inherit isolation from processes)
  const { data: steps, error: stepsError } = await supabase
    .from('playbook_steps')
    .select('*')
    .in('process_id', processes.map(p => p.id))
    .eq('client_id', userClientId);

  return { processes, steps };
}
```

### Pattern C: Create New Process

```javascript
async function createProcess(name, description) {
  const userClientId = sessionStorage.getItem('userClientId');
  const userId = supabase.auth.user().id;

  const { data, error } = await supabase
    .from('playbook_processes')
    .insert([
      {
        client_id: userClientId,  // ← REQUIRED
        name,
        description,
        owner_id: userId,
        status: 'draft'
      }
    ])
    .select();

  if (error) {
    console.error('Create failed:', error);
    return null;
  }

  return data[0];
}
```

### Pattern D: Admin Switch Client

```javascript
async function switchClient(newClientId) {
  const userId = supabase.auth.user().id;

  const { error } = await supabase
    .from('profiles')
    .update({ client_id: newClientId })
    .eq('user_id', userId);

  if (error) {
    console.error('Switch failed:', error);
    // Likely: user is not an admin
    return false;
  }

  // Update session
  sessionStorage.setItem('userClientId', newClientId);

  // Refresh all playbook data
  await loadPlaybook();
  return true;
}
```

---

## Code Review Checklist

Before approving any PR touching Supabase queries:

- [ ] All `.from('playbook_*')` queries include `.eq('client_id', userClientId)`
- [ ] INSERT queries include `client_id: userClientId` in payload
- [ ] UPDATE queries never modify `client_id` column
- [ ] Code comments explain RLS context
- [ ] No `.select('*')` without filtering (or documented as out-of-scope)
- [ ] Error handling includes `error.code === '42501'` check
- [ ] No hardcoded client IDs; use `sessionStorage.getItem('userClientId')`
- [ ] Admin switcher only accessible to users with `role='admin'`
- [ ] Refactoring checklist item marked complete

---

## Testing Requirements

### T1: RLS Policy Testing

**Location**: Supabase Playground or automated test suite

```sql
-- Test 1: User sees only own client data
SELECT * FROM playbook_processes;
-- Expected: Returns only rows matching user's client_id

-- Test 2: User cannot insert into different client
INSERT INTO playbook_processes (client_id, name, status) 
VALUES ('other-client-id', 'Test', 'draft');
-- Expected: permission denied

-- Test 3: Admin can switch clients
UPDATE profiles SET client_id = 'new-client-id' WHERE user_id = auth.uid();
SELECT * FROM playbook_processes;
-- Expected: Returns new-client-id data only
```

### T2: JavaScript Query Testing

**Location**: `js/test/` (if test suite exists)

```javascript
test('loadPlaybook respects RLS', async () => {
  const processes = await loadPlaybook();
  expect(processes.every(p => p.client_id === sessionStorage.getItem('userClientId'))).toBe(true);
});

test('createProcess includes client_id', async () => {
  const newProcess = await createProcess('Test', 'Description');
  expect(newProcess.client_id).toBe(sessionStorage.getItem('userClientId'));
});
```

---

## Migration & Refactoring

### Checklist for Phase BUILD

- [ ] Audit all `.from('playbook_*')` queries in JavaScript
- [ ] Refactor each query to include `.eq('client_id', userClientId)`
- [ ] Deploy RLS policies to Supabase
- [ ] Test in Supabase Playground with multiple user roles
- [ ] Manual integration test: Taïna cannot see Face Soul Yoga data
- [ ] Manual admin test: Admin can switch clients and see new data
- [ ] Security audit: ANON key cannot access RLS-protected tables
- [ ] Performance baseline: <5% query latency increase

---

## References

- **System Specification**: `docs/specs/system.md`
- **Domain Specification**: `docs/specs/domain.md`
- **API Specification**: `docs/specs/api.md`
- **ADR-0001**: `docs/adr/ADR-0001-rls-isolation.md`
- **Project Config**: `project-config.json`
- **Brief**: `docs/brief.md`
- **Scope**: `docs/scope.md`
- **Acceptance Criteria**: `docs/acceptance.md`

---

## Questions & Escalation

### Q: What if I need to query across multiple clients?

**A**: Out of scope for V1. Phase PLAN may define an Edge Function with elevated privileges. For now, assume single-client queries only.

### Q: Can I cache playbook data on the client?

**A**: Yes, but invalidate after admin switcher. Include timestamp in cache key to detect stale data across session switches.

### Q: How do I handle stale JWT tokens?

**A**: Supabase handles token refresh automatically. If token is expired, RLS will deny queries. Display "session expired" message and ask user to log in again.

### Q: What about unit testing RLS policies?

**A**: Use Supabase Playground SQL interface to test policies with different roles. Automated testing is possible via SDK but out of scope for V1.

---

**Prepared by**: Factory Pipeline (MODEL Phase - Rules Generation)  
**Status**: ACTIVE (Phase BUILD onwards)  
**Last Updated**: 2026-04-26
