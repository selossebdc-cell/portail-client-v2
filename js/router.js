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
  } else {
    document.getElementById('client-view').classList.remove('hidden');
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

  // Stats : Seances + Avancement + A faire
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
    '<div class="stat-box"><div class="stat-value">' + completedSessions + '/' + totalSessions + '</div><div class="stat-label">Seances</div></div>' +
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

  // Check badges (async, non-blocking)
  checkAllBadges(profile.id);
}

// Password change
function requestPasswordChange() {
  var subject = encodeURIComponent('Changement de mot de passe — Espace Client');
  var body = encodeURIComponent('Bonjour Catherine,\n\nJe souhaite changer le mot de passe de mon espace client.\n\nMon nouveau mot de passe souhaite : [A COMPLETER]\n\nMerci !');
  window.location.href = 'mailto:catherine@csbusiness.fr?subject=' + subject + '&body=' + body;
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
