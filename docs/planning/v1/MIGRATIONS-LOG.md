# Migrations Log — RLS Foundation (Phase BUILD)

**Project**: Portail Client V2 — Secure Multi-Tenant Isolation  
**Phase**: BUILD (Implementation)  
**Epic**: Epic 1 — RLS Foundation

---

## Migration: create_playbook_clients

**Timestamp**: 2026-04-26 21:54:09 UTC  
**Status**: ✅ SUCCESS  
**Task**: TASK-0002

### Schema

```sql
CREATE TABLE public.playbook_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  status varchar(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX idx_playbook_clients_status ON public.playbook_clients(status);
CREATE INDEX idx_playbook_clients_name ON public.playbook_clients(name);

ALTER TABLE public.playbook_clients ENABLE ROW LEVEL SECURITY;
```

### Seed Data Inserted

| Client | Status | UUID |
|--------|--------|------|
| Client A | active | 602c1f44-504f-4ea4-a1e3-592dbdf8aeaf |
| Guadeloupe Explor | active | 9940623d-3c30-47ea-b113-069327010288 |
| Face Soul Yoga | active | 8ccc177f-b7d2-4b5e-ac70-a10a042e7b99 |
| Taïna | active | bbce1c4f-c1ff-44ad-9d6e-1bd9faf1d29a |

**Total Rows Inserted**: 4

### Verification

✅ Table created with 5 columns (id, name, status, created_at, updated_at)  
✅ Primary key: UUID with auto-generation  
✅ Unique constraint on `name`  
✅ CHECK constraint on `status` (active/inactive/archived)  
✅ Indexes created on `status` and `name`  
✅ RLS enabled (policies deferred to Epic 2)  
✅ 4 seed clients inserted  

### Impact

- **New table**: `public.playbook_clients` (authoritative client master data)
- **Dependencies**: Next task will update FK from `playbook_processes.client_id` to reference this table
- **Blockers**: None

---

## Migration: backfill_profiles_client_id

**Timestamp**: 2026-04-26 21:55:12 UTC  
**Status**: ✅ SUCCESS  
**Task**: TASK-0003

### Operations

1. Dropped old FK constraint `profiles_client_id_fkey` (was pointing to profiles.id)
2. Backfilled 6 profiles with correct `playbook_clients` mappings
3. Set column as NOT NULL
4. Created new FK constraint pointing to `playbook_clients.id`
5. Created index on `client_id`

### Backfill Logic

| User | Email | Role | Client |
|------|-------|------|--------|
| catherine@csbusiness.fr | admin | Client A |
| michael@csbusiness.fr | admin | Client A |
| fu@fusolutions.fr | client | Client A (default) |
| support@facesoulyoga.com | client | Face Soul Yoga |
| aurelia.delsol@gmail.com | client | Face Soul Yoga |
| ttharsis@guadeloupe-explor.com | client | Guadeloupe Explor |

### Verification

✅ 6/6 profiles backfilled  
✅ 0 NULL values  
✅ All FK references valid  
✅ New FK constraint points to playbook_clients.id  
✅ Index created on client_id for performance

### Impact

- **Modified table**: `public.profiles` (linked users to clients)
- **Constraint change**: FK now correctly references `playbook_clients` instead of self-referential
- **Blockers**: None
- **Data clean**: All 6 users properly assigned to their clients

---

## Next Migrations

1. ✅ TASK-0001: Audit playbook_processes schema
2. ✅ TASK-0002: Create playbook_clients table
3. ✅ TASK-0003: Backfill profiles with client_id
4. → TASK-0004: Fix FK in `playbook_processes` (client_id → playbook_clients.id)
5. → TASK-0005+: RLS policies on all tables

---

**Status**: Ready for TASK-0004  
**Architecture Checkpoint**: Multi-tenant foundation established ✅✅✅
