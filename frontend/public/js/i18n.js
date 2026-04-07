const translations = {
    es: {
        dashboard: "Dashboard",
        incidents: "Incidencias",
        reports: "Reportes",
        settings: "Configuración",
        help: "Ayuda",
        total_incidents: "Total de Incidencias Registradas",
        new: "Nueva",
        export: "Exportar",
        approved: "Aprobadas / Resueltas",
        pending: "Pendientes de Validación",
        critical: "Reportes Rechazados",
        your_incidents: "Tus Incidentes",
        filter: "Filtro",
        sort: "Ordenar",
        title: "TÍTULO",
        desc: "DESCRIPCIÓN",
        status: "ESTADO",
        actions: "ACCIONES",
        report_incident: "Reportar Incidente",
        language: "Idioma de la interfaz",
        theme: "Modo Claro",
        appearance: "Apariencia",
        lang_region: "Idioma y Región",
        sys_settings: "Configuración del Sistema",
        theme_desc: "Cambia el aspecto visual de la aplicación a tonos claros.",
        lang_desc: "Selecciona el idioma preferido para la aplicación.",
        all: "Todas",
        approved_filter: "Aprobadas",
        pending_filter: "Pendientes",
        rejected_filter: "Rechazadas",
        general: "GENERAL",
        support: "SOPORTE",
        incident_title_label: "Título del Incidente",
        incident_desc_label: "Descripción Detallada",
        incident_priority_label: "Prioridad",
        incident_location_label: "Ubicación Geográfica",
        priority_low: "Baja",
        priority_medium: "Media",
        priority_high: "Alta",
        save_incident: "Guardar Incidente",
        cancel_edit: "Cancelar Edición",
        map_instruction: "*Haz click en el mapa para marcar el punto del incidente.",
        search_placeholder: "Buscar un incidente o reporte... (Ctrl+K)",
        today: "Hoy",
        empty_list: "No tienes incidentes reportados para este filtro.",
        empty_list_all: "No tienes incidentes reportados.",
        update_incident: "Actualizar Incidente",
        edit_incident: "Editar Incidente",
        status_label: "Estado Actual",
        st_pending: "Pendiente",
        st_progress: "En progreso",
        st_resolved: "Resuelto",
        title_placeholder: "Ej. Caída de red en piso 3...",
        desc_placeholder: "Describe los detalles, lugar y alcance del incidente..."
    },
    en: {
        dashboard: "Dashboard",
        incidents: "Incidents",
        reports: "Reports",
        settings: "Settings",
        help: "Help",
        total_incidents: "Total Registered Incidents",
        new: "New",
        export: "Export",
        approved: "Approved / Resolved",
        pending: "Pending Validation",
        critical: "Rejected Reports",
        your_incidents: "Your Incidents",
        filter: "Filter",
        sort: "Sort",
        title: "TITLE",
        desc: "DESCRIPTION",
        status: "STATUS",
        actions: "ACTIONS",
        report_incident: "Report Incident",
        language: "Interface Language",
        theme: "Light Mode",
        appearance: "Appearance",
        lang_region: "Language & Region",
        sys_settings: "System Settings",
        theme_desc: "Change the visual appearance of the application to light tones.",
        lang_desc: "Select the preferred language for the application.",
        all: "All",
        approved_filter: "Approved",
        pending_filter: "Pending",
        rejected_filter: "Rejected",
        general: "GENERAL",
        support: "SUPPORT",
        incident_title_label: "Incident Title",
        incident_desc_label: "Detailed Description",
        incident_priority_label: "Priority",
        incident_location_label: "Geographic Location",
        priority_low: "Low",
        priority_medium: "Medium",
        priority_high: "High",
        save_incident: "Save Incident",
        cancel_edit: "Cancel Edit",
        map_instruction: "*Click on the map to mark the incident location.",
        search_placeholder: "Search for an incident or report... (Ctrl+K)",
        today: "Today",
        empty_list: "You have no reported incidents for this filter.",
        empty_list_all: "You have no reported incidents.",
        update_incident: "Update Incident",
        edit_incident: "Edit Incident",
        status_label: "Current Status",
        st_pending: "Pending",
        st_progress: "In progress",
        st_resolved: "Resolved",
        title_placeholder: "E.g. Network down on 3rd floor...",
        desc_placeholder: "Describe the details, location and scope of the incident..."
    }
};

function applyLanguage(lang) {
    document.documentElement.lang = lang;

    // First Handle normal translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
                el.placeholder = translations[lang][key];
            } else {
                // Find existing icon if any
                const icon = el.querySelector('i');
                if (icon) {
                    el.innerHTML = '';
                    el.appendChild(icon);
                    el.appendChild(document.createTextNode(' ' + translations[lang][key]));
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        }
    });

    // Handle specific placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                el.placeholder = translations[lang][key];
            }
        }
    });

    // Specifically for select options if they exist
    document.querySelectorAll('option[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem('lang') || 'es';
    applyLanguage(savedLang);
});
