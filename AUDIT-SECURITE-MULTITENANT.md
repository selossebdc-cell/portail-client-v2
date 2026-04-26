# 🔴 AUDIT DE SÉCURITÉ CRITIQUE — Portail-Client-V2/Playbook

**Date**: 2026-04-26  
**Analyseur**: Claude + Framework Secure-by-Design (Mickaël Ramarivelo)  
**Cible**: `playbook.html` — Isolation multi-tenant  
**Sévérité**: 🔴 **CRITIQUE** — Data Breach Imminent  

---

## 📋 RÉSUMÉ EXÉCUTIF

**Problème**: L'isolation multi-tenant est entièrement **côté JavaScript**. Aucun RLS (Row Level Security) n'est implémenté.

**Impact**: 
- ✅ Taïna (Guadeloupe Explor) peut voir toutes les données de Face Soul Yoga
- ✅ Toute requête HTTP modifiée peut contourner le filtre client
- ✅ Un admin malveillant peut lire/modifier/supprimer les données d'autres clients

**Verdict**: Application **NON sécurisée en production**. Violation de RGPD (données personnelles exposées).

---

## 🔍 VULNÉRABILITÉS DÉTECTÉES

### 1. 🔴 RLS NON IMPLÉMENTÉ (Critique)

**Localisation**: Ligne 1789 du playbook.html

```javascript
// Admin avec filtre client : filtrer côté front (RLS retourne tout pour admin)
if (appState.isAdmin && appState.currentClientId) {
  var cid = appState.currentClientId;
  processesResult = processesResult.filter(function(p) { return p.client_id === cid; });
}
```

**Le Problème**: 
- Le commentaire **reconnaît explicitement** que "RLS retourne tout pour admin"
- Le filtrage est fait en JavaScript après récupération de TOUTES les données
- La vraie protection doit être dans Supabase RLS, pas dans le navigateur

**Règle Violée** (Secure-by-Design §1):
> "RLS Obligatoire : Toute nouvelle table créée DOIT avoir le RLS activé par défaut"

---

### 2. 🔴 getAll() SANS FILTRE CÔTÉ SUPABASE (Critique)

**Localisation**: Ligne 2069-2076

```javascript
db.processes: {
  getAll: async function() {
    var result = await supabaseClient
      .from('playbook_processes')
      .select('*, playbook_steps(*)')
      .order('created_at', { ascending: false });
    return result.data || [];
  }
}
```

**Le Problème**:
- **Aucun `.eq('client_id', userClientId)`** → retourne TOUTES les données
- Les données sont ensuite filtrées en JavaScript (voir §1)
- Un attaquant qui intercepte la requête Supabase direct peut accéder à toutes les données

**Exemple d'Attaque**:
```javascript
// Attaquant peut émettre directement via Supabase client:
supabaseClient
  .from('playbook_processes')
  .select('*')  // TOUTES les données
  .order('created_at', { ascending: false })
```

**Règle Violée** (Secure-by-Design §2):
> "Ne jamais faire confiance au Front-end... La vraie protection doit être appliquée à la source de la donnée via l'API, un serveur Back-end, ou le RLS."

---

### 3. 🔴 owners.getAll() SANS FILTRE (Critique)

**Localisation**: Ligne 2141-2148

```javascript
db.owners: {
  getAll: async function() {
    var result = await supabaseClient
      .from('playbook_owners')
      .select('*')
      .order('name');
    return result.data || [];
  }
}
```

**Impact**: 
- Les "propriétaires" (noms, rôles) sont partagés entre tous les clients
- Taïna peut voir "Laurie" et "Anam" qui appartiennent à Face Soul Yoga
- Cela constitue une fuite d'information (PII)

---

### 4. 🔴 .update() SANS VÉRIFICATION DE PROPRIÉTÉ (Critique)

**Localisation**: Ligne 2097-2104, 2123-2129

```javascript
db.processes: {
  update: async function(id, fields) {
    var result = await supabaseClient
      .from('playbook_processes')
      .update(fields)
      .eq('id', id);  // ⚠️ SEUL CONTRÔLE = L'ID
  }
}
```

**Le Problème**:
- L'update vérifie UNIQUEMENT que l'ID existe
- **Aucune vérification que l'utilisateur appartient au bon client**
- Un utilisateur peut modifier le processus d'un autre client en changeant simplement l'ID

**Attaque Possible**:
```javascript
// Taïna change le nom du processus de Face Soul Yoga:
await db.processes.update('fsy-process-uuid', { name: 'HACKED' });
// ✅ Succès (pas de RLS)
```

**Règle Violée** (Secure-by-Design §2):
> "Toute vérification d'accès dans le navigateur n'est qu'un confort utilisateur. La vraie protection doit être appliquée à la source de la donnée via RLS."

---

### 5. 🟠 CONFUSION user_id / client_id (Haute)

**Localisation**: Ligne 3287

```javascript
appState.currentClientId = profileResult.data.id;
// 🔴 Le 'id' ici est l'user_id, PAS le client_id !
```

**Le Problème**:
- Pour un client (non-admin), `currentClientId` = son `user_id`
- La table `playbook_processes` a une colonne `client_id` (ligne 1812)
- Mismatch : on compare `user_id` avec `client_id` dans le filtre line 1792

**Structure Manquante**:
- Table `profiles` devrait avoir une colonne `client_id` (référence FK)
- Au lieu de cela, on utilise l'`id` de l'utilisateur comme ID client

---

### 6. 🟠 Clé ANON Exposée Publiquement (Moyen)

**Localisation**: Ligne 2045-2046

```javascript
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Note**: La clé ANON est **publiquement exposée par design** (elle est dans le front-end). C'est normal pour Supabase.  
**Mais**: Sans RLS, cette clé peut lire/modifier/supprimer TOUTES les données.

---

### 7. 🟡 Titre Hardcodé (Faible - UX Issue)

**Localisation**: Ligne 6, puis dynamique ligne 1775 et 1778

```html
<title>Face Soul Yoga — Playbook</title>
```

```javascript
titleEl.textContent = (selected ? (selected.company || selected.full_name) : '') + ' — Playbook';
```

**Problème**: Le titre HTML est hardcodé "Face Soul Yoga", pas dynamique avec le client sélectionné.

---

### 8. 🟡 Pas de Protection HTTP (Moyen)

**Missing**: Aucun header de sécurité (CSP, X-Frame-Options, HSTS, X-Content-Type-Options).

---

## 📊 TABLEAU DES PROBLÈMES

| # | Problème | Sévérité | Ligne | Cause Racine | Règle Violée |
|---|----------|----------|-------|--------------|--------------|
| 1 | RLS non implémenté | 🔴 CRIT | 1789 | Pas de `ALTER TABLE ... ENABLE RLS` | Secure-by-Design §1 |
| 2 | getAll() sans filtre | 🔴 CRIT | 2069 | Pas de `.eq('client_id', ...)` | Secure-by-Design §2 |
| 3 | owners.getAll() | 🔴 CRIT | 2141 | Même cause | Secure-by-Design §2 |
| 4 | update() sans vérif | 🔴 CRIT | 2097 | Pas de filtre `client_id` | Secure-by-Design §2 |
| 5 | user_id vs client_id | 🟠 HIGH | 3287 | Structure DB manquante | Architecture |
| 6 | Clé ANON exposée | 🟡 MED | 2046 | Design normal Supabase | Secure-by-Design §2 |
| 7 | Titre hardcodé | 🟡 LOW | 6 | Pas critique | UX |
| 8 | Headers manquants | 🟡 MED | N/A | Config Vercel/GitHub Pages | Secure-by-Design §3 |

---

## 🎯 SCÉNARIO D'ATTAQUE RÉALISTE

### Étape 1: Intercepter les Clés
L'attaquant ouvre DevTools et voit la clé ANON (ligne 2046).

### Étape 2: Récupérer Toutes les Données
```javascript
// Depuis la console ou via Postman
const { data } = await supabase
  .from('playbook_processes')
  .select('*');  // Aucun RLS → SUCCÈS
// Result: TOUTES les données de TOUS les clients
```

### Étape 3: Modifier les Données
```javascript
await supabase
  .from('playbook_processes')
  .update({ status: 'supprime' })
  .eq('client_id', 'face-soul-yoga-id');
// ✅ Succès (RLS devrait bloquer cela)
```

---

## ✅ CHECKLIST REMÉDIATION

- [ ] **Activer RLS** sur `playbook_processes` et `playbook_steps`
- [ ] **Créer policies RLS** par client
- [ ] **Ajouter colonne `client_id`** à la table `profiles`
- [ ] **Mettre à jour `getAll()`** pour filtrer par client
- [ ] **Mettre à jour `.update()` / `.delete()`** pour vérifier ownership
- [ ] **Supprimer clé ANON** du code (si possible utiliser Edge Functions)
- [ ] **Ajouter headers de sécurité** (CSP, HSTS, etc.)
- [ ] **Tests de sécurité** (vérifier qu'on ne peut pas accéder aux données d'un autre client)

---

## 🚀 PROCHAINES ÉTAPES

**Recommandation**: Lancer `/factory` avec Sonnet 4.6+ pour un plan d'implémentation complet.

Plan Haute Niveau:
1. **SPEC** → Définir l'architecture RLS (which table, which column, which policy)
2. **PLAN** → Migrations Supabase + refactoring JavaScript
3. **BUILD** → Implémenter RLS + mettre à jour requêtes
4. **QA** → Vérifier isolation (Taïna ne voit que ses données)

---

**Audité par**: Claude (Framework Secure-by-Design v1.0)  
**Date**: 2026-04-26
