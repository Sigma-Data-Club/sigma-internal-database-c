export const memberStrings = {
  pageTitle: "Members",
  pageSubtitle: "Browse and manage club members.",
  searchLabel: "Search members",
  searchPlaceholder: "Search by name, email, phone or ID",
  loadingMembers: "Loading members...",
  noMembers: "No members found.",
  noMembersMatch: "No members match your search.",

  managementTitle: "Member management",
  managementSubtitle: "View profile, manage roles, and review event activity.",
  backToMembers: "Back to members",

  tabs: {
    overview: "Overview",
    roles: "Roles",
    events: "Events",
    summary: "Summary",
  },

  overview: {
    memberId: "Member ID",
    email: "Email",
    phone: "Phone",
    academicProgramId: "Academic program ID",
    studyYear: "Study year",
    active: "Active",
    yes: "Yes",
    no: "No",
    edit: "Edit member",
    activate: "Activate member",
    deactivate: "Deactivate member",
    save: "Save changes",
    cancel: "Cancel",
  },

  roles: {
    title: "Member roles",
    empty: "This member has no roles.",
    addRole: "Add role",
    replaceRoles: "Replace roles",
    roleId: "Role ID",
    roleIds: "Role IDs",
    roleIdsPlaceholder: "Example: 1, 2, 5",
    remove: "Remove",
    currentRoles: "Current roles",
    helper:
      "Because no role-list endpoint was provided, roles are managed by role ID.",
  },

  events: {
    title: "Member events",
    empty: "This member has no events.",
    start: "Start",
    end: "End",
    speaker: "Speaker",
    topic: "Topic",
  },

  summary: {
    title: "Events summary",
    empty: "No summary data available.",
  },

  dialogs: {
    activateTitle: "Activate member?",
    activateDescription:
      "This will activate the member and allow them to use the system according to their permissions.",
    deactivateTitle: "Deactivate member?",
    deactivateDescription:
      "This will deactivate the member. They may lose access depending on backend rules.",
    confirm: "Confirm",
    close: "Close",
  },

  errors: {
    missingId: "Member ID is missing.",
    noReadPermission: "You do not have permission to view member details.",
    loadMemberFailed: "Failed to load member details.",
    loadMembersFailed: "Failed to load members.",
    loadRolesFailed: "Failed to load member roles.",
    loadEventsFailed: "Failed to load member events.",
    loadSummaryFailed: "Failed to load member summary.",
    updateFailed: "Failed to update member.",
    activateFailed: "Failed to activate member.",
    deactivateFailed: "Failed to deactivate member.",
    addRoleFailed: "Failed to add role.",
    removeRoleFailed: "Failed to remove role.",
    replaceRolesFailed: "Failed to replace roles.",
    invalidRoleId: "Please enter a valid role ID.",
  },

  success: {
    updated: "Member updated successfully.",
    activated: "Member activated successfully.",
    deactivated: "Member deactivated successfully.",
    roleAdded: "Role added successfully.",
    roleRemoved: "Role removed successfully.",
    rolesReplaced: "Roles replaced successfully.",
  },
} as const;