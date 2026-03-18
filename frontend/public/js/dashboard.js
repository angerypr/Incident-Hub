const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

if (!token || !userId) {
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    fetchIncidents();
    initMap();
});

let map;
let marker;

function initMap() {
    // Coordenadas genericas (centro del mundo o una ciudad clave, ej. CDMX: [19.4326, -99.1332])
    map = L.map('mapSelector').setView([19.4326, -99.1332], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
    }).addTo(map);

    map.on('click', function(e) {
        placeMarker(e.latlng);
    });
}

function placeMarker(latlng) {
    if (marker) {
        marker.setLatLng(latlng);
    } else {
        marker = L.marker(latlng).addTo(map);
    }
    document.getElementById('incidentLat').value = latlng.lat;
    document.getElementById('incidentLng').value = latlng.lng;
}

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
        list.innerHTML = "<p style='padding: 20px; color: var(--text-muted);'>No tienes incidentes reportados.</p>";
        return;
    }

    userIncidents.forEach(inc => {
        const item = document.createElement("div");
        item.className = "incident-item";

        let statusTxt = inc.status === "resolved" ? "Resuelto" : inc.status === "in_progress" ? "En progreso" : "Pendiente";

        item.innerHTML = `
            <div class="item-title">
                <span class="priority-indicator p-${inc.priority}"></span>
                ${inc.title}
            </div>
            <div class="item-desc" title="${inc.description}">${inc.description}</div>
            <div>
                <span class="badge ${inc.status}">${statusTxt}</span>
            </div>
            <div class="item-actions">
                ${inc.location && inc.location.lat ? `<a href="https://maps.google.com/?q=${inc.location.lat},${inc.location.lng}" target="_blank" class="action-btn" style="background:#e3f2fd; color:#1e88e5;" title="Ver en Google Maps"><i class="ph ph-map-pin"></i></a>` : ''}
                <button class="action-btn edit-action" title="Editar" onclick='editIncident(${JSON.stringify(inc)})'>
                    <i class="ph ph-pencil-simple"></i>
                </button>
                <button class="action-btn delete-action" title="Eliminar" onclick="deleteIncident('${inc._id}')">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateCounters(incidents) {
    const userIncidents = incidents.filter(i => i.reportedBy && i.reportedBy._id === userId);

    const total = userIncidents.length;
    const resolved = incidents.filter(i => i.status === "resolved").length;
    const isCritical = incidents.filter(i => i.priority === "high" && i.status !== "resolved").length;
    const pending = incidents.filter(i => i.status === "pending" || i.status === "in_progress").length;

    // Actualizar el "Hero card"
    const totalCountHero = document.querySelector(".hero-info h1");
    if (totalCountHero) totalCountHero.innerHTML = `${total}`;

    // Actualizar las '.stat-card' (Resueltas, Pendientes, Críticas)
    const cards = document.querySelectorAll(".stat-card .stat-body h2");
    if (cards.length >= 3) {
        cards[0].textContent = `${resolved}`; // Aprobadas / Resueltas
        cards[1].textContent = `${pending}`; // Pendientes de Validación
        cards[2].textContent = `${isCritical}`; // Incidentes Críticos
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

    const lat = document.getElementById('incidentLat').value;
    const lng = document.getElementById('incidentLng').value;
    if (lat && lng) {
        payload.location = {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        };
    }

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

    if (inc.location && inc.location.lat) {
        placeMarker({ lat: inc.location.lat, lng: inc.location.lng });
        map.setView([inc.location.lat, inc.location.lng], 15);
    } else {
        if (marker) map.removeLayer(marker);
        marker = null;
        document.getElementById('incidentLat').value = "";
        document.getElementById('incidentLng').value = "";
    }
}

function resetForm() {
    incidentForm.reset();
    incidentId.value = "";
    statusInput.style.display = "none";
    submitBtn.textContent = "Guardar Incidente";
    cancelBtn.style.display = "none";
    formTitle.textContent = "Reportar Nuevo Incidente";

    if (marker) map.removeLayer(marker);
    marker = null;
    document.getElementById('incidentLat').value = "";
    document.getElementById('incidentLng').value = "";
    map.setView([19.4326, -99.1332], 5);
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
