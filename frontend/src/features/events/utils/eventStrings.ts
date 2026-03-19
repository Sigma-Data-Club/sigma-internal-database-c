export const eventStrings = {
  page: {
    listTitle: "Eventos",
    listSubtitle:
      "Consulta eventos, solicitudes, asistencia y estadísticas.",

    detailsTitleFallback: "Detalles del evento",
    detailsSubtitle: "Vista detallada del evento",

    analyticsTitle: "Analítica de eventos",
    analyticsSubtitle:
      "Rendimiento global de los eventos del club y tendencias de asistencia.",

    managementTitle: "Gestión del evento",
    managementSubtitle:
      "Gestiona información, solicitudes, asistencia y estadísticas.",
  },

  actions: {
    backToEvents: "Volver a eventos",
    backToEvent: "Volver al evento",
    createEvent: "Crear evento",
    editEvent: "Editar evento",
    deleteEvent: "Eliminar evento",
    apply: "Solicitar",
    submit: "Enviar",
    submitFeedback: "Enviar valoración",
    applications: "Solicitudes",
    attendance: "Asistencia",
    stats: "Estadísticas",
    management: "Gestionar",
    cancel: "Cancelar",
    delete: "Eliminar",
    deleting: "Eliminando...",
    submitting: "Enviando...",
    loading: "Cargando...",
    applyFilters: "Aplicar filtros",
    resetFilters: "Restablecer",
    approve: "Aceptar",
    reject: "Rechazar",
    waitlist: "Lista de espera",
    markAttended: "Marcar como asistió",
    markNoShow: "Marcar como no asistió",
    approveAllPending: "Aceptar todas las pendientes",
    approveTopPending: "Aceptar top N pendientes",
    refresh: "Recargar",
  },

  filters: {
    searchEvents: "Buscar eventos",
    searchEventsPlaceholder: "Buscar por título, tema, ponente o ID",
    searchApplications: "Buscar solicitudes",
    searchApplicationsPlaceholder:
      "Buscar por ID, decisión, asistencia o modalidad",
    all: "Todos",
    upcoming: "Próximos",
    ongoing: "En curso",
    past: "Finalizados",
    dateFrom: "Fecha desde",
    dateTo: "Fecha hasta",
    onlyPending: "Solo pendientes",
    orderNewest: "Más recientes primero",
    orderOldest: "Más antiguas primero",
    topN: "Top N",
  },

  sections: {
    myParticipation: "Mi participación",
    management: "Gestión",
    quickStats: "Estadísticas rápidas",
    topEvents: "Eventos destacados",
    submitFeedback: "Enviar valoración",
    eventInfo: "Información del evento",
    applicationsManagement: "Gestión de solicitudes",
    attendanceManagement: "Gestión de asistencia",
    adminOverview: "Resumen de gestión",
  },

  tabs: {
    overview: "Resumen",
    applications: "Solicitudes",
    attendance: "Asistencia",
    stats: "Estadísticas",
  },

  labels: {
    id: "ID",
    memberId: "ID del miembro",
    topic: "Tema",
    speaker: "Ponente",
    start: "Inicio",
    end: "Fin",
    status: "Estado",
    phase: "Fase",
    decision: "Decisión",
    attendanceStatus: "Estado de asistencia",
    attendanceMode: "Modalidad de asistencia",
    appliedAt: "Fecha de solicitud",
    feedbackSubmitted: "Valoración enviada",
    rating: "Puntuación (1-5)",
    comment: "Comentario",
    totalApplications: "Solicitudes totales",
    accepted: "Aceptadas",
    pending: "Pendientes",
    attended: "Asistieron",
    noShow: "No asistieron",
    avgFeedback: "Valoración media",
    attendanceRate: "Tasa de asistencia",
    acceptanceRate: "Tasa de aceptación",
    rejected: "Rechazadas",
    waitlisted: "En espera",
    cancelled: "Canceladas",
    unknownAttendance: "Asistencia desconocida",
    orderByApplicationTime: "Ordenar por fecha de solicitud",
    updateDecision: "Actualizar decisión",
  },

  statuses: {
    upcoming: "Próximo",
    ongoing: "En curso",
    past: "Finalizado",
    checkinOpen: "Check-in abierto",
    inPerson: "Presencial",
    online: "En línea",
    unknown: "Desconocido",
    pending: "Pendiente",
    accepted: "Aceptada",
    rejected: "Rechazada",
    waitlisted: "En espera",
    cancelled: "Cancelada",
    attended: "Asistió",
    noShow: "No asistió",
  },

  empty: {
    noEvents: "No se encontraron eventos.",
    noEventsWithFilters:
      "Ningún evento coincide con los filtros aplicados.",
    noTopic: "Sin tema",
    noData:
      "No hay datos analíticos disponibles para el período seleccionado.",
    noApplication: "Todavía no has enviado una solicitud para este evento.",
    noApplications: "No se encontraron solicitudes para este evento.",
  },

  messages: {
    sessionExpired: "La sesión ha expirado. Inicia sesión de nuevo.",
    noEventsPermission: "No tienes permiso para ver los eventos.",
    noManagementPermission: "No tienes permiso para gestionar este evento.",
    eventsEndpointNotFound: "No se encontró el endpoint de eventos.",
    failedToLoadEvents: "No se pudieron cargar los eventos.",
    failedToLoadManagement:
      "No se pudieron cargar los datos de gestión del evento.",
    failedToUpdateDecision:
      "No se pudo actualizar la decisión de la solicitud.",
    failedToUpdateAttendance:
      "No se pudo actualizar la asistencia.",
    unexpectedError: "Se produjo un error inesperado.",

    missingEventId: "Falta el ID del evento.",
    failedToLoadEventDetails:
      "No se pudieron cargar los detalles del evento.",
    failedToLoadApplicationStatus:
      "No se pudo cargar el estado de tu solicitud.",
    failedToLoadEventStats:
      "No se pudieron cargar las estadísticas del evento.",
    failedToSubmitApplication:
      "No se pudo enviar la solicitud.",
    failedToSubmitFeedback:
      "No se pudo enviar la valoración.",
    failedToDeleteEvent:
      "No se pudo eliminar el evento.",

    invalidFeedbackRating:
      "La puntuación debe ser un número entero entre 1 y 5.",

    loadingEvents: "Cargando eventos...",
    loadingApplication: "Cargando solicitud...",
    loadingStatistics: "Cargando estadísticas...",
    loadingAnalytics: "Cargando analítica...",
    loadingManagement: "Cargando gestión del evento...",

    attendanceAvailableAfterEnd:
      "La asistencia estará disponible cuando el evento haya finalizado.",
    attendanceAvailableOneHourBeforeStart:
      "La asistencia se habilita una hora antes del inicio del evento.",
    attendanceOnlyForAccepted:
      "La asistencia solo se puede registrar para solicitudes aceptadas.",
    managementDescription:
      "Usa estas herramientas para gestionar solicitudes, asistencia y analítica.",
  },

  analytics: {
    cards: {
      totalEvents: "Eventos totales",
      totalApplications: "Solicitudes",
      accepted: "Aceptadas",
      attended: "Asistieron",
      noShow: "No asistieron",
      avgFeedback: "Valoración media",
      attendanceRate: "Tasa de asistencia",
      acceptanceRate: "Tasa de aceptación",
    },
    charts: {
      topEvents: "Eventos destacados",
    },
  },

  dialogs: {
    deleteTitle: "Eliminar evento",
    deleteDescription:
      "¿Seguro que quieres eliminar este evento? Esta acción no se puede deshacer.",
  },

  management: {
    title: "Gestión del evento",
    subtitle: "Gestiona solicitudes, asistencia y estadísticas.",
    search: "Buscar solicitudes",
    searchPlaceholder:
      "Buscar por ID, decisión, asistencia o modalidad",
    onlyPending: "Solo pendientes",
    attendanceLocked:
      "La asistencia aún no está disponible para este evento.",
  },
};