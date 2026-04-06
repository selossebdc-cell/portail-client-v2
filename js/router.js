let currentProfile = null;

async function initApp() {
  const session = await requireAuth();
  if (!session) return;

  const profile = await getProfile(session.user.id);
  currentProfile = profile;

  document.getElementById('loading').classList.add('hidden');

  if (profile.role === 'admin') {
    document.getElementById('admin-view').classList.remove('hidden');
    initAdminDashboard();
    initClientSelector();
  } else if (profile.role === 'assistant') {
    // Assistant sees the associated client's portal with restricted modules
    var associatedId = profile.associated_client_id;
    if (associatedId) {
      var clientProfile = await getProfile(associatedId);
      // Override enabled_modules with assistant's own modules
      clientProfile.enabled_modules = profile.enabled_modules || [];
      document.getElementById('client-view').classList.remove('hidden');
      applyConditionalTabs(clientProfile);
      initClientPortal(clientProfile);
    } else {
      document.getElementById('client-view').classList.remove('hidden');
      initClientPortal(profile);
    }
  } else {
    document.getElementById('client-view').classList.remove('hidden');
    applyConditionalTabs(profile);
    initClientPortal(profile);
  }
}

async function initClientPortal(profile) {
  // Header
  var firstName = (profile.full_name || '').split(' ')[0];
  document.getElementById('client-title').textContent = 'Salut ' + firstName;

  var subtitle = '';
  if (profile.company) subtitle += profile.company;
  if (profile.company && profile.program) subtitle += ' — ';
  if (profile.program) subtitle += profile.program;
  document.getElementById('client-subtitle').textContent = subtitle;

  // Logo
  var logoEl = document.getElementById('client-logo');
  if (profile.logo_url) {
    logoEl.innerHTML = '<img src="' + profile.logo_url + '" alt="" style="max-height:48px;max-width:120px;border-radius:8px">';
  } else {
    var initials = firstName.charAt(0).toUpperCase();
    logoEl.innerHTML = '<div style="width:48px;height:48px;border-radius:12px;background:rgba(194,122,90,0.15);color:#d4956f;display:flex;align-items:center;justify-content:center;font-family:Playfair Display,serif;font-size:1.4rem;font-weight:700">' + initials + '</div>';
  }

  // Stats : Séances + Avancement + A faire
  var statsEl = document.getElementById('client-stats');
  var { data: sessions } = await db
    .from('sessions')
    .select('session_number, status')
    .eq('client_id', profile.id);

  var completedSessions = sessions ? sessions.filter(function(s) { return s.status === 'completed'; }).length : 0;
  var totalSessions = profile.total_sessions || '?';
  var sessionPct = totalSessions !== '?' ? Math.round((completedSessions / totalSessions) * 100) : 0;
  // Stocker pour réutiliser dans le dashboard
  window._sessionPct = sessionPct;

  var { data: actions } = await db
    .from('actions')
    .select('is_completed, status')
    .eq('client_id', profile.id);

  var pendingActions = actions ? actions.filter(function(a) {
    return a.status !== 'done' && a.status !== 'abandoned' && !a.is_completed;
  }).length : 0;

  var doneActions = actions ? actions.filter(function(a) {
    return a.status === 'done' || a.is_completed;
  }).length : 0;

  statsEl.innerHTML =
    '<div class="stat-box"><div class="stat-value">' + completedSessions + '/' + totalSessions + '</div><div class="stat-label">Séances</div></div>' +
    '<div class="stat-box"><div class="stat-value">' + sessionPct + '%</div><div class="stat-label">Avancement</div></div>' +
    '<div class="stat-box"><div class="stat-value">' + pendingActions + '</div><div class="stat-label">A faire</div></div>' +
    '<div class="stat-box"><div class="stat-value">' + doneActions + ' ✓</div><div class="stat-label">Bravo !</div></div>';

  // Tabs
  var tabs = document.querySelectorAll('#client-tabs .tab');
  var panels = document.querySelectorAll('#client-view .tab-panel');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.dataset.tab;
      tabs.forEach(function(t) { t.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById(target).classList.add('active');
      // Mark badge seen
      var tabName = target.replace('tab-', '');
      markTabSeen(tabName);
    });
  });

  // Load all data
  loadClientDashboard(profile);
  loadActions(profile.id);
  loadBrainDumps(profile.id);
  loadTools(profile.id);
  loadTutos(profile.id);
  loadSessions(profile.id);
  loadProject(profile.id);
  loadAutomations(profile.id);
  loadContract(profile.id);
  loadPlaybook(profile.id);

  // Check badges (async, non-blocking)
  checkAllBadges(profile.id);
  updatePlaybookBadge(profile.id);
}

// Password change modal
function requestPasswordChange() {
  var overlay = document.createElement('div');
  overlay.id = 'password-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px';

  overlay.innerHTML = '<div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:24px;max-width:400px;width:100%">'
    + '<h3 style="color:#C27A5A;margin-bottom:16px;font-family:Playfair Display,serif">Changer mon mot de passe</h3>'
    + '<input type="password" id="new-pw" class="input" placeholder="Nouveau mot de passe" style="margin-bottom:8px">'
    + '<input type="password" id="confirm-pw" class="input" placeholder="Confirmer le nouveau" style="margin-bottom:8px">'
    + '<div id="pw-error" style="color:#f87171;font-size:0.8rem;min-height:20px;margin-bottom:8px"></div>'
    + '<div style="display:flex;gap:8px;justify-content:flex-end">'
    + '<button onclick="document.getElementById(\'password-modal-overlay\').remove()" style="background:none;border:1px solid #333;color:#a0a0a0;border-radius:8px;padding:8px 16px;cursor:pointer;font-family:inherit">Annuler</button>'
    + '<button id="pw-submit" style="background:#C27A5A;color:#fff;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-family:inherit">Changer</button>'
    + '</div></div>';

  document.body.appendChild(overlay);

  // Fermer en cliquant sur l'overlay
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById('pw-submit').addEventListener('click', async function() {
    var newPw = document.getElementById('new-pw').value;
    var confirmPw = document.getElementById('confirm-pw').value;
    var errEl = document.getElementById('pw-error');
    errEl.textContent = '';

    if (!newPw || !confirmPw) { errEl.textContent = 'Remplis tous les champs'; return; }
    if (newPw !== confirmPw) { errEl.textContent = 'Les mots de passe ne correspondent pas'; return; }
    if (newPw.length < 6) { errEl.textContent = 'Minimum 6 caractères'; return; }

    this.disabled = true;
    this.textContent = 'Changement...';

    try {
      var { error } = await db.auth.updateUser({ password: newPw });
      if (error) throw error;
      errEl.style.color = '#4ade80';
      errEl.textContent = 'Mot de passe changé avec succès !';
      setTimeout(function() { overlay.remove(); }, 2000);
    } catch (err) {
      errEl.style.color = '#f87171';
      errEl.textContent = 'Erreur : ' + (err.message || 'impossible de changer le mot de passe');
      this.disabled = false;
      this.textContent = 'Changer';
    }
  });
}

// Done actions toggle
function toggleDoneActions() {
  var list = document.getElementById('actions-done-list');
  var chev = document.getElementById('done-chevron');
  if (list.style.display === 'none') {
    list.style.display = 'block'; chev.textContent = '▼';
  } else {
    list.style.display = 'none'; chev.textContent = '▶';
  }
}

// Helper
function formatDate(dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', initApp);
