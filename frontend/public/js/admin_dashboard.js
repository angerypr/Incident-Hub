document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    loadStats();
    loadCatalogs();
    loadCatalogs();
    loadValidations();
    loadMergeOptions();
    initSettings();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    const viewTitle = document.getElementById('view-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(item.dataset.target).classList.add('active');
            viewTitle.textContent = item.textContent.trim();

            if(item.dataset.target === 'stats-view') loadStats();
            if(item.dataset.target === 'validations-view') loadValidations();
            if(item.dataset.target === 'merge-view') loadMergeOptions();
            if(item.dataset.target === 'catalogs-view') loadCatalogs();
            if(item.dataset.target === 'catalogs-view') loadCatalogs();
        });
    });
}

function initSettings() {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        if (localStorage.getItem("theme") === "light") {
            themeToggle.checked = true;
            document.documentElement.classList.add("light-mode");
        }

        themeToggle.addEventListener("change", (e) => {
            if (e.target.checked) {
                document.documentElement.classList.add("light-mode");
                localStorage.setItem("theme", "light");
            } else {
                document.documentElement.classList.remove("light-mode");
                localStorage.setItem("theme", "dark");
            }
        });
    }

    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
        if (localStorage.getItem("lang")) {
            languageSelect.value = localStorage.getItem("lang");
        }
        
        languageSelect.addEventListener("change", (e) => {
            const lang = e.target.value;
            localStorage.setItem("lang", lang);
            if(window.applyLanguage) {
                window.applyLanguage(lang);
            }
        });
    }
}

async function loadStats() {
    try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        document.getElementById('stat-users').textContent = data.totalUsers || 0;
        document.getElementById('stat-total').textContent = data.totalIncidents || 0;
        document.getElementById('stat-pending').textContent = data.pendingValidations || 0;
        document.getElementById('stat-published').textContent = data.published || 0;
    } catch(e) { console.error(e); }
}

async function loadCatalogs() {
    await fetchProvinces();
    await fetchMunicipalities();
    await fetchNeighborhoods();
    await fetchIncidentTypes();
}

async function fetchProvinces() {
    const res = await fetch('/api/admin/provinces');
    const data = await res.json();
    
    const list = document.getElementById('list-provinces');
    list.innerHTML = '';
    const select = document.getElementById('mun-province-select');
    select.innerHTML = '<option value="">Provincia...</option>';
    
    data.forEach(p => {
        list.innerHTML += `
        <li>
            <div>
                <span class="item-name">${p.name}</span>
            </div>
            <div class="action-group">
                <button class="btn-small btn-edit" onclick="promptEditProvince('${p._id}', '${p.name}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                <button class="btn-small btn-delete" onclick="deleteProvince('${p._id}')" title="Eliminar"><i class="ph ph-trash"></i></button>
            </div>
        </li>`;
        select.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });
}

document.getElementById('form-province').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('province-name').value;
    try {
        const res = await fetch('/api/admin/provinces', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
        });
        const data = await res.json();
        if(!res.ok) return alert("Error al guardar: " + (data.error || "Datos duplicados o invalidos"));
        document.getElementById('province-name').value = '';
        fetchProvinces();
    } catch(err) { alert("Error de conexion"); }
});

window.promptEditProvince = async function(id, oldName) {
    const newName = prompt("Nuevo nombre para la provincia:", oldName);
    if (!newName || newName === oldName) return;
    try {
        const res = await fetch(`/api/admin/provinces/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: newName}) });
        const data = await res.json();
        if(!res.ok) alert("Error al editar: " + (data.error || "Datos invalidos"));
        fetchProvinces();
    } catch(err) { alert("Error de conexion"); }
};

window.deleteProvince = async function(id) {
    if (!confirm("Eliminar esta provincia? Podria afectar registros vinculados.")) return;
    try {
        await fetch(`/api/admin/provinces/${id}`, { method: 'DELETE' });
        fetchProvinces();
    } catch(err) { alert("Error de conexion"); }
};

async function fetchMunicipalities() {
    const res = await fetch('/api/admin/municipalities');
    const data = await res.json();
    
    const list = document.getElementById('list-municipalities');
    list.innerHTML = '';
    const select = document.getElementById('neigh-municipality-select');
    select.innerHTML = '<option value="">Municipio...</option>';
    
    data.forEach(m => {
        list.innerHTML += `
        <li>
            <div>
                <span class="item-name">${m.name}</span>
                <span class="item-parent">Provincia: ${m.provinceId?.name || 'N/A'}</span>
            </div>
            <div class="action-group">
                <button class="btn-small btn-edit" onclick="promptEditMunicipality('${m._id}', '${m.name}', '${m.provinceId?._id}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                <button class="btn-small btn-delete" onclick="deleteMunicipality('${m._id}')" title="Eliminar"><i class="ph ph-trash"></i></button>
            </div>
        </li>`;
        select.innerHTML += `<option value="${m._id}">${m.name}</option>`;
    });
}

document.getElementById('form-municipality').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('municipality-name').value;
    const provinceId = document.getElementById('mun-province-select').value;
    try {
        const res = await fetch('/api/admin/municipalities', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, provinceId })
        });
        const data = await res.json();
        if(!res.ok) return alert("Error al guardar: " + (data.error || "Datos invalidos"));
        document.getElementById('municipality-name').value = '';
        fetchMunicipalities();
    } catch(err) { alert("Error de conexion"); }
});

window.promptEditMunicipality = async function(id, oldName, provId) {
    const newName = prompt("Nuevo nombre para el municipio:", oldName);
    if (!newName || newName === oldName) return;
    try {
        const res = await fetch(`/api/admin/municipalities/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: newName, provinceId: provId}) });
        const data = await res.json();
        if(!res.ok) alert("Error al editar: " + (data.error || "Datos invalidos"));
        fetchMunicipalities();
    } catch(err) { alert("Error de conexion"); }
};

window.deleteMunicipality = async function(id) {
    if (!confirm("Eliminar este municipio?")) return;
    await fetch(`/api/admin/municipalities/${id}`, { method: 'DELETE' });
    fetchMunicipalities();
};

async function fetchNeighborhoods() {
    const res = await fetch('/api/admin/neighborhoods');
    const data = await res.json();
    
    const list = document.getElementById('list-neighborhoods');
    list.innerHTML = '';
    
    data.forEach(n => {
        list.innerHTML += `
        <li>
            <div>
                <span class="item-name">${n.name}</span>
                <span class="item-parent">Municipio: ${n.municipalityId?.name || 'N/A'}</span>
            </div>
            <div class="action-group">
                <button class="btn-small btn-edit" onclick="promptEditNeighborhood('${n._id}', '${n.name}', '${n.municipalityId?._id}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                <button class="btn-small btn-delete" onclick="deleteNeighborhood('${n._id}')" title="Eliminar"><i class="ph ph-trash"></i></button>
            </div>
        </li>`;
    });
}

document.getElementById('form-neighborhood').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('neighborhood-name').value;
    const municipalityId = document.getElementById('neigh-municipality-select').value;
    try {
        const res = await fetch('/api/admin/neighborhoods', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, municipalityId })
        });
        const data = await res.json();
        if(!res.ok) return alert("Error al guardar: " + (data.error || "Datos invalidos"));
        document.getElementById('neighborhood-name').value = '';
        fetchNeighborhoods();
    } catch(err) { alert("Error de conexion"); }
});

window.promptEditNeighborhood = async function(id, oldName, munId) {
    const newName = prompt("Nuevo nombre para el barrio:", oldName);
    if (!newName || newName === oldName) return;
    try {
        const res = await fetch(`/api/admin/neighborhoods/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: newName, municipalityId: munId}) });
        const data = await res.json();
        if(!res.ok) alert("Error al editar: " + (data.error || "Datos invalidos"));
        fetchNeighborhoods();
    } catch(err) { alert("Error de conexion"); }
};

window.deleteNeighborhood = async function(id) {
    if (!confirm("Eliminar este barrio?")) return;
    await fetch(`/api/admin/neighborhoods/${id}`, { method: 'DELETE' });
    fetchNeighborhoods();
};

async function fetchIncidentTypes() {
    const res = await fetch('/api/admin/incident-types');
    const data = await res.json();
    
    const list = document.getElementById('list-incident-types');
    list.innerHTML = '';
    
    data.forEach(t => {
        list.innerHTML += `
        <li>
            <div>
                <span class="item-name">${t.name}</span>
            </div>
            <div class="action-group">
                <button class="btn-small btn-edit" onclick="promptEditIncidentType('${t._id}', '${t.name}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                <button class="btn-small btn-delete" onclick="deleteIncidentType('${t._id}')" title="Eliminar"><i class="ph ph-trash"></i></button>
            </div>
        </li>`;
    });
}

document.getElementById('form-incident-type').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('itype-name').value;
    try {
        const res = await fetch('/api/admin/incident-types', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
        });
        const data = await res.json();
        if(!res.ok) return alert("Error al guardar: " + (data.error || "Datos duplicados o invalidos"));
        document.getElementById('itype-name').value = '';
        fetchIncidentTypes();
    } catch(err) { alert("Error de conexion"); }
});

window.promptEditIncidentType = async function(id, oldName) {
    const newName = prompt("Nuevo nombre para el tipo de incidente:", oldName);
    if (!newName || newName === oldName) return;
    try {
        const res = await fetch(`/api/admin/incident-types/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: newName}) });
        const data = await res.json();
        if(!res.ok) alert("Error al editar: " + (data.error || "Datos invalidos"));
        fetchIncidentTypes();
    } catch(err) { alert("Error de conexion"); }
};

window.deleteIncidentType = async function(id) {
    if (!confirm("Eliminar este tipo de incidente?")) return;
    await fetch(`/api/admin/incident-types/${id}`, { method: 'DELETE' });
    fetchIncidentTypes();
};

window._pendingIncidentsData = [];

async function loadValidations() {
    const res = await fetch('/api/admin/incidents/pending');
    window._pendingIncidentsData = await res.json();
    const data = window._pendingIncidentsData;
    const container = document.getElementById('validations-container');
    container.innerHTML = '';

    if(data.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b; font-size: 16px;">Genial No hay reportes pendientes de validacion.</div>';
        return;
    }

    data.forEach(inc => {
        container.innerHTML += `
            <div class="incident-card" style="cursor: pointer;" onclick="openValidationDetails('${inc._id}')">
                <div class="incident-header">
                    <h4 class="incident-title">${inc.title}</h4>
                    <span class="incident-date">${new Date(inc.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <p class="incident-desc">${inc.description.substring(0, 100)}...</p>
                <div class="incident-meta">
                    <i class="ph ph-user"></i> ${inc.reportedBy?.email || 'N/A'}
                </div>
                <div class="incident-actions">
                    <button class="btn-flex" style="background:#e2e8f0; color:#475569;" onclick="event.stopPropagation(); window.openValidationDetails('${inc._id}')"><i class="ph ph-eye" style="font-size: 18px;"></i> Ver Detalles</button>
                </div>
            </div>
        `;
    });
}

window.openValidationDetails = function(id) {
    const inc = window._pendingIncidentsData.find(i => i._id === id);
    if(!inc) return;

    const existingModal = document.getElementById('details-modal');
    if(existingModal) existingModal.remove();

    const locString = inc.location && inc.location.lat ? inc.location.lat + ', ' + inc.location.lng : 'No especificada';

    let modalHtml = `
    <div id="details-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">
        <div style="background: rgba(30, 41, 59, 0.75); padding: 30px; border-radius: 20px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
            <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 5px 0; font-size: 20px; color: #ffffff;">${inc.title}</h3>
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
                        ${inc.provinceId?.name || 'N/A'} > ${inc.municipalityId?.name || 'N/A'} > ${inc.neighborhoodId?.name || 'N/A'}
                        <br><span style="color: #64748b; font-size: 12px;">(Coords: ${locString})</span>
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
                <div style="grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; margin-top: 5px;">
                    <h5 style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Reportado por</h5>
                    <p style="margin: 0; font-size: 14px; color: #f8fafc; font-weight: 500;"><i class="ph ph-user"></i> ${inc.reportedBy?.email || 'Anonimo'}</p>
                </div>
            </div>

            ${inc.imageBase64 ? `
            <div style="margin-bottom: 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); padding: 10px; border-radius: 12px; background: rgba(0,0,0,0.2);">
                <h5 style="margin: 0 0 8px 0; color: #cbd5e1; font-size: 13px; text-transform: uppercase; font-weight: 600; text-align: left;">Imagen Adjunta</h5>
                <img src="${inc.imageBase64}" style="max-width: 100%; border-radius: 8px; max-height: 250px; object-fit: contain;">
            </div>
            ` : ''}

            <div style="display:flex; gap: 12px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <button class="btn-flex btn-approve" onclick="document.getElementById('details-modal').remove(); publishIncident('${inc._id}')" style="padding: 12px; font-size: 15px; background: rgba(34,197,94,0.2); color: #4ade80; border: 1px solid rgba(34,197,94,0.3);"><i class="ph ph-check-circle" style="font-size: 20px;"></i> Aprobar Reporte</button>
                <button class="btn-flex btn-reject" onclick="document.getElementById('details-modal').remove(); rejectIncident('${inc._id}')" style="padding: 12px; font-size: 15px; background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.3);"><i class="ph ph-x-circle" style="font-size: 20px;"></i> Rechazar y Eliminar</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.publishIncident = async function(id) {
    if(!confirm("Deseas publicar este incidente? Se mostrara a todos.")) return;
    await fetch(`/api/admin/incidents/${id}/publish`, { method: 'PUT' });
    loadValidations();
    loadStats();
    loadMergeOptions();
};

window.rejectIncident = async function(id) {
    if(!confirm("Deseas rechazar y archivar este incidente?")) return;
    await fetch(`/api/admin/incidents/${id}/reject`, { method: 'PUT' });
    loadValidations();
    loadStats();
    loadMergeOptions();
};

async function loadMergeOptions() {
    const res = await fetch('/api/admin/incidents/pending'); 
    window._pendingIncidentsData = await res.json();
    const data = window._pendingIncidentsData;
    
    const container = document.getElementById('merge-container');
    container.innerHTML = '';
    
    const mergeBtn = document.getElementById('btn-merge-selected');
    if(mergeBtn) mergeBtn.style.display = 'none';

    if(data.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b; font-size: 16px;">Vaya, no hay reportes pendientes para fusionar.</div>';
        return;
    }

    data.forEach(inc => {
        container.innerHTML += `
            <div class="incident-card" style="position: relative;">
                <input type="checkbox" class="validation-checkbox" value="${inc._id}" style="position: absolute; top: 22px; right: 20px; transform: scale(1.3); cursor: pointer; accent-color: #a855f7;" onchange="window.toggleMergeButton()">
                <div class="incident-header" style="padding-right: 30px;">
                    <h4 class="incident-title">${inc.title}</h4>
                    <span class="incident-date">${new Date(inc.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <p class="incident-desc">${inc.description.substring(0, 100)}...</p>
                <div class="incident-meta">
                    <i class="ph ph-user"></i> ${inc.reportedBy?.email || 'N/A'}
                </div>
            </div>
        `;
    });
}

window.toggleMergeButton = function() {
    const checked = document.querySelectorAll('.validation-checkbox:checked');
    const btn = document.getElementById('btn-merge-selected');
    if (!btn) return;
    if (checked.length > 1) {
        btn.style.display = 'inline-flex';
        btn.innerHTML = `<i class="ph ph-git-merge" style="margin-right: 5px;"></i> Fusionar ${checked.length} Seleccionados`;
    } else {
        btn.style.display = 'none';
    }
};

window.promptMergeSelected = async function() {
    const checkboxes = Array.from(document.querySelectorAll('.validation-checkbox:checked'));
    if(checkboxes.length < 2) return;
    const ids = checkboxes.map(cb => cb.value);
    
    const existingModal = document.getElementById('merge-modal');
    if(existingModal) existingModal.remove();

    let modalHtml = `
    <div id="merge-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">
        <div style="background: rgba(30, 41, 59, 0.75); padding: 30px; border-radius: 20px; width: 450px; max-width: 90%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 18px; color: #ffffff;">Fusionar Reportes</h3>
                <button onclick="document.getElementById('merge-modal').remove()" style="background:none; border:none; font-size: 20px; cursor: pointer; color: #94a3b8;"><i class="ph ph-x"></i></button>
            </div>
            <p style="font-size:14px; color:#cbd5e1; margin-bottom: 20px; line-height: 1.5;">Selecciona cual de los reportes es el <strong>mas completo</strong>. Este sera el reporte principal y se conservara intacto. Los demas se fusionaran dentro de este (se eliminaran).</p>
            <select id="modal-merge-primary" style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px; font-family: 'Poppins'; color: #ffffff; background: rgba(15,23,42,0.8); outline: none;">
    `;
    
    window._pendingIncidentsData.filter(i => ids.includes(i._id)).forEach(inc => {
        modalHtml += `<option value="${inc._id}">${inc.title}</option>`;
    });

    modalHtml += `
            </select>
            <div style="display:flex; justify-content: flex-end; gap: 10px;">
                <button class="btn-danger" style="background:transparent; border:1px solid rgba(255,255,255,0.1); color:#cbd5e1;" onclick="document.getElementById('merge-modal').remove()">Cancelar</button>
                <button class="btn-primary" style="background: linear-gradient(135deg, #c084fc, #9333ea); border: none;" onclick="window.confirmMergeModal()">Fusionar Reportes</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    window.confirmMergeModal = async function() {
        const primaryId = document.getElementById('modal-merge-primary').value;
        const secondaryIds = ids.filter(id => id !== primaryId);
        
        try {
            const res = await fetch('/api/admin/incidents/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ primaryId, secondaryIds })
            });
            const ans = await res.json();
            alert(ans.message || "Fusionado con exito");
            document.getElementById('merge-modal').remove();
            loadMergeOptions();
            loadValidations();
            loadStats();
        } catch(e) { console.error(e); }
    };
};

window._publishedIncidentsData = [];

async function loadPublished() {
    const res = await fetch('/api/incidents');
    const data = await res.json();
    const published = data.filter(inc => inc.validationStatus === 'published');
    window._publishedIncidentsData = published;
    
    const container = document.getElementById('published-container');
    container.innerHTML = '';

    if(published.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">No hay reportes publicados.</div>';
        return;
    }

    published.forEach(inc => {
        const locString = inc.location && inc.location.lat ? inc.location.lat + ', ' + inc.location.lng : 'N/A';
        container.innerHTML += `
            <div class="incident-card" style="cursor: pointer;" onclick="window.openPublishedDetails('${inc._id}')">
                <div class="incident-header">
                    <h4 class="incident-title">${inc.title}</h4>
                    <span class="incident-date" style="color:#10b981; font-size:12px; font-weight: 500; display:flex; align-items:center; gap:4px;"><i class="ph ph-check-circle"></i> Publicado</span>
                </div>
                <p class="incident-desc">${inc.description.substring(0, 100)}...</p>
                <div class="incident-meta" style="flex-wrap: wrap;">
                    <span style="display:flex; align-items:center; gap:4px;"><i class="ph ph-user"></i> ${inc.reportedBy?.email || 'Anonimo'}</span>
                    <span style="display:flex; align-items:center; gap:4px; margin-left: auto;"><i class="ph ph-map-pin"></i> ${locString}</span>
                </div>
            </div>
        `;
    });
}

window.showPublishedView = function() {
    loadPublished();
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('published-view').classList.add('active');
    document.getElementById('view-title').textContent = 'Reportes Publicados';
};

window.deletePublishedIncident = async function(id) {
    if(!confirm("¿Estás seguro de eliminar permanentemente este incidente publicado?")) return;
    try {
        await fetch(`/api/incidents/${id}`, { method: 'DELETE' });
        loadPublished();
        loadStats();
    } catch(e) { console.error(e); }
};

window.openPublishedDetails = function(id) {
    const inc = window._publishedIncidentsData.find(i => i._id === id);
    if(!inc) return;

    const existingModal = document.getElementById('details-modal');
    if(existingModal) existingModal.remove();

    const locString = inc.location && inc.location.lat ? inc.location.lat + ', ' + inc.location.lng : 'No especificada';

    let modalHtml = `
    <div id="details-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">
        <div style="background: rgba(30, 41, 59, 0.75); padding: 30px; border-radius: 20px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
            <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
                <div>
                    <h3 style="margin: 0 0 5px 0; font-size: 20px; color: #ffffff;">${inc.title} <span style="display:inline-block; font-size:12px; font-weight:normal; background: rgba(16,185,129,0.2); color:#10b981; padding:2px 8px; border-radius:12px; margin-left:8px; vertical-align:middle;">Publicado</span></h3>
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
                        ${inc.provinceId?.name || 'N/A'} > ${inc.municipalityId?.name || 'N/A'} > ${inc.neighborhoodId?.name || 'N/A'}
                        <br><span style="color: #64748b; font-size: 12px;">(Coords: ${locString})</span>
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
                <div style="grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; margin-top: 5px;">
                    <h5 style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Reportado por</h5>
                    <p style="margin: 0; font-size: 14px; color: #f8fafc; font-weight: 500;"><i class="ph ph-user"></i> ${inc.reportedBy?.email || 'Anonimo'}</p>
                </div>
            </div>

            ${inc.imageBase64 ? `
            <div style="margin-bottom: 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); padding: 10px; border-radius: 12px; background: rgba(0,0,0,0.2);">
                <h5 style="margin: 0 0 8px 0; color: #cbd5e1; font-size: 13px; text-transform: uppercase; font-weight: 600; text-align: left;">Imagen Adjunta</h5>
                <img src="${inc.imageBase64}" style="max-width: 100%; border-radius: 8px; max-height: 250px; object-fit: contain;">
            </div>
            ` : ''}

            <div style="display:flex; justify-content: flex-end; gap: 12px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <button class="btn-flex" onclick="document.getElementById('details-modal').remove()" style="padding: 10px 16px; font-size: 14px; background: rgba(255,255,255,0.1); color: #cbd5e1; flex: 0 1 auto; border: 1px solid rgba(255,255,255,0.2);">Cerrar Modal</button>
                <button class="btn-flex btn-reject" onclick="document.getElementById('details-modal').remove(); deletePublishedIncident('${inc._id}')" style="padding: 10px 16px; font-size: 14px; background: rgba(239,68,68,0.2); color: #f87171; flex: 0 1 auto; border: 1px solid rgba(239,68,68,0.3);"><i class="ph ph-trash"></i> Eliminar Registro</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.showStatsView = function() {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector('[data-target="stats-view"]').classList.add('active');
    
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('stats-view').classList.add('active');
    document.getElementById('view-title').textContent = 'Estadisticas';
    loadStats();
};
