// ═══ Tableau de bord client (page d'arrivée) ═══

async function loadClientDashboard(profile) {
  const container = document.getElementById('dashboard-content');
  let html = '';

  // ─── Alerte RDV ───
  const { data: plannedSessions } = await db
    .from('sessions')
    .select('*')
    .eq('client_id', profile.id)
    .eq('status', 'planned')
    .order('date', { ascending: true })
    .limit(1);

  if (plannedSessions && plannedSessions.length > 0) {
    const next = plannedSessions[0];
    const d = next.date ? new Date(next.date + 'T00:00:00') : null;
    const dateStr = d ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'A definir';
    html += '<div style="margin-bottom:20px;padding:14px 18px;background:rgba(194,122,90,0.08);border:1px solid rgba(194,122,90,0.2);border-radius:10px;display:flex;align-items:center;gap:12px">' +
      '<span style="font-size:1.4rem">📅</span>' +
      '<div style="flex:1">' +
        '<div style="font-weight:600;font-size:0.9rem">Prochaine séance : ' + dateStr + '</div>' +
        '<div style="font-size:0.8rem;color:#666666">' + (next.title || '') + '</div>' +
      '</div>' +
    '</div>';
  } else {
    // Warning : pas de RDV calé
    html += '<div style="margin-bottom:20px;padding:14px 18px;background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.3);border-radius:10px;display:flex;align-items:center;gap:12px">' +
      '<span style="font-size:1.4rem">⚠️</span>' +
      '<div style="flex:1">' +
        '<div style="font-weight:600;font-size:0.9rem;color:#fb923c">Ton prochain RDV n\'est pas encore cale</div>' +
        '<div style="font-size:0.8rem;color:#b0b0b0">Prends rendez-vous pour continuer ton accompagnement.</div>' +
      '</div>';
    html += '<div style="display:flex;gap:8px;flex-shrink:0">' +
      '<a href="https://fantastical.app/consulting-strategique/rdv1h" target="_blank" class="tuto-btn" style="font-size:0.8rem;padding:6px 14px">RDV 1h</a>' +
      '<a href="https://fantastical.app/consulting-strategique/reunion-1h30" target="_blank" class="tuto-btn" style="font-size:0.8rem;padding:6px 14px">RDV 1h30</a>' +
    '</div>';
    html += '</div>';
  }

  // ─── Objectifs (si renseignés) ───
  if (profile.objectives && profile.objectives.length > 0) {
    html += '<div style="margin-bottom:24px;padding:20px;background:rgba(194,122,90,0.05);border:1px solid rgba(194,122,90,0.15);border-radius:12px">' +
      '<h3 style="font-family:Playfair Display,serif;font-size:1.1rem;margin-bottom:12px;color:#d4956f">Mes objectifs</h3>';
    profile.objectives.forEach(function(obj) {
      html += '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.9rem;color:#e0e0e0">' +
        '<span style="color:#d4956f">◆</span> ' + obj + '</div>';
    });
    html += '</div>';
  }

  // ─── Retroplanning mini (basé sur les séances, pas les jours) ───
  if (profile.start_date && profile.end_date) {
    const start = new Date(profile.start_date + 'T00:00:00');
    const end = new Date(profile.end_date + 'T00:00:00');
    const startStr = start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    const endStr = end.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    const pct = window._sessionPct || 0;

    html += '<div style="margin-bottom:24px;padding:16px 20px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-size:0.8rem;color:#b0b0b0">' + startStr + '</span>' +
        '<span style="font-size:0.75rem;color:#666666">Avancement programme</span>' +
        '<span style="font-size:0.8rem;color:#b0b0b0">' + endStr + '</span>' +
      '</div>' +
      '<div style="height:8px;background:#222;border-radius:4px;overflow:hidden;position:relative">' +
        '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#C27A5A,#d4956f);border-radius:4px;transition:width 0.5s"></div>' +
      '</div>' +
      '<div style="text-align:center;font-size:0.75rem;color:#666666;margin-top:4px">' + pct + '% du programme</div>' +
    '</div>';
  }

  // ─── Résumé Playbook ───
  var pbSummary = await getPlaybookSummary(profile.id);
  if (pbSummary.totalSteps > 0) {
    var pbPct = Math.round((pbSummary.doneSteps / pbSummary.totalSteps) * 100);
    html += '<div style="margin-bottom:20px;padding:14px 18px;background:rgba(194,122,90,0.08);border:1px solid rgba(194,122,90,0.2);border-radius:10px;cursor:pointer" onclick="switchToTab(\'tab-playbook\')">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
          '<div style="font-weight:600;font-size:0.9rem">📋 Playbook</div>' +
          '<div style="font-size:0.8rem;color:#888;margin-top:2px">' + pbSummary.active + ' process actif' + (pbSummary.active > 1 ? 's' : '') + ' · ' + pbSummary.doneSteps + '/' + pbSummary.totalSteps + ' étapes</div>' +
        '</div>' +
        '<span style="font-size:0.85rem;color:#C27A5A;font-weight:600">' + pbPct + '%</span>' +
      '</div>' +
      '<div style="margin-top:8px;height:4px;background:#222;border-radius:2px;overflow:hidden">' +
        '<div style="height:100%;width:' + pbPct + '%;background:linear-gradient(90deg,#C27A5A,#d4956f);border-radius:2px"></div>' +
      '</div>' +
    '</div>';
  }

  // ─── Actions prioritaires ───
  const { data: actions } = await db
    .from('actions')
    .select('id, title, tags, status, is_completed')
    .eq('client_id', profile.id)
    .order('sort_order', { ascending: true });

  const pendingActions = actions ? actions.filter(function(a) {
    return a.status !== 'done' && a.status !== 'abandoned' && !a.is_completed;
  }).slice(0, 5) : [];

  if (pendingActions.length > 0) {
    html += '<div style="margin-bottom:24px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
        '<h3 style="font-family:Playfair Display,serif;font-size:1.1rem">Actions en cours</h3>' +
        '<span style="font-size:0.8rem;color:#d4956f;cursor:pointer" onclick="switchToTab(\'tab-actions\')">Voir tout →</span>' +
      '</div>';
    pendingActions.forEach(function(a) {
      const tags = (a.tags || []).map(function(t) {
        return '<span class="action-tag tag-' + t + '">' + t + '</span>';
      }).join('');
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;margin-bottom:6px;cursor:pointer" onclick="switchToTab(\'tab-actions\')">' +
        '<span style="color:#3a3a3a;font-size:0.8rem">○</span>' +
        '<span style="font-size:0.9rem;color:#e0e0e0;flex:1">' + a.title + '</span>' +
        tags +
      '</div>';
    });
    html += '</div>';
  }

  // ─── Raccourcis ───
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px">';

  html += '<div style="padding:16px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;cursor:pointer;transition:border-color 0.2s" onclick="switchToTab(\'tab-braindump\')" onmouseover="this.style.borderColor=\'#C27A5A\'" onmouseout="this.style.borderColor=\'#2a2a2a\'">' +
    '<div style="font-size:1.2rem;margin-bottom:4px">💭</div>' +
    '<div style="font-size:0.85rem;font-weight:600">Quelque chose a noter ?</div>' +
    '<div style="font-size:0.75rem;color:#666666">Note tes idees, blocages...</div>' +
  '</div>';

  html += '<div style="padding:16px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;cursor:pointer;transition:border-color 0.2s" onclick="switchToTab(\'tab-project\')" onmouseover="this.style.borderColor=\'#C27A5A\'" onmouseout="this.style.borderColor=\'#2a2a2a\'">' +
    '<div style="font-size:1.2rem;margin-bottom:4px">📊</div>' +
    '<div style="font-size:0.85rem;font-weight:600">Mon projet</div>' +
    '<div style="font-size:0.75rem;color:#666666">KPI, avancement, dashboards</div>' +
  '</div>';

  // Dernier CR
  const { data: lastCR } = await db
    .from('sessions')
    .select('session_number, title, cr_url')
    .eq('client_id', profile.id)
    .not('cr_url', 'is', null)
    .order('session_number', { ascending: false })
    .limit(1);

  if (lastCR && lastCR.length > 0 && lastCR[0].cr_url) {
    html += '<a href="' + lastCR[0].cr_url + '" target="_blank" style="padding:16px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;text-decoration:none;color:inherit;transition:border-color 0.2s" onmouseover="this.style.borderColor=\'#C27A5A\'" onmouseout="this.style.borderColor=\'#2a2a2a\'">' +
      '<div style="font-size:1.2rem;margin-bottom:4px">📄</div>' +
      '<div style="font-size:0.85rem;font-weight:600">Dernier CR</div>' +
      '<div style="font-size:0.75rem;color:#666666">S' + lastCR[0].session_number + ' — ' + (lastCR[0].title || '') + '</div>' +
    '</a>';
  } else {
    html += '<div style="padding:16px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;cursor:pointer;transition:border-color 0.2s" onclick="switchToTab(\'tab-sessions\')" onmouseover="this.style.borderColor=\'#C27A5A\'" onmouseout="this.style.borderColor=\'#2a2a2a\'">' +
      '<div style="font-size:1.2rem;margin-bottom:4px">📅</div>' +
      '<div style="font-size:0.85rem;font-weight:600">Mes séances</div>' +
      '<div style="font-size:0.75rem;color:#666666">Historique et CR</div>' +
    '</div>';
  }

  // Liens RDV
  html += '<div style="padding:16px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px">' +
    '<div style="font-size:1.2rem;margin-bottom:4px">🗓️</div>' +
    '<div style="font-size:0.85rem;font-weight:600;margin-bottom:8px">Prendre RDV</div>' +
    '<div style="display:flex;gap:6px">' +
      '<a href="https://fantastical.app/consulting-strategique/rdv1h" target="_blank" class="tuto-btn" style="font-size:0.75rem;padding:5px 12px">1h</a>' +
      '<a href="https://fantastical.app/consulting-strategique/reunion-1h30" target="_blank" class="tuto-btn" style="font-size:0.75rem;padding:5px 12px">1h30</a>' +
    '</div>' +
  '</div>';

  html += '</div>';

  container.innerHTML = html;
}

function switchToTab(tabId) {
  const tabs = document.querySelectorAll('#client-tabs .tab');
  const panels = document.querySelectorAll('#client-view .tab-panel');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  panels.forEach(function(p) { p.classList.remove('active'); });
  // Find matching tab button
  tabs.forEach(function(t) {
    if (t.dataset.tab === tabId) t.classList.add('active');
  });
  var panel = document.getElementById(tabId);
  if (panel) panel.classList.add('active');
  // Mark badge as seen
  var tabName = tabId.replace('tab-', '');
  markTabSeen(tabName);
}
