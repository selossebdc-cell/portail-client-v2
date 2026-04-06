// ═══ Playbook intégré dans le portail (lecture + checkbox) ═══

var playbookProcesses = [];

async function loadPlaybook(clientId) {
  var container = document.getElementById('playbook-portal-list');
  if (!container) return;

  try {
    var result = await db
      .from('playbook_processes')
      .select('*, playbook_steps(*)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (result.error) throw result.error;
    playbookProcesses = result.data || [];
    renderPlaybookPortal(playbookProcesses);
  } catch (e) {
    console.error('Erreur chargement playbook:', e);
    container.innerHTML = '<p style="color:#666;text-align:center;padding:20px 0">Impossible de charger le playbook.</p>';
  }
}

function renderPlaybookPortal(processes) {
  var container = document.getElementById('playbook-portal-list');
  if (!container) return;

  if (!processes || processes.length === 0) {
    container.innerHTML = '<p style="color:#666;text-align:center;padding:40px 0">Aucun process pour le moment.</p>';
    return;
  }

  var html = '';
  processes.forEach(function(p) {
    var steps = (p.playbook_steps || []).sort(function(a, b) { return a.step_order - b.step_order; });
    var total = steps.length;
    var done = steps.filter(function(s) { return s.done; }).length;
    var pct = total > 0 ? Math.round((done / total) * 100) : 0;

    var statusBadge = p.status === 'termine'
      ? '<span style="font-size:0.7rem;padding:2px 8px;border-radius:4px;background:rgba(74,222,128,0.15);color:#4ade80">Terminé</span>'
      : '<span style="font-size:0.7rem;padding:2px 8px;border-radius:4px;background:rgba(96,165,250,0.15);color:#60a5fa">Actif</span>';

    var dateCible = p.date_cible ? new Date(p.date_cible + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    html += '<div class="playbook-process-card" style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;margin-bottom:12px;overflow:hidden">';

    // Header (cliquable pour ouvrir/fermer)
    html += '<div class="playbook-process-header" onclick="togglePlaybookProcess(\'' + p.id + '\')" style="padding:16px 18px;cursor:pointer;display:flex;align-items:center;gap:12px">';
    html += '<span id="chevron-' + p.id + '" style="color:#666;font-size:0.8rem;transition:transform 0.2s">▶</span>';
    html += '<div style="flex:1">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
    html += '<span style="font-weight:600;font-size:0.95rem">' + p.name + '</span>';
    html += statusBadge;
    html += '</div>';
    html += '<div style="display:flex;align-items:center;gap:12px;font-size:0.8rem;color:#888">';
    if (dateCible) html += '<span>Échéance : ' + dateCible + '</span>';
    html += '<span>' + done + '/' + total + ' étapes</span>';
    html += '</div>';
    // Progress bar
    html += '<div style="margin-top:8px;height:4px;background:#222;border-radius:2px;overflow:hidden">';
    html += '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#C27A5A,#d4956f);border-radius:2px;transition:width 0.3s"></div>';
    html += '</div>';
    html += '</div></div>';

    // Steps (hidden by default)
    html += '<div id="steps-' + p.id + '" style="display:none;padding:0 18px 16px;border-top:1px solid #222">';
    if (steps.length > 0) {
      // Group by section
      var sections = {};
      steps.forEach(function(s) {
        var sec = s.section || 'Étapes';
        if (!sections[sec]) sections[sec] = [];
        sections[sec].push(s);
      });
      Object.keys(sections).forEach(function(secName) {
        html += '<div style="margin-top:12px;margin-bottom:6px;font-size:0.75rem;color:#C27A5A;text-transform:uppercase;letter-spacing:1px;font-weight:600">' + secName + '</div>';
        sections[secName].forEach(function(s) {
          var checkStyle = s.done
            ? 'background:#C27A5A;border-color:#C27A5A;color:#fff'
            : 'background:transparent;border-color:#444;color:transparent';
          var textStyle = s.done ? 'text-decoration:line-through;color:#666' : 'color:#e0e0e0';
          var ownerHtml = s.raci_r ? '<span style="font-size:0.7rem;padding:1px 6px;border-radius:4px;background:rgba(194,122,90,0.15);color:#d4956f">' + s.raci_r + '</span>' : '';

          html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #1f1f1f" onclick="togglePlaybookStep(\'' + s.id + '\', ' + !s.done + ')" style="cursor:pointer">';
          html += '<div style="width:18px;height:18px;border:2px solid;border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.7rem;cursor:pointer;margin-top:1px;' + checkStyle + '">✓</div>';
          html += '<div style="flex:1;min-width:0">';
          html += '<div style="font-size:0.85rem;' + textStyle + ';display:flex;align-items:center;gap:8px;flex-wrap:wrap">' + s.title + ' ' + ownerHtml + '</div>';
          if (s.description) {
            html += '<div style="font-size:0.75rem;color:#777;margin-top:2px">' + s.description + '</div>';
          }
          html += '</div></div>';
        });
      });
    }
    // Lien vers playbook complet
    html += '<div style="margin-top:12px;text-align:center">';
    html += '<a href="playbook.html" target="_blank" style="font-size:0.8rem;color:#C27A5A;text-decoration:none">Ouvrir le playbook complet →</a>';
    html += '</div>';
    html += '</div></div>';
  });

  container.innerHTML = html;
}

function togglePlaybookProcess(processId) {
  var stepsDiv = document.getElementById('steps-' + processId);
  var chevron = document.getElementById('chevron-' + processId);
  if (!stepsDiv) return;
  var isOpen = stepsDiv.style.display !== 'none';
  stepsDiv.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
}

async function togglePlaybookStep(stepId, newDone) {
  try {
    var result = await db
      .from('playbook_steps')
      .update({ done: newDone })
      .eq('id', stepId);
    if (result.error) throw result.error;
    // Recharger
    var clientId = viewingAsClientId || currentProfile.id;
    await loadPlaybook(clientId);
    // Mettre à jour le badge
    updatePlaybookBadge(clientId);
  } catch (e) {
    console.error('Erreur toggle step:', e);
  }
}

// Résumé pour le dashboard
async function getPlaybookSummary(clientId) {
  try {
    var result = await db
      .from('playbook_processes')
      .select('id, name, status, playbook_steps(done)')
      .eq('client_id', clientId);
    if (result.error) throw result.error;
    var processes = result.data || [];
    var active = processes.filter(function(p) { return p.status === 'actif'; }).length;
    var totalSteps = 0;
    var doneSteps = 0;
    processes.forEach(function(p) {
      var steps = p.playbook_steps || [];
      totalSteps += steps.length;
      doneSteps += steps.filter(function(s) { return s.done; }).length;
    });
    return { active: active, totalSteps: totalSteps, doneSteps: doneSteps };
  } catch (e) {
    console.error('Erreur playbook summary:', e);
    return { active: 0, totalSteps: 0, doneSteps: 0 };
  }
}

async function updatePlaybookBadge(clientId) {
  var summary = await getPlaybookSummary(clientId);
  var badge = document.getElementById('badge-playbook');
  if (badge && summary.totalSteps > 0) {
    var pending = summary.totalSteps - summary.doneSteps;
    if (pending > 0) {
      badge.textContent = pending;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }
}
