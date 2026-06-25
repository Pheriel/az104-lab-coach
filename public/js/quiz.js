layout('Quiz par module', 'quiz');

let quizState = { modules: [], questions: [] };

async function initQuiz() {
  $('#app').innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <select id="moduleSelect"><option value="">Tous les modules</option></select>
        <button class="button secondary" id="loadQuiz">Charger</button>
      </div>
      <form id="quizForm" class="list"></form>
      <div class="toolbar" style="margin-top:16px">
        <button class="button" id="submitQuiz" type="button">Corriger</button>
      </div>
      <div id="quizResult"></div>
    </section>
  `;
  quizState.modules = await api.get('/api/modules');
  $('#moduleSelect').insertAdjacentHTML('beforeend', quizState.modules.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join(''));
  $('#loadQuiz').addEventListener('click', loadQuiz);
  $('#submitQuiz').addEventListener('click', submitQuiz);
  await loadQuiz();
}

async function loadQuiz() {
  const moduleId = $('#moduleSelect').value;
  quizState.questions = await api.get(`/api/quiz/questions${moduleId ? `?module_id=${moduleId}` : ''}`);
  $('#quizResult').innerHTML = '';
  $('#quizForm').innerHTML = quizState.questions.map((question) => `
    <div class="card">
      <h3>${escapeHtml(question.question)}</h3>
      <p>${escapeHtml(question.module_name)} · ${escapeHtml(question.difficulty)}</p>
      ${question.choices.map((choice, index) => `
        <label class="item" style="justify-content:flex-start">
          <input type="radio" name="q_${question.id}" value="${index}">
          <span>${escapeHtml(choice)}</span>
        </label>
      `).join('')}
    </div>
  `).join('') || '<div class="empty">Aucune question disponible.</div>';
}

async function submitQuiz() {
  const answers = quizState.questions.map((question) => {
    const selected = $(`input[name="q_${question.id}"]:checked`);
    return selected ? { question_id: question.id, selected_answer: Number(selected.value) } : null;
  }).filter(Boolean);

  if (answers.length !== quizState.questions.length) {
    $('#quizResult').innerHTML = '<div class="empty">Reponds a toutes les questions avant correction.</div>';
    return;
  }

  const result = await api.post('/api/quiz/attempts', {
    module_id: $('#moduleSelect').value || undefined,
    answers,
  });

  $('#quizResult').innerHTML = `
    <div class="panel" style="margin-top:16px">
      <h2>Score ${result.score}/${result.total}</h2>
      <div class="list">
        ${result.answers.map((answer) => `
          <div class="item">
            <div>
              <h3>Question ${answer.question_id}</h3>
              <p>${escapeHtml(answer.explanation)}</p>
            </div>
            <span class="badge ${answer.correct ? 'ok' : 'warn'}">${answer.correct ? 'Correct' : 'A revoir'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

initQuiz().catch((error) => {
  $('#app').innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
});
