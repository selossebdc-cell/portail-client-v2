// TASK-0015: Selecteur multi-clients admin + modules actives
// Couche: Application + UI

let allClients = [];
let viewingAsClientId = null;

async function initClientSelector() {
  if (currentProfile.role !== 'admin') return;

  const { data: clients } = await db
    .from('profiles')
    .select('id, full_name, role, enabled_modules, company')
    .in('role', ['client', 'assistant'])
    .order('full_name');

  allClients = clients || [];
  renderClientSelector();
}

function renderClientSelector() {
  const header = document.querySelector('#admin-view .app-header');
  if (header.querySelector('.client-selector')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'client-selector';
  wrapper.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:16px;';

  const select = document.createElement('select');
  select.id = 'admin-client-select';
  select.style.cssText = 'background:#1a1a1a;color:#e8e0d8;border:1px solid #333;border-radius:8px;padding:6px 12px;font-size:0.85rem;font-family:inherit;cursor:pointer;min-width:180px;';

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Voir un client...';
  select.appendChild(defaultOpt);

  allClients.filter(c => c.role === 'client').forEach(client => {
    const opt = document.createElement('option');
    opt.value = client.id;
    opt.textContent = client.full_name + (client.company ? ' — ' + client.company : '');
    select.appendChild(opt);
  });

  select.addEventListener('change', async function() {
    if (this.value) {
      await switchToClientView(this.value);
    }
  });

  const configBtn = document.createElement('button');
  configBtn.textContent = '⚙';
  configBtn.title = 'Configurer les modules';
  configBtn.style.cssText = 'background:none;border:1px solid #333;border-radius:8px;padding:6px 10px;cursor:pointer;color:#C27A5A;font-size:1rem;';
  configBtn.addEventListener('click', () => toggleModulesPanel());

  wrapper.appendChild(select);
  wrapper.appendChild(configBtn);

  const userDiv = header.querySelector('.app-header__user');
  header.insertBefore(wrapper, userDiv);
}

async function switchToClientView(clientId) {
  viewingAsClientId = clientId;

  const profile = await getProfile(clientId);
  currentProfile = profile;

  document.getElementById('admin-view').classList.add('hidden');
  document.getElementById('client-view').classList.remove('hidden');

  // Update header
  var firstName = (profile.full_name || '').split(' ')[0];
  document.getElementById('client-title').textContent = 'Salut ' + firstName;
  var subtitle = '';
  if (profile.company) subtitle += profile.company;
  if (profile.company && profile.program) subtitle += ' — ';
  if (profile.program) subtitle += profile.program;
  document.getElementById('client-subtitle').textContent = subtitle;

  // Apply conditional tabs
  applyConditionalTabs(profile);

  // Add back button + selector in client view
  addClientViewControls(profile);

  // Load client data
  initClientPortal(profile);
  loadClientDashboard(profile);
  loadTools(profile.id);
  loadProject(profile.id);
  loadAutomations(profile.id);
  checkAllBadges(profile.id);
}

function addClientViewControls(profile) {
  // Supprimer l'ancien bandeau s'il existe
  var existing = document.getElementById('admin-topbar');
  if (existing) existing.remove();

  // Barre admin sticky en haut de la page
  var topbar = document.createElement('div');
  topbar.id = 'admin-topbar';
  topbar.style.cssText = 'position:sticky;top:0;z-index:100;background:#111;border-bottom:2px solid #C27A5A;padding:8px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;';

  // Back button
  var backBtn = document.createElement('button');
  backBtn.textContent = '← Dashboard';
  backBtn.style.cssText = 'background:rgba(194,122,90,0.15);color:#C27A5A;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.8rem;font-family:inherit;font-weight:500;';
  backBtn.onclick = backToAdmin;

  // Nom du client affiché
  var clientLabel = document.createElement('span');
  clientLabel.style.cssText = 'color:#e8e0d8;font-size:0.85rem;font-weight:600;';
  clientLabel.textContent = profile.full_name + (profile.company ? ' — ' + profile.company : '');

  // Quick switch
  var quickSelect = document.createElement('select');
  quickSelect.style.cssText = 'background:#1a1a1a;color:#e8e0d8;border:1px solid #333;border-radius:8px;padding:6px 10px;font-size:0.8rem;font-family:inherit;cursor:pointer;margin-left:auto;';

  allClients.filter(c => c.role === 'client').forEach(client => {
    var opt = document.createElement('option');
    opt.value = client.id;
    opt.textContent = client.full_name;
    if (client.id === profile.id) opt.selected = true;
    quickSelect.appendChild(opt);
  });

  quickSelect.addEventListener('change', function() {
    if (this.value && this.value !== profile.id) {
      switchToClientView(this.value);
    }
  });

  topbar.appendChild(backBtn);
  topbar.appendChild(clientLabel);
  topbar.appendChild(quickSelect);

  // Insérer tout en haut de la vue client
  var clientView = document.getElementById('client-view');
  clientView.insertBefore(topbar, clientView.firstChild);
}

async function backToAdmin() {
  viewingAsClientId = null;
  const session = await getSession();
  const adminProfile = await getProfile(session.user.id);
  currentProfile = adminProfile;

  document.getElementById('client-view').classList.add('hidden');
  document.getElementById('admin-view').classList.remove('hidden');

  // Reset selector
  const select = document.getElementById('admin-client-select');
  if (select) select.value = '';

  // Remove admin topbar from client view
  var topbar = document.getElementById('admin-topbar');
  if (topbar) topbar.remove();

  // Reset conditional tabs
  resetConditionalTabs();

  await loadAdminClients();
}

// --- Conditional tabs (V2 modules) ---

const V2_MODULES = {
  parcours: { tab: 'tab-parcours', label: '📍 Parcours', icon: '' },
  kpis: { tab: 'tab-kpis', label: '📊 KPIs', icon: '' },
  chatbots: { tab: 'tab-chatbots', label: '💬 Chatbots', icon: '' }
};

function applyConditionalTabs(profile) {
  const nav = document.getElementById('client-tabs');
  const modules = profile.enabled_modules || [];

  // Remove existing V2 tabs
  nav.querySelectorAll('.v2-tab').forEach(t => t.remove());

  // Remove existing V2 panels
  document.querySelectorAll('.v2-panel').forEach(p => p.remove());

  // Add enabled V2 tabs
  Object.entries(V2_MODULES).forEach(([key, config]) => {
    if (modules.includes(key)) {
      // Tab button
      const btn = document.createElement('button');
      btn.className = 'tab v2-tab';
      btn.dataset.tab = config.tab;
      btn.textContent = config.label;
      btn.addEventListener('click', function() {
        const tabs = nav.querySelectorAll('.tab');
        const panels = document.querySelectorAll('#client-view .tab-panel');
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(config.tab).classList.add('active');
      });

      // Insert before KPI/Playbook external links
      const externalLinks = nav.querySelectorAll('a.tab');
      if (externalLinks.length > 0) {
        nav.insertBefore(btn, externalLinks[0]);
      } else {
        nav.appendChild(btn);
      }

      // Panel (placeholder for now — content loaded in Sprint 2/3/4)
      if (!document.getElementById(config.tab)) {
        const panel = document.createElement('div');
        panel.id = config.tab;
        panel.className = 'tab-panel v2-panel';
        panel.innerHTML = '<div style="text-align:center;padding:40px 0;color:#666"><p style="font-size:1.2rem;margin-bottom:8px">' + config.label + '</p><p style="font-size:0.85rem">Module en cours de construction</p></div>';
        document.querySelector('.client-main').insertBefore(panel, document.querySelector('.help-footer'));
      }
    }
  });
}

function resetConditionalTabs() {
  document.querySelectorAll('.v2-tab').forEach(t => t.remove());
  document.querySelectorAll('.v2-panel').forEach(p => p.remove());
}

// --- Modules configuration panel ---

function toggleModulesPanel() {
  let panel = document.getElementById('modules-config-panel');
  if (panel) {
    panel.remove();
    return;
  }

  panel = document.createElement('div');
  panel.id = 'modules-config-panel';
  panel.style.cssText = 'position:fixed;top:0;right:0;width:360px;height:100vh;background:#1a1a1a;border-left:2px solid #C27A5A;z-index:1000;padding:24px;overflow-y:auto;box-shadow:-4px 0 20px rgba(0,0,0,0.5);';

  let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">';
  html += '<h3 style="color:#C27A5A;font-size:1rem;margin:0">Modules par client</h3>';
  html += '<button onclick="document.getElementById(\'modules-config-panel\').remove()" style="background:none;border:none;color:#666;font-size:1.2rem;cursor:pointer">✕</button>';
  html += '</div>';

  allClients.filter(c => c.role === 'client').forEach(client => {
    const modules = client.enabled_modules || [];
    html += '<div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #333">';
    html += '<div style="font-weight:600;margin-bottom:8px;color:#e8e0d8">' + client.full_name + '</div>';

    Object.entries(V2_MODULES).forEach(([key, config]) => {
      const checked = modules.includes(key) ? 'checked' : '';
      html += '<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;cursor:pointer;font-size:0.85rem;color:#aaa">';
      html += '<input type="checkbox" ' + checked + ' onchange="updateClientModule(\'' + client.id + '\', \'' + key + '\', this.checked)" style="accent-color:#C27A5A">';
      html += config.label;
      html += '</label>';
    });
    html += '</div>';
  });

  panel.innerHTML = html;
  document.body.appendChild(panel);
}

async function updateClientModule(clientId, moduleName, enabled) {
  const client = allClients.find(c => c.id === clientId);
  if (!client) return;

  let modules = [...(client.enabled_modules || [])];
  if (enabled && !modules.includes(moduleName)) {
    modules.push(moduleName);
  } else if (!enabled) {
    modules = modules.filter(m => m !== moduleName);
  }

  const { error } = await db
    .from('profiles')
    .update({ enabled_modules: modules })
    .eq('id', clientId);

  if (error) {
    console.error('Erreur MAJ modules:', error);
    return;
  }

  // Update local cache
  client.enabled_modules = modules;

  // If currently viewing this client, refresh tabs
  if (viewingAsClientId === clientId) {
    const profile = await getProfile(clientId);
    applyConditionalTabs(profile);
  }
}
