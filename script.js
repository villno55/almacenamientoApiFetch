const LS_ELECTION = 'elecciones_estado';
const LS_VOTES = 'elecciones_votos';
const LS_CANDIDATES = 'elecciones_candidatos';

const BLANCO = {
  id: "blanco",
  nombre: "Voto en Blanco",
  descripcion: "Expresa que no apoyas a ningún candidato",
  foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/White_Square.svg/2048px-White_Square.svg.png"
};

let candidates = [];

const adminView = document.getElementById("adminView");
const voterView = document.getElementById("voterView");
const resultsView = document.getElementById("resultsView");
const candidatesContainer = document.getElementById("candidatesContainer");
const resultsList = document.getElementById("resultsList");

function getAllCandidates() {
  return [...candidates, BLANCO];
}

function showView(view) {
  adminView.style.display = "none";
  voterView.style.display = "none";
  resultsView.style.display = "none";
  view.style.display = "block";
}

function startElection() {
  localStorage.setItem(LS_ELECTION, JSON.stringify({ started: true, startedAt: new Date() }));
  localStorage.setItem(LS_VOTES, JSON.stringify([]));
  renderCandidates();
  showView(voterView);
}

function closeElection() {
  const st = JSON.parse(localStorage.getItem(LS_ELECTION) || "{}");
  st.started = false;
  st.closedAt = new Date();
  localStorage.setItem(LS_ELECTION, JSON.stringify(st));
  showResults();
}

async function loadCandidates() {
  try {
    const resp = await fetch("candidatos.json");
    let data = await resp.json();

    data = data.map((c, i) => {
      let id = (c.id || "").toLowerCase().trim();
      if (id === "blanco") {
        id = `cand-${i}`;
      }
      return { ...c, id };
    });

    candidates = data;
    localStorage.setItem(LS_CANDIDATES, JSON.stringify(candidates));
  } catch (err) {
    candidates = [];
  }
}

function renderCandidates() {
  const st = JSON.parse(localStorage.getItem(LS_ELECTION) || '{"started":false}');
  const votes = JSON.parse(localStorage.getItem(LS_VOTES) || '[]');
  candidatesContainer.innerHTML = '';

  getAllCandidates().forEach(c => {
    const voteCount = votes.filter(v => v.candidateId === c.id).length;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${c.foto}" alt="${c.nombre}">
      <h3>${c.nombre}</h3>
      <p>${c.descripcion}</p>
      <button ${!st.started ? "disabled" : ""} onclick="vote('${c.id}')">
        Votar
      </button>
      <p>Votos: ${voteCount}</p>
    `;
    candidatesContainer.appendChild(card);
  });
}

function vote(candidateId) {
  const st = JSON.parse(localStorage.getItem(LS_ELECTION) || '{"started":false}');
  if (!st.started) return alert("Las elecciones no están abiertas");

  const votes = JSON.parse(localStorage.getItem(LS_VOTES) || '[]');
  votes.push({ candidateId, time: new Date() });
  localStorage.setItem(LS_VOTES, JSON.stringify(votes));

  alert("Voto registrado");
  renderCandidates();
}

function showResults() {
  const votes = JSON.parse(localStorage.getItem(LS_VOTES) || '[]');
  const totals = {};

  getAllCandidates().forEach(c => totals[c.id] = 0);
  votes.forEach(v => {
    if (totals[v.candidateId] !== undefined) totals[v.candidateId]++;
  });

  resultsList.innerHTML = '';
  const sorted = getAllCandidates().sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));

  sorted.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.nombre}: ${totals[c.id] || 0} votos`;
    resultsList.appendChild(li);
  });

  showView(resultsView);
}

window.onload = async function() {
  await loadCandidates();
  renderCandidates();
};
