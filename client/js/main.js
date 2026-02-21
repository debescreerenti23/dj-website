// ================= ELEMENTOS =================

const loginForm = document.getElementById("login-form");
const adminIndicator = document.getElementById("admin-indicator");
const logoutBtn = document.getElementById("logout-btn");

const sessionForm = document.getElementById("session-form");
const sessionsContainer = document.getElementById("sessions");
const addSessionDiv = document.querySelector(".add-session");

// ================= CONFIG =================

const API_URL = "http://localhost:3000";

// ================= UI ADMIN =================

function updateAdminUI() {
  const token = localStorage.getItem("adminToken");

  if (token) {
    addSessionDiv.style.display = "block";
    loginForm.style.display = "none";
    adminIndicator.style.display = "block";
    logoutBtn.style.display = "block";
  } else {
    addSessionDiv.style.display = "none";
    loginForm.style.display = "block";
    adminIndicator.style.display = "none";
    logoutBtn.style.display = "none";
  }
}

// ================= TOAST =================

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

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("adminToken", data.token);
    updateAdminUI();
    showToast("Login correcto");
  } else {
    showToast("Credenciales incorrectas", "#ff004c");
  }
});

// ================= LOGOUT =================

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("adminToken");
  updateAdminUI();
  showToast("Sesión cerrada", "#ffaa00");
});

// ================= CARGAR SESIONES =================

async function loadSessions() {
  const res = await fetch(`${API_URL}/sessions`);
  const sessions = await res.json();

  sessionsContainer.innerHTML = "";

  sessions.forEach(session => {

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
      <p style="color:#00ffe0;">⬇ Descargas: ${session.downloads || 0}</p>
    `;

    // ================= DOWNLOAD =================

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "⬇ DOWNLOAD";
    downloadBtn.classList.add("traktor-btn");
    downloadBtn.style.marginLeft = "10px";

    downloadBtn.addEventListener("click", async () => {

      window.open(session.downloadUrl, "_blank");

      await fetch(`${API_URL}/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...session,
          downloads: (session.downloads || 0) + 1
        })
      });

      loadSessions();
      showToast("Descarga iniciada");
    });

    sessionDiv.appendChild(downloadBtn);

    // ================= BOTONES ADMIN =================

    const token = localStorage.getItem("adminToken");

    if (token) {

      const editBtn = document.createElement("button");
      editBtn.textContent = "EDITAR";
      editBtn.classList.add("traktor-btn");
      editBtn.style.marginLeft = "10px";

      editBtn.addEventListener("click", () => {
        document.getElementById("title").value = session.title;
        document.getElementById("description").value = session.description;
        document.getElementById("year").value = session.year;
        document.getElementById("downloadUrl").value = session.downloadUrl;

        sessionForm.dataset.editId = session.id;
        showToast("Editando sesión", "#ffaa00");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "DELETE";
      deleteBtn.classList.add("traktor-btn");
      deleteBtn.style.marginLeft = "10px";

      deleteBtn.addEventListener("click", async () => {
        if (!confirm("⚠️ Esta sesión se eliminará. ¿Continuar?")) return;

        await fetch(`${API_URL}/sessions/${session.id}`, {
          method: "DELETE",
          headers: {
            "Authorization": "Bearer " + token
          }
        });

        loadSessions();
        showToast("Sesión eliminada", "#ff004c");
      });

      sessionDiv.appendChild(editBtn);
      sessionDiv.appendChild(deleteBtn);
    }

    sessionsContainer.appendChild(sessionDiv);
  });
}

// ================= CREAR / EDITAR =================

sessionForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("adminToken");
  if (!token) {
    showToast("Debes iniciar sesión", "#ff004c");
    return;
  }

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const year = document.getElementById("year").value;
  const downloadUrl = document.getElementById("downloadUrl").value;

  const editId = sessionForm.dataset.editId;

  if (editId) {

    await fetch(`${API_URL}/sessions/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ title, description, year, downloadUrl })
    });

    delete sessionForm.dataset.editId;
    showToast("Sesión actualizada", "#ffaa00");

  } else {

    await fetch(`${API_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        title,
        description,
        year,
        downloadUrl,
        downloads: 0
      })
    });

    showToast("Sesión añadida");
  }

  sessionForm.reset();
  loadSessions();
});

// ================= INIT =================

updateAdminUI();
loadSessions();