// ═══ Brain Dump + réponses Catherine ═══

async function loadBrainDumps(clientId) {
  const { data, error } = await db
    .from('brain_dumps')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) { console.error('Erreur chargement brain dumps:', error); return; }

  // Charger les réponses pour tous les brain dumps
  var replies = [];
  if (data && data.length > 0) {
    var dumpIds = data.map(function(d) { return d.id; });
    var { data: repliesData } = await db
      .from('brain_dump_replies')
      .select('*')
      .in('brain_dump_id', dumpIds)
      .order('created_at', { ascending: true });
    replies = repliesData || [];
  }

  renderBrainDumps(data, replies);
}

function renderBrainDumps(dumps, replies) {
  var listContainer = document.getElementById('brain-dump-list');

  if (!dumps || dumps.length === 0) {
    listContainer.innerHTML = '';
    return;
  }

  // Grouper les réponses par brain_dump_id
  var repliesByDump = {};
  (replies || []).forEach(function(r) {
    if (!repliesByDump[r.brain_dump_id]) repliesByDump[r.brain_dump_id] = [];
    repliesByDump[r.brain_dump_id].push(r);
  });

  var html = '<h3 class="section-title" style="font-size:1rem;margin-top:8px">Mes notes precedentes</h3>';

  dumps.forEach(function(dump) {
    var date = new Date(dump.created_at);
    var dateStr = date.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
    var readBadge = dump.is_read
      ? '<span style="font-size:0.7rem;color:#4ade80">✓ Lu</span>'
      : '<span style="font-size:0.7rem;color:#d4956f">En attente</span>';

    html += '<div class="braindump-entry">' +
      '<div class="braindump-entry-header">' +
        '<span class="braindump-entry-date">' + dateStr + '</span>' +
        readBadge +
      '</div>' +
      '<div class="braindump-entry-content">' + escapeHtml(dump.content) + '</div>';

    // Réponses de Catherine
    var dumpReplies = repliesByDump[dump.id] || [];
    if (dumpReplies.length > 0) {
      dumpReplies.forEach(function(reply) {
        var replyDate = new Date(reply.created_at);
        var replyDateStr = replyDate.toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
        });

        html += '<div style="margin-top:10px;margin-left:20px;padding:12px 16px;background:rgba(194,122,90,0.06);border-left:3px solid #C27A5A;border-radius:0 8px 8px 0">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
            '<span style="font-size:0.7rem;color:#d4956f;font-weight:600">Catherine</span>' +
            '<span style="font-size:0.65rem;color:#666666">' + replyDateStr + '</span>' +
          '</div>' +
          '<div style="font-size:0.85rem;color:#e0e0e0;line-height:1.6">' + escapeHtml(reply.content) + '</div>' +
        '</div>';
      });
    }

    html += '</div>';
  });

  listContainer.innerHTML = html;
}

async function submitBrainDump() {
  var textarea = document.getElementById('brain-dump-input');
  var content = textarea.value.trim();
  var btn = document.getElementById('brain-dump-submit');

  if (!content) return;

  btn.disabled = true;
  btn.textContent = 'Envoi...';

  var portalCid = typeof getPortalDataClientId === 'function' ? getPortalDataClientId() : (currentProfile && currentProfile.id);
  if (!portalCid) {
    btn.disabled = false;
    btn.textContent = 'Envoyer';
    return;
  }

  var { error } = await db
    .from('brain_dumps')
    .insert({ client_id: portalCid, content: content });

  if (error) {
    console.error('Erreur envoi brain dump:', error);
    btn.disabled = false;
    btn.textContent = 'Envoyer';
    return;
  }

  textarea.value = '';
  btn.disabled = false;
  btn.textContent = 'Envoyer';

  loadBrainDumps(portalCid);
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
