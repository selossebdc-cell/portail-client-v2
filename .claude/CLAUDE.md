# Portail Client V2 — Développement

## Méthode obligatoire : Spec-to-Code Factory

**Pipeline** : BREAK > MODEL > ACT > DEBRIEF  
**5 gates** : Gate 0 (Intake) → Gate 1 (Spec) → Gate 2 (Plan) → Gate 3 (Build) → Gate 4 (QA) → Gate 5 (Debrief)  
**Invariants** : No Spec No Code, No Task No Commit

## Skills disponibles
- `/factory` — lancer une nouvelle feature (BREAK phase)
- `/factory-intake` — valider l'intake (Gate 0)
- `/factory-spec` — écrire la spec (Gate 1)
- `/factory-plan` — architecture + plan (Gate 2)
- `/factory-build` — implémentation (Gate 3)
- `/factory-qa` — tests + validation (Gate 4)

## Agents spécialisés
- **analyst** — comprendre le problème
- **architect** — design la solution
- **developer** — code
- **pm** — définit le scope
- **qa** — teste
- **scrum-master** — coordonne

## Contexte du projet

**Repos** :
- Principal : selossebdc-cell/portail-client (GitHub Pages)
- Supabase : dcynlifggjiqqihincbp (eu-north-1)

**Tech stack** :
- Frontend : HTML5 + CSS3 + Vanilla JS
- Backend : Supabase (Postgres + Edge Functions)
- Auth : Supabase Auth (email/password)
- Storage : GitHub Pages

**Architecture existante** :
- `app.html` — portail interactif (client + admin)
- `js/client/` — modules clients (actions, sessions, playbook, etc.)
- `js/admin/` — modules admin (dashboards, tasks, recap)
- `css/` — système de design cohérent
- `playbook.html` — process management (Lovable + Supabase)
- `tasks.html` — gestion tâches (deprecated, remplacé par app.html)

## Règles de code

1. **Pas de commentaires inutiles** — le code doit être auto-documenté
2. **Réutiliser les patterns existants** — cohérence avec le reste du portail
3. **RLS (Row Level Security)** — toutes les requêtes Supabase respectent les RLS
4. **Responsive first** — mobile d'abord, puis desktop
5. **Accessibilité** — WCAG 2.1 AA minimum
6. **Performance** — lazy load, cache, minify

## Checklist avant merge

- [ ] Code passe la validation Factory (Gate 4)
- [ ] Tests manuels sur mobile + desktop
- [ ] Pas de console errors/warnings
- [ ] RLS correctement configurées
- [ ] Commit avec message descriptif
- [ ] GitHub Pages à jour
