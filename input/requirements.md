# Requirements — Isolation Multi-Tenant Sécurisée (Playbook)

## Overview

**Problem**: L'isolation multi-tenant du playbook.html est entièrement côté JavaScript. Aucun RLS (Row Level Security) n'est implémenté dans Supabase. Cela signifie que Taïna (Guadeloupe Explor) peut voir toutes les données de Face Soul Yoga. Un attaquant qui obtient la clé ANON peut lire/modifier/supprimer les données de tous les clients.

**Solution**: Implémenter une architecture RLS stricte dans Supabase. Chaque client ne verra QUE ses propres données (processus, étapes, propriétaires). Les admins pourront switcher entre clients avec restriction côté serveur.

## Scope & Objectives

- **OBJ-001**: Implémenter RLS sur `playbook_processes`, `playbook_steps`, `playbook_owners`
- **OBJ-002**: Refactorer JavaScript pour filtrer côté Supabase (`.eq('client_id', userClientId)`) au lieu de côté front
- **OBJ-003**: Ajouter colonne `client_id` à `profiles` (si manquante)
- **OBJ-004**: Tester isolation multi-tenant (vérifier que Taïna ne voit que Guadeloupe Explor)
- **OBJ-005**: Documenter architecture RLS pour maintenabilité

## Requirements

### Functional Requirements

- **REQ-001**: Chaque client ne voit que ses propres processus (`playbook_processes` filtrés par `client_id`)
- **REQ-002**: Chaque client ne voit que ses propres étapes (`playbook_steps` cascadé via `process_id`)
- **REQ-003**: Chaque client ne voit que ses propres propriétaires (`playbook_owners` filtrés par `client_id`)
- **REQ-004**: Admin peut switcher entre clients et voir seulement ce client
- **REQ-005**: Tous les `.update()` et `.delete()` doivent vérifier ownership côté Supabase
- **REQ-006**: Les requêtes JavaScript utilisent `.eq('client_id', userClientId)` au lieu de `.select('*')` + filtrage front

### Non-Functional Requirements

- **NFR-001**: Security — RLS activé sur toutes les tables concernées (Secure-by-Design)
- **NFR-002**: Performance — Pas de dégradation (RLS natif Supabase)
- **NFR-003**: Accessibility — Pas de changement UI (RLS est transparent)
- **NFR-004**: Maintainability — Documentation claire des policies RLS

## Data Types

### Inputs

- User session (auth.uid())
- User profile (role: 'client' | 'admin', client_id: UUID)
- Playbook data (processes, steps, owners avec colonne `client_id`)

### Outputs

- Filtered datasets (processus/étapes/propriétaires du client connecté uniquement)
- RLS audit log (optionnel)

## Constraints

- **Timeline**: 3-5 jours (audit + implémentation + test)
- **Resources**: Supabase PostgreSQL + Supabase JS client
- **Technical**: 
  - Stack existant: HTML5 + Vanilla JS + Supabase
  - Pas de rupture compatibilité (interface inchangée)
  - Clé ANON reste exposée (par design Supabase)

## Success Criteria

- [x] Audit de sécurité complété (AUDIT-SECURITE-MULTITENANT.md)
- [ ] RLS activé sur playbook_processes, playbook_steps, playbook_owners
- [ ] Policies RLS testées et validées
- [ ] JavaScript refactorisé (.eq('client_id', ...) appliqué partout)
- [ ] Tests manuels: Taïna ne voit QUE Guadeloupe Explor
- [ ] Tests manuels: Admin peut switcher et ne voit que le client choisi
- [ ] Aucune donnée exposée si clé ANON compromise
- [ ] Documentation RLS + commentaires code

## Questions & Assumptions

- **Q1**: Existe-t-il une colonne `client_id` dans `profiles` ? (Si non, la créer)
- **Q2**: Les admins ont-ils besoin de voir tous les clients ou de switcher ? (Assomption: switcher seulement, RLS restreint par client choisi)
- **A1**: Chaque `playbook_owners` appartient à un seul client (donc colonne `client_id` requise)
- **A2**: Les steps héritent du client via `playbook_processes.client_id` (cascadé)

---

**Created**: 2026-04-26  
**Mode**: Greenfield V1  
**Phase**: Ready for BREAK phase intake  
**Audit Reference**: AUDIT-SECURITE-MULTITENANT.md
