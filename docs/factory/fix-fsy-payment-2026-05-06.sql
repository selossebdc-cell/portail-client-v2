-- FSY — Paiement reçu le 06/05/2026 + ajout facture client
-- À exécuter dans Supabase SQL Editor

BEGIN;

-- 1) Marquer la prochaine échéance "pending" comme payée au 2026-05-06
WITH target AS (
  SELECT c.id, c.payment_schedule
  FROM contracts c
  JOIN profiles p ON p.id = c.client_id
  WHERE lower(p.email) = 'aurelia@facesoulyoga.com'
  LIMIT 1
),
pending_pos AS (
  SELECT
    t.id,
    MIN((e.ord - 1)::int) AS idx0
  FROM target t
  CROSS JOIN LATERAL jsonb_array_elements(t.payment_schedule) WITH ORDINALITY AS e(item, ord)
  WHERE e.item->>'status' = 'pending'
  GROUP BY t.id
)
UPDATE contracts c
SET payment_schedule =
  jsonb_set(
    jsonb_set(
      c.payment_schedule,
      ARRAY[(pp.idx0)::text, 'status'],
      '"paid"'::jsonb,
      true
    ),
    ARRAY[(pp.idx0)::text, 'date'],
    '"2026-05-06"'::jsonb,
    true
  )
FROM pending_pos pp
WHERE c.id = pp.id;

-- 2) Ajouter la facture dans l'onglet Contrat (documents)
-- Dépose d'abord le PDF dans le bucket Storage "documents", ex:
--   clients/fsy/factures/facture-fsy-2026-05-06.pdf
-- Puis remplace le path ci-dessous si besoin.
WITH target AS (
  SELECT c.id, c.documents
  FROM contracts c
  JOIN profiles p ON p.id = c.client_id
  WHERE lower(p.email) = 'aurelia@facesoulyoga.com'
  LIMIT 1
)
UPDATE contracts c
SET documents =
  COALESCE(c.documents, '[]'::jsonb) ||
  jsonb_build_array(
    jsonb_build_object(
      'name', 'Facture — paiement du 06/05/2026',
      'type', 'facture',
      'date', '2026-05-06',
      'path', 'clients/fsy/factures/facture-fsy-2026-05-06.pdf'
    )
  )
FROM target t
WHERE c.id = t.id
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(c.documents, '[]'::jsonb)) d
    WHERE d->>'path' = 'clients/fsy/factures/facture-fsy-2026-05-06.pdf'
       OR (d->>'type' = 'facture' AND d->>'date' = '2026-05-06')
  );

COMMIT;

-- Vérification rapide
-- SELECT payment_schedule, documents
-- FROM contracts c
-- JOIN profiles p ON p.id = c.client_id
-- WHERE lower(p.email) = 'aurelia@facesoulyoga.com';
