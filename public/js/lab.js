layout('Detail du lab', 'labs');

let currentLab = null;

async function initLab() {
  const id = new URLSearchParams(location.search).get('id');
  const app = $('#app');
  if (!id) {
    app.innerHTML = '<div class="empty">Aucun lab selectionne.</div>';
    return;
  }
  currentLab = await api.get(`/api/labs/${id}`);
  document.querySelector('h1').textContent = currentLab.title;
  renderLab();
}

function renderLab() {
  const completed = new Set(currentLab.completed_step_ids || []);
  const percent = currentLab.steps.length ? Math.round((completed.size / currentLab.steps.length) * 100) : 0;
  $('#app').innerHTML = `
    <section class="grid cols-2">
      <div class="panel">
        <h2>${escapeHtml(currentLab.module_name)}</h2>
        <p>${escapeHtml(currentLab.objective)}</p>
        <div class="toolbar">
          <span class="badge ${statusClass(currentLab.status)}">${formatStatus(currentLab.status)}</span>
          <span class="badge">${currentLab.estimated_minutes} min</span>
          <span class="badge">${escapeHtml(currentLab.difficulty)}</span>
        </div>
        <div class="progress" style="--value:${percent}%"><span></span></div>
        <div class="toolbar" style="margin-top:14px">
          <button class="button" id="completeLab">Lab termine</button>
        </div>
      </div>
      <div class="panel">
        <h2>Notes personnelles</h2>
        <textarea id="personalNotes">${escapeHtml(currentLab.personal_notes)}</textarea>
        <div class="toolbar" style="margin-top:12px">
          <select id="labStatus">
            ${['not_started', 'in_progress', 'completed'].map((status) => `<option value="${status}" ${status === currentLab.status ? 'selected' : ''}>${formatStatus(status)}</option>`).join('')}
          </select>
          <button class="button" id="saveProgress">Sauvegarder</button>
        </div>
        <div class="toast" id="toast"></div>
      </div>
    </section>
    <section class="panel" style="margin-top:18px">
      <h2>Avant de commencer</h2>
      <p>${escapeHtml(currentLab.prerequisites || 'Aucun prerequis specifique.')}</p>
    </section>
    <section class="grid cols-2" style="margin-top:18px">
      ${renderInfoPanel('Ce que je dois comprendre', currentLab.understanding_goals)}
      ${renderInfoPanel('Comment verifier que ca fonctionne', currentLab.verification_steps)}
    </section>
    <section class="grid cols-2" style="margin-top:18px">
      ${renderCommands(currentLab.useful_commands)}
      ${renderInfoPanel('Pieges frequents', currentLab.common_pitfalls)}
    </section>
    <section class="panel" style="margin-top:18px">
      <h2>Checklist</h2>
      <div class="list">
        ${currentLab.steps.map((step) => renderStep(step, completed.has(step.id))).join('')}
      </div>
    </section>
  `;

  $all('[data-step]').forEach((checkbox) => {
    checkbox.addEventListener('click', async () => {
      await api.post(`/api/labs/${currentLab.id}/steps/${checkbox.dataset.step}/toggle`);
      currentLab = await api.get(`/api/labs/${currentLab.id}`);
      renderLab();
    });
  });

  $('#saveProgress').addEventListener('click', saveProgress);
  $('#completeLab').addEventListener('click', completeLab);
}

function renderStep(step, checked) {
  return `
    <div class="step">
      <input type="checkbox" aria-label="Etape completee" ${checked ? 'checked' : ''} disabled>
      <span>
        <strong>${step.step_order}. ${escapeHtml(step.title)}</strong>
        <p>${escapeHtml(step.instruction)}</p>
        ${step.command_hint ? `<code class="code">${escapeHtml(step.command_hint)}</code>` : ''}
        <button class="button secondary" data-step="${step.id}" style="margin-top:10px">${checked ? 'Reouvrir etape' : 'Marquer etape completee'}</button>
      </span>
    </div>
  `;
}

function renderInfoPanel(title, items) {
  const list = Array.isArray(items) && items.length
    ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>A completer pendant le lab.</li>';
  return `<div class="panel"><h2>${escapeHtml(title)}</h2><ul>${list}</ul></div>`;
}

function renderCommands(commands) {
  const list = Array.isArray(commands) && commands.length
    ? commands.map((command) => `
      <div class="card">
        <h3>${escapeHtml(command.label || 'Commande')}</h3>
        <code class="code">${escapeHtml(command.command || '')}</code>
      </div>
    `).join('')
    : '<div class="empty">Aucune commande referencee.</div>';
  return `<div class="panel"><h2>Commandes utiles Azure CLI / PowerShell</h2><div class="list">${list}</div></div>`;
}

async function saveProgress() {
  await api.patch(`/api/labs/${currentLab.id}/progress`, {
    status: $('#labStatus').value,
    personal_notes: $('#personalNotes').value,
  });
  $('#toast').textContent = 'Progression sauvegardee.';
  currentLab = await api.get(`/api/labs/${currentLab.id}`);
}

async function completeLab() {
  const allStepIds = currentLab.steps.map((step) => step.id);
  const completed = new Set(currentLab.completed_step_ids || []);
  for (const stepId of allStepIds) {
    if (!completed.has(stepId)) {
      await api.post(`/api/labs/${currentLab.id}/steps/${stepId}/toggle`);
    }
  }
  await api.patch(`/api/labs/${currentLab.id}/progress`, {
    status: 'completed',
    personal_notes: $('#personalNotes').value,
  });
  currentLab = await api.get(`/api/labs/${currentLab.id}`);
  renderLab();
}

initLab().catch((error) => {
  $('#app').innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
});
