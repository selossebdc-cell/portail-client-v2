async function initAdminDashboard() {
  document.getElementById('user-name-admin').textContent = currentProfile.full_name;
  initTabs('#admin-tabs, #admin-view');

  const tabs = document.querySelectorAll('#admin-view .tab');
  const panels = document.querySelectorAll('#admin-view .tab-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });

  await loadAdminClients();
  loadRecaps();
}

async function loadAdminClients() {
  const { data: clients, error } = await db
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('full_name');

  if (error) { console.error('Erreur chargement clients:', error); return; }

  const { data: allActions } = await db.from('actions').select('client_id, is_completed');
  const { data: allDumps } = await db.from('brain_dumps').select('client_id, is_read');
  const { data: allSessions } = await db.from('sessions').select('client_id, session_number, date, status').order('session_number', { ascending: false });

  renderAdminClients(clients, allActions || [], allDumps || [], allSessions || []);
}

function renderAdminClients(clients, allActions, allDumps, allSessions) {
  const container = document.getElementById('clients-list');

  if (!clients || clients.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">👥</div>
        <div class="empty-state__text">Aucun client pour le moment.</div>
      </div>`;
    return;
  }

  const totalUnread = allDumps.filter(d => !d.is_read).length;
  const brainDumpTab = document.querySelector('#admin-view .tab[data-tab="tab-clients"]');
  if (totalUnread > 0 && brainDumpTab) {
    const existingBadge = brainDumpTab.querySelector('.badge');
    if (!existingBadge) {
      brainDumpTab.insertAdjacentHTML('beforeend', `<span class="badge">${totalUnread}</span>`);
    }
  }

  let html = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--space-md);margin-bottom:var(--space-xl)">
      <div class="card" style="text-align:center">
        <div class="text-secondary" style="font-size:var(--font-size-xs)">Clients actifs</div>
        <div style="font-size:var(--font-size-2xl);font-weight:700;color:var(--terracotta)">${clients.filter(c => c.status === 'active').length}</div>
      </div>
      <div class="card" style="text-align:center">
        <div class="text-secondary" style="font-size:var(--font-size-xs)">Brain dumps non lus</div>
        <div style="font-size:var(--font-size-2xl);font-weight:700;color:${totalUnread > 0 ? 'var(--danger)' : 'var(--success)'}">${totalUnread}</div>
      </div>
      <div class="card" style="text-align:center">
        <div class="text-secondary" style="font-size:var(--font-size-xs)">Objectif 2026</div>
        <div style="font-size:var(--font-size-2xl);font-weight:700">${clients.length}/24</div>
      </div>
    </div>`;

  clients.forEach(client => {
    const clientActions = allActions.filter(a => a.client_id === client.id);
    const completedActions = clientActions.filter(a => a.is_completed).length;
    const totalActions = clientActions.length;
    const pct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    const unreadDumps = allDumps.filter(d => d.client_id === client.id && !d.is_read).length;

    const clientSessions = allSessions.filter(s => s.client_id === client.id);
    const completedSessions = clientSessions.filter(s => s.status === 'completed').length;
    const nextSession = clientSessions.find(s => s.status === 'planned');
    const nextDateStr = nextSession && nextSession.date
      ? new Date(nextSession.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      : '—';

    const statusClass = client.status === 'active' ? 'status-active' : client.status === 'paused' ? 'status-paused' : 'status-completed';
    const statusLabel = client.status === 'active' ? 'Actif' : client.status === 'paused' ? 'Pause' : 'Terminé';

    html += `
      <div class="card" onclick="viewClientDetail('${client.id}')" style="cursor:pointer">
        <div class="card-header">
          <div>
            <h3 class="card-title">${client.full_name}</h3>
            <div class="text-secondary" style="font-size:var(--font-size-xs)">${client.program || '—'}</div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--space-sm)">
            ${unreadDumps > 0 ? `<span class="status status-alert">💭 ${unreadDumps}</span>` : ''}
            <span class="status ${statusClass}">${statusLabel}</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-md);font-size:var(--font-size-xs);margin-top:var(--space-sm)">
          <div>
            <div class="text-muted">Sessions</div>
            <div style="font-weight:600">${completedSessions}/${client.total_sessions || '?'}</div>
          </div>
          <div>
            <div class="text-muted">Actions</div>
            <div style="font-weight:600">${completedActions}/${totalActions} (${pct}%)</div>
          </div>
          <div>
            <div class="text-muted">Prochaine</div>
            <div style="font-weight:600">${nextDateStr}</div>
          </div>
        </div>
        <div class="progress-bar mt-md">
          <div class="progress-bar__fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

async function viewClientDetail(clientId) {
  const { data: dumps } = await db
    .from('brain_dumps')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_read', false);

  if (dumps && dumps.length > 0) {
    await db
      .from('brain_dumps')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .eq('is_read', false);
  }

  const profile = await getProfile(clientId);
  currentProfile = profile;

  // Use the new switchToClientView from client-selector.js
  await switchToClientView(clientId);
}

// initClientPortal is defined in router.js (single source of truth)
