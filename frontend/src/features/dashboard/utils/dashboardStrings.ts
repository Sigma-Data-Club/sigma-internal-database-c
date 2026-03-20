export const dashboardText = {
  title: "Panel principal",
  fallbackMember: "Miembro",
  welcome: (displayName: string) => `Bienvenido, ${displayName}.`,

  noAccessibleSectionsTitle: "No hay secciones disponibles",
  noAccessibleSectionsDescription:
    "Has iniciado sesión correctamente, pero no hay secciones del panel disponibles con tus permisos actuales.",

  members: {
    title: "Miembros",
    description:
      "Consulta los miembros del club, busca por nombre o correo electrónico y abre perfiles detallados.",
    button: "Abrir miembros",
  },

  projects: {
    title: "Proyectos",
    description:
      "Consulta los proyectos, abre sus detalles y accede a las herramientas de gestión del proyecto.",
    button: "Abrir proyectos",
  },

  events: {
    title: "Eventos",
    description:
      "Consulta los eventos, las solicitudes, la asistencia y la analítica de eventos.",
    button: "Abrir eventos",
  },
};