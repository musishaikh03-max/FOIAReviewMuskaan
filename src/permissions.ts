import { RoleView } from './types';

export const ACTIONS = {
  createCase: ['Administrator', 'Intake Staff', 'FOIA Manager'],
  editCase: ['Administrator', 'Intake Staff', 'Processor', 'Supervisor / QC'],
  assignCase: ['Administrator', 'Intake Staff', 'FOIA Manager'],
  reassignCase: ['Administrator', 'Intake Staff', 'Supervisor / QC', 'FOIA Manager'],
  addNote: ['Administrator', 'Intake Staff', 'Processor', 'Reviewer / Redactor', 'Supervisor / QC', 'FOIA Manager'],
  linkRelatedCase: ['Administrator', 'Intake Staff', 'Processor', 'Supervisor / QC'],
  manageClock: ['Administrator', 'Processor', 'Supervisor / QC'],
  decideExpedite: ['Supervisor / QC'],
  manageTasks: ['Administrator', 'Processor', 'Supervisor / QC'],
  manageRfd: ['Administrator', 'Processor', 'Supervisor / QC'],
  returnRfd: ['Administrator', 'Custodian / Action Office'],
  uploadDocument: ['Administrator', 'Intake Staff', 'Processor', 'Custodian / Action Office'],
  composeCorrespondence: ['Administrator', 'Intake Staff', 'Processor', 'Supervisor / QC'],
  approveCorrespondence: ['Supervisor / QC'],
  sendCorrespondence: ['Administrator', 'Processor', 'Supervisor / QC'],
  requestClosure: ['Administrator', 'Intake Staff', 'Processor', 'Supervisor / QC'],
  approveClosure: ['Supervisor / QC'],
  reviewDocuments: ['Administrator', 'Processor', 'Reviewer / Redactor', 'Supervisor / QC'],
  redactDocuments: ['Reviewer / Redactor'],
  submitQc: ['Processor', 'Reviewer / Redactor'],
  decideQc: ['Supervisor / QC'],
  manageDetermination: ['Processor', 'Reviewer / Redactor', 'Supervisor / QC'],
  approveDetermination: ['Supervisor / QC'],
  dispatchRelease: ['Processor', 'Supervisor / QC'],
  returnToReview: ['Processor', 'Supervisor / QC'],
  closeFinalResponse: ['Supervisor / QC'],
  manageCoordination: ['Administrator', 'Processor', 'Reviewer / Redactor', 'Supervisor / QC'],
  approveCoordination: ['Supervisor / QC'],
  confirmTransfer: ['Supervisor / QC', 'Administrator'],
  manageFees: ['Fee / Finance', 'Supervisor / QC', 'Administrator'],
  registerAppeal: ['Appeals Reviewer', 'FOIA Manager', 'Administrator'],
  reviewAppeal: ['Appeals Reviewer'],
  reopenCase: ['Supervisor / QC', 'Administrator'],
  submitPortalRequest: ['Requester (Portal)'],
  respondPortal: ['Requester (Portal)'],
  prepareReadingRoom: ['Processor', 'Supervisor / QC'],
  approveReadingRoom: ['Supervisor / QC'],
  editSettings: ['Administrator'],
  manageUsers: ['Administrator'],
  manageReferenceData: ['Administrator'],
  exportAudit: ['Administrator', 'Security / Audit'],
  exportOperationalReports: ['Administrator', 'Supervisor / QC', 'FOIA Manager'],
  simulateFoiaGovImport: ['Administrator'],
  resetPrototypeData: ['Administrator'],
} satisfies Record<string, RoleView[]>;

export type Action = keyof typeof ACTIONS;

export function can(role: RoleView, action: Action) {
  return ACTIONS[action].some(allowed => allowed === role);
}

export function allowedRoles(action: Action) {
  return ACTIONS[action].join(', ');
}
