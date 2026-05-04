// ═══ Tutos & Guides — guides pédagogiques + ressources FSY statiques ═══

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeExternalUrl(url) {
  try {
    var parsed = new URL(url, window.location.origin);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
  } catch (e) {
    return null;
  }
  return null;
}

function buildFsyRow(href, title, desc, icon) {
  var safeUrl = sanitizeExternalUrl(href);
  if (!safeUrl) return '';
  return '<div class="tuto-card">' +
    '<div class="tuto-icon">' + escapeHtml(icon) + '</div>' +
    '<div class="tuto-info">' +
      '<div class="tuto-name">' + escapeHtml(title) + '</div>' +
      '<div class="tuto-desc">' + escapeHtml(desc) + '</div>' +
    '</div>' +
    '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" class="tuto-btn">▶ Ouvrir</a>' +
  '</div>';
}

function buildFsyResourcesHtml() {
  var base = new URL('/clients/fsy/', window.location.origin).href;
  var html = '';
  html += '<div style="margin-bottom:24px;padding:16px;border:1px solid rgba(194,122,90,0.35);border-radius:12px;background:#151515">';
  html += '<h3 style="font-family:Playfair Display,serif;color:#d4956f;font-size:1.05rem;margin:0 0 12px">1) Circle — vidéo de démarrage + page sous la vidéo</h3>';
  html += buildFsyRow(base + 'script-video-circle-onboarding-fsy.html', 'Script vidéo — bienvenue sur Circle', 'Texte prêt à enregistrer pour la vidéo de démarrage.', '🎬');
  html += buildFsyRow(base + 'premieres-actions-circle-fsy.html', 'Page à mettre sous la vidéo de démarrage', 'Tes 3 premières actions sur Circle.', '⭕');
  html += '<h3 style="font-family:Playfair Display,serif;color:#d4956f;font-size:1.05rem;margin:18px 0 12px">2) Recrutement d\'un bras droit</h3>';
  html += buildFsyRow(base + 'fiche-poste-recrutement-bras-droit-fsy.html', 'Fiche de poste — annonce recrutement', 'Texte public pour diffuser l\'offre.', '📣');
  html += buildFsyRow(base + 'fiche-poste-bras-droit-fsy.html', 'Fiche de poste — bras droit opérations', 'Version détaillée du rôle.', '📋');
  html += buildFsyRow(base + 'grille-entretien-bras-droit-fsy.html', 'Grille d\'entretien candidats', 'Structure et critères pour les entretiens.', '✅');
  html += '</div>';
  return html;
}

async function shouldShowFsyResources(clientId) {
  try {
    var u = await db.auth.getUser();
    var email = (((u || {}).data || {}).user || {}).email || '';
    email = String(email).toLowerCase();
    if (email.indexOf('aurelia') !== -1 || email.indexOf('facesoulyoga') !== -1 || email.indexOf('delsol@gmail') !== -1) {
      return true;
    }
  } catch (e) {}
  try {
    var p = await db.from('profiles').select('company, program, email').eq('id', clientId).single();
    var row = p && p.data ? p.data : {};
    var company = String(row.company || '').toLowerCase();
    var program = String(row.program || '').toLowerCase();
    var email2 = String(row.email || '').toLowerCase();
    if (company.indexOf('face soul') !== -1 || company.indexOf('facesoul') !== -1) return true;
    if (program.indexOf('clarte') !== -1 || program.indexOf('clarté') !== -1) return true;
    if (email2.indexOf('aurelia') !== -1 || email2.indexOf('facesoulyoga') !== -1 || email2.indexOf('delsol@gmail') !== -1) return true;
  } catch (e) {}
  return false;
}

async function loadTutos(clientId) {
  const { data, error } = await db
    .from('tutos')
    .select('*')
    .eq('client_id', clientId)
    .in('tuto_type', ['guide', 'video'])
    .order('sort_order', { ascending: true });

  if (error) { console.error('Erreur chargement tutos:', error); return; }
  var showFsy = await shouldShowFsyResources(clientId);
  renderTutos(data, showFsy ? buildFsyResourcesHtml() : '');
}

function renderTutos(tutos, fsyIntroHtml) {
  const container = document.getElementById('tutos-list');

  if ((!tutos || tutos.length === 0) && !fsyIntroHtml) {
    container.innerHTML = '<p style="color:#666666; text-align:center; padding:40px 0;">Pas encore de tutos.</p>';
    return;
  }

  let html = fsyIntroHtml || '';
  tutos.forEach(function(tuto) {
    var icon = escapeHtml(tuto.icon || '📘');
    var safeUrl = sanitizeExternalUrl(tuto.loom_url);
    var hasUrl = !!safeUrl;
    var isVideo = tuto.tuto_type === 'video';
    var progressText = isVideo ? '📹 Video' : (tuto.steps ? tuto.steps + ' etapes' : '');
    var safeTitle = escapeHtml(tuto.title || '');
    var safeDesc = escapeHtml(tuto.content_html || '');

    html += '<div class="tuto-card">' +
      '<div class="tuto-icon">' + icon + '</div>' +
      '<div class="tuto-info">' +
        '<div class="tuto-name">' + safeTitle + '</div>' +
        '<div class="tuto-desc">' + safeDesc + '</div>' +
        (progressText ? '<div class="tuto-progress">' + escapeHtml(progressText) + '</div>' : '') +
      '</div>';

    if (hasUrl) {
      var btnLabel = isVideo ? '▶ Regarder' : '▶ Voir';
      html += '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" class="tuto-btn">' + escapeHtml(btnLabel) + '</a>';
    } else {
      html += '<span style="font-size:0.75rem;color:#666666;font-style:italic;white-space:nowrap">Bientot dispo</span>';
    }

    html += '</div>';
  });

  container.innerHTML = html;
}
