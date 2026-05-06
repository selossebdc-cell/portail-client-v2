async function loadSessions(clientId) {
  // Charger sessions + actions liées
  const [sessionsRes, actionsRes] = await Promise.all([
    db.from('sessions').select('*').eq('client_id', clientId).order('session_number', { ascending: false }),
    db.from('actions').select('id, title, status, is_completed, origin_session').eq('client_id', clientId)
  ]);

  if (sessionsRes.error) { console.error('Erreur chargement sessions:', sessionsRes.error); return; }
  renderSessions(sessionsRes.data, actionsRes.data || []);
}

function renderSessions(sessions, allActions) {
  function linkifyText(text) {
    var raw = String(text || '');
    var escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/(https?:\/\/[^\s<]+)/g, function(url) {
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" style="color:#d4956f;text-decoration:underline">' + url + '</a>';
    });
  }

  const container = document.getElementById('sessions-list');
  const subtitleEl = document.getElementById('sessions-subtitle');

  if (!sessions || sessions.length === 0) {
    container.innerHTML = '<p style="color:#666666; text-align:center; padding:40px 0;">L\'historique de tes séances apparaîtra ici.</p>';
    return;
  }

  const completed = sessions.filter(function(s) { return s.status === 'completed'; }).length;
  const total = currentProfile.total_sessions || '?';
  if (subtitleEl) {
    subtitleEl.textContent = '';
  }

  // Grouper actions par session d'origine
  var actionsBySession = {};
  allActions.forEach(function(a) {
    if (a.origin_session) {
      if (!actionsBySession[a.origin_session]) actionsBySession[a.origin_session] = [];
      actionsBySession[a.origin_session].push(a);
    }
  });

  let html = '';
  sessions.forEach(function(session, i) {
    const dateStr = session.date
      ? formatDate(session.date)
      : 'Date a definir';

    const isPlanned = session.status === 'planned';

    // Summary V1
    const summaryHtml = session.summary
      ? '<p style="font-size:0.85rem; color:#ccc; margin-top:12px;">' + linkifyText(session.summary) + '</p>'
      : '<p style="color:#666666;font-size:0.85rem;padding-top:16px">Le résumé sera ajoute après la séance.</p>';

    // CR link button
    let crHtml = '';
    if (session.cr_url) {
      crHtml = '<a href="' + session.cr_url + '" target="_blank" style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:8px 16px;background:rgba(194,122,90,0.1);border:1px solid rgba(194,122,90,0.3);border-radius:8px;color:#d4956f;font-size:0.8rem;font-weight:500;text-decoration:none;transition:all 0.2s" onmouseover="this.style.background=\'rgba(194,122,90,0.2)\'" onmouseout="this.style.background=\'rgba(194,122,90,0.1)\'">📄 Voir le compte-rendu complet →</a>';
    }

    // Decisions V1
    let decisionsHtml = '';
    if (session.decisions && session.decisions.length > 0) {
      const items = session.decisions.map(function(d) { return '<li>' + d + '</li>'; }).join('');
      decisionsHtml = '<div class="session-decisions"><h4>Decisions cles</h4><ul>' + items + '</ul></div>';
    }

    // Actions liées à cette session
    let actionsHtml = '';
    const sessionActions = actionsBySession[session.session_number];
    if (sessionActions && sessionActions.length > 0) {
      actionsHtml = '<div style="margin-top:12px;padding:12px 16px;background:rgba(96,165,250,0.05);border-radius:8px">';
      actionsHtml += '<h4 style="font-size:0.8rem;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Actions assignees</h4>';

      sessionActions.forEach(function(a) {
        var statusIcon, statusColor;
        if (a.status === 'done' || a.is_completed) {
          statusIcon = '✓'; statusColor = '#4ade80';
        } else if (a.status === 'abandoned') {
          statusIcon = '✕'; statusColor = '#666666';
        } else if (a.status === 'in_progress') {
          statusIcon = '◐'; statusColor = '#60a5fa';
        } else if (a.status === 'blocked') {
          statusIcon = '!'; statusColor = '#f87171';
        } else {
          statusIcon = '○'; statusColor = '#666666';
        }

        var textStyle = (a.status === 'done' || a.is_completed || a.status === 'abandoned')
          ? 'text-decoration:line-through;opacity:0.6' : '';

        actionsHtml += '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem">';
        actionsHtml += '<span style="color:' + statusColor + ';font-size:0.75rem;min-width:16px;text-align:center">' + statusIcon + '</span>';
        actionsHtml += '<span style="color:#ccc;' + textStyle + '">' + a.title + '</span>';
        actionsHtml += '</div>';
      });

      actionsHtml += '</div>';
    }

    html += '<div class="session-card' + (i === 0 ? ' open' : '') + '">' +
      '<div class="session-header" onclick="this.parentElement.classList.toggle(\'open\')">' +
        '<div class="session-num">' + session.session_number + '</div>' +
        '<div class="session-info">' +
          '<div class="session-title">' + (session.title || (isPlanned ? 'Prochaine séance' : 'Séance ' + session.session_number)) + '</div>' +
          '<div class="session-date">' + dateStr + (isPlanned ? ' — A venir' : '') + '</div>' +
        '</div>' +
        '<span class="session-chevron">▼</span>' +
      '</div>' +
      '<div class="session-body">' +
        summaryHtml +
        crHtml +
        decisionsHtml +
        actionsHtml +
      '</div>' +
    '</div>';
  });

  container.innerHTML = html;
}
