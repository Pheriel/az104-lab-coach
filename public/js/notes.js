layout('Notes et ressources', 'notes');

let notesState = { modules: [], notes: [], resources: [] };

async function initNotes() {
  $('#app').innerHTML = `
    <section class="grid cols-2">
      <div class="panel">
        <h2>Nouvelle note</h2>
        <form id="noteForm" class="form-grid">
          <input class="input" name="title" placeholder="Titre" required>
          <select name="module_id"><option value="">Module libre</option></select>
          <textarea class="full" name="content" placeholder="Commandes, observations, pieges a retenir" required></textarea>
          <input class="input full" name="tags" placeholder="Tags separes par des virgules">
          <button class="button" type="submit">Ajouter</button>
        </form>
      </div>
      <div class="panel">
        <h2>Ressources</h2>
        <div id="resourcesList" class="list"></div>
      </div>
    </section>
    <section class="panel" style="margin-top:18px">
      <h2>Mes notes</h2>
      <div id="notesList" class="list"></div>
    </section>
  `;
  notesState.modules = await api.get('/api/modules');
  $('[name="module_id"]').insertAdjacentHTML('beforeend', notesState.modules.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join(''));
  $('#noteForm').addEventListener('submit', createNote);
  await refreshNotes();
}

async function refreshNotes() {
  const [notes, resources] = await Promise.all([api.get('/api/notes'), api.get('/api/resources')]);
  notesState.notes = notes;
  notesState.resources = resources;
  $('#notesList').innerHTML = notes.map((note) => `
    <div class="item">
      <div>
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.module_name || 'General')} · ${(note.tags || []).map(escapeHtml).join(', ')}</p>
        <code class="code">${escapeHtml(note.content)}</code>
      </div>
      <button class="button secondary" data-delete="${note.id}">Supprimer</button>
    </div>
  `).join('') || '<div class="empty">Aucune note.</div>';
  $('#resourcesList').innerHTML = resources.map((resource) => `
    <a class="item" href="${escapeHtml(resource.url || '#')}" target="_blank" rel="noreferrer">
      <div>
        <h3>${escapeHtml(resource.title)}</h3>
        <p>${escapeHtml(resource.module_name || 'General')} · ${escapeHtml(resource.resource_type)}</p>
      </div>
    </a>
  `).join('') || '<div class="empty">Aucune ressource.</div>';

  $all('[data-delete]').forEach((button) => button.addEventListener('click', async () => {
    await api.delete(`/api/notes/${button.dataset.delete}`);
    await refreshNotes();
  }));
}

async function createNote(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  await api.post('/api/notes', {
    title: form.get('title'),
    module_id: form.get('module_id') || undefined,
    content: form.get('content'),
    tags: form.get('tags'),
  });
  event.target.reset();
  await refreshNotes();
}

initNotes().catch((error) => {
  $('#app').innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
});
