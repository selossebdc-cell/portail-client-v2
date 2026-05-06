# MEMORY — Portail Client V2 (prod)

Mis à jour le 2026-05-06

## Contexte prod
- Repo prod actif: `selossebdc-cell/portail-client-v2`
- Dossier local: `code/portail-client-v2-prod`
- Domaine: `https://espace.csbusiness.fr`

## Mode portail par client
- Implémenté dans `js/router.js`
- Mécanisme:
  - `SIMPLIFIED_PORTAL_CLIENT_IDS` (map d'UUID clients en mode simplifié)
  - `SIMPLIFIED_PORTAL_TABS` (ordre/ensemble des onglets)
- DotMarket est configuré en mode simplifié.

## SOP de référence
- `docs/SOP-PORTAL-MODES.md`
- Utiliser ce SOP pour:
  - création d'un nouveau portail client
  - choix simplifié vs complet
  - checklist de validation finale

## DotMarket — état livré
- Onglets actifs: Accueil, Ressources, Sessions, Mon contrat, Brain Dump
- Bloc stats d'en-tête masqué pour DotMarket
- Bouton WhatsApp supprimé (instable selon device/browser), email conservé
- Contrat affiché avec montant total forcé en HT (10 000 € HT)
- Ressources nettoyées (docs de travail uniquement, sans contrat, sans doublons CR)
- Sessions:
  - vrais CR session 1 et session 2 publiés et reliés
  - rendez-vous planifiés ajoutés (14/05 09:30, 19/05 16:00) avec liens Meet
  - résumés sessions linkifiés (URLs cliquables)

## Points de vigilance
- Vérifier les 404 après publication GitHub Pages (cache CDN)
- Éviter les doublons de contenus entre Sessions et Ressources
- Toujours valider le repo réellement connecté au domaine avant patch

## Security audit archive — 2026-05-06

Scope: empirical RLS/runtime checks from client token + anon token.

### Summary
- Verdict: GO (no blocking security issue found).
- Cross-tenant isolation validated on tested tables.
- Anonymous reads return empty result sets on sensitive tables.
- Cross-client write attempt blocked by RLS (`42501`).

### Checks performed
- Secrets scan (runtime code): no exposed server secret found.
- Anon access checks:
  - `profiles`, `sessions`, `actions`, `tutos`, `contracts` => `[]`
- Client-token isolation checks (Kevin / DotMarket):
  - own client reads => data visible
  - other client reads => `[]`
  - `profiles` by other client email => `[]`
- Cross-client write probe:
  - insert `tutos` with foreign `client_id` => `403` / RLS violation

### Note
- `playbook_steps` direct filter with `client_id` is invalid (column does not exist), so that specific probe is not applicable for this table.
