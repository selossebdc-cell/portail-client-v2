# Projet

## Méthode obligatoire : Spec-to-Code Factory

**Pipeline** : BREAK > MODEL > ACT > DEBRIEF  
**Invariants** : No Spec No Code, No Task No Commit

## Avant toute développement

1. **Security Risk Assessment** (si feature)
   - Path: `/01-entreprise/skills/security-assessment/SKILL.md`
   
2. **Factory Pipeline**
   - Path: `/01-entreprise/skills/factory/SKILL.md`
   - Commande: `/factory`

## SKILLs disponibles

- `/factory` — Pipeline complet
- `/factory-intake` — Phase BREAK
- `/factory-spec` — Phase MODEL
- `/factory-plan` — Phase PLAN
- `/factory-build` — Phase BUILD
- `/factory-qa` — Phase DEBRIEF
- `/factory-quick` — Fast-track pour tweak mineur
- `/factory-resume` — Reprendre après interruption

## Règles absolues

- ✅ Toute feature → Security Risk Assessment AVANT factory
- ✅ Toute feature → Factory pipeline obligatoire
- ✅ Aucun code sans specs validées
- ✅ Aucun commit sans task ID (TASK-XXXX)

## Resources

- Methodology: https://github.com/SylvainChabaud/spec-to-code-factory
- MEMORY: `/01-entreprise/memory/`

---
**Status** : Factory setup complète — 2026-04-26
