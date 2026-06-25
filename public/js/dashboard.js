layout('Dashboard', 'dashboard');

async function initDashboard() {
  const app = $('#app');
  try {
    const data = await api.get('/api/dashboard');
    const progress = data.progress;
    app.innerHTML = `
      <section class="grid cols-3">
        <div class="panel metric"><span>Progression globale</span><strong>${progress.completion_percent}%</strong><div class="progress" style="--value:${progress.completion_percent}%"><span></span></div></div>
        <div class="panel metric"><span>Labs termines</span><strong>${progress.completed_labs}/${progress.total_labs}</strong></div>
        <div class="panel metric"><span>Labs en cours</span><strong>${progress.in_progress_labs}</strong></div>
      </section>
      <section class="grid cols-2" style="margin-top:18px">
        <div class="panel">
          <h2>Labs en cours</h2>
          <div class="list">${renderActiveLabs(data.activeLabs)}</div>
        </div>
        <div class="panel">
          <h2>Quiz recents</h2>
          <div class="list">${renderAttempts(data.recentAttempts)}</div>
        </div>
      </section>
      <section class="panel" style="margin-top:18px">
        <h2>Objectifs par module</h2>
        <div class="grid cols-3">${data.objectives.map(renderObjective).join('')}</div>
      </section>
    `;
  } catch (error) {
    app.innerHTML = `<div class="empty">Impossible de charger le dashboard: ${escapeHtml(error.message)}</div>`;
  }
}

function renderActiveLabs(labs) {
  if (!labs.length) return '<div class="empty">Aucun lab en cours.</div>';
  return labs.map((lab) => {
    const percent = lab.total_steps ? Math.round((lab.completed_steps / lab.total_steps) * 100) : 0;
    return `
      <a class="item" href="/lab.html?id=${lab.id}">
        <div>
          <h3>${escapeHtml(lab.title)}</h3>
          <p>${escapeHtml(lab.module_name)} · ${lab.completed_steps}/${lab.total_steps} etapes</p>
          <div class="progress" style="--value:${percent}%"><span></span></div>
        </div>
        <span class="badge warn">En cours</span>
      </a>
    `;
  }).join('');
}

function renderAttempts(attempts) {
  if (!attempts.length) return '<div class="empty">Aucun quiz tente pour le moment.</div>';
  return attempts.map((attempt) => `
    <div class="item">
      <div>
        <h3>${escapeHtml(attempt.module_name || 'Quiz general')}</h3>
        <p>Score ${attempt.score}/${attempt.total}</p>
      </div>
      <span class="badge ${attempt.score / attempt.total >= 0.7 ? 'ok' : 'warn'}">${Math.round((attempt.score / attempt.total) * 100)}%</span>
    </div>
  `).join('');
}

function renderObjective(module) {
  return `
    <div class="card">
      <h3>${escapeHtml(module.name)}</h3>
      <p>${escapeHtml(module.exam_weight)} · ${module.labs} labs · ${module.questions} questions</p>
    </div>
  `;
}

initDashboard();
