async function loadActions(clientId) {
  const { data, error } = await db
    .from('actions')
    .select('*')
    .eq('client_id', clientId)
    .order('sort_order', { ascending: true });

  if (error) { console.error('Erreur chargement actions:', error); return; }
  renderActions(data);
}

function renderActions(actions) {
  const container = document.getElementById('actions-list');

  if (!actions || actions.length === 0) {
    container.innerHTML = '<p style="color:#666666; text-align:center; padding:40px 0;">Aucune action pour le moment.</p>';
    document.getElementById('badge-actions').style.display = 'none';
    document.getElementById('actions-done-section').style.display = 'none';
    return;
  }

  // Séparer : actives vs terminées/abandonnées
  const active = actions.filter(function(a) {
    return a.status !== 'done' && a.status !== 'abandoned' && !a.is_completed;
  });
  const done = actions.filter(function(a) {
    return a.status === 'done' || a.is_completed;
  });
  const abandoned = actions.filter(function(a) {
    return a.status === 'abandoned';
  });

  // Badge V1
  const badge = document.getElementById('badge-actions');
  if (active.length > 0) {
    badge.textContent = active.length;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }

  // Actions actives
  let html = '';
  active.forEach(function(a) { html += actionCardHtml(a); });
  container.innerHTML = html || '<p style="color:#666666; text-align:center; padding:40px 0;">Tout est fait ! Bravo 💪</p>';

  // Section "Déjà fait"
  const doneSection = document.getElementById('actions-done-section');
  const doneList = document.getElementById('actions-done-list');

  if (done.length > 0 || abandoned.length > 0) {
    doneSection.style.display = 'block';

    let archiveHtml = '';

    if (done.length > 0) {
      archiveHtml += '<div style="margin-bottom:16px">';
      done.forEach(function(a) { archiveHtml += actionCardHtml(a); });
      archiveHtml += '</div>';
    }

    if (abandoned.length > 0) {
      archiveHtml += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #2a2a2a">';
      archiveHtml += '<div style="font-size:0.75rem;color:#666666;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Abandonnees</div>';
      abandoned.forEach(function(a) { archiveHtml += actionCardHtml(a); });
      archiveHtml += '</div>';
    }

    doneList.innerHTML = archiveHtml;
  } else {
    doneSection.style.display = 'none';
    doneList.innerHTML = '';
  }
}

function actionCardHtml(a) {
  const isDone = a.status === 'done' || a.is_completed;
  const isAbandoned = a.status === 'abandoned';
  const isArchived = isDone || isAbandoned;

  // Tags V1
  const tags = (a.tags || []).map(function(t) {
    return '<span class="action-tag tag-' + t + '">' + t + '</span>';
  }).join('');

  // Origin session badge
  let originHtml = '';
  if (a.origin_session) {
    originHtml = '<span class="action-tag" style="background:rgba(194,122,90,0.15);color:#d4956f">S' + a.origin_session + '</span>';
  }

  // Link V1
  let linkHtml = '';
  if (a.link_url) {
    linkHtml = '<a href="' + a.link_url + '" target="_blank" class="action-link" onclick="event.stopPropagation();">' + (a.link_label || 'Ouvrir') + ' →</a>';
  }

  // Status indicator
  let statusHtml = '';
  if (isAbandoned) {
    statusHtml = '<span style="font-size:0.7rem;color:#666666;font-style:italic;margin-left:auto;white-space:nowrap">abandonnee</span>';
  }

  // Buttons
  let buttonsHtml = '';
  if (isDone) {
    buttonsHtml = '<span onclick="event.stopPropagation(); changeActionStatus(\'' + a.id + '\', \'todo\')" style="font-size:0.75rem; color:#fb923c; cursor:pointer; padding:4px 10px; border:1px solid rgba(251,146,60,0.3); border-radius:6px; white-space:nowrap;">Annuler</span>';
  } else if (!isAbandoned) {
    buttonsHtml =
      '<div style="display:flex;gap:6px;margin-left:auto;flex-shrink:0" onclick="event.stopPropagation()">' +
        '<span onclick="changeActionStatus(\'' + a.id + '\', \'done\')" style="font-size:0.7rem;color:#4ade80;cursor:pointer;padding:3px 8px;border:1px solid rgba(74,222,128,0.3);border-radius:6px" title="Fait">✓</span>' +
        '<span onclick="changeActionStatus(\'' + a.id + '\', \'abandoned\')" style="font-size:0.7rem;color:#666666;cursor:pointer;padding:3px 8px;border:1px solid #333;border-radius:6px" title="Abandonner">✕</span>' +
      '</div>';
  } else {
    buttonsHtml = '<span onclick="event.stopPropagation(); changeActionStatus(\'' + a.id + '\', \'todo\')" style="font-size:0.75rem; color:#fb923c; cursor:pointer; padding:4px 10px; border:1px solid rgba(251,146,60,0.3); border-radius:6px; white-space:nowrap;">Reprendre</span>';
  }

  // Card classes
  let cardClass = 'action-card';
  if (isDone) cardClass += ' done';
  if (isAbandoned) cardClass += ' done';

  // Checkbox
  let checkboxContent = '';
  let checkboxExtra = '';
  if (isDone) {
    checkboxContent = '✓';
  } else if (isAbandoned) {
    checkboxContent = '✕';
    checkboxExtra = ' style="background:#991b1b;border-color:#f87171;color:#f87171"';
  }

  const clickAction = (!isDone && !isAbandoned)
    ? ' onclick="changeActionStatus(\'' + a.id + '\', \'done\')"'
    : '';

  return '<div class="' + cardClass + '"' + clickAction + '>' +
    '<div class="action-checkbox"' + checkboxExtra + '>' + checkboxContent + '</div>' +
    '<div class="action-body">' +
      '<div class="action-text">' + a.title + '</div>' +
      ((tags || originHtml) ? '<div class="action-meta">' + tags + originHtml + '</div>' : '') +
      linkHtml +
    '</div>' + statusHtml + buttonsHtml + '</div>';
}

async function changeActionStatus(actionId, newStatus) {
  const isDone = (newStatus === 'done');
  const isAbandoned = (newStatus === 'abandoned');

  const { error } = await db
    .from('actions')
    .update({
      status: newStatus,
      is_completed: isDone,
      completed_at: (isDone || isAbandoned) ? new Date().toISOString() : null
    })
    .eq('id', actionId);

  if (error) { console.error('Erreur mise a jour action:', error); return; }
  var reloadId = typeof getPortalDataClientId === 'function' ? getPortalDataClientId() : (currentProfile && currentProfile.id);
  if (reloadId) loadActions(reloadId);
}

// Legacy compat
async function toggleAction(actionId, wasCompleted) {
  changeActionStatus(actionId, wasCompleted ? 'todo' : 'done');
}
