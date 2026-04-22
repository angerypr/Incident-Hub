const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");

if (!token || !userId) {
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
        const emailLabel = document.getElementById("userEmailLabel");
        if (emailLabel) emailLabel.textContent = userEmail;

        const topbarName = document.getElementById("topbarUserName");
        if (topbarName) {
            // Convierte "juan@gmail.com" -> "Juan"
            const namePart = userEmail.split('@')[0];
            topbarName.textContent = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        }
    }
    fetchIncidents();
    initMap();
    fetchCatalogs();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.getAttribute('href') === 'configuracion.html') return;
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if (!target) return;

            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
            document.getElementById(target).classList.add('active');

            if (target === 'report-view') {
                setTimeout(() => { if (map) map.invalidateSize(); }, 300);
            }

            if (target === 'public-incidents-view') {
                setTimeout(() => { if (globalIncidentsMap) globalIncidentsMap.invalidateSize(); }, 300);
                loadPublicIncidents();
            }
        });
    });

    const publicSearchInput = document.getElementById('publicSearchInput');
    if (publicSearchInput) {
        publicSearchInput.addEventListener('input', (e) => {
            renderPublicIncidents(e.target.value);
        });
    }
});

window._publicIncidentsData = [];
let globalIncidentsMap;
let globalMarkersLayer;

function getGlobalMap() {
    if (!globalIncidentsMap) {
        globalIncidentsMap = L.map('globalIncidentsMap').setView([18.735693, -70.162651], 7);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(globalIncidentsMap);
        globalMarkersLayer = L.layerGroup().addTo(globalIncidentsMap);
    }
    return globalIncidentsMap;
}

async function loadPublicIncidents() {
    try {
        const res = await fetch('/api/incidents');
        const data = await res.json();
        window._publicIncidentsData = data.filter(inc => inc.validationStatus === 'published');

        renderPublicIncidents();
    } catch (e) {
        console.error("Error cargando incidencias públicas", e);
    }
}

function renderPublicIncidents(searchTerm = '') {
    const container = document.getElementById('public-incidents-container');
    container.innerHTML = '';

    let filtered = window._publicIncidentsData;

    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(inc => {
            const t = inc.title?.toLowerCase() || '';
            const d = inc.description?.toLowerCase() || '';
            const type = inc.incidentType?.name?.toLowerCase() || '';
            const prov = inc.provinceId?.name?.toLowerCase() || '';
            const muni = inc.municipalityId?.name?.toLowerCase() || '';
            const neigh = inc.neighborhoodId?.name?.toLowerCase() || '';

            return t.includes(term) || d.includes(term) || type.includes(term) ||
                prov.includes(term) || muni.includes(term) || neigh.includes(term);
        });
    }

    getGlobalMap();
    if (globalMarkersLayer) globalMarkersLayer.clearLayers();

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1;">No se encontraron incidencias publicadas que coincidan con la búsqueda.</p>';
        return;
    }

    filtered.forEach(inc => {
        if (inc.location && inc.location.lat && inc.location.lng) {
            const marker = L.marker([inc.location.lat, inc.location.lng]);
            marker.on('click', () => {
                openPublicIncidentDetails(inc._id);
            });
            const bubbleHtml = `
                <div style="font-family:'Poppins'; padding:3px;">
                    <strong style="color:var(--text-primary);">${inc.title}</strong><br>
                    <span style="color:#60a5fa; font-size:12px;">${inc.incidentType?.name || 'General'}</span>
                </div>
            `;
            marker.bindTooltip(bubbleHtml, { direction: 'top', className: 'custom-tooltip' });
            globalMarkersLayer.addLayer(marker);
        }

        const locString = inc.provinceId?.name ? `${inc.provinceId.name} - ${inc.municipalityId?.name || ''}` : 'Ubicación no especificada';


        container.innerHTML += `
            <div class="public-card" style="cursor: pointer;" onclick="openPublicIncidentDetails('${inc._id}')">
                ${inc.imageBase64 ? `<img src="${inc.imageBase64}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">` : ''}
                <div class="public-header">
                    <h4 class="public-title">${inc.title}</h4>
                    <span class="public-date"><i class="ph ph-clock"></i> ${new Date(inc.occurrenceDate || inc.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="public-meta">
                    <span><i class="ph ph-warning-circle" style="color:#ef4444;"></i> ${inc.incidentType?.name || 'Reporte General'}</span>
                    <span><i class="ph ph-map-pin" style="color:#60a5fa;"></i> ${locString}</span>
                </div>
                <p class="public-desc">${inc.description.substring(0, 140)}...</p>
                <div style="font-size: 12px; color: var(--text-muted); display:flex; gap: 15px; margin-top: auto; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.05);">
                    <span><i class="ph ph-skull" style="color:#f87171;"></i> Fallecidos: ${inc.deaths || 0}</span>
                    <span><i class="ph ph-first-aid" style="color:#fbbf24;"></i> Heridos: ${inc.injured || 0}</span>
                    ${inc.socialLink ? `<a href="${inc.socialLink}" target="_blank" onclick="event.stopPropagation();" style="margin-left:auto; color:#60a5fa; text-decoration:none;"><i class="ph ph-link"></i> Ver enlace</a>` : ''}
                </div>
            </div>
        `;
    });
}

function obfuscateEmail(email) {
    if (!email) return 'Anónimo';
    const split = email.split('@');
    if (split.length !== 2) return email;
    const name = split[0];
    if (name.length <= 2) return name + '***@' + split[1];
    return name.substring(0, 2) + '***@' + split[1];
}

window.openPublicIncidentDetails = function (id) {
    const inc = window._publicIncidentsData.find(i => i._id === id);
    if (!inc) return;

    const existingModal = document.getElementById('details-modal');
    if (existingModal) existingModal.remove();

    const locString = inc.provinceId?.name ? `${inc.provinceId.name} > ${inc.municipalityId?.name || ''} > ${inc.neighborhoodId?.name || ''}` : 'Ubicación no especificada';
    const obfuscatedAuthor = obfuscateEmail(inc.reportedBy?.email);

    let commentsHtml = '';
    if (inc.comments && inc.comments.length > 0) {
        commentsHtml = inc.comments.map(c => `
            <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #60a5fa; font-size: 12px; font-weight: 500;"><i class="ph-fill ph-user-circle"></i> ${obfuscateEmail(c.userEmail)}</span>
                    <span style="color: #64748b; font-size: 11px;">${new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p style="margin: 0; color: #cbd5e1; font-size: 14px;">${c.content}</p>
            </div>
        `).join('');
    } else {
        commentsHtml = '<p style="color: #64748b; font-size: 13px; text-align: center; padding: 20px 0;">No hay comentarios todavía. Sé el primero en opinar.</p>';
    }

    let modalHtml = `
    <div id="details-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">
        <div style="background: rgba(30, 41, 59, 0.75); padding: 30px; border-radius: 20px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
            <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 5px 0; font-size: 20px; color: #ffffff;">${inc.title} <span style="display:inline-block; font-size:12px; font-weight:normal; background: rgba(16,185,129,0.2); color:#10b981; padding:2px 8px; border-radius:12px; margin-left:8px; vertical-align:middle;">Publicado</span></h3>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #60a5fa;"><i class="ph ph-user"></i> Publicado por: ${obfuscatedAuthor}</p>
                    <p style="margin: 0; font-size: 13px; color: #94a3b8;"><i class="ph ph-calendar"></i> Reportado el: ${new Date(inc.createdAt || Date.now()).toLocaleString()}</p>
                    ${inc.occurrenceDate ? `<p style="margin: 0; font-size: 13px; color: #94a3b8;"><i class="ph ph-clock"></i> Ocurrió el: ${new Date(inc.occurrenceDate).toLocaleString()}</p>` : ''}
                </div>
                <button onclick="document.getElementById('details-modal').remove()" style="background:none; border:none; font-size: 24px; cursor: pointer; color: #94a3b8;"><i class="ph ph-x"></i></button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h5 style="margin: 0 0 8px 0; color: #cbd5e1; font-size: 13px; text-transform: uppercase; font-weight: 600;">Descripcion</h5>
                <p style="margin: 0; font-size: 15px; color: #f8fafc; line-height: 1.6;">${inc.description}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: rgba(15, 23, 42, 0.4); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <div>
                    <h5 style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Tipo / Categoria</h5>
                    <p style="margin: 0; font-size: 14px; color: #f8fafc; font-weight: 500;">${inc.incidentType?.name || 'No especificado'}</p>
                </div>
                <div>
                    <h5 style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Prioridad</h5>
                    <p style="margin: 0; font-size: 14px; color: #f8fafc; font-weight: 500;">${inc.priority || 'Normal'}</p>
                </div>
                <div style="grid-column: 1 / -1;">
                    <h5 style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Ubicacion y Mapa</h5>
                    <p style="margin: 0; font-size: 14px; color: #f8fafc; font-weight: 500;">
                        ${locString}
                    </p>
                </div>
                <div>
                    <h5 style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Víctimas Reportadas</h5>
                    <p style="margin: 0; font-size: 14px; color: #f8fafc; font-weight: 500;"><span style="color:#ef4444;">Muertos: ${inc.deaths || 0}</span> | <span style="color:#eab308;">Heridos: ${inc.injured || 0}</span></p>
                </div>
                <div>
                    <h5 style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Enlace Fuente / Social</h5>
                    <p style="margin: 0; font-size: 14px; font-weight: 500;">
                        ${inc.socialLink ? `<a href="${inc.socialLink}" target="_blank" style="color: #60a5fa; text-decoration: none;"><i class="ph ph-link"></i> Ver Enlace</a>` : '<span style="color: #64748b;">No adjunto</span>'}
                    </p>
                </div>
            </div>

            ${inc.imageBase64 ? `
            <div style="margin-bottom: 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); padding: 10px; border-radius: 12px; background: rgba(0,0,0,0.2);">
                <img src="${inc.imageBase64}" style="max-width: 100%; border-radius: 8px; max-height: 350px; object-fit: contain;">
            </div>
            ` : ''}

            <div style="margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #f8fafc; font-size: 16px;"><i class="ph ph-chat-teardrop-text"></i> Comentarios Comunitarios</h4>
                <div style="max-height: 250px; overflow-y: auto; margin-bottom: 15px; padding-right: 5px;" class="custom-scrollbar">
                    ${commentsHtml}
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="newCommentInput_${inc._id}" placeholder="Escribe un comentario..." style="flex: 1; padding: 12px 15px; border-radius: 8px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); color: white; outline: none; font-family: 'Poppins';">
                    <button onclick="submitPublicComment('${inc._id}')" class="btn-primary" style="padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; white-space: nowrap; margin: 0;"><i class="ph ph-paper-plane-right"></i> Enviar</button>
                </div>
            </div>

            <div style="display:flex; justify-content: flex-end; gap: 12px; padding-top: 15px; margin-top: 20px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <button class="btn-flex" onclick="document.getElementById('details-modal').remove()" style="padding: 10px 16px; font-size: 14px; background: rgba(255,255,255,0.1); color: #cbd5e1; flex: 0 1 auto; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; border-radius: 6px;">Cerrar Detalle</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.submitPublicComment = async function (id) {
    const input = document.getElementById(`newCommentInput_${id}`);
    const content = input.value.trim();
    if (!content) return;

    const userEmail = localStorage.getItem('userEmail') || 'anonimo@hub.com';
    const oldHtml = input.innerHTML;
    input.disabled = true;

    try {
        const res = await fetch(`/api/incidents/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail, content })
        });
        if (res.ok) {
            await loadPublicIncidents();
            openPublicIncidentDetails(id);
        } else {
            console.error("Error del servidor al comentar");
            input.disabled = false;
        }
    } catch (e) {
        console.error("Error posteando comentario", e);
        input.disabled = false;
    }
};

let map;
let marker;
let allIncidents = [];

function initMap() {

    map = L.map('mapSelector').setView([19.4326, -99.1332], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
    }).addTo(map);

    map.on('click', function (e) {
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


const incidentForm = document.getElementById("incidentForm");
const incidentId = document.getElementById("incidentId");
const titleInput = document.getElementById("incidentTitle");
const descInput = document.getElementById("incidentDescription");
const priorityInput = document.getElementById("incidentPriority");
const statusInput = document.getElementById("incidentStatus");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");

const incidentDate = document.getElementById("incidentDate");
const incidentTypeSelect = document.getElementById("incidentTypeSelect");
const incidentProvince = document.getElementById("incidentProvince");
const incidentMunicipality = document.getElementById("incidentMunicipality");
const incidentNeighborhood = document.getElementById("incidentNeighborhood");
const incidentDeaths = document.getElementById("incidentDeaths");
const incidentInjured = document.getElementById("incidentInjured");
const incidentSocialLink = document.getElementById("incidentSocialLink");
const incidentImage = document.getElementById("incidentImage");

let imageBase64Data = "";

async function fetchCatalogs() {
    try {
        const [typesRes, provRes] = await Promise.all([
            fetch("/api/admin/incident-types"),
            fetch("/api/admin/provinces")
        ]);
        const types = await typesRes.json();
        const provinces = await provRes.json();

        types.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t._id; opt.textContent = t.name;
            if (incidentTypeSelect) incidentTypeSelect.appendChild(opt);
        });

        provinces.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p._id; opt.textContent = p.name;
            if (incidentProvince) incidentProvince.appendChild(opt);
        });
    } catch (e) { console.error("Error fetching catalogs", e); }
}

if (incidentProvince) {
    incidentProvince.addEventListener("change", async (e) => {
        incidentMunicipality.innerHTML = '<option value="">Seleccione municipio...</option>';
        incidentNeighborhood.innerHTML = '<option value="">Seleccione barrio...</option>';
        incidentMunicipality.disabled = true;
        incidentNeighborhood.disabled = true;

        if (!e.target.value) return;

        try {
            const res = await fetch(`/api/admin/municipalities?provinceId=${e.target.value}`);
            const munis = await res.json();
            munis.forEach(m => {
                const opt = document.createElement("option");
                opt.value = m._id; opt.textContent = m.name;
                incidentMunicipality.appendChild(opt);
            });
            incidentMunicipality.disabled = false;
        } catch (err) { console.error(err); }
    });
}

if (incidentMunicipality) {
    incidentMunicipality.addEventListener("change", async (e) => {
        incidentNeighborhood.innerHTML = '<option value="">Seleccione barrio...</option>';
        incidentNeighborhood.disabled = true;

        if (!e.target.value) return;

        try {
            const res = await fetch(`/api/admin/neighborhoods?municipalityId=${e.target.value}`);
            const neighs = await res.json();
            neighs.forEach(n => {
                const opt = document.createElement("option");
                opt.value = n._id; opt.textContent = n.name;
                incidentNeighborhood.appendChild(opt);
            });
            incidentNeighborhood.disabled = false;
        } catch (err) { console.error(err); }
    });
}

if (incidentImage) {
    incidentImage.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { imageBase64Data = reader.result; };
            reader.readAsDataURL(file);
        } else {
            imageBase64Data = "";
        }
    });
}

incidentForm.addEventListener("submit", handleIncident);

const filterStatus = document.getElementById("filterStatus");
if (filterStatus) {
    filterStatus.addEventListener("change", () => renderIncidents(allIncidents));
}

async function fetchIncidents() {
    try {
        const response = await fetch("/api/incidents");
        allIncidents = await response.json();

        renderIncidents(allIncidents);
        updateCounters(allIncidents);
    } catch (error) {
        console.error("Error al cargar incidentes:", error);
    }
}

function renderIncidents(incidents) {
    const list = document.getElementById("incidentsList");
    list.innerHTML = "";


    let userIncidents = incidents.filter(i => i.reportedBy && i.reportedBy._id === userId);

    const filterVal = document.getElementById("filterStatus")?.value || 'all';
    if (filterVal !== 'all') {
        userIncidents = userIncidents.filter(i => i.validationStatus === filterVal);
    }

    if (userIncidents.length === 0) {
        list.innerHTML = "<p style='padding: 20px; color: var(--text-muted);' data-i18n='empty_list'>No tienes incidentes reportados para este filtro.</p>";
        applyLanguage(localStorage.getItem('lang') || 'es');
        return;
    }

    userIncidents.forEach(inc => {
        const item = document.createElement("div");
        item.className = "incident-item";

        let statusKey = "";
        let badgeClass = "";

        if (inc.validationStatus === "published") {
            statusKey = "approved_filter";
            badgeClass = "resolved";
        } else if (inc.validationStatus === "rejected") {
            statusKey = "rejected_filter";
            badgeClass = "rejected";
        } else {
            statusKey = "st_pending";
            badgeClass = "pending";
        }

        item.innerHTML = `
            <div class="item-title">
                <span class="priority-indicator p-${inc.priority}"></span>
                ${inc.title}
            </div>
            <div class="item-desc" title="${inc.description}">${inc.description}</div>
            <div>
                <span class="badge ${badgeClass}" data-i18n="${statusKey}">...</span>
            </div>
            <div class="item-actions">
                ${inc.location && inc.location.lat ? `<a href="https://maps.google.com/?q=${inc.location.lat},${inc.location.lng}" target="_blank" class="action-btn" style="background:rgba(59,130,246,0.2); color:#60a5fa;" title="Ver en Google Maps"><i class="ph ph-map-pin"></i></a>` : ''}
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

    applyLanguage(localStorage.getItem('lang') || 'es');
}

function updateCounters(incidents) {
    const userIncidents = incidents.filter(i => i.reportedBy && i.reportedBy._id === userId);

    const total = userIncidents.length;
    const resolved = userIncidents.filter(i => i.validationStatus === "published").length;
    const pending = userIncidents.filter(i => i.validationStatus === "pending").length;
    const rejected = userIncidents.filter(i => i.validationStatus === "rejected").length;

    const totalCountHero = document.getElementById("heroTotalIncidents");
    if (totalCountHero) totalCountHero.innerHTML = `${total}`;

    const cards = document.querySelectorAll(".stat-card .stat-body h2");
    if (cards.length >= 3) {
        cards[0].textContent = `${resolved}`;
        cards[1].textContent = `${pending}`;
        cards[2].textContent = `${rejected}`;
    }
}

async function handleIncident(e) {
    e.preventDefault();

    const isEdit = incidentId.value !== "";
    const endpoint = isEdit ? `/api/incidents/${incidentId.value}` : "/api/incidents";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
        title: titleInput.value.trim(),
        occurrenceDate: incidentDate.value,
        incidentType: incidentTypeSelect.value,
        description: descInput.value.trim(),
        provinceId: incidentProvince.value,
        municipalityId: incidentMunicipality.value,
        neighborhoodId: incidentNeighborhood.value,
        priority: priorityInput.value,
        deaths: Number(incidentDeaths.value),
        injured: Number(incidentInjured.value),
        socialLink: incidentSocialLink.value.trim(),
        imageBase64: imageBase64Data,
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
        document.querySelector('[data-target="home-view"]').click();
    } catch (error) {
        alert(error.message);
    }
}

function editIncident(inc) {
    incidentId.value = inc._id;
    titleInput.value = inc.title;

    if (inc.occurrenceDate) {
        incidentDate.value = new Date(inc.occurrenceDate).toISOString().slice(0, 16);
    } else { incidentDate.value = ""; }

    incidentTypeSelect.value = inc.incidentType?._id || inc.incidentType || "";
    descInput.value = inc.description;

    // Set priority
    priorityInput.value = inc.priority;
    statusInput.value = inc.status;

    // Extract _id from populated objects for province, then load cascading dropdowns
    const provinceVal = inc.provinceId?._id || inc.provinceId || "";
    incidentProvince.value = provinceVal;
    incidentMunicipality.innerHTML = '<option value="">Seleccione municipio...</option>';
    incidentMunicipality.disabled = true;
    incidentNeighborhood.innerHTML = '<option value="">Seleccione barrio...</option>';
    incidentNeighborhood.disabled = true;

    incidentDeaths.value = inc.deaths || 0;
    incidentInjured.value = inc.injured || 0;
    incidentSocialLink.value = inc.socialLink || "";
    imageBase64Data = inc.imageBase64 || "";
    incidentImage.value = ""; // Can't set file input value programmatically

    statusInput.style.display = "inline-block";
    submitBtn.textContent = "Actualizar Incidente";
    submitBtn.setAttribute("data-i18n", "update_incident");
    cancelBtn.style.display = "inline-block";
    formTitle.textContent = "Editar Incidente";
    formTitle.setAttribute("data-i18n", "edit_incident");

    if (inc.location && inc.location.lat) {
        placeMarker({ lat: inc.location.lat, lng: inc.location.lng });
        map.setView([inc.location.lat, inc.location.lng], 15);
    } else {
        if (marker) map.removeLayer(marker);
        marker = null;
        document.getElementById('incidentLat').value = "";
        document.getElementById('incidentLng').value = "";
    }
    document.querySelector('[data-target="report-view"]').click();

    // Invalidate map size so it renders fully if the tab was hidden
    setTimeout(() => { if (map) map.invalidateSize(); }, 300);
}

function resetForm() {
    incidentForm.reset();
    incidentId.value = "";
    imageBase64Data = "";

    incidentMunicipality.innerHTML = '<option value="">Seleccione municipio...</option>';
    incidentMunicipality.disabled = true;
    incidentNeighborhood.innerHTML = '<option value="">Seleccione barrio...</option>';
    incidentNeighborhood.disabled = true;

    statusInput.style.display = "none";
    submitBtn.textContent = "Guardar Incidente";
    submitBtn.setAttribute("data-i18n", "save_incident");
    cancelBtn.style.display = "none";
    formTitle.textContent = "Reportar Nuevo Incidente";
    formTitle.setAttribute("data-i18n", "report_incident");

    if (marker) map.removeLayer(marker);
    marker = null;
    document.getElementById('incidentLat').value = "";
    document.getElementById('incidentLng').value = "";
    map.setView([19.4326, -99.1332], 5);
}

async function deleteIncident(id) {
    if (!confirm("¿Estás seguro de eliminar este incidente?")) return;

    try {
        const res = await fetch(`/api/incidents/${id}`, {
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
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}
