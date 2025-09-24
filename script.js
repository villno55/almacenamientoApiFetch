const API_CANDIDATOS = "https://raw.githubusercontent.com/CesarMCuellarCha/apis/refs/heads/main/candidatos.json";
const API_ADMIN = "https://raw.githubusercontent.com/cesarmcuellar/Elecciones/refs/heads/main/administrador.json";

const adminUser = document.getElementById("adminUser");
const adminPass = document.getElementById("adminPass");
const btnLogin = document.getElementById("btnLogin");
const btnInicio = document.getElementById("btnInicio");
const btnCierre = document.getElementById("btnCierre");
const estadoSpan = document.getElementById("estado");

const votacionSection = document.getElementById("votacion");
const candidatosDiv = document.getElementById("candidatos");
const resultadosSection = document.getElementById("resultados");
const tablaResultados = document.getElementById("tablaResultados");
const btnReiniciar = document.getElementById("btnReiniciar");

let eleccionesActivas = false;
let candidatos = [];
let votos = JSON.parse(localStorage.getItem("votos_elecciones") || "{}");

const PLACEHOLDER = "https://via.placeholder.com/400x300?text=Sin+Imagen";


async function fetchAdmin() {
  try {
    const r = await fetch(API_ADMIN);
    if (!r.ok) throw new Error("Error al obtener admin");
    return await r.json();
  } catch (err) {
    console.error("Error en fetchAdmin:", err);
    alert("No se pudo obtener datos de administrador. Revisa la consola.");
    return null;
  }
}

async function fetchCandidatos() {
  try {
    console.log(" Intentando conectar a:", API_CANDIDATOS);
    const r = await fetch(API_CANDIDATOS);
    console.log("Estado HTTP:", r.status, r.statusText);

    if (!r.ok) throw new Error("Error al obtener candidatos");

    const data = await r.json();
    console.log("JSON recibido:", data);

   
    const candidatosConFotos = data.map(c => {
      const nombre = (c.nombre || "").toLowerCase();

      if (nombre.includes("juan")) {
        c.foto = "imágenes/juan.jpg";
      } else if (nombre.includes("monik") || nombre.includes("monica")) {
        c.foto = "imágenes/Monik.jpg";
      } else if (nombre.includes("carlos")) {
        c.foto = "imágenes/carlos.jpg";
      } else if (nombre.includes("Blanco")) {
        c.foto = "imágenes/Voto-en-blanco.jpg";
      } else {
        c.foto = PLACEHOLDER;
      }

      return c;
    });

    console.log(" Candidatos finales:", candidatosConFotos);
    return candidatosConFotos;
  } catch (err) {
    console.error("Error en fetchCandidatos:", err);
    alert("No se pudieron cargar los candidatos. Revisa la consola.");
    return [];
  }
}

function nombreCompleto(c) {
  return `${c.nombre || ""} ${c.apellido || ""}`.trim();
}

function guardarVotos() {
  localStorage.setItem("votos_elecciones", JSON.stringify(votos));
}

function inicializarVotos() {
  candidatos.forEach(c => {
    const key = nombreCompleto(c);
    if (!(key in votos)) votos[key] = 0;
  });
  guardarVotos();
}

function renderCandidatos() {
  candidatosDiv.innerHTML = "";
  if (!candidatos.length) {
    candidatosDiv.innerHTML = "<p>No hay candidatos para mostrar.</p>";
    return;
  }

  
candidatos.forEach(c => {
  let key = nombreCompleto(c);
  let foto = c.foto || PLACEHOLDER;
  let ficha = c.ficha ?? "-";
  let curso = c.curso ?? "-";

    if (key.toLowerCase().includes("blanco")) {
    key = "Voto en Blanco";
    foto = "imágenes/Voto-en-blanco.jpg";
    
  }
    const card = document.createElement("div");
    card.className = "candidato";
    card.innerHTML = `
      <img src="${foto}" alt="${key}" loading="lazy">
      <h3>${key}</h3>
      <p><strong>Programa:</strong> ${curso}</p>
      <p><strong>Ficha:</strong> ${ficha}</p>
      <p><small>Votos actuales: <span class="vcount">${votos[key] ?? 0}</span></small></p>
    `;
    card.addEventListener("click", () => votarPor(key));
    candidatosDiv.appendChild(card);
  });
}

function votarPor(key) {
  if (!eleccionesActivas) {
    alert("Las elecciones no están activas.");
    return;
  }
  const confirmar = confirm(`¿Está seguro que desea votar por ${key}?`);
  if (!confirmar) return;

  votos[key] = (votos[key] || 0) + 1;
  guardarVotos();

  const spans = candidatosDiv.querySelectorAll(".candidato");
  spans.forEach(card => {
    const title = card.querySelector("h3").textContent.trim();
    if (title === key) {
      const vspan = card.querySelector(".vcount");
      if (vspan) vspan.textContent = votos[key];
    }
  });

  alert("Voto registrado. ¡Gracias!");
}

function mostrarResultados() {
  votacionSection.classList.add("hidden");
  resultadosSection.classList.remove("hidden");
  tablaResultados.innerHTML = "";

  const arr = Object.entries(votos).sort((a, b) => b[1] - a[1]);
  arr.forEach(([nombre, n]) => {
    tablaResultados.innerHTML += `<p><strong>${nombre}:</strong> ${n} votos</p>`;
  });
}

function actualizarEstado() {
  estadoSpan.textContent = `Estado: ${eleccionesActivas ? "Activas" : "Inactivas"}`;
}


btnLogin.addEventListener("click", async () => {
  const admin = await fetchAdmin();
  if (!admin) return;
  if (adminUser.value === admin.username && adminPass.value === admin.password) {
    alert("Acceso concedido como administrador");
    btnInicio.disabled = false;
    btnCierre.disabled = false;
  } else {
    alert("Usuario o contraseña incorrectos");
  }
});

btnInicio.addEventListener("click", async () => {
  candidatos = await fetchCandidatos();
  eleccionesActivas = true;
  inicializarVotos();
  renderCandidatos();
  votacionSection.classList.remove("hidden");
  resultadosSection.classList.add("hidden");
  actualizarEstado();
});

btnCierre.addEventListener("click", () => {
  eleccionesActivas = false;
  guardarVotos();
  mostrarResultados();
  actualizarEstado();
});

btnReiniciar.addEventListener("click", () => {
  if (!confirm("¿Desea reiniciar (borrar todos los votos)?")) return;
  votos = {};
  localStorage.removeItem("votos_elecciones");
  tablaResultados.innerHTML = "<p>Reiniciado.</p>";
  if (eleccionesActivas && candidatos.length) {
    inicializarVotos();
    renderCandidatos();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  actualizarEstado();
});
main.js
Displaying main.js.
