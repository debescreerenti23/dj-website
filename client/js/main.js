async function loadSessions() {
  const response = await fetch("http://localhost:3000/sessions");
  const sessions = await response.json();

  const container = document.getElementById("sessions");
  container.innerHTML = "";

  sessions.forEach(session => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${session.title}</h3>
      <p>${session.description}</p>
      <p>Año: ${session.year}</p>
      <a href="${session.downloadUrl}" target="_blank">Descargar</a>
      <hr>
    `;
    container.appendChild(div);
  });
}

loadSessions();

const form = document.getElementById("session-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const year = document.getElementById("year").value;
  const downloadUrl = document.getElementById("downloadUrl").value;

  const response = await fetch("http://localhost:3000/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, year, downloadUrl }),
  });

  if (response.ok) {
    form.reset(); // limpia el formulario
    loadSessions(); // recarga la lista de sesiones
    alert("Sesión añadida correctamente 🎧");
  } else {
    alert("Error al añadir sesión");
  }
});
