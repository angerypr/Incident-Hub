const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

if (!token || !userId) {
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", fetchIncidents);

// Elementos del DOM
const incidentForm = document.getElementById("incidentForm");
const incidentId = document.getElementById("incidentId");
const titleInput = document.getElementById("incidentTitle");
const descInput = document.getElementById("incidentDescription");
const priorityInput = document.getElementById("incidentPriority");
const statusInput = document.getElementById("incidentStatus");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");

// Listeners
incidentForm.addEventListener("submit", handleIncident);

async function fetchIncidents() {
    try {
        const response = await fetch("http://localhost:3000/api/incidents");
        const incidents = await response.json();

        renderIncidents(incidents);
        updateCounters(incidents);
    } catch (error) {
        console.error("Error al cargar incidentes:", error);
    }
}

function renderIncidents(incidents) {
    const list = document.getElementById("incidentsList");
    list.innerHTML = "";

    // Filtrar para mostrar solo los de este usuario para que tenga sentido el dashboard
    const userIncidents = incidents.filter(i => i.reportedBy && i.reportedBy._id === userId);

    if (userIncidents.length === 0) {
        list.innerHTML = "<p>No tienes incidentes reportados.</p>";
        return;
    }

    userIncidents.forEach(inc => {
        const item = document.createElement("div");
        item.className = "incident-card";

        let priorityColor = inc.priority === "high" ? "red" : inc.priority === "medium" ? "orange" : "green";
        let priorityTxt = inc.priority === "high" ? "Alta" : inc.priority === "medium" ? "Media" : "Baja";

        let statusTxt = inc.status === "resolved" ? "Resuelto" : inc.status === "in_progress" ? "En progreso" : "Pendiente";

        item.innerHTML = `
            <div class="incident-header">
                <h4>${inc.title}</h4>
                <div class="incident-badges">
                    <span class="badge" style="background-color: ${priorityColor}">${priorityTxt}</span>
                    <span class="badge ${inc.status}">${statusTxt}</span>
                </div>
            </div>
            <p>${inc.description}</p>
            <div class="incident-actions">
                <button class="edit-btn" onclick='editIncident(${JSON.stringify(inc)})'>Editar</button>
                <button class="delete-btn" onclick="deleteIncident('${inc._id}')">Eliminar</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateCounters(incidents) {
    const userIncidents = incidents.filter(i => i.reportedBy && i.reportedBy._id === userId);

    const total = userIncidents.length;
    const resolved = userIncidents.filter(i => i.status === "resolved").length;
    const pending = userIncidents.filter(i => i.status === "pending" || i.status === "in_progress").length;

    // Asumiendo el orden en dashboard.html es: Total, Aprobadas (Resueltas), Pendientes de Validación
    const cards = document.querySelectorAll(".card");
    if (cards.length >= 3) {
        cards[0].textContent = `Total Incidencias: ${total}`;
        cards[1].textContent = `Incidencias Resueltas: ${resolved}`; // Renombrado en UI para ser consistente
        cards[2].textContent = `Pendientes/Progreso: ${pending}`;
    }
}

async function handleIncident(e) {
    e.preventDefault();

    const isEdit = incidentId.value !== "";
    const endpoint = isEdit ? `http://localhost:3000/api/incidents/${incidentId.value}` : "http://localhost:3000/api/incidents";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
        title: titleInput.value.trim(),
        description: descInput.value.trim(),
        priority: priorityInput.value,
        reportedBy: userId
    };

    if (isEdit) {
        payload.status = statusInput.value;
    }

    try {
        const res = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Error al guardar el incidente");

        resetForm();
        fetchIncidents();
    } catch (error) {
        alert(error.message);
    }
}

function editIncident(inc) {
    incidentId.value = inc._id;
    titleInput.value = inc.title;
    descInput.value = inc.description;
    priorityInput.value = inc.priority;
    statusInput.value = inc.status;

    statusInput.style.display = "inline-block";
    submitBtn.textContent = "Actualizar Incidente";
    cancelBtn.style.display = "inline-block";
    formTitle.textContent = "Editar Incidente";
}

function resetForm() {
    incidentForm.reset();
    incidentId.value = "";
    statusInput.style.display = "none";
    submitBtn.textContent = "Guardar Incidente";
    cancelBtn.style.display = "none";
    formTitle.textContent = "Reportar Nuevo Incidente";
}

async function deleteIncident(id) {
    if (!confirm("¿Estás seguro de eliminar este incidente?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/incidents/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) throw new Error("Error al eliminar");

        fetchIncidents();
    } catch (error) {
        alert(error.message);
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "login.html";
}
