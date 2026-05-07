// FSY — timeline portail : 5 jalons amont + 1 séance coaching (à ce jour).

function isFsyPortalClient(profile) {
  if (!profile) return false;
  var company = String(profile.company || '').toLowerCase();
  var email = String(profile.email || '').toLowerCase();
  var program = String(profile.program || '').toLowerCase();
  return company.indexOf('face soul') !== -1 ||
    company.indexOf('facesoul') !== -1 ||
    company.indexOf('fsy') !== -1 ||
    company.indexOf('aurelia') !== -1 ||
    email.indexOf('facesoulyoga') !== -1 ||
    email.indexOf('aurelia') !== -1 ||
    program.indexOf('fsy') !== -1 ||
    program.indexOf('aurelia') !== -1;
}

/** 1–5 = févr.–mars | 6 = unique séance coaching enregistrée (CR PDF mai 2026). */
function getFsyPortalTimelineEntries() {
  var base = new URL('/clients/fsy/', window.location.origin).href;
  return [
    {
      session_number: 1,
      title: 'Session 1 — Lancement stratégique & cadrage des priorités',
      date: '2026-02-19',
      status: 'completed',
      summary: 'Audit initial, mapping des process, identification des 5 piliers. Cadrage priorités : process > outils. Objectif 500K€ CA 2026. CEO time 2h/semaine.',
      cr_url: null,
      decisions: [
        'Process mapping = priorité n°1',
        'CEO time : 2h/semaine bloquées',
        'Pricing B2C : 299€ → 399€ coaching sommeil',
        'Migration plateforme mi-mars',
        'Objectif CA 500K€ 2026'
      ]
    },
    {
      session_number: 2,
      title: 'Session 2 — Migration Kajabi + Bunny, architecture offre FSY',
      date: '2026-03-02',
      status: 'completed',
      summary: 'Validation stack Circle + Bunny.net. Séparation FSY (mass-market) vs Aurélia Del Sol (premium). Arrêt des lives hebdo → evergreen. Freelance pour migration.',
      cr_url: null,
      decisions: [
        'Kajabi + Bunny.net confirmés comme stack cible',
        'Circle éliminé puis réintégré session pivot',
        'FSY Studio (B2C) vs MTM (B2B) ; tarif MTM actuel : plus de 1 000 € (repère projet ~1 499 € sur Stripe)',
        'Arrêt des lives hebdo → contenu evergreen',
        'Recruter freelance pour migration'
      ]
    },
    {
      session_number: 3,
      title: 'Session 3 — Stratégie offre FSY (evergreen + pricing) & Chatbot Telegram',
      date: '2026-03-11',
      status: 'completed',
      summary: 'Session avec Laurie seule (Aurélia absente). Formation evergreen mai 2026. Grille tarifaire : Studio 17€/mois, MTM en hausse (au-delà de 1 000 € ; ordre de grandeur interne ~1 499 €), coaching sommeil 399€. Chatbot mention-only validé. Projection CA révisée selon grille.',
      cr_url: null,
      decisions: [
        'Formation evergreen : lancement mai 2026',
        'MTM : tarif public supérieur à 1 000 € (caler sur Stripe / paywall Circle ; repère ~1 499 €)',
        'Abonnement Studio : 17€/mois',
        'Coaching sommeil : 399€ (lancement juin)',
        'Uscreen gardé 1 an pendant migration',
        'Chatbot Telegram : mode mention-only uniquement'
      ]
    },
    {
      session_number: 4,
      title: 'Session 4 — Repositionnement des marques & feuille de route opérationnelle',
      date: '2026-03-16',
      status: 'completed',
      summary: 'SESSION PIVOT. 3 entités distinctes actées : FSY Studio B2C (17€/mois, Laurie gère), Master The Method B2B (tarif MTM au-delà de 1 000 €, repère ~1 499 €), Aurélia Del Sol Premium (390€+). Migration Uscreen+Kajabi → Circle avant juillet 2026. VA recrutée (Upwork, 500$).',
      cr_url: base + 'cr-session4-fsy.html',
      decisions: [
        '3 entités distinctes : FSY Studio B2C + MTM B2B + Aurélia Del Sol Premium',
        'Migration Uscreen+Kajabi → Circle avant juillet 2026',
        'VA recrutée Upwork (Anam, 500$) pour migration vidéos',
        'MTM : prix catalogue > 1 000 € (vérifier Stripe / offre active ; indicatif ~1 499 €)',
        'Site FSY = purement éducatif (exit lifestyle)',
        '4 challenges/an pour FSY Studio',
        'Licence annuelle MTM 100€/an',
        'Programme ambassadrices MTM (10-15% commission)'
      ]
    },
    {
      session_number: 5,
      title: 'Session 5 — Validation parcours clients + Circle + session Claude',
      date: '2026-03-24',
      status: 'planned',
      summary: 'Séance prévue dans le plan d’accompagnement initial (mars). Statut repris de la base si elle a été mise à jour.',
      cr_url: null,
      decisions: []
    },
    {
      session_number: 6,
      title: 'Session 6 — Coaching stratégique & suivi',
      date: '2026-05-05',
      status: 'completed',
      summary: 'Compte-rendu de la séance de coaching (automatisation, Brevo, Stripe, Circle). Séance unique à ce stade dans le parcours affiché.',
      cr_url: base + 'pdfs/coaching-session-2026-05-05.pdf',
      decisions: []
    }
  ];
}

/**
 * Rattache une ligne Supabase au créneau portail 1–6.
 * Toute ligne datée à partir d’avril 2026 alimente le seul créneau coaching n°6.
 */
function fsyTimelineSlotForDbRow(s) {
  var n = s.session_number;
  if (n === undefined || n === null) return null;
  var d = s.date ? String(s.date) : '';

  if (n >= 101 && n <= 105) return n - 100;
  if (n >= 1 && n <= 5 && d && d < '2026-04-01') return n;
  if (d && d >= '2026-04-01') return 6;
  return null;
}

function mergeDbSessionsWithFsyPortalTimeline(dbSessions) {
  function pickBest(prev, row) {
    if (!prev) return row;
    var rank = function(r) {
      if (r.status === 'completed') return 2;
      if (r.status === 'planned') return 0;
      return 1;
    };
    if (rank(row) > rank(prev)) return row;
    if (rank(row) === rank(prev) && row.date && prev.date && row.date > prev.date) return row;
    return prev;
  }

  var extras = getFsyPortalTimelineEntries();
  var allowedNums = {};
  extras.forEach(function(e) { allowedNums[e.session_number] = true; });

  var byNumDb = {};
  var byNumOrphan = {};
  (dbSessions || []).forEach(function(s) {
    var key = fsyTimelineSlotForDbRow(s);
    if (key === null || key === undefined) {
      key = s.session_number;
    }
    if (!allowedNums[key]) {
      byNumOrphan[key] = pickBest(byNumOrphan[key], s);
      return;
    }
    byNumDb[key] = pickBest(byNumDb[key], s);
  });

  var sessions = extras.map(function(e) {
    var row = Object.assign({}, e);
    var db = byNumDb[e.session_number];
    if (db) {
      if (db.summary) row.summary = db.summary;
      if (db.decisions != null) row.decisions = db.decisions;
      if (db.title) row.title = db.title;
      if (db.status) row.status = db.status;
      if (db.id) row.id = db.id;
      if (!e.cr_url && db.cr_url) row.cr_url = db.cr_url;
      if (!e.cr_url && db.date) row.date = db.date;
    }
    if (row.decisions == null && e.decisions != null) row.decisions = e.decisions;
    if (!row.summary && e.summary) row.summary = e.summary;
    return row;
  });

  Object.keys(byNumOrphan).forEach(function(k) {
    sessions.push(byNumOrphan[k]);
  });

  sessions.sort(function(a, b) {
    var da = a.date ? new Date(a.date + 'T00:00:00').getTime() : 0;
    var dbd = b.date ? new Date(b.date + 'T00:00:00').getTime() : 0;
    if (dbd !== da) return dbd - da;
    return (b.session_number || 0) - (a.session_number || 0);
  });

  return sessions;
}

function getFsyPortalSessionStats(dbSessions) {
  var merged = mergeDbSessionsWithFsyPortalTimeline(dbSessions || []);
  var total = merged.length;
  var completed = merged.filter(function(s) { return s.status === 'completed'; }).length;
  var pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total: total, completed: completed, pct: pct };
}

function getFsyLatestReportsForDashboard(limit) {
  var lim = limit || 3;
  return getFsyPortalTimelineEntries()
    .filter(function(e) { return e.cr_url; })
    .sort(function(a, b) {
      var da = a.date ? new Date(a.date + 'T00:00:00').getTime() : 0;
      var db = b.date ? new Date(b.date + 'T00:00:00').getTime() : 0;
      return db - da;
    })
    .slice(0, lim)
    .map(function(e) {
      return {
        session_number: e.session_number,
        session_label: String(e.session_number),
        title: e.title,
        cr_url: e.cr_url,
        date: e.date
      };
    });
}
