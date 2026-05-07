// FSY — timeline portail (source unique) : mêmes dates + même CR que l’historique Sessions et l’accueil.

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

function getFsyPortalTimelineEntries() {
  var base = new URL('/clients/fsy/', window.location.origin).href;
  return [
    { session_number: 6, title: 'Session 6', date: '2026-05-05', status: 'completed', summary: '', cr_url: base + 'pdfs/coaching-session-2026-05-05.pdf' },
    { session_number: 5, title: 'Session 5', date: '2026-04-23', status: 'completed', summary: '', cr_url: null },
    { session_number: 4, title: 'Session 4', date: '2026-04-23', status: 'completed', summary: '', cr_url: base + 'pdfs/coaching-session-2026-04-23.pdf' },
    { session_number: 3, title: 'Session 3', date: '2026-04-21', status: 'completed', summary: '', cr_url: base + 'pdfs/coaching-session-2026-04-21.pdf' },
    { session_number: 2, title: 'Session 2', date: '2026-04-20', status: 'completed', summary: '', cr_url: base + 'pdfs/coaching-session-2026-04-20.pdf' },
    { session_number: 1, title: 'Session 1', date: '2026-04-09', status: 'completed', summary: '', cr_url: base + 'pdfs/coaching-session-2026-04-09.pdf' }
  ];
}

function mergeDbSessionsWithFsyPortalTimeline(dbSessions) {
  function pickBest(prev, s) {
    if (!prev) return s;
    var rank = function(row) {
      if (row.status === 'completed') return 2;
      if (row.status === 'planned') return 0;
      return 1;
    };
    if (rank(s) > rank(prev)) return s;
    if (rank(s) === rank(prev) && s.date && prev.date && s.date > prev.date) return s;
    return prev;
  }

  var extras = getFsyPortalTimelineEntries();
  var allowedNums = {};
  extras.forEach(function(e) { allowedNums[e.session_number] = true; });

  var byNumDb = {};
  var byNumOrphan = {};
  (dbSessions || []).forEach(function(s) {
    var n = s.session_number;
    if (n === undefined || n === null) return;
    if (!allowedNums[n]) {
      byNumOrphan[n] = pickBest(byNumOrphan[n], s);
      return;
    }
    byNumDb[n] = pickBest(byNumDb[n], s);
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
        title: e.title,
        cr_url: e.cr_url,
        date: e.date
      };
    });
}
