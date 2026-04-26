# Questions — Phase BREAK

| # | Question | Type | Priorité | Hypothèse | Réponse | Statut |
|---|----------|------|----------|-----------|---------|--------|
| Q1 | Existe-t-il une colonne `client_id` dans la table `profiles` ? | bloquante | BLOQUANTE | Non (à créer). La colonne `client_id` (UUID, FK vers `clients`) n'existe pas et doit être ajoutée. | Oui, elle existe déjà | REPONDU ✓ |
| Q2 | Tous les users doivent-ils avoir un `client_id` (y compris les admins) ? | bloquante | BLOQUANTE | Oui. Les admins ont aussi un `client_id` qui représente leur "client actif" et switcher = changer ce `client_id` à la volée. | Oui, tous (y compris admins) | REPONDU ✓ |
| Q3 | Comment les admins switcher entre clients ? Côté application (bouton dropdown) ou côté RLS (contexte auth modifié) ? | bloquante | BLOQUANTE | Hypothèse: Bouton dropdown côté application + mise à jour du `client_id` dans `profiles` via un endpoint sécurisé (RLS/trigger protégé). | Bouton dropdown + update profiles | REPONDU ✓ |
| Q4 | Faut-il ajouter `client_id` à la table `playbook_owners` s'il est manquant ? | bloquante | BLOQUANTE | Oui. Chaque propriétaire doit avoir un `client_id` explicite pour permettre le filtrage RLS direct (`.eq('client_id', userClientId)`). | Non, elle existe déjà | REPONDU ✓ |
| Q5 | Les `playbook_steps` héritent-ils du `client_id` via `playbook_processes` ou doivent-ils avoir une colonne `client_id` directe ? | bloquante | BLOQUANTE | Hypothèse: Héritage via FK vers `playbook_processes`. La RLS sur `playbook_steps` utilisera une sous-requête ou une FK chain: `process_id` → `playbook_processes.client_id`. | Héritage via FK (Phase MODEL confirmera) | HYPOTHESE |
| Q6 | Les migrations doivent-elles ajouter `client_id` aux colonnes existantes ou créer des nouvelles colonnes ? Y a-t-il déjà une colonne `client_id` dans `playbook_processes` ? | bloquante | BLOQUANTE | Hypothèse: `playbook_processes` a déjà `client_id`. Si `playbook_owners` n'a pas `client_id`, créer une colonne NULL-able avec valeur par défaut (migration AddClientIdToPlaybookOwners). | Oui, existe déjà | REPONDU ✓ |
| Q7 | Qui peut switcher entre clients ? Seulement les admins (role='admin') ou aussi les clients (role='client') ? | bloquante | BLOQUANTE | Hypothèse: Seulement les admins (role='admin'). Les clients (role='client') restent verrouillés à leur `client_id` initial. | Seulement les admins | REPONDU ✓ |
| Q8 | Faut-il implémenter une table `client_switches` ou `audit_logs` pour tracer chaque switch d'admin ? | optionnelle | OPTIONNELLE | Hypothèse: Non requis pour MVP. Ajouter des logs audit si demandé en Phase MODEL. | Hypothèse acceptée | HYPOTHESE |
| Q9 | Comment gérer les permissions `INSERT` et `UPDATE` sur `playbook_owners` ? L'utilisateur doit-il être le propriétaire du processus ou simplement un admin du client ? | bloquante | BLOQUANTE | Hypothèse: Tout utilisateur (admin ou client) du même `client_id` peut créer/modifier les propriétaires. RLS vérifie `client_id` match dans `playbook_processes`. | Tout utilisateur du même client | REPONDU ✓ |
| Q10 | La clé ANON exposée risque d'être utilisée pour bypass. Faut-il implémenter un rate limiting ou une validation supplémentaire côté Edge Functions ? | optionnelle | OPTIONNELLE | Hypothèse: Non pour MVP. La RLS elle-même est la protection. Rate limiting peut être ajouté en Phase MODEL si menace identifiée. | Hypothèse acceptée | HYPOTHESE |
| Q11 | Tous les appels JavaScript utilisent-ils déjà `supabase.from()` ou certains utilisent-ils directement des requêtes HTTP raw ? | bloquante | BLOQUANTE | Hypothèse: Tous utilisent `supabase.from()`. Lister les fichiers JS à refactoriser (search pour `.select('*')` + filtrage manual). | À auditer en Phase MODEL | CLARIFICATION |
| Q12 | Y a-t-il des views ou stored procedures qui contournent la RLS sur les tables principales ? | bloquante | BLOQUANTE | Hypothèse: Non. Si views existent, elles doivent aussi respecter RLS (security_invoker) ou être refactorisées. | À auditer en Phase MODEL | CLARIFICATION |
| Q13 | Stratégie de test: Tests unitaires JS, intégration Supabase, ou tests manuels uniquement ? | optionnelle | OPTIONNELLE | Hypothèse: Tests manuels + vérification Supabase RLS via playground. Tests unitaires optionnels en Phase BUILD. | Hypothèse acceptée | HYPOTHESE |
| Q14 | Quelle est la table `clients` ? Doit-elle avoir des colonnes de métadonnées (nom, adresse, logo) ? | optionnelle | OPTIONNELLE | Hypothèse: Table `clients` existe déjà avec au minimum (id, name). Confirmer structure en Phase MODEL. | Hypothèse acceptée | HYPOTHESE |
| Q15 | En cas de `playbook_processes` sans `client_id` (données legacy), comment les gérer ? Quarantaine, migration auto, ou suppresssion ? | bloquante | BLOQUANTE | Hypothèse: Migration data avec `client_id` = NULL si orphelin. Puis audit manuel avant refonte complète. | NULL si orphelin + audit manuel | CLARIFICATION |
| Q16 | Le bouton "Switcher client" (pour admins) doit-il être visible dans l'interface playbook.html actuelle ? | optionnelle | OPTIONNELLE | Hypothèse: Oui, mais UI placement défini en Phase MODEL (dropdown header, modal, etc.). | Hypothèse acceptée | HYPOTHESE |

---

## Résumé des Dépendances

**Bloquantes (9)**: Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q9, Q11, Q12, Q15 → **11 bloquantes** (critiques pour architecture RLS)

**Optionnelles (5)**: Q8, Q10, Q13, Q14, Q16 → Peuvent utiliser hypothèses, clarifiées en Phase MODEL

### Hypothèses Clés Proposées

1. **Architecture multi-tenant**: Tous les users (clients + admins) ont un `client_id` dans `profiles`.
2. **Admins switcher**: Admin peut changer dynamiquement le `client_id` en `profiles` (via button + endpoint RLS-protégé).
3. **RLS native**: Utiliser PostgreSQL RLS sur Supabase (pas de filtrage côté front).
4. **Migrations**: Ajouter `client_id` où manquant (playbook_owners prioritaire).
5. **Héritage cascadé**: `playbook_steps` récupère `client_id` via FK chain avec `playbook_processes`.

### Fichiers à Auditer (Phase MODEL)

- `js/client/playbook.js` ou équivalent (chercher `.select('*')` + filtrage manual)
- Structure schema Supabase (confirmation `client_id` existence)
- Logique auth existante (comment `client_id` est défini au login)

---

**Generated**: 2026-04-26  
**Phase**: BREAK (Analysis)  
**Next Step**: Phase MODEL (répondre questions + générer brief/scope/acceptance)
