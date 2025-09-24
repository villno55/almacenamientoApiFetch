const CANDIDATES_URL = 'https://raw.githubusercontent.com/CesarMCuellarCha/apis/refs/heads/main/candidatos.json';
const ADMIN_URL = 'https://raw.githubusercontent.com/cesarmcuellar/Elecciones/refs/heads/main/administrador.json';

const LS_ELECTION = 'elecciones_estado';
const LS_VOTES = 'elecciones_votos';
const LS_CACHED_CAND = 'elecciones_cache_cands';
const LS_CURRENT_VOTER = 'elecciones_voter';

const electionStatusEl = document.getElementById('election-status');
const adminAreaBtn = document.getElementById('admin-area-btn');
const refreshBtn = document.getElementById('refresh-btn');
const adminSection = document.getElementById('admin-section');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const adminUserInput = document.getElementById('admin-user');
const adminPassInput = document.getElementById('admin-pass');
const adminControls = document.getElementById('admin-controls');
const adminNameSpan = document.getElementById('admin-name');
const startBtn = document.getElementById('start-elections-btn');
const closeBtn = document.getElementById('close-elections-btn');
const viewResultsAdminBtn = document.getElementById('view-results-admin-btn');
const adminMessage = document.getElementById('admin-message');

const votingSection = document.getElementById('voting-section');
const candidatesContainer = document.getElementById('candidates-container');

const resultsSection = document.getElementById('results-section');
const resultsList = document.getElementById('results-list');
const backToVoteBtn = document.getElementById('back-to-vote-btn');

const confirmModal = document.getElementById('confirm-modal');
const confirmText = document.getElementById('confirm-text');
const confirmYes = document.getElementById('confirm-yes-btn');
const confirmNo = document.getElementById('confirm-no-btn');

const setVoterBtn = document.getElementById('set-voter-btn');
const voterIdInput = document.getElementById('voter-id');
const voterCodeInput = document.getElementById('voter-code');
const voterCurrent = document.getElementById('voter-current');

let candidates = [];
let adminData = null;
let selectedCandidateForVote = null;

init();

async function init() {
  bindEvents();
  loadLocalCache();
  await loadCandidates();
  await loadAdminData();
  renderByState();
}

function bindEvents() {
  adminAreaBtn.addEventListener('click', toggleAdminSection);
  adminLoginBtn.addEventListener('click', onAdminLogin);
  adminLogoutBtn.addEventListener('click', onAdminLogout);
  startBtn.addEventListener('click', onStartElections);
  closeBtn.addEventListener('click', onCloseElections);
  viewResultsAdminBtn.addEventListener('click', showResults);
  refreshBtn.addEventListener('click', async () => {
    await loadCandidates(true);
    renderByState();
  });

  setVoterBtn.addEventListener('click', saveVoterData);
  backToVoteBtn.addEventListener('click', () => showView('voting'));

  confirmNo.addEventListener('click', hideModal);
  confirmYes.addEventListener('click', confirmVote);

  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) hideModal();
  });
}

function loadLocalCache() {
  if (!localStorage.getItem(LS_ELECTION)) {
    localStorage.setItem(LS_ELECTION, JSON.stringify({ started: false, startedAt: null, closedAt: null }));
  }
  if (!localStorage.getItem(LS_VOTES)) {
    localStorage.setItem(LS_VOTES, JSON.stringify([]));
  }

  const v = localStorage.getItem(LS_CURRENT_VOTER);
  if (v) {
    const o = JSON.parse(v);
    voterCurrent.textContent = `Aprendiz: ${o.voterId} · Ficha: ${o.ficha}`;
    voterIdInput.value = o.voterId;
    voterCodeInput.value = o.ficha;
  }
}

async function loadCandidates(force = false) {
  try {
    if (!force) {
      const cache = localStorage.getItem(LS_CACHED_CAND);
      if (cache) {
        candidates = JSON.parse(cache);
        renderCandidates();
      }
    }

    const res = await fetch(CANDIDATES_URL);
    if (!res.ok) throw new Error('Error al obtener candidatos');
    let data = await res.json();

    candidates = data
      .filter(c => c.id !== 'blanco' && c.nombre.toLowerCase() !== 'voto en blanco')
      .map((c, i) => ({ ...c, id: c.id || `cand-${i}` }));

    localStorage.setItem(LS_CACHED_CAND, JSON.stringify(candidates));
    renderCandidates();
  } catch (err) {
    console.error('Candidatos fetch error', err);
    if (!candidates || candidates.length === 0) {
      candidatesContainer.innerHTML = `<p class="muted">No se han podido cargar los candidatos. Revisa la conexión.</p>`;
    }
  }
}

async function loadAdminData() {
  try {
    const res = await fetch(ADMIN_URL);
    if (!res.ok) throw new Error('Error admin');
    adminData = await res.json();
  } catch (err) {
    console.error('Admin fetch error', err);
    adminData = null;
  }
}

function renderByState() {
  const st = JSON.parse(localStorage.getItem(LS_ELECTION));
  electionStatusEl.textContent = st.started ? (st.closedAt ? 'Estado: Cerradas' : 'Estado: Abiertas') : 'Estado: No iniciadas';
  electionStatusEl.style.color = st.closedAt ? '#ddd' : (st.started ? '#fff' : '#bbb');
  showView(st.closedAt ? 'results' : 'voting');
  renderCandidates();
}

function showView(view) {
  adminSection.classList.add('hidden');
  votingSection.classList.add('hidden');
  resultsSection.classList.add('hidden');

  if (view === 'admin') adminSection.classList.remove('hidden');
  if (view === 'voting') votingSection.classList.remove('hidden');
  if (view === 'results') resultsSection.classList.remove('hidden');
}

function toggleAdminSection() {
  if (adminSection.classList.contains('hidden')) {
    showView('admin');
  } else {
    showView('voting');
  }
}

function renderCandidates() {
  const st = JSON.parse(localStorage.getItem(LS_ELECTION));
  const votes = JSON.parse(localStorage.getItem(LS_VOTES));
  candidatesContainer.innerHTML = '';

  if (candidates.length === 0) {
    candidatesContainer.innerHTML = `<p class="muted">No hay candidatos disponibles.</p>`;
    return;
  }

  candidates.forEach(c => {
    const voteCount = votes.filter(v => v.candidateId === c.id).length;
    const card = document.createElement('div');
    card.className = 'candidate-card';
    card.innerHTML = `
      <img class="candidate-photo" src="${c.foto}" alt="${escapeHtml(c.nombre)}" data-id="${c.id}">
      <div class="candidate-name">${escapeHtml(c.nombre)}</div>
      <div class="candidate-program">${escapeHtml(c.programa || '')}</div>
      <div class="candidate-meta">Aprendiz: ${escapeHtml(c.documento || '')} · Ficha: ${escapeHtml(c.ficha || '')}</div>
      <div class="muted">Votos: <strong>${voteCount}</strong></div>
    `;
    const img = card.querySelector('.candidate-photo');
    img.addEventListener('click', () => onCandidateClick(c));
    candidatesContainer.appendChild(card);
  });

  if (st.closedAt) {
    candidatesContainer.querySelectorAll('.candidate-photo').forEach(img => img.style.cursor = 'default');
  }
}

function showResults() {
  const votes = JSON.parse(localStorage.getItem(LS_VOTES));
  const totals = {};
  candidates.forEach(c => totals[c.id] = 0);
  votes.forEach(v => {
    if (totals[v.candidateId] !== undefined) totals[v.candidateId]++;
  });

  resultsList.innerHTML = '';
  const sorted = [...candidates].sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));

  sorted.forEach(c => {
    const row = document.createElement('div');
    row.className = 'result-row';
    row.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${c.foto}" alt="" style="width:56px;height:56px;object-fit:cover">
        <div>
          <div style="font-weight:600">${escapeHtml(c.nombre)}</div>
          <div class="muted">${escapeHtml(c.programa || '')}</div>
        </div>
      </div>
      <div>
        <div style="font-size:20px;font-weight:700">${totals[c.id] || 0}</div>
        <div class="muted">votos</div>
      </div>
    `;
    resultsList.appendChild(row);
  });

  showView('results');
}

async function onAdminLogin() {
  if (!adminData) {
    adminMessage.textContent = 'No se pudo cargar la información de administrador.';
    return;
  }

  const u = adminUserInput.value.trim();
  const p = adminPassInput.value.trim();

  const expectedUser = adminData.user || adminData.usuario || adminData.username || '';
  const expectedPass = adminData.pass || adminData.password || adminData.clave || '';

  if (u === expectedUser && p === expectedPass) {
    adminMessage.style.color = 'green';
    adminMessage.textContent = 'Acceso concedido.';
    adminControls.classList.remove('hidden');
    adminLogoutBtn.classList.remove('hidden');
    adminLoginBtn.classList.add('hidden');
    adminNameSpan.textContent = adminData.name || adminData.nombre || expectedUser;
  } else {
    adminMessage.style.color = 'red';
    adminMessage.textContent = 'Credenciales incorrectas.';
  }
}

function onAdminLogout() {
  adminControls.classList.add('hidden');
  adminLogoutBtn.classList.add('hidden');
  adminLoginBtn.classList.remove('hidden');
  adminMessage.textContent = '';
  adminUserInput.value = '';
  adminPassInput.value = '';
}

function onStartElections() {
  const st = JSON.parse(localStorage.getItem(LS_ELECTION));
  if (st.started && !st.closedAt) {
    adminMessage.style.color = 'orange';
    adminMessage.textContent = 'Las elecciones ya están en curso.';
    return;
  }
  st.started = true;
  st.startedAt = new Date().toISOString();
  st.closedAt = null;
  localStorage.setItem(LS_ELECTION, JSON.stringify(st));
  adminMessage.style.color = 'green';
  adminMessage.textContent = 'Elecciones iniciadas.';
  renderByState();
}

function onCloseElections() {
  const st = JSON.parse(localStorage.getItem(LS_ELECTION));
  if (!st.started || st.closedAt) {
    adminMessage.style.color = 'orange';
    adminMessage.textContent = 'No hay elecciones abiertas para cerrar.';
    return;
  }
  st.closedAt = new Date().toISOString();
  localStorage.setItem(LS_ELECTION, JSON.stringify(st));
  adminMessage.style.color = 'green';
  adminMessage.textContent = 'Elecciones cerradas.';
  showResults();
}

function onCandidateClick(candidate) {
  const st = JSON.parse(localStorage.getItem(LS_ELECTION));
  if (!st.started || st.closedAt) {
    alert('Las elecciones no están activas.');
    return;
  }
  const voter = JSON.parse(localStorage.getItem(LS_CURRENT_VOTER));
  if (!voter || !voter.voterId || !voter.ficha) {
    alert('Por favor, ingrese los datos del aprendiz.');
    return;
  }
  selectedCandidateForVote = candidate;
  confirmText.textContent = `Vas a votar por "${candidate.nombre}". Aprendiz: ${voter.voterId} · Ficha: ${voter.ficha}`;
  showModal();
}

function confirmVote() {
  const voter = JSON.parse(localStorage.getItem(LS_CURRENT_VOTER));
  if (!voter || !selectedCandidateForVote) {
    alert("No se pudo registrar el voto. Verifique sus datos.");
    return;
  }

  const votes = JSON.parse(localStorage.getItem(LS_VOTES)) || [];

  votes.push({
    candidateId: selectedCandidateForVote.id,
    voterId: voter.voterId,
    ficha: voter.ficha,
    timestamp: new Date().toISOString()
  });

  localStorage.setItem(LS_VOTES, JSON.stringify(votes));
  selectedCandidateForVote = null;
  hideModal();
  renderCandidates();
  alert("Voto registrado correctamente.");
}

function showModal() {
  confirmModal.classList.remove('hidden');
}

function hideModal() {
  confirmModal.classList.add('hidden');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function saveVoterData() {
  const voterId = voterIdInput.value.trim();
  const ficha = voterCodeInput.value.trim();
  if (!voterId || !ficha) {
    alert("Debe ingresar documento y ficha válidos.");
    return;
  }
  const voter = { voterId, ficha };
  localStorage.setItem(LS_CURRENT_VOTER, JSON.stringify(voter));
  voterCurrent.textContent = `Aprendiz: ${voterId} · Ficha: ${ficha}`;
  alert("Datos del aprendiz guardados.");
}
