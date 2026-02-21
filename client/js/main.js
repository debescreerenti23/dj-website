// ================= VARIABLES =================

let sessions = JSON.parse(localStorage.getItem("sessions")) || [];
let isAdmin = localStorage.getItem("isAdmin") === "true";

// ================= ELEMENTOS =================

const loginForm = document.getElementById("login-form");
const adminIndicator = document.getElementById("admin-indicator");
const logoutBtn = document.getElementById("logout-btn");

const sessionForm = document.getElementById("session-form");
const sessionsContainer = document.getElementById("sessions");

// ================= CONTROL UI ADMIN =================

function updateAdminUI() {
  if (isAdmin) {
    loginForm.style.display = "none";
    adminIndicator.style.display = "block";
    adminIndicator.textContent = "🟢 Sesión iniciada como Admin";
    logoutBtn.style.display = "inline-block";
    sessionForm.style.display = "block";
  } else {
    loginForm.style.display = "block";
    adminIndicator.style.display = "none";
    logoutBtn.style.display = "none";
    sessionForm.style.display = "none";
  }
}

// ================= MENSAJE FLOTANTE =================

function showToast(message, color = "#00ffe0") {
  const toast = document.createElement("div");
  toast.textContent = message;

  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = "#111";
  toast.style.color = color;
  toast.style.border = `1px solid ${color}`;
  toast.style.padding = "10px 15px";
  toast.style.borderRadius = "6px";
  toast.style.boxShadow = `0 0 10px ${color}`;
  toast.style.zIndex = "9999";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ================= LOGIN =================

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "1234") {
    isAdmin = true;
    localStorage.setItem("isAdmin", "true");

    updateAdminUI();
    showToast("Login correcto");
    loadSessions();
  } else {
    showToast("Usuario o contraseña incorrectos", "#ff004c");
  }
});

// ================= LOGOUT =================

logoutBtn.addEventListener("click", () => {
  const confirmLogout = confirm("⚠️ Se va a cerrar la sesión. ¿Continuar?");
  if (!confirmLogout) return;

  isAdmin = false;
  localStorage.removeItem("isAdmin");

  updateAdminUI();
  showToast("Sesión cerrada", "#ffaa00");
  loadSessions();
});

// ================= GUARDAR SESIONES =================

function saveSessions() {
  localStorage.setItem("sessions", JSON.stringify(sessions));
}

// ================= CARGAR SESIONES =================

function loadSessions() {

  // Compatibilidad sesiones antiguas
  sessions.forEach(session => {
    if (session.downloads === undefined) {
      session.downloads = 0;
    }
  });

  sessionsContainer.innerHTML = "";

  sessions.forEach((session, index) => {

    const sessionDiv = document.createElement("div");
    sessionDiv.style.border = "1px solid #00ffe0";
    sessionDiv.style.padding = "15px";
    sessionDiv.style.margin = "15px 0";
    sessionDiv.style.borderRadius = "10px";
    sessionDiv.style.background = "#111";
    sessionDiv.style.color = "white";

    sessionDiv.innerHTML = `
      <h3>${session.title} (${session.year})</h3>
      <p>${session.description}</p>
      <p style="color:#00ffe0;">⬇ Descargas: ${session.downloads}</p>
    `;

    // ================= PLAY =================

    const playBtn = document.createElement("button");
    playBtn.textContent = "PLAY";
    playBtn.classList.add("traktor-btn");

    playBtn.addEventListener("click", () => {
      const audioPlayer = document.getElementById("audio-player");
      const audioSource = document.getElementById("audio-source");

      audioSource.src = session.downloadUrl;
      audioPlayer.load();
      audioPlayer.play();

      showToast(`Reproduciendo: ${session.title}`);
    });

    sessionDiv.appendChild(playBtn);

    // ================= DOWNLOAD =================

    const downloadBtn = document.createElement("button");
    downloadBtn.innerHTML = "⬇ DOWNLOAD";
    downloadBtn.classList.add("traktor-btn");
    downloadBtn.style.marginLeft = "10px";

    downloadBtn.addEventListener("click", () => {

      const link = document.createElement("a");
      link.href = session.downloadUrl;
      link.download = session.title + ".mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      session.downloads++;
      saveSessions();
      loadSessions();

      showToast("Descarga iniciada");
    });

    sessionDiv.appendChild(downloadBtn);

    // ================= BOTONES ADMIN =================

    if (isAdmin) {

      const editBtn = document.createElement("button");
      editBtn.textContent = "EDITAR";
      editBtn.classList.add("traktor-btn");
      editBtn.style.marginLeft = "10px";

      editBtn.addEventListener("click", () => {

        document.getElementById("title").value = session.title;
        document.getElementById("description").value = session.description;
        document.getElementById("year").value = session.year;
        document.getElementById("downloadUrl").value = session.downloadUrl;

        sessions.splice(index, 1);
        saveSessions();
        loadSessions();

        showToast("Editando sesión", "#ffaa00");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "DELETE";
      deleteBtn.classList.add("traktor-btn");
      deleteBtn.style.marginLeft = "10px";

      deleteBtn.addEventListener("click", () => {

        const confirmDelete = confirm("⚠️ Esta sesión se eliminará. ¿Continuar?");
        if (!confirmDelete) return;

        sessions.splice(index, 1);
        saveSessions();
        loadSessions();

        showToast("Sesión eliminada", "#ff004c");
      });

      sessionDiv.appendChild(editBtn);
      sessionDiv.appendChild(deleteBtn);
    }

    sessionsContainer.appendChild(sessionDiv);
  });
}

// ================= AÑADIR SESIÓN =================

sessionForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!isAdmin) {
    showToast("Debes iniciar sesión como admin", "#ff004c");
    return;
  }

  const newSession = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    year: document.getElementById("year").value,
    downloadUrl: document.getElementById("downloadUrl").value,
    downloads: 0
  };

  sessions.push(newSession);
  saveSessions();
  loadSessions();

  sessionForm.reset();
  showToast("Sesión añadida correctamente");
});

// ================= INICIAR =================

updateAdminUI();
loadSessions();