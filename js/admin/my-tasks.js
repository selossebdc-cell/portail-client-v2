let allTasks = [];
let currentTaskFilter = 'all';

const PERSO_CATEGORIES = ['filles', 'voyages', 'finances', 'perso', 'sante'];
const CATEGORY_LABELS = {
  filles: 'Filles', voyages: 'Voyages', finances: 'Finances',
  administratif: 'Administratif', clients: 'Clients', contenu: 'Contenu',
  dev: 'Développement', perso: 'Perso', sante: 'Santé'
};

async function loadMyTasks() {
  try {
    const { data, error } = await db
      .from('tasks')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    allTasks = data || [];
    renderMyTasks();
  } catch (e) {
    console.error('Erreur chargement tâches:', e);
    document.getElementById('mytasks-list').innerHTML = '<p style="color:#666;text-align:center;padding:40px 0">Erreur de chargement</p>';
  }
}

function renderMyTasks() {
  const container = document.getElementById('mytasks-list');
  let filtered = [...allTasks];

  // Appliquer le filtre
  if (currentTaskFilter === 'todo') {
    filtered = filtered.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  } else if (currentTaskFilter === 'done') {
    filtered = filtered.filter(t => t.status === 'done');
  } else if (currentTaskFilter === 'pro') {
    filtered = filtered.filter(t => !PERSO_CATEGORIES.includes(t.category));
  } else if (currentTaskFilter === 'perso') {
    filtered = filtered.filter(t => PERSO_CATEGORIES.includes(t.category));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:#666;text-align:center;padding:40px 0">Aucune tâche</p>';
    updateTaskProgress();
    return;
  }

  // Grouper par catégorie
  const groups = {};
  filtered.forEach(t => {
    if (!groups[t.category]) groups[t.category] = [];
    groups[t.category].push(t);
  });

  let html = '';
  for (const [cat, tasks] of Object.entries(groups)) {
    html += `<div style="color:#C27A5A;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin:20px 0 10px">${CATEGORY_LABELS[cat] || cat}</div>`;
    tasks.forEach(t => {
      const done = t.status === 'done';
      const priorityTag = t.priority === 2 ? '<span style="font-size:0.65rem;padding:2px 8px;border-radius:10px;background:#4a1a1a;color:#ff6b6b">Urgent</span>' :
                          t.priority === 1 ? '<span style="font-size:0.65rem;padding:2px 8px;border-radius:10px;background:#4a3a1a;color:#ffa94d">Important</span>' : '';
      const agentTag = t.created_by !== 'catherine' ? `<span style="font-size:0.65rem;padding:2px 8px;border-radius:10px;background:#1a2a3a;color:#74b9ff">${t.created_by}</span>` : '';
      const notesHtml = t.notes ? `<div style="color:#C27A5A;font-size:0.75rem;margin-top:4px;font-style:italic">${t.notes}</div>` : '';

      html += `
        <label style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #2a2a2a;cursor:pointer;transition:opacity 0.3s${done ? ';opacity:0.4' : ''}">
          <input type="checkbox" ${done ? 'checked' : ''} readonly style="appearance:none;-webkit-appearance:none;width:22px;height:22px;min-width:22px;border:2px solid #C27A5A;border-radius:6px;background:${done ? '#C27A5A' : 'transparent'};margin-top:1px;cursor:pointer" onclick="toggleMyTask('${t.id}', '${t.status}')">
          <div style="flex:1">
            <div style="font-size:0.95rem;line-height:1.4${done ? ';text-decoration:line-through;color:#555' : ''}">${t.title}</div>
            ${t.detail ? `<div style="color:#777;font-size:0.8rem;margin-top:2px">${t.detail}</div>` : ''}
            ${(priorityTag || agentTag) ? `<div style="display:flex;gap:8px;margin-top:4px">${priorityTag}${agentTag}</div>` : ''}
            ${notesHtml}
          </div>
        </label>`;
    });
  }
  container.innerHTML = html;
  updateTaskProgress();
}

async function toggleMyTask(id, currentStatus) {
  const newStatus = currentStatus === 'done' ? 'todo' : 'done';
  const completedAt = newStatus === 'done' ? new Date().toISOString() : null;
  try {
    const { error } = await db
      .from('tasks')
      .update({ status: newStatus, completed_at: completedAt, updated_by: 'catherine' })
      .eq('id', id);
    if (error) throw error;
    const task = allTasks.find(t => t.id === id);
    if (task) { task.status = newStatus; task.completed_at = completedAt; }
    renderMyTasks();
  } catch (e) {
    console.error('Erreur update tâche:', e);
  }
}

async function addMyTask() {
  const input = document.getElementById('newTask');
  const cat = document.getElementById('newCategory');
  const title = input.value.trim();
  if (!title) return;

  try {
    const { data, error } = await db
      .from('tasks')
      .insert([{ title, category: cat.value, status: 'todo', created_by: 'catherine' }])
      .select();
    if (error) throw error;
    if (data && data.length > 0) {
      allTasks.unshift(data[0]);
      input.value = '';
      renderMyTasks();
    }
  } catch (e) {
    console.error('Erreur ajout tâche:', e);
  }
}

function updateTaskProgress() {
  const active = allTasks.filter(t => t.status !== 'cancelled');
  const done = active.filter(t => t.status === 'done').length;
  const total = active.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const bar = document.getElementById('mytasks-progress-bar');
  if (bar) bar.style.width = pct + '%';
  const counter = document.getElementById('mytasks-counter');
  if (counter) counter.textContent = `${done} / ${total} — ${pct}%`;
}

// Filtres
function initMyTaskFilters() {
  const filterBtns = document.querySelectorAll('#mytasks-filters .filter-btn');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#mytasks-filters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTaskFilter = btn.dataset.filter;
        renderMyTasks();
      });
    });
  }

  // Add task
  const addBtn = document.getElementById('addMyTaskBtn');
  const newTaskInput = document.getElementById('newTask');

  if (addBtn) {
    addBtn.addEventListener('click', addMyTask);
  }
  if (newTaskInput) {
    newTaskInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addMyTask();
    });
  }
}

// Auto-refresh
setInterval(loadMyTasks, 60000);
