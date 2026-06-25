layout('Administration', 'admin');

async function initAdmin() {
  $('#app').innerHTML = `
    <section class="grid cols-2">
      <div class="panel">
        <h2>Etat des donnees</h2>
        <div id="stats" class="grid cols-3"></div>
        <div class="toolbar" style="margin-top:16px">
          <button class="button danger" id="resetDemo">Reset demo data</button>
        </div>
        <div class="toast" id="toast"></div>
      </div>
      <div class="panel">
        <h2>Ajouter un module</h2>
        <form id="moduleForm" class="form-grid">
          <input class="input" name="name" placeholder="Nom" required>
          <input class="input" name="exam_weight" placeholder="Poids examen">
          <textarea class="full" name="description" placeholder="Description"></textarea>
          <button class="button" type="submit">Creer</button>
        </form>
      </div>
    </section>
    <section class="grid cols-2" style="margin-top:18px">
      <div class="panel">
        <h2>Ajouter un lab</h2>
        <form id="labForm" class="form-grid">
          <select name="module_id" required><option value="">Module</option></select>
          <input class="input" name="title" placeholder="Titre" required>
          <input class="input" name="slug" placeholder="slug-unique" required>
          <select name="difficulty"><option value="debutant">Debutant</option><option value="intermediaire">Intermediaire</option><option value="avance">Avance</option></select>
          <input class="input" name="estimated_minutes" type="number" min="1" value="45">
          <input class="input" name="azure_services" placeholder="Services Azure, separes par virgules">
          <textarea class="full" name="objective" placeholder="Objectif du lab" required></textarea>
          <textarea class="full" name="prerequisites" placeholder="Prerequis"></textarea>
          <input class="input full" name="common_pitfalls" placeholder="Pieges frequents, separes par virgules">
          <input class="input full" name="understanding_goals" placeholder="Ce que je dois comprendre, separe par virgules">
          <input class="input full" name="verification_steps" placeholder="Verifications, separees par virgules">
          <button class="button" type="submit">Creer le lab</button>
        </form>
      </div>
      <div class="panel">
        <h2>Ajouter une ressource</h2>
        <form id="resourceForm" class="form-grid">
          <select name="module_id"><option value="">Module</option></select>
          <input class="input" name="title" placeholder="Titre" required>
          <select name="resource_type"><option value="doc">Doc</option><option value="commande">Commande</option><option value="video">Video</option><option value="reference">Reference</option><option value="outil">Outil</option></select>
          <input class="input" name="url" placeholder="URL">
          <textarea class="full" name="content" placeholder="Description ou commande"></textarea>
          <button class="button" type="submit">Ajouter</button>
        </form>
      </div>
    </section>
  `;

  await populateModules();
  await loadStats();
  $('#resetDemo').addEventListener('click', resetDemo);
  $('#moduleForm').addEventListener('submit', createModule);
  $('#labForm').addEventListener('submit', createLab);
  $('#resourceForm').addEventListener('submit', createResource);
}

async function populateModules() {
  const modules = await api.get('/api/modules');
  const options = modules.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
  $all('select[name="module_id"]').forEach((select) => {
    const first = select.querySelector('option')?.outerHTML || '';
    select.innerHTML = first + options;
  });
}

async function loadStats() {
  const stats = await api.get('/api/admin/stats');
  $('#stats').innerHTML = Object.entries(stats).map(([key, value]) => `
    <div class="card metric"><span>${escapeHtml(key)}</span><strong>${value}</strong></div>
  `).join('');
}

async function resetDemo() {
  if (!confirm('Recharger les donnees de demo ?')) return;
  $('#toast').textContent = 'Reset en cours...';
  await api.post('/api/admin/reset-demo-data');
  await populateModules();
  await loadStats();
  $('#toast').textContent = 'Donnees de demo rechargees.';
}

async function createModule(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  await api.post('/api/modules', Object.fromEntries(form.entries()));
  event.target.reset();
  await populateModules();
  await loadStats();
}

async function createLab(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  await api.post('/api/labs', Object.fromEntries(form.entries()));
  event.target.reset();
  await loadStats();
}

async function createResource(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  await api.post('/api/resources', Object.fromEntries(form.entries()));
  event.target.reset();
  await loadStats();
}

initAdmin().catch((error) => {
  $('#app').innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
});
