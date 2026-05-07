// ═══ Mes outils — client peut ajouter ═══

async function loadTools(clientId) {
  const { data, error } = await db
    .from('tools')
    .select('*')
    .eq('client_id', clientId)
    .order('sort_order', { ascending: true });

  if (error) { console.error('Erreur chargement outils:', error); return; }
  renderTools(data);
}

function renderTools(tools) {
  const container = document.getElementById('tools-list');

  let html = '';

  if (tools && tools.length > 0) {
    tools.forEach(function(tool) {
      var statusBadge, statusColor;
      switch (tool.status) {
        case 'adopted':
          statusBadge = '✅ Adopte'; statusColor = '#4ade80'; break;
        case 'in_progress':
          statusBadge = '🔄 En cours'; statusColor = '#60a5fa'; break;
        case 'planned':
          statusBadge = '📋 Prevu'; statusColor = '#fb923c'; break;
        case 'abandoned':
          statusBadge = '✕ Abandonne'; statusColor = '#666666'; break;
        default:
          statusBadge = ''; statusColor = '#666666';
      }

      var opacity = tool.status === 'abandoned' ? 'opacity:0.5;' : '';

      html += '<div class="tuto-card" style="' + opacity + '">' +
        '<div class="tuto-icon">' + (tool.icon || '🔧') + '</div>' +
        '<div class="tuto-info">' +
          '<div class="tuto-name">' + tool.name + '</div>' +
          '<div class="tuto-desc">' + (tool.description || '') + '</div>' +
          '<div style="margin-top:4px"><span style="font-size:0.7rem;color:' + statusColor + ';font-weight:500">' + statusBadge + '</span></div>' +
        '</div>';

      if (tool.url) {
        html += '<a href="' + tool.url + '" target="_blank" class="tuto-btn">Ouvrir</a>';
      }

      html += '</div>';
    });
  } else {
    html += '<p style="color:#666666;text-align:center;padding:20px 0">Aucun outil pour le moment.</p>';
  }

  // Bouton ajouter
  html += '<div id="tool-add-form" style="margin-top:20px">' +
    '<div id="tool-add-btn" style="padding:14px;background:rgba(194,122,90,0.08);border:1px dashed rgba(194,122,90,0.3);border-radius:12px;text-align:center;cursor:pointer;color:#d4956f;font-size:0.9rem;transition:all 0.2s" onclick="showToolForm()" onmouseover="this.style.borderStyle=\'solid\'" onmouseout="this.style.borderStyle=\'dashed\'">' +
      '+ Ajouter un outil' +
    '</div>' +
    '<div id="tool-form" style="display:none;padding:20px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px">' +
      '<input id="tool-name" type="text" placeholder="Nom de l\'outil (ex: Notion, Canva...)" style="width:100%;padding:10px 14px;background:#222;border:1px solid #333;border-radius:8px;color:#e0e0e0;font-family:inherit;font-size:0.9rem;margin-bottom:10px">' +
      '<textarea id="tool-desc" placeholder="A quoi ca te sert ? Comment tu l\'utilises ?" style="width:100%;min-height:80px;padding:10px 14px;background:#222;border:1px solid #333;border-radius:8px;color:#e0e0e0;font-family:inherit;font-size:0.9rem;resize:vertical;margin-bottom:12px"></textarea>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button onclick="hideToolForm()" style="padding:8px 16px;background:none;border:1px solid #333;border-radius:8px;color:#b0b0b0;cursor:pointer;font-family:inherit;font-size:0.85rem">Annuler</button>' +
        '<button onclick="submitTool()" class="tuto-btn" id="tool-submit-btn">Ajouter</button>' +
      '</div>' +
    '</div>' +
  '</div>';

  container.innerHTML = html;
}

function showToolForm() {
  document.getElementById('tool-add-btn').style.display = 'none';
  document.getElementById('tool-form').style.display = 'block';
  document.getElementById('tool-name').focus();
}

function hideToolForm() {
  document.getElementById('tool-add-btn').style.display = 'block';
  document.getElementById('tool-form').style.display = 'none';
  document.getElementById('tool-name').value = '';
  document.getElementById('tool-desc').value = '';
}

async function submitTool() {
  var name = document.getElementById('tool-name').value.trim();
  var desc = document.getElementById('tool-desc').value.trim();
  var btn = document.getElementById('tool-submit-btn');

  if (!name) { document.getElementById('tool-name').style.borderColor = '#f87171'; return; }

  btn.disabled = true;
  btn.textContent = 'Ajout...';

  var portalCid = typeof getPortalDataClientId === 'function' ? getPortalDataClientId() : (currentProfile && currentProfile.id);
  if (!portalCid) {
    btn.disabled = false;
    btn.textContent = 'Ajouter';
    return;
  }

  const { error } = await db
    .from('tools')
    .insert({
      client_id: portalCid,
      name: name,
      description: desc || null,
      status: 'in_progress',
      added_by: currentProfile.id
    });

  if (error) {
    console.error('Erreur ajout outil:', error);
    btn.disabled = false;
    btn.textContent = 'Ajouter';
    return;
  }

  btn.disabled = false;
  btn.textContent = 'Ajouter';
  loadTools(portalCid);
}
