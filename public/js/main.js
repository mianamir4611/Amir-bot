function toggleMenu() {
  const nav = document.getElementById('navBar');
  const btn = document.getElementById('menuToggle');
  nav.classList.toggle('open');
  btn.classList.toggle('active');
}

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const section = document.getElementById(name);
  if (section) section.classList.add('active');
  const btn = document.querySelector(`[data-section="${name}"]`);
  if (btn) btn.classList.add('active');

  if (name === 'onlines') loadOnlines();
  if (name === 'commands') loadCommands();

  const nav = document.getElementById('navBar');
  const menuBtn = document.getElementById('menuToggle');
  if (nav) nav.classList.remove('open');
  if (menuBtn) menuBtn.classList.remove('active');
}

function showStatus(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'status-msg ' + type;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

async function createBot() {
  const appstate = document.getElementById('appState').value.trim();
  const username = document.getElementById('c_username').value.trim();
  const password = document.getElementById('c_password').value.trim();
  const botname = document.getElementById('c_botname').value.trim();
  const botprefix = document.getElementById('c_botprefix').value.trim();
  const botadmin = document.getElementById('c_botadmin').value.trim();

  if (!appstate || !username || !password) {
    return showStatus('createStatus', 'Appstate, username and password are required', 'error');
  }

  try { JSON.parse(appstate); } catch {
    return showStatus('createStatus', 'Invalid appstate JSON format', 'error');
  }

  const btn = document.querySelector('.create-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Creating...';

  try {
    const res = await fetch('/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appstate, username, password, botname: botname || 'RAZA-BoT', botprefix: botprefix || '.', botadmin })
    });
    const data = await res.json();
    if (res.ok) {
      showStatus('createStatus', 'Bot created successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = `/profile?token=${data.token}&botid=${data.botid}`;
      }, 1500);
    } else {
      showStatus('createStatus', data.error || 'Failed to create bot', 'error');
    }
  } catch (err) {
    showStatus('createStatus', 'Network error: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = 'Create Bot';
}

async function loginBot() {
  const username = document.getElementById('l_username').value.trim();
  const password = document.getElementById('l_password').value.trim();

  if (!username || !password) {
    return showStatus('loginStatus', 'Username and password are required', 'error');
  }

  const btn = document.querySelector('.login-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Logging in...';

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      showStatus('loginStatus', 'Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = `/profile?token=${data.token}&botid=${data.botid}`;
      }, 1500);
    } else {
      showStatus('loginStatus', data.error || 'Login failed', 'error');
    }
  } catch (err) {
    showStatus('loginStatus', 'Network error: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = 'Login';
}

async function loadOnlines() {
  const container = document.getElementById('onlinesList');
  if (!container) return;
  container.innerHTML = '<div class="empty-state"><span class="loading-spinner"></span> Loading...</div>';

  try {
    const res = await fetch('/info');
    const bots = await res.json();

    if (bots.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No bots online</p></div>';
      return;
    }

    container.innerHTML = bots.map((bot, i) => {
      const hours = Math.floor(bot.time / 3600);
      const mins = Math.floor((bot.time % 3600) / 60);
      const secs = bot.time % 60;
      const uptime = `${hours}h ${mins}m ${secs}s`;
      const imgSrc = bot.thumbSrc || 'https://i.ibb.co/kVrhfytH/70112f6ff73f.jpg';
      return `<div class="bot-card" style="animation-delay:${i * 0.1}s">
        <img src="${imgSrc}" alt="${bot.name}" onerror="this.src='https://i.ibb.co/kVrhfytH/70112f6ff73f.jpg'">
        <div class="bot-info">
          <h4>${bot.name}</h4>
          <p>Uptime: ${uptime}</p>
        </div>
        <div class="online-dot"></div>
      </div>`;
    }).join('');
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Failed to load online bots</p></div>';
  }
}

async function loadCommands() {
  const container = document.getElementById('commandsList');
  if (!container) return;
  container.innerHTML = '<div class="empty-state"><span class="loading-spinner"></span> Loading...</div>';

  try {
    const res = await fetch('/commands');
    const commands = await res.json();

    if (commands.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No commands loaded</p></div>';
      return;
    }

    const categories = {};
    commands.forEach(cmd => {
      const cat = cmd.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    });

    let html = '';
    for (const [cat, cmds] of Object.entries(categories).sort()) {
      html += `<h3 style="color: #e94560; margin: 18px 0 10px; font-size: 0.9em; font-weight: 600; letter-spacing: 0.5px;">${cat} (${cmds.length})</h3>`;
      cmds.forEach(cmd => {
        html += `<div class="cmd-item">
          <h5>${cmd.name}</h5>
          <p>${cmd.description || 'No description'}</p>
          ${cmd.aliases.length ? `<p style="color:#555;font-size:0.72em">Aliases: ${cmd.aliases.join(', ')}</p>` : ''}
          <span class="cmd-category">${cat}</span>
          ${cmd.adminOnly ? '<span class="cmd-category" style="background:rgba(220,53,69,0.1);color:#dc3545;">Admin</span>' : ''}
        </div>`;
      });
    }

    container.innerHTML = html;
    window._allCommands = commands;
  } catch {
    container.innerHTML = '<div class="empty-state"><p>Failed to load commands</p></div>';
  }
}

function searchCommands() {
  const query = document.getElementById('cmdSearch').value.toLowerCase();
  const container = document.getElementById('commandsList');
  if (!window._allCommands) return;

  const filtered = window._allCommands.filter(cmd =>
    cmd.name.toLowerCase().includes(query) ||
    (cmd.description || '').toLowerCase().includes(query) ||
    (cmd.category || '').toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No commands match your search</p></div>';
    return;
  }

  container.innerHTML = filtered.map(cmd => `<div class="cmd-item">
    <h5>${cmd.name}</h5>
    <p>${cmd.description || 'No description'}</p>
    <span class="cmd-category">${cmd.category || 'General'}</span>
  </div>`).join('');
}

async function loadStats() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    const el = (id) => document.getElementById(id);
    if (el('statBots')) el('statBots').textContent = data.totalBots;
    if (el('statCmds')) el('statCmds').textContent = data.totalCommands;
    if (el('statEvents')) el('statEvents').textContent = data.totalEvents;
    if (el('statMemory')) el('statMemory').textContent = data.memory + 'MB';
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
  showSection('create');
  loadStats();
  setInterval(loadStats, 30000);
});
