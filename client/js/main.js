const API_URL = "https://dj-website-bkfj.onrender.com";

const loginForm = document.getElementById("login-form");
const sessionForm = document.getElementById("session-form");
const sessionsContainer = document.getElementById("sessions");
const logoutBtn = document.getElementById("logout-btn");
const searchInput = document.getElementById("search-input");
const yearFilter = document.getElementById("year-filter");
const submitBtn = document.getElementById("submit-btn");
const djPhoto = document.getElementById("dj-photo");
const adminFormContainer = document.getElementById("admin-form-container");

let editingSessionId = null;
let clickCount = 0;

function updateAdminUI() {
    const token = localStorage.getItem("adminToken");
    document.getElementById("admin-controls").style.display = token ? "block" : "none";
    if (token) adminFormContainer.style.display = "none";
}

function showToast(message, color = "#00ffe0") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.style.borderColor = color;
    toast.style.color = color;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function filterSessions() {
    const term = searchInput.value.toLowerCase();
    const year = yearFilter.value;
    const cards = document.querySelectorAll(".session-card");
    cards.forEach(card => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        const cardYear = card.querySelector("h3 span").textContent.replace(/[()]/g, "");
        card.style.display = (title.includes(term) && (year === "all" || cardYear === year)) ? "flex" : "none";
    });
}

function updateYearOptions(sessions) {
    const years = [...new Set(sessions.map(s => s.year))].sort((a,b) => b-a);
    const current = yearFilter.value;
    yearFilter.innerHTML = '<option value="all">Todos los años</option>';
    years.forEach(y => {
        const opt = document.createElement("option");
        opt.value = y; opt.textContent = y;
        yearFilter.appendChild(opt);
    });
    yearFilter.value = current;
}

async function loadSessions() {
    try {
        const res = await fetch(`${API_URL}/sessions`);
        const sessions = await res.json();
        const token = localStorage.getItem("adminToken");
        
        updateYearOptions(sessions);
        sessionsContainer.innerHTML = "";

        sessions.forEach(s => {
            const card = document.createElement("div");
            card.className = "session-card";
            
            // LÓGICA DE RUTA ABSOLUTA
            let imgPath = 'images/audio.png'; 
            if (s.coverUrl && s.coverUrl.trim() !== "") {
                const rawPath = s.coverUrl.trim();
                if (rawPath.startsWith('http')) {
                    imgPath = rawPath;
                } else {
                    // Forzamos que empiece por / para que sea una ruta raíz
                    imgPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
                }
            }

            const safeDesc = s.description ? s.description.replace(/'/g, "\\'") : "";
            const safeTitle = s.title ? s.title.replace(/'/g, "\\'") : "";
            const safeCover = s.coverUrl ? s.coverUrl.replace(/'/g, "\\'") : "";

            card.innerHTML = `
                <div class="cover-wrapper">
                    <img src="${imgPath}" alt="${s.title}" class="session-cover" onerror="this.src='images/audio.png'">
                </div>
                <div class="session-content">
                    <h3>${s.title} <span>(${s.year})</span></h3>
                    <p>${s.description || ''}</p>
                    <p style="color:#00ffe0">⬇ <span id="count-${s.id}">${s.downloads || 0}</span> descargas</p>
                    <div class="card-actions">
                        <button class="traktor-btn" onclick="handleDownload('${s.id}', '${s.downloadUrl}')">DOWNLOAD</button>
                        ${token ? `
                            <button class="traktor-btn" onclick="prepareEdit('${s.id}', '${safeTitle}', '${safeDesc}', '${s.year}', '${s.downloadUrl}', '${safeCover}')">EDIT</button>
                            <button class="traktor-btn-danger" onclick="deleteSession('${s.id}')">DEL</button>
                        ` : ''}
                    </div>
                </div>
            `;
            sessionsContainer.appendChild(card);
        });
        filterSessions();
    } catch (err) { console.error(err); }
}

async function handleDownload(id, url) {
    window.open(url, "_blank");
    const el = document.getElementById(`count-${id}`);
    if (el) el.textContent = parseInt(el.textContent) + 1;
    await fetch(`${API_URL}/sessions/${id}/download`, { method: "POST" });
}

async function deleteSession(id) {
    if (!confirm("¿Eliminar sesión?")) return;
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${API_URL}/sessions/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) { showToast("Sesión eliminada"); loadSessions(); }
}

function prepareEdit(id, title, desc, year, url, cover) {
    editingSessionId = id;
    document.getElementById("title").value = title || "";
    document.getElementById("description").value = desc || "";
    document.getElementById("year").value = year || "";
    document.getElementById("downloadUrl").value = url || "";
    // Limpiamos el valor de cover si viene como undefined string
    document.getElementById("coverUrl").value = (cover === "undefined" || !cover) ? "" : cover;
    
    submitBtn.innerHTML = '<i class="fas fa-edit"></i> ACTUALIZAR SESIÓN';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

sessionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    const data = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        year: document.getElementById("year").value.toString(),
        downloadUrl: document.getElementById("downloadUrl").value,
        coverUrl: document.getElementById("coverUrl").value
    };

    const method = editingSessionId ? "PUT" : "POST";
    const url = editingSessionId ? `${API_URL}/sessions/${editingSessionId}` : `${API_URL}/sessions`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            showToast(editingSessionId ? "¡Actualizada!" : "¡Guardada!");
            editingSessionId = null;
            sessionForm.reset();
            submitBtn.innerHTML = '<i class="fas fa-save"></i> GUARDAR EN LIBRERÍA';
            loadSessions();
        }
    } catch (err) { console.error(err); }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            username: document.getElementById("username").value, 
            password: document.getElementById("password").value 
        })
    });
    const data = await res.json();
    if (res.ok) { 
        localStorage.setItem("adminToken", data.token); 
        updateAdminUI(); 
        loadSessions(); 
    } else showToast("Error de acceso", "#ff004c");
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    updateAdminUI();
    loadSessions();
});

searchInput.addEventListener("input", filterSessions);
yearFilter.addEventListener("change", filterSessions);

djPhoto.addEventListener("click", () => {
    clickCount++;
    if(clickCount === 7) {
        adminFormContainer.style.display = "block";
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        clickCount = 0;
    }
});

updateAdminUI();
loadSessions();