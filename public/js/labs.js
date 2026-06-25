layout('Labs pratiques', 'labs');

let labsState = { modules: [], labs: [] };

async function initLabs() {
  const app = $('#app');
  app.innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <select id="moduleFilter"><option value="">Tous les modules</option></select>
        <select id="statusFilter">
          <option value="">Tous les statuts</option>
          <option value="not_started">A demarrer</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Termine</option>
        </select>
        <select id="difficultyFilter">
          <option value="">Toutes les difficultes</option>
          <option value="debutant">Debutant</option>
          <option value="intermediaire">Intermediaire</option>
          <option value="avance">Avance</option>
        </select>
      </div>
      <div id="labsList" class="list"></div>
    </section>
  `;

  labsState.modules = await api.get('/api/modules');
  $('#moduleFilter').insertAdjacentHTML('beforeend', labsState.modules.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join(''));
  $('#moduleFilter').addEventListener('change', loadLabs);
  $('#statusFilter').addEventListener('change', loadLabs);
  $('#difficultyFilter').addEventListener('change', loadLabs);
  await loadLabs();
}

async function loadLabs() {
  const moduleId = $('#moduleFilter').value;
  const status = $('#statusFilter').value;
  const difficulty = $('#difficultyFilter').value;
  const params = new URLSearchParams();
  if (moduleId) params.set('module_id', moduleId);
  if (status) params.set('status', status);
  if (difficulty) params.set('difficulty', difficulty);
  labsState.labs = await api.get(`/api/labs?${params}`);
  renderLabs();
}

function renderLabs() {
  const list = $('#labsList');
  if (!labsState.labs.length) {
    list.innerHTML = '<div class="empty">Aucun lab pour ces filtres.</div>';
    return;
  }
  list.innerHTML = labsState.labs.map((lab) => {
    const percent = lab.total_steps ? Math.round((lab.completed_steps / lab.total_steps) * 100) : 0;
    return `
      <a class="item" href="/lab.html?id=${lab.id}">
        <div>
          <h3>${escapeHtml(lab.title)}</h3>
          <p>${escapeHtml(lab.module_name)} · ${escapeHtml(lab.difficulty)} · ${lab.estimated_minutes} min</p>
          <p>${escapeHtml(lab.objective)}</p>
          <div class="progress" style="--value:${percent}%"><span></span></div>
        </div>
        <span class="badge ${statusClass(lab.status)}">${formatStatus(lab.status)}</span>
      </a>
    `;
  }).join('');
}

initLabs().catch((error) => {
  $('#app').innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
});
