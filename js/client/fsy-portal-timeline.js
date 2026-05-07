// FSY — timeline portail : 5 jalons amont + 1 point de suivi mai 2026 (PDF / compte-rendu).

/** Séances prévues au contrat (bandeau) : profil Supabase `total_sessions`, sinon aligné CR « X/19 ». */
var FSY_PORTAL_CONTRACT_SESSIONS_FALLBACK = 19;

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

/** 1–5 = févr.–mars | 6 = point du 5 mai 2026 (intitulé comme le compte-rendu). */
function getFsyPortalTimelineEntries() {
  var base = new URL('/clients/fsy/', window.location.origin).href;
  return [
    {
      session_number: 1,
      title: 'Lancement stratégique & cadrage des priorités',
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
      title: 'Migration Kajabi + Bunny, architecture offre FSY',
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
      title: 'Stratégie offre FSY (evergreen + pricing) & Chatbot Telegram',
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
      title: 'Repositionnement des marques & feuille de route opérationnelle',
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
      title: 'Validation parcours clients + Circle + session Claude',
      date: '2026-03-24',
      status: 'planned',
      summary: 'Séance prévue dans le plan d’accompagnement initial (mars). Statut repris de la base si elle a été mise à jour.',
      cr_url: null,
      decisions: []
    },
    {
      session_number: 6,
      title: 'Mise en place et débogage des plateformes de formation et de marketing',
      date: '2026-05-05',
      status: 'completed',
      summary:
        'Point du 5 mai 2026 : Brevo (campagnes / lists), communauté Circle, automatisations Stripe ↔ Circle ↔ Brevo, clarification des workflows (journeys). Compte-rendu détaillé dans le PDF joint.',
      cr_url: base + 'pdfs/coaching-session-2026-05-05.pdf',
      decisions: []
    }
  ];
}

/**
 * Rattache une ligne Supabase au créneau portail 1–6 (toute entrée post-mars ou n° ≥ 6 → créneau 6).
 */
function fsyTimelineSlotForDbRow(s) {
  var n = s.session_number;
  var d = s.date ? String(s.date) : '';

  if (n >= 101 && n <= 105) return n - 100;
  if (n >= 1 && n <= 5) {
    if (!d || d < '2026-04-01') return n;
    return 6;
  }
  if (Number.isFinite(Number(n)) && Number(n) >= 6) return 6;
  if (d && d >= '2026-04-01') return 6;
  return 6;
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
  var byNumDb = {};
  (dbSessions || []).forEach(function(s) {
    var key = fsyTimelineSlotForDbRow(s);
    byNumDb[key] = pickBest(byNumDb[key], s);
  });

  var sessions = extras.map(function(e) {
    var row = Object.assign({}, e);
    var db = byNumDb[e.session_number];
    if (db) {
      if (db.summary) row.summary = db.summary;
      if (db.decisions != null) row.decisions = db.decisions;
      if (db.status) row.status = db.status;
      if (db.id) row.id = db.id;
      if (!e.cr_url && db.cr_url) row.cr_url = db.cr_url;
      if (!e.cr_url && db.date) row.date = db.date;
    }
    if (row.decisions == null && e.decisions != null) row.decisions = e.decisions;
    if (!row.summary && e.summary) row.summary = e.summary;
    return row;
  });

  sessions.sort(function(a, b) {
    return (a.session_number || 0) - (b.session_number || 0);
  });

  return sessions;
}

function getFsyPortalSessionStats(dbSessions, profile) {
  var merged = mergeDbSessionsWithFsyPortalTimeline(dbSessions || []);
  var completed = merged.filter(function(s) {
    return s.status === 'completed';
  }).length;
  var contractTotal = profile && Number(profile.total_sessions) > 0
    ? Number(profile.total_sessions)
    : FSY_PORTAL_CONTRACT_SESSIONS_FALLBACK;
  var pct = contractTotal > 0 ? Math.round((completed / contractTotal) * 100) : 0;
  return { total: contractTotal, completed: completed, pct: pct };
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
        session_label: '',
        hide_session_badge: true,
        title: e.title,
        cr_url: e.cr_url,
        date: e.date
      };
    });
}
