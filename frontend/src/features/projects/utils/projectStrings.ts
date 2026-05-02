export const projectStrings = {
  page: {
    titleFallback: "Detalles del proyecto",
    subtitle:
      "Consulta la información del proyecto, sus miembros, las solicitudes y las acciones de gestión.",
    listTitle: "Proyectos",
    listSubtitle:
      "Consulta los proyectos, abre sus detalles y gestiona su creación.",
  },

  actions: {
    back: "Volver",
    apply: "Solicitar",
    edit: "Editar",
    delete: "Eliminar",
    save: "Guardar",
    cancel: "Cancelar",
    submit: "Enviar",
    accept: "Aceptar",
    reject: "Rechazar",
    withdraw: "Retirar",
    changeRole: "Cambiar rol",
    remove: "Eliminar",
    createProject: "Crear proyecto",
    creating: "Creando...",
    create: "Crear",
  },

  tabs: {
    members: "Miembros",
    applications: "Solicitudes",
  },

  fields: {
    name: "Nombre",
    description: "Descripción",
    status: "Estado",
    startedAt: "Inicio",
    finishedAt: "Fin",
    desiredRole: "Rol deseado",
    applicationText: "Texto de la solicitud",
    managerNote: "Nota del gestor",
    projectRole: "Rol del proyecto",
    searchProjects: "Buscar proyectos",
    searchProjectsPlaceholder: "Busca por nombre, descripción, estado o ID",
    allStatuses: "Todos",
    setFinishDate: "Establecer fecha de fin",
  },

  stats: {
    membersTotal: "Miembros totales",
    membersActive: "Miembros activos",
    pendingApplications: "Solicitudes pendientes",
    income: "Ingresos",
    expenses: "Gastos",
    balance: "Balance",
  },

  empty: {
    noDescription: "Sin descripción",
    noMembers: "No se encontraron miembros.",
    noApplications: "No se encontraron solicitudes.",
    managerOnlyApplications:
      "Las solicitudes solo están disponibles para los gestores del proyecto.",
    noProjects: "No se encontraron proyectos.",
    noProjectsWithFilters: "Ningún proyecto coincide con los filtros.",
  },

  dialogs: {
    editProject: "Editar proyecto",
    applyToProject: "Solicitar unirse al proyecto",
    changeRole: "Cambiar rol del miembro",
    confirmDeleteProject: "Eliminar proyecto",
    confirmRemoveMember: "Eliminar miembro",
    reviewApplication: "Revisar solicitud",
    createProject: "Crear proyecto",
  },

  messages: {
    missingProjectId: "Falta el ID del proyecto.",
    missingCurrentUser: "No se pudo determinar el usuario actual.",
    missingManagerUser: "No se pudo determinar el gestor actual.",
    noPermission: "No tienes permiso para ver los detalles del proyecto.",
    requiredApplicationFields:
      "El rol deseado y el texto de la solicitud son obligatorios.",
    loadError: "No se pudieron cargar los detalles del proyecto.",
    updateError: "No se pudo actualizar el proyecto.",
    deleteError: "No se pudo eliminar el proyecto.",
    submitError: "No se pudo enviar la solicitud.",
    withdrawError: "No se pudo retirar la solicitud.",
    decisionError: "No se pudo actualizar la solicitud.",
    removeMemberError: "No se pudo eliminar al miembro.",
    changeRoleError: "No se pudo actualizar el rol del miembro.",

    sessionExpired: "La sesión ha expirado. Inicia sesión de nuevo.",
    noListPermission: "No tienes permiso para ver los proyectos.",
    missingProjectsEndpoint: "No se encontró el endpoint de proyectos.",
    loadProjectsError: "No se pudieron cargar los proyectos.",
    unexpectedError: "Se produjo un error inesperado.",
    requiredProjectName: "El nombre del proyecto es obligatorio.",
    finishBeforeStart:
      "La fecha de fin no puede ser anterior a la fecha de inicio.",
    createProjectError: "No se pudo crear el proyecto.",
    loadingProjects: "Cargando proyectos...",
    projectWithoutFinishDate:
      "Este proyecto se creará sin fecha de finalización.",
    optional: "Opcional",
  },

  confirmations: {
    deleteProject: (projectName: string) =>
      `¿Seguro que quieres eliminar el proyecto "${projectName}"? Esta acción no se puede deshacer.`,
    removeMember: "¿Seguro que quieres eliminar este miembro del proyecto?",
  },

  labels: {
    joined: "Se unió",
    left: "Salió",
    applied: "Solicitado",
    managerNote: "Nota del gestor",
    member: "Miembro",
    role: "Rol",
    started: "Inicio",
    finished: "Fin",
    applicationText: "Texto de la solicitud",
    id: "ID",
  },
} as const;