# API Specification — Secure Playbook Multi-Tenant Isolation

**Version**: 1.0  
**Evolution Mode**: Greenfield V1  
**Generated**: 2026-04-26  
**Phase**: MODEL (Architecture)  
**Status**: Ready for Implementation

---

## Executive Summary

This document specifies the technical API layer for secure playbook multi-tenant isolation. It includes:
1. **SQL RLS Policies** (database-level access control)
2. **JavaScript Client Patterns** (application-level data handling)
3. **Endpoint Specifications** (admin switcher and related operations)
4. **Error Handling** (RLS denial responses and recovery)

---

## Part 1: SQL RLS Policies

### RLS Policy: `playbook_processes` — SELECT

**Name**: `playbook_processes_select_policy`

**Table**: `playbook_processes`

**Trigger**: SELECT

**Policy Logic**:
```sql
CREATE POLICY playbook_processes_select_policy
  ON playbook_processes
  FOR SELECT
  USING (
    -- User must have same client_id as the process
    (SELECT client_id FROM profiles WHERE user_id = auth.uid()) 
      = playbook_processes.client_id
  );
```

**Effect**:
- User sees only processes belonging to their `client_id`
- RLS blocks access to processes from other clients
- ANON key (unauthenticated) cannot access any processes

**Test Case**:
```sql
-- As Admin (client_id = 'Client A')
SELECT * FROM playbook_processes;
-- → Returns only Client A processes

-- As Client User (client_id = 'Guadeloupe Explor')
SELECT * FROM playbook_processes;
-- → Returns only Guadeloupe Explor processes

-- As ANON key (unauthenticated)
SELECT * FROM playbook_processes;
-- → permission denied (or empty result)
```

---

### RLS Policy: `playbook_processes` — INSERT

**Name**: `playbook_processes_insert_policy`

**Table**: `playbook_processes`

**Trigger**: INSERT

**Policy Logic**:
```sql
CREATE POLICY playbook_processes_insert_policy
  ON playbook_processes
  FOR INSERT
  WITH CHECK (
    -- User must be inserting into their own client_id
    auth.uid() IS NOT NULL
    AND (SELECT client_id FROM profiles WHERE user_id = auth.uid()) = NEW.client_id
  );
```

**Effect**:
- User can only INSERT into processes for their assigned client
- Attempting to insert for a different client is blocked by RLS
- INSERT with `client_id = NULL` is rejected

**Test Case**:
```sql
-- As Admin (client_id = 'Client A')
INSERT INTO playbook_processes (client_id, name, status)
VALUES ('Client A', 'New Process', 'draft');
-- → Success

INSERT INTO playbook_processes (client_id, name, status)
VALUES ('Client B', 'New Process', 'draft');
-- → permission denied (RLS blocks)
```

---

### RLS Policy: `playbook_processes` — UPDATE

**Name**: `playbook_processes_update_policy`

**Table**: `playbook_processes`

**Trigger**: UPDATE

**Policy Logic**:
```sql
CREATE POLICY playbook_processes_update_policy
  ON playbook_processes
  FOR UPDATE
  USING (
    -- User must have same client_id as the process
    (SELECT client_id FROM profiles WHERE user_id = auth.uid()) 
      = playbook_processes.client_id
  )
  WITH CHECK (
    -- User cannot change client_id (immutable after creation)
    playbook_processes.client_id = OLD.client_id
    -- User must still have access to the process
    AND (SELECT client_id FROM profiles WHERE user_id = auth.uid()) 
      = playbook_processes.client_id
  );
```

**Effect**:
- User can only UPDATE processes from their client
- `client_id` column is immutable (UPDATE rejects changes)
- Other columns (name, status, etc.) can be modified
- Prevents cross-client data migration

**Test Case**:
```sql
-- As Admin (client_id = 'Client A')
UPDATE playbook_processes 
SET name = 'Updated Process'
WHERE id = 'process-1' AND client_id = 'Client A';
-- → Success (if process exists and belongs to Client A)

UPDATE playbook_processes 
SET client_id = 'Client B'
WHERE id = 'process-1';
-- → permission denied (client_id is immutable)

UPDATE playbook_processes 
SET name = 'Updated'
WHERE id = 'process-2' AND client_id = 'Client B';
-- → permission denied (process doesn't belong to user's client)
```

---

### RLS Policy: `playbook_processes` — DELETE

**Name**: `playbook_processes_delete_policy`

**Table**: `playbook_processes`

**Trigger**: DELETE

**Policy Logic**:
```sql
CREATE POLICY playbook_processes_delete_policy
  ON playbook_processes
  FOR DELETE
  USING (
    -- User must have same client_id as the process
    (SELECT client_id FROM profiles WHERE user_id = auth.uid()) 
      = playbook_processes.client_id
  );
```

**Effect**:
- User can only DELETE processes from their client
- Deletion cascades to steps and owners (if FK cascade is configured)
- Prevents cross-client data loss

**Test Case**:
```sql
-- As Admin (client_id = 'Client A')
DELETE FROM playbook_processes 
WHERE id = 'process-1' AND client_id = 'Client A';
-- → Success (if process exists and belongs to Client A)

DELETE FROM playbook_processes 
WHERE id = 'process-2' AND client_id = 'Client B';
-- → permission denied (process doesn't belong to user's client)
```

---

### RLS Policy: `playbook_steps` — SELECT (Cascading)

**Name**: `playbook_steps_select_policy`

**Table**: `playbook_steps`

**Trigger**: SELECT

**Policy Logic**:
```sql
CREATE POLICY playbook_steps_select_policy
  ON playbook_steps
  FOR SELECT
  USING (
    -- Steps inherit client_id from parent process via FK chain
    (SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id)
      = (SELECT client_id FROM profiles WHERE user_id = auth.uid())
  );
```

**Effect**:
- User sees only steps from processes belonging to their client
- Steps are inaccessible if parent process is not owned by user's client
- Cascading isolation is automatic via FK chain

**Test Case**:
```sql
-- As User (client_id = 'Client A')
SELECT * FROM playbook_steps 
WHERE process_id = 'process-1';
-- → Returns steps only if process-1 belongs to Client A
-- → permission denied if process-1 belongs to Client B
```

---

### RLS Policy: `playbook_steps` — INSERT (Cascading)

**Name**: `playbook_steps_insert_policy`

**Table**: `playbook_steps`

**Trigger**: INSERT

**Policy Logic**:
```sql
CREATE POLICY playbook_steps_insert_policy
  ON playbook_steps
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (SELECT client_id FROM playbook_processes WHERE id = NEW.process_id)
      = (SELECT client_id FROM profiles WHERE user_id = auth.uid())
  );
```

**Effect**:
- User can only INSERT steps into processes they own
- `process_id` must belong to user's client
- Inherited `client_id` is verified via process ownership

**Test Case**:
```sql
-- As User (client_id = 'Client A')
INSERT INTO playbook_steps (process_id, name, order)
VALUES ('process-1', 'New Step', 1);
-- → Success if process-1 belongs to Client A
-- → permission denied if process-1 belongs to Client B
```

---

### RLS Policy: `playbook_steps` — UPDATE (Cascading)

**Name**: `playbook_steps_update_policy`

**Table**: `playbook_steps`

**Trigger**: UPDATE

**Policy Logic**:
```sql
CREATE POLICY playbook_steps_update_policy
  ON playbook_steps
  FOR UPDATE
  USING (
    (SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id)
      = (SELECT client_id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    (SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id)
      = (SELECT client_id FROM profiles WHERE user_id = auth.uid())
    AND playbook_steps.process_id = OLD.process_id  -- process_id is immutable
  );
```

**Effect**:
- User can only UPDATE steps in processes they own
- `process_id` cannot be changed (immutable)
- Other columns (name, order, description) can be modified

---

### RLS Policy: `playbook_steps` — DELETE (Cascading)

**Name**: `playbook_steps_delete_policy`

**Table**: `playbook_steps`

**Trigger**: DELETE

**Policy Logic**:
```sql
CREATE POLICY playbook_steps_delete_policy
  ON playbook_steps
  FOR DELETE
  USING (
    (SELECT client_id FROM playbook_processes WHERE id = playbook_steps.process_id)
      = (SELECT client_id FROM profiles WHERE user_id = auth.uid())
  );
```

**Effect**:
- User can only DELETE steps in processes they own
- Deletion is scoped to user's client via process ownership

---

### RLS Policy: `playbook_owners` — SELECT

**Name**: `playbook_owners_select_policy`

**Table**: `playbook_owners`

**Trigger**: SELECT

**Policy Logic**:
```sql
CREATE POLICY playbook_owners_select_policy
  ON playbook_owners
  FOR SELECT
  USING (
    -- User must have same client_id as the owner
    (SELECT client_id FROM profiles WHERE user_id = auth.uid()) 
      = playbook_owners.client_id
  );
```

**Effect**:
- User sees only owners belonging to their client
- Owner records from other clients are inaccessible

---

### RLS Policy: `playbook_owners` — INSERT

**Name**: `playbook_owners_insert_policy`

**Table**: `playbook_owners`

**Trigger**: INSERT

**Policy Logic**:
```sql
CREATE POLICY playbook_owners_insert_policy
  ON playbook_owners
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (SELECT client_id FROM profiles WHERE user_id = auth.uid()) = NEW.client_id
  );
```

**Effect**:
- User can only INSERT owners for their client
- Owner's `client_id` must match user's `client_id`

---

### RLS Policy: `playbook_owners` — UPDATE

**Name**: `playbook_owners_update_policy`

**Table**: `playbook_owners`

**Trigger**: UPDATE

**Policy Logic**:
```sql
CREATE POLICY playbook_owners_update_policy
  ON playbook_owners
  FOR UPDATE
  USING (
    (SELECT client_id FROM profiles WHERE user_id = auth.uid()) 
      = playbook_owners.client_id
  )
  WITH CHECK (
    (SELECT client_id FROM profiles WHERE user_id = auth.uid()) 
      = playbook_owners.client_id
    AND playbook_owners.client_id = OLD.client_id  -- client_id is immutable
  );
```

**Effect**:
- User can only UPDATE owners from their client
- `client_id` is immutable (cannot change ownership to another client)

---

### RLS Policy: `playbook_owners` — DELETE

**Name**: `playbook_owners_delete_policy`

**Table**: `playbook_owners`

**Trigger**: DELETE

**Policy Logic**:
```sql
CREATE POLICY playbook_owners_delete_policy
  ON playbook_owners
  FOR DELETE
  USING (
    (SELECT client_id FROM profiles WHERE user_id = auth.uid()) 
      = playbook_owners.client_id
  );
```

**Effect**:
- User can only DELETE owners from their client

---

### RLS Policy: `profiles` — Admin Switcher

**Name**: `profiles_admin_switch_client`

**Table**: `profiles`

**Trigger**: UPDATE

**Scope**: Admin users only

**Policy Logic**:
```sql
CREATE POLICY profiles_admin_switch_client
  ON profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND role = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'admin'
  );
```

**Allowed Updates**: `client_id` column (other columns blocked via column-level policies if needed)

**Effect**:
- Admin users can update their own `client_id` to switch clients
- Non-admin users cannot update `client_id`
- Users cannot modify other users' profiles

**Test Case**:
```sql
-- As Admin (user_id = 'admin-123', role = 'admin')
UPDATE profiles 
SET client_id = 'new-client-id'
WHERE user_id = 'admin-123';
-- → Success

-- As Client User (user_id = 'client-456', role = 'client')
UPDATE profiles 
SET client_id = 'new-client-id'
WHERE user_id = 'client-456';
-- → permission denied (not an admin)
```

---

## Part 2: JavaScript Client Patterns

### Pattern 1: Fetch User's Client

**Purpose**: Load user's assigned/active `client_id` from `profiles`

**Code**:
```javascript
async function getUserClient() {
  // RLS enforces that user can only read their own profile
  const { data, error } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('user_id', supabase.auth.user().id)
    .single();

  if (error) {
    console.error('Failed to fetch user client:', error);
    return null;
  }

  return data.client_id;
}

// Usage
const userClientId = await getUserClient();
sessionStorage.setItem('userClientId', userClientId);
```

---

### Pattern 2: Query Playbook Processes (Safe)

**Purpose**: Fetch processes for current user's client with RLS enforcement

**Code**:
```javascript
async function getPlaybookProcesses() {
  const userClientId = sessionStorage.getItem('userClientId');
  
  // RLS enforces client_id filtering at database layer
  // JavaScript filter is defense-in-depth (redundant but safe)
  const { data, error } = await supabase
    .from('playbook_processes')
    .select('*')
    .eq('client_id', userClientId);  // ← Explicit filtering

  if (error) {
    console.error('RLS enforcement:', error);
    // RLS denial: user attempted unauthorized access
    // Display: "Permission denied" (do not expose RLS details)
    return [];
  }

  return data;
}
```

**Pattern Explanation**:
- `.eq('client_id', userClientId)` is sent to Supabase client
- Supabase constructs query with WHERE filter
- RLS policy evaluates in addition to WHERE clause
- Both layers filter independently (defense-in-depth)

---

### Pattern 3: Create New Process

**Purpose**: Insert a process for user's client

**Code**:
```javascript
async function createPlaybookProcess(name, description) {
  const userClientId = sessionStorage.getItem('userClientId');
  const userId = supabase.auth.user().id;

  // Must include client_id in payload
  // RLS INSERT policy verifies client_id matches user's client
  const { data, error } = await supabase
    .from('playbook_processes')
    .insert([
      {
        client_id: userClientId,  // ← Critical: required by RLS
        name: name,
        description: description,
        owner_id: userId,
        status: 'draft'
      }
    ])
    .select();

  if (error) {
    console.error('Create process failed:', error);
    // Possible causes:
    // 1. RLS denied (client_id mismatch)
    // 2. Invalid data (validation error)
    // 3. FK violation (invalid owner_id or client_id)
    return null;
  }

  return data[0];
}
```

---

### Pattern 4: Update Process

**Purpose**: Modify process name, status, etc. (NOT client_id)

**Code**:
```javascript
async function updatePlaybookProcess(processId, updates) {
  const userClientId = sessionStorage.getItem('userClientId');

  // RLS UPDATE policy enforces:
  // 1. User must own the process (client_id match)
  // 2. client_id is immutable (cannot be changed)
  const { data, error } = await supabase
    .from('playbook_processes')
    .update(updates)  // Do NOT include client_id here
    .eq('id', processId)
    .eq('client_id', userClientId)  // ← RLS enforcement
    .select();

  if (error) {
    console.error('Update failed:', error);
    // RLS denial: user does not own the process
    return null;
  }

  return data[0];
}
```

**Key Point**: Do NOT include `client_id` in updates; it's immutable.

---

### Pattern 5: Delete Process

**Purpose**: Remove a process (cascades to steps and owners)

**Code**:
```javascript
async function deletePlaybookProcess(processId) {
  const userClientId = sessionStorage.getItem('userClientId');

  // RLS DELETE policy enforces:
  // 1. User must own the process (client_id match)
  const { error } = await supabase
    .from('playbook_processes')
    .delete()
    .eq('id', processId)
    .eq('client_id', userClientId);  // ← RLS enforcement

  if (error) {
    console.error('Delete failed:', error);
    return false;
  }

  return true;
}
```

---

### Pattern 6: Admin Switch Client

**Purpose**: Allow admin user to switch their active `client_id`

**Code**:
```javascript
async function switchAdminClient(newClientId) {
  const userId = supabase.auth.user().id;

  // RLS profile policy enforces:
  // 1. User is admin (role = 'admin')
  // 2. User is updating their own row
  const { error } = await supabase
    .from('profiles')
    .update({ client_id: newClientId })
    .eq('user_id', userId)
    .select();

  if (error) {
    console.error('Switch client failed:', error);
    // Possible causes:
    // 1. User is not an admin (RLS blocks)
    // 2. Invalid client_id (FK violation)
    return false;
  }

  // Update session storage with new client_id
  sessionStorage.setItem('userClientId', newClientId);

  // Refresh playbook data for new client
  await refreshPlaybookData();

  return true;
}

async function refreshPlaybookData() {
  // Re-query playbook tables with new client_id
  // RLS will enforce isolation for new client
  const processes = await getPlaybookProcesses();
  renderPlaybook(processes);
}
```

---

### Pattern 7: Secure Query (AVOID)

**Purpose**: ANTI-PATTERN — What NOT to do

**Bad Code**:
```javascript
// ❌ WRONG: Fetch all processes and filter client-side
const { data } = await supabase
  .from('playbook_processes')
  .select('*');  // No WHERE clause; fetches everything!

const filtered = data.filter(p => p.client_id === userClientId);

// PROBLEM: If RLS is disabled, attacker gets ALL processes
// If RLS is enabled, no data is returned (RLS blocks SELECT)
// But vulnerability persists in code architecture
```

**Correct Code**:
```javascript
// ✅ CORRECT: Explicit filtering at query layer
const { data } = await supabase
  .from('playbook_processes')
  .select('*')
  .eq('client_id', userClientId);  // Server-side filtering + RLS
```

---

## Part 3: Endpoint Specifications

### Endpoint: Switch Client (Admin Only)

**HTTP Method**: POST

**Path**: `/api/switch-client` (or via Supabase RLS-protected UPDATE)

**Authentication**: Supabase JWT token (required)

**Request Body**:
```json
{
  "client_id": "uuid-of-target-client"
}
```

**Response** (Success 200):
```json
{
  "success": true,
  "user_id": "auth-user-id",
  "client_id": "uuid-of-target-client",
  "client_name": "Client Name",
  "switched_at": "2026-04-26T12:00:00Z"
}
```

**Response** (Failure 403):
```json
{
  "error": "Unauthorized",
  "message": "Only administrators can switch clients",
  "code": "ADMIN_REQUIRED"
}
```

**Response** (Failure 400):
```json
{
  "error": "Bad Request",
  "message": "Invalid client_id format",
  "code": "INVALID_CLIENT_ID"
}
```

**Implementation Options**:

**Option A**: Direct Supabase UPDATE (Recommended)
```javascript
async function switchAdminClient(clientId) {
  const { error } = await supabase
    .from('profiles')
    .update({ client_id: clientId })
    .eq('user_id', supabase.auth.user().id);

  if (error) throw error;
  
  // Update session
  sessionStorage.setItem('userClientId', clientId);
  return { success: true, client_id: clientId };
}
```

**Option B**: Supabase Edge Function (If centralized logic needed)
```sql
-- In Edge Function (deno)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { client_id } = await req.json();
  const user = await supabase.auth.getUser();

  // Verify admin role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.user.id)
    .single();

  if (profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Not admin' }), { status: 403 });
  }

  // Update client_id
  await supabase
    .from('profiles')
    .update({ client_id })
    .eq('user_id', user.user.id);

  return new Response(JSON.stringify({ success: true, client_id }));
});
```

---

## Part 4: Error Handling

### EH-001: RLS Denial (permission denied)

**Scenario**: User queries data outside their `client_id`

**Supabase Error Response**:
```json
{
  "code": "42501",
  "message": "new row violates row-level security policy",
  "hint": null
}
```

**Application Response**:
```javascript
try {
  const { data, error } = await supabase
    .from('playbook_processes')
    .select('*');

  if (error && error.code === '42501') {
    console.error('RLS violation:', error.message);
    displayUserMessage('You do not have permission to access this resource');
    return [];
  }
} catch (e) {
  console.error('Database error:', e);
}
```

---

### EH-002: Foreign Key Violation

**Scenario**: User attempts to reference invalid FK (e.g., wrong client_id in owner assignment)

**Supabase Error Response**:
```json
{
  "code": "23503",
  "message": "insert or update on table violates foreign key constraint",
  "hint": "Key (client_id)=(invalid-uuid) is not present in table \"clients\"."
}
```

**Application Response**:
```javascript
if (error && error.code === '23503') {
  console.error('FK violation:', error.message);
  displayUserMessage('The selected client does not exist');
  return null;
}
```

---

### EH-003: Not Null Violation

**Scenario**: User attempts INSERT without required `client_id`

**Supabase Error Response**:
```json
{
  "code": "23502",
  "message": "null value in column violates not-null constraint",
  "hint": "Failing row contains (...)."
}
```

**Application Response**:
```javascript
if (error && error.code === '23502') {
  console.error('Missing required field:', error.message);
  displayUserMessage('Required field missing');
  return null;
}
```

---

### EH-004: Unique Constraint Violation

**Scenario**: Duplicate entry (if unique constraint exists on table)

**Supabase Error Response**:
```json
{
  "code": "23505",
  "message": "duplicate key value violates unique constraint",
  "hint": "Key (...)=(...) already exists."
}
```

---

## Part 5: Testing & Validation

### Test Plan

#### Test 1: SELECT Policy Enforcement
```javascript
test('User can only SELECT own client data', async () => {
  // Login as Client A user
  const { data } = await supabase
    .from('playbook_processes')
    .select('*');

  // Should return only Client A processes
  expect(data.every(p => p.client_id === 'Client A')).toBe(true);
});
```

#### Test 2: INSERT Policy Enforcement
```javascript
test('User cannot INSERT into different client', async () => {
  const { error } = await supabase
    .from('playbook_processes')
    .insert([{ client_id: 'Client B', name: 'Test' }]);

  // Should fail with permission denied
  expect(error.code).toBe('42501');
});
```

#### Test 3: Admin Switcher
```javascript
test('Admin can switch clients and see different data', async () => {
  // Switch to Client B
  await switchAdminClient('Client B');

  // Query playbook
  const { data } = await supabase
    .from('playbook_processes')
    .select('*')
    .eq('client_id', 'Client B');

  // Should return Client B data
  expect(data.every(p => p.client_id === 'Client B')).toBe(true);
});
```

---

**Document prepared by**: Factory Pipeline (MODEL Phase - Architecture)  
**For review by**: Architect, Backend Engineer, Security Lead  
**Status**: Ready for Implementation (Phase BUILD)
