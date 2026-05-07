// FSY — timeline portail : 10 points réalisés / planifiés (févr. → mai 2026), contrat 19 séances (bandeau).

/** Séances prévues au contrat (bandeau) : profil Supabase `total_sessions`, sinon 19. */
var FSY_PORTAL_CONTRACT_SESSIONS_FALLBACK = 19;

/**
 * Rattache une ligne Supabase à une ligne portail 1–10 (priorité à la date exacte).
 * Les deux RDV du 23/04 sont regroupés sur le créneau 8.
 */
var FSY_PORTAL_DATE_TO_SLOT = {
  '2026-02-19': 1,
  '2026-03-02': 2,
  '2026-03-11': 3,
  '2026-03-16': 4,
  '2026-03-24': 5,
  '2026-04-09': 6,
  '2026-04-20': 7,
  '2026-04-23': 8,
  '2026-05-04': 9,
  '2026-05-05': 10
};

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

/** Intitulés alignés sur les compte-rendus / synthèses de réunion (sous-titres CR). */
function getFsyPortalTimelineEntries() {
  var base = new URL('/clients/fsy/', window.location.origin).href;
  return [
    {
      session_number: 1,
      title: 'Lancement stratégique & cadrage des priorités',
      date: '2026-02-19',
      status: 'completed',
      summary: 'Audit initial, mapping des process, identification des 5 piliers. Cadrage priorités : process > outils. Objectif 500K€ CA 2026. CEO time 2h/semaine.',
      cr_url: base + 'pdfs/fsy-cr-2026-02-19.pdf',
      cr_url_label: 'PDF — CR du 19 févr.',
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
      summary:
        'Validation stack Circle + Bunny.net. Séparation FSY (mass-market) vs Aurélia Del Sol (premium). Réunion du 5 mars : notes jointes (entre le 2 et le 11).',
      cr_url: base + 'pdfs/fsy-cr-2026-03-02.html',
      cr_url_label: 'HTML — 2 mars',
      cr_url_extra: base + 'pdfs/fsy-cr-2026-03-02.pdf',
      cr_url_extra_label: 'PDF — 2 mars',
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
      summary:
        'Session avec Laurie seule (Aurélia absente). Formation evergreen mai 2026. Grille tarifaire : Studio 17€/mois, MTM en hausse (au-delà de 1 000 € ; ordre de grandeur interne ~1 499 €), coaching sommeil 399€. Chatbot mention-only validé.',
      cr_url: base + 'pdfs/fsy-cr-2026-03-11.html',
      cr_url_label: 'HTML — 11 mars',
      cr_url_extra: base + 'pdfs/fsy-cr-2026-03-11.pdf',
      cr_url_extra_label: 'PDF — 11 mars',
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
      cr_url_extra: base + 'pdfs/fsy-cr-2026-03-16-synthese.pdf',
      cr_url_extra_label: 'PDF — synthèse 16 mars',

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
      status: 'completed',
      summary:
        'Point de fin mars sur le parcours client, Circle et l’outillage (Claude). Compte-rendu retrouvé : consultation du 30/03 (délégation, automatisations, migration Circle/WhatsApp, tunnel premium).',
      cr_url: base + 'pdfs/fsy-cr-2026-03-30.pdf',
      cr_url_label: 'PDF — CR du 30 mars',
      decisions: []
    },
    {
      session_number: 6,
      title: 'Offre atelier premium, automatisations n8n/Brevo/Stripe/Circle & acquisition LinkedIn MTM',
      date: '2026-04-09',
      status: 'completed',
      summary: 'Réunion hebdomadaire : suivi automatisations, UTMs, migration YouScreen → Circle, parcours MTM (signature, onboarding), blocages Brevo/campagnes. Pistes d’optimisation acquisition MTM (LinkedIn).',
      cr_url: base + 'coaching-session-2026-04-09.html',
      cr_url_extra: base + 'pdfs/coaching-session-2026-04-09.pdf',
      cr_url_extra_label: 'PDF — fiche réunion',
      decisions: []
    },
    {
      session_number: 7,
      title: 'Mise en place et optimisation du parcours client automatisé',
      date: '2026-04-20',
      status: 'completed',
      summary: 'Réunion hebdomadaire : UX Circle (calendrier, tutoriels), architecture bout en bout (UTM, n8n, Stripe, Brevo, onboarding, anti-churn), migration abonnées Uscreen.',
      cr_url: base + 'coaching-session-2026-04-20.html',
      cr_url_extra: base + 'pdfs/coaching-session-2026-04-20.pdf',
      cr_url_extra_label: 'PDF — fiche réunion',
      decisions: []
    },
    {
      session_number: 8,
      title: 'Migration Uscreen → Circle & Stripe, CRM unifié et automatisations Brevo',
      date: '2026-04-23',
      status: 'completed',
      summary: 'Journée du 23 avril : cadrage migration (abonnements, Bunny, bugs Circle, escalade support) et alignement CRM unifié, UTM, workflows n8n + documentation pour l’équipe.',
      cr_url: base + 'coaching-session-2026-04-23.html',
      cr_url_extra: base + 'pdfs/fsy-cr-2026-04-23-cadrage-migration.pdf',
      cr_url_extra_label: 'PDF — cadrage migration',
      decisions: []
    },
    {
      session_number: 9,
      title: 'Automatisations Stripe/Brevo/n8n, reporting FSY, ManyChat & e-signature',
      date: '2026-05-04',
      status: 'completed',
      summary: 'Point hebdomadaire : migration Circle, refonte workflows MTM (nodes natifs), coûts e-signature, rapport hebdo FSY, quiz Manychat / chatbots.',
      cr_url: base + 'pdfs/fsy-cr-2026-05-04.pdf',
      decisions: []
    },
    {
      session_number: 10,
      title: 'Mise en place et débogage des plateformes de formation et de marketing',
      date: '2026-05-05',
      status: 'completed',
      summary:
        'Point du 5 mai 2026 : Brevo (campagnes / listes), communauté Circle, automatisations Stripe ↔ Circle ↔ Brevo, clarification des workflows (journeys). Détail dans le compte-rendu PDF.',
      cr_url: base + 'coaching-session-2026-05-05.html',
      cr_url_extra: base + 'pdfs/coaching-session-2026-05-05.pdf',
      cr_url_extra_label: 'PDF — export',
      decisions: []
    }
  ];
}

function fsyTimelineSlotForDbRow(s) {
  var d = s.date ? String(s.date).slice(0, 10) : '';
  if (d && FSY_PORTAL_DATE_TO_SLOT[d] != null) return FSY_PORTAL_DATE_TO_SLOT[d];

  var n = s.session_number;
  if (n >= 101 && n <= 105) return n - 100;

  var num = Number(n);
  if (Number.isFinite(num) && num >= 1 && num <= 10) return num;
  if (Number.isFinite(num) && num >= 11) return 10;

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
  var byNumDb = {};
  (dbSessions || []).forEach(function(s) {
    var key = fsyTimelineSlotForDbRow(s);
    if (key === null || key === undefined) return;
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
