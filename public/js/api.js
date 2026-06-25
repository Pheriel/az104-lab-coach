const api = {
  async get(path) {
    return request(path);
  },
  async post(path, body) {
    return request(path, { method: 'POST', body: JSON.stringify(body || {}) });
  },
  async put(path, body) {
    return request(path, { method: 'PUT', body: JSON.stringify(body || {}) });
  },
  async patch(path, body) {
    return request(path, { method: 'PATCH', body: JSON.stringify(body || {}) });
  },
  async delete(path) {
    return request(path, { method: 'DELETE' });
  },
};

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function formatStatus(status) {
  return {
    not_started: 'A demarrer',
    in_progress: 'En cours',
    completed: 'Termine',
  }[status] || status;
}

function statusClass(status) {
  return status === 'completed' ? 'ok' : status === 'in_progress' ? 'warn' : '';
}

function layout(pageTitle, active) {
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="/dashboard.html">
          <span class="brand-mark">AZ</span>
          <span><strong>AZ-104 Coach</strong><span>Labs locaux</span></span>
        </a>
        <nav class="nav">
          ${navLink('dashboard.html', 'Dashboard', active === 'dashboard')}
          ${navLink('labs.html', 'Labs', active === 'labs')}
          ${navLink('quiz.html', 'Quiz', active === 'quiz')}
          ${navLink('notes.html', 'Notes', active === 'notes')}
          ${navLink('admin.html', 'Admin', active === 'admin')}
        </nav>
      </aside>
      <main class="main">
        <div class="topbar">
          <div>
            <div class="eyebrow">Preparation AZ-104</div>
            <h1>${escapeHtml(pageTitle)}</h1>
          </div>
          <a class="button secondary" href="/labs.html">Reprendre un lab</a>
        </div>
        <div id="app"></div>
      </main>
    </div>
  `);
}

function navLink(href, label, active) {
  return `<a class="${active ? 'active' : ''}" href="/${href}">${label}</a>`;
}
