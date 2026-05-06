# SOP — Modes de portail client (simplifie / complet)

Objectif : pouvoir choisir, pour chaque nouveau client, entre :
- **Portail complet** (toutes les sections historiques)
- **Portail simplifie** (Accueil, Ressources, Sessions, Contrat, Brain Dump)

---

## 1) Regle de configuration

Le mode simplifie est pilote dans :
- `js/router.js`
- objet `SIMPLIFIED_PORTAL_CLIENT_IDS`

Exemple :
```js
var SIMPLIFIED_PORTAL_CLIENT_IDS = {
  '8d9428ce-184a-4232-a225-4c8ee6e2acb1': true // DotMarket
};
```

Si l'UUID client est dans cet objet => portail simplifie.
Sinon => portail complet.

---

## 2) Procedure creation nouveau portail

1. Creer le client et les profils utilisateurs en base (Supabase).
2. Creer le dossier statique : `clients/<slug-client>/`.
3. Publier les documents initiaux.
4. Inserer les ressources dans `tutos` (liens + titres + ordre).
5. Renseigner le contrat dans `contracts`.
6. Choisir le mode :
   - **Complet** : ne rien ajouter.
   - **Simplifie** : ajouter l'UUID client dans `SIMPLIFIED_PORTAL_CLIENT_IDS`.
7. Commit + push `main`.

---

## 3) Checklist de cloture (release client)

- [ ] Connexion OK avec un compte client
- [ ] Onglets affiches conformes au mode voulu
- [ ] Ressources ouvrent toutes en 200 (pas de 404)
- [ ] Sessions : titres/dates/coherence OK
- [ ] Contrat : montant + labels HT/TTC coherents
- [ ] Bouton contact fonctionne (email)
- [ ] Push prod effectue

---

## 4) Convention de labels (recommandee)

Pour garder un espace lisible :
- Ressources de travail : `01 — ...`, `02 — ...`, `03 — ...`
- Sessions : `Session N — <titre court>`
- Eviter les doublons (un CR dans Sessions OU Ressources selon besoin metier)

