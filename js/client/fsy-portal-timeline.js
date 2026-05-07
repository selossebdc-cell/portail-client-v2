// FSY — timeline portail (source unique) : affichage Sessions, accueil « derniers CR », stats bandeau.

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

/** Jalons 1–11 : ordre chronologique (1 = plus ancienne, 11 = plus récente). */
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
        'FSY = mass-market (17-1950€) vs Aurélia Del Sol = premium (3-15K€)',
        'Arrêt des lives hebdo → contenu evergreen',
        'Recruter freelance pour migration'
      ]
    },
    {
      session_number: 3,
      title: 'Session 3 — Stratégie offre FSY (evergreen + pricing) & Chatbot Telegram',
      date: '2026-03-11',
      status: 'completed',
      summary: 'Session avec Laurie seule (Aurélia absente). Formation evergreen mai 2026. Pricing verrouillé : MTM 1950€ (early bird 1550€), abo 17€/mois, coaching sommeil 399€. Chatbot mention-only validé. Projection CA 634K€/an.',
      cr_url: null,
      decisions: [
        'Formation evergreen : lancement mai 2026',
        'MTM : 1 950€ (early bird 1 550€) — relevé à 2 900€ en session pivot',
        'Abonnement Studio : 17€/mois',
        'Coaching sommeil : 399€ (lancement juin)',
        'Uscreen gardé 1 an pendant migration',
        'Chatbot Telegram : mode mention-only uniquement',
        'Projection CA réaliste : 634K€/an'
      ]
    },
    {
      session_number: 4,
      title: 'Session 4 — Repositionnement des marques & feuille de route opérationnelle',
      date: '2026-03-16',
      status: 'completed',
      summary: 'SESSION PIVOT. 3 entités distinctes actées : FSY Studio B2C (17€/mois, Laurie gère), Master The Method B2B (2 900€ evergreen), Aurélia Del Sol Premium (390€+). Migration Uscreen+Kajabi → Circle avant juillet 2026. VA recrutée (Upwork, 500$). Prix MTM relevé de 1 950€ à 2 900€.',
      cr_url: base + 'cr-session4-fsy.html',
      decisions: [
        '3 entités distinctes : FSY Studio B2C + MTM B2B + Aurélia Del Sol Premium',
        'Migration Uscreen+Kajabi → Circle avant juillet 2026',
        'VA recrutée Upwork (Anam, 500$) pour migration vidéos',
        'Prix MTM : 1 950€ → 2 900€ (early bird 2 500€)',
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
      title: 'Session 6 — Coaching',
      date: '2026-04-09',
      status: 'completed',
      summary: '',
      cr_url: base + 'pdfs/coaching-session-2026-04-09.pdf',
      decisions: []
    },
    {
      session_number: 7,
      title: 'Session 7 — Coaching',
      date: '2026-04-20',
      status: 'completed',
      summary: '',
      cr_url: base + 'pdfs/coaching-session-2026-04-20.pdf',
      decisions: []
    },
    {
      session_number: 8,
      title: 'Session 8 — Coaching',
      date: '2026-04-21',
      status: 'completed',
      summary: '',
      cr_url: base + 'pdfs/coaching-session-2026-04-21.pdf',
      decisions: []
    },
    {
      session_number: 9,
      title: 'Session 9 — Coaching',
      date: '2026-04-23',
      status: 'completed',
      summary: '',
      cr_url: base + 'pdfs/coaching-session-2026-04-23.pdf',
      decisions: []
    },
    {
      session_number: 10,
      title: 'Session 10 — Coaching',
      date: '2026-04-23',
      status: 'completed',
      summary: '',
      cr_url: null,
      decisions: []
    },
    {
      session_number: 11,
      title: 'Session 11 — Coaching',
      date: '2026-05-05',
      status: 'completed',
      summary: '',
      cr_url: base + 'pdfs/coaching-session-2026-05-05.pdf',
      decisions: []
    }
  ];
}

/** Rattache une ligne Supabase au numéro de session portail 1–11 (ancienne numérotation ou 101–105). */
function fsyTimelineSlotForDbRow(s) {
  var n = s.session_number;
  if (n === undefined || n === null) return null;
  var d = s.date ? String(s.date) : '';

  if (n >= 101 && n <= 105) return n - 100;
  if (n >= 1 && n <= 5 && d && d < '2026-04-01') return n;
  if (n >= 1 && n <= 6 && d && d >= '2026-04-01') return n + 5;
  if (n >= 6 && n <= 11) return n;
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

/** Même agrégat que l’onglet Sessions → aligne le bandeau « Séances X/Y » et le %. */
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
      var label = String(e.session_number);
      return {
        session_number: e.session_number,
        session_label: label,
        title: e.title,
        cr_url: e.cr_url,
        date: e.date
      };
    });
}
