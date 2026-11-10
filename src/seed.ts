import {
  ACCESS_CLASS,
  AdminUser,
  Appeal,
  APPEAL_DECISION,
  APPEAL_STATUS,
  AuditEvent,
  CASE_STATUS,
  CaseRecord,
  ClockEvent,
  CLOCK_EVENT_KIND,
  Correspondence,
  CorrespondenceTemplate,
  CoordinationItem,
  COORDINATION_KIND,
  COORDINATION_STATUS,
  CORRESPONDENCE_STATUS,
  CORRESPONDENCE_TYPE,
  DEMO_USERS,
  DOC_CLASSIFICATION,
  DELIVERY_OUTCOME,
  Determination,
  DETERMINATION_STATUS,
  DISPOSITION,
  Document,
  FeeRecord,
  HOLD_TYPE,
  Notification,
  Office,
  OWNERSHIP_AFTER,
  PAYMENT_STATUS,
  PUBLICATION_CHOICE,
  QC_DECISION,
  QC_ITEM_RESULT,
  QC_KIND,
  QCReview,
  RELEASE_CHANNEL,
  RELEASE_KIND,
  ReleaseRecord,
  RESPONSIVENESS,
  REVIEW_OUTCOME,
  REVIEW_STATUS,
  ReviewDecision,
  RFD,
  RFD_STATUS,
  Settings,
  ReferenceData,
  PROCESSING_TRACK,
  REQUEST_SOURCE,
  REQUESTER_CATEGORY,
  REQUESTER_AGREEMENT,
  TASK_STATUS,
  Task,
  UPLOAD_STATUS,
  WAIVER_DECISION,
  requesterKey,
} from './types';

export const DEFAULT_SETTINGS: Settings = {
  asOfDate: '2025-01-22',
  coordinationInScope: true,
  feesInScope: true,
  appealsInScope: true,
  portalInScope: true,
  readingRoomInScope: true,
  outboundApprovalRequired: true,
  qcForNoRecords: true,
  showAiAssistant: true,
};

const base = (record: Partial<CaseRecord> & Pick<CaseRecord, 'id' | 'title' | 'requester' | 'received' | 'status' | 'team' | 'processor' | 'track' | 'risk'>): CaseRecord => ({
  requestType: 'FOIA',
  needsClarification: false,
  expeditedRequested: false,
  willingToPayFees: false,
  requesterKey: requesterKey(record.requester),
  relatedCaseIds: [],
  dueDate: null,
  dueDateBasis: 'Not established',
  controllingDate: null,
  clock: { state: 'Not established' },
  ...record,
});

export const ORIGINAL_CASE_IDS = [
  'FOIA-2025-0147', 'FOIA-2025-0139', 'FOIA-2025-0135', 'FOIA-2025-0128',
  'FOIA-2025-0118', 'FOIA-2025-0114', 'FOIA-2025-0109',
];

export const RESERVED_CASE_IDS = ['FOIA-2025-0101', 'FOIA-2025-0102', 'FOIA-2025-0103', 'FOIA-2025-0104'];

export const seedCases: CaseRecord[] = [
  base({ id: 'FOIA-2025-0147', title: 'Riverside Hospital – Environmental Records', requester: 'John Miller', received: '2025-01-21', status: CASE_STATUS.IN_PROGRESS, team: 'FOIA Operations', processor: 'A. Carter', track: 'Standard', dueDate: '2025-01-24', dueDateBasis: 'Seeded sample', risk: 'High', source: 'Email', requesterType: 'Individual', description: 'Request for environmental compliance records, including inspection reports, notices of violation, and related communications for the period Jan 1, 2023 – Dec 31, 2024.', dateRange: 'Jan 1, 2023 – Dec 31, 2024', dateRangeStart: '2023-01-01', dateRangeEnd: '2024-12-31', responseFormat: 'Electronic (PDF)', email: 'john.miller@email.com', phone: '(202) 555-0147', address: '123 Maple Ave, Arlington, VA 22201' }),
  base({ id: 'FOIA-2025-0139', title: 'Facility Inspection Reports', requester: 'Green Valley Association', received: '2025-01-20', status: CASE_STATUS.RECORDS_SEARCH, team: 'Records Search', processor: 'M. Rivera', track: 'Complex', dueDate: '2025-01-27', dueDateBasis: 'Seeded sample', risk: 'Medium' }),
  base({ id: 'FOIA-2025-0135', title: 'Contractor Correspondence', requester: 'David Lee', received: '2025-01-19', status: CASE_STATUS.REVIEW, team: 'Processing', processor: 'S. Patel', track: 'Standard', dueDate: '2025-01-28', dueDateBasis: 'Seeded sample', risk: 'Medium' }),
  base({ id: 'FOIA-2025-0128', title: 'Grant Program Records', requester: 'Emily White', received: '2025-01-17', status: CASE_STATUS.QC_REVIEW, team: 'Review & QC', processor: 'R. Gomez', track: 'Complex', dueDate: '2025-01-30', dueDateBasis: 'Seeded sample', risk: 'Low' }),
  base({ id: 'FOIA-2025-0118', title: 'Policy Correspondence', requester: 'Thomas Reed', received: '2025-01-15', status: CASE_STATUS.PENDING_RESPONSE, team: 'FOIA Operations', processor: 'K. Nguyen', track: 'Standard', dueDate: '2025-02-03', dueDateBasis: 'Seeded sample', risk: 'Medium' }),
  base({ id: 'FOIA-2025-0114', title: 'Environmental Compliance Records', requester: 'Susan Clark', received: '2025-01-14', status: CASE_STATUS.DETERMINATION, team: 'Processing', processor: 'L. Brooks', track: 'Complex', dueDate: '2025-02-05', dueDateBasis: 'Seeded sample', risk: 'Low' }),
  base({ id: 'FOIA-2025-0109', title: 'Project Approval Documents', requester: 'Mark Johnson', received: '2025-01-10', status: CASE_STATUS.CLOSED, team: 'FOIA Operations', processor: 'A. Carter', track: 'Standard', dueDate: '2025-01-22', dueDateBasis: 'Seeded sample', risk: '—' }),
  base({ id: 'FOIA-2025-0101', title: 'Sample intake awaiting assignment', requester: 'Sample requester', received: '2025-01-22', status: CASE_STATUS.PENDING_ASSIGNMENT, team: 'Unassigned', processor: 'Unassigned', track: 'Not set', risk: 'Not assessed' }),
  base({ id: 'FOIA-2025-0102', title: 'Sample clarification hold', requester: 'Sample requester', received: '2024-12-18', status: CASE_STATUS.RECORDS_SEARCH, team: 'Records Search', processor: 'A. Carter', track: 'Complex', dueDate: '2025-01-10', dueDateBasis: 'Seeded sample', risk: 'High', clock: { state: 'Hold recorded', holdType: 'Clarification', holdSince: '2025-01-08' } }),
  base({ id: 'FOIA-2025-0103', title: 'Sample reopened request', requester: 'Sample requester', received: '2024-12-12', status: CASE_STATUS.REOPENED, team: 'FOIA Operations', processor: 'A. Carter', track: 'Standard', risk: 'Not assessed' }),
  base({ id: 'FOIA-2025-0104', title: 'Sample transferred request', requester: 'Sample requester', received: '2024-12-10', status: CASE_STATUS.TRANSFERRED, team: 'FOIA Operations', processor: 'Unassigned', track: 'Not set', risk: 'Not assessed' }),
];

export const seedTasks: Task[] = [
  { id: 'task-001', caseId: 'FOIA-2025-0147', type: 'Review', title: 'Review records', ownerName: 'A. Carter', ownerRole: 'Processor', status: TASK_STATUS.OPEN, dueDate: '2025-01-24', createdAt: '2025-01-22T09:00:00.000Z' },
  { id: 'task-002', caseId: 'FOIA-2025-0139', type: 'Follow-up', title: 'Follow up with custodian', ownerName: 'M. Rivera', ownerRole: 'Processor', status: TASK_STATUS.OPEN, dueDate: '2025-01-27', createdAt: '2025-01-22T09:10:00.000Z' },
  { id: 'task-003', caseId: 'FOIA-2025-0135', type: 'Redaction', title: 'Complete redaction', ownerName: 'S. Patel', ownerRole: 'Reviewer / Redactor', status: TASK_STATUS.IN_PROGRESS, dueDate: '2025-01-28', createdAt: '2025-01-22T09:20:00.000Z' },
  { id: 'task-004', caseId: 'FOIA-2025-0128', type: 'Response', title: 'Prepare response package', ownerName: 'R. Gomez', ownerRole: 'Supervisor / QC', status: TASK_STATUS.OPEN, dueDate: '2025-01-30', createdAt: '2025-01-22T09:30:00.000Z' },
  { id: 'task-005', caseId: 'FOIA-2025-0118', type: 'Review', title: 'Confirm response package', ownerName: 'A. Carter', ownerRole: 'Processor', status: TASK_STATUS.BLOCKED, dueDate: '2025-02-03', createdAt: '2025-01-22T09:40:00.000Z' },
  { id: 'task-006', caseId: 'FOIA-2025-0114', type: 'Determination', title: 'Review draft determination', ownerName: 'S. Patel', ownerRole: 'Reviewer / Redactor', status: TASK_STATUS.OPEN, dueDate: '2025-02-05', createdAt: '2025-01-22T09:50:00.000Z' },
  { id: 'task-007', caseId: 'FOIA-2025-0102', type: 'Clarification', title: 'Review clarification response', ownerName: 'A. Carter', ownerRole: 'Processor', status: TASK_STATUS.OPEN, dueDate: null, createdAt: '2025-01-22T10:00:00.000Z' },
  { id: 'task-008', caseId: 'FOIA-2025-0103', type: 'Reopening', title: 'Review reopened case scope', ownerName: 'P. Singh', ownerRole: 'FOIA Manager', status: TASK_STATUS.OPEN, dueDate: null, createdAt: '2025-01-22T10:10:00.000Z' },
  { id: 'task-009', caseId: 'FOIA-2025-0102', type: 'Clarification', title: 'Await requester response', ownerName: 'A. Carter', ownerRole: 'Processor', status: TASK_STATUS.OPEN, dueDate: null, createdAt: '2025-01-08T12:00:00.000Z' },
];

const seedDoc = (id: string, caseId: string, name: string, office: string, rfdId?: string): Document => ({
  id, caseId, rfdId, name, office, sizeKb: 420, mime: 'application/pdf', source: 'Custodian return',
  classification: DOC_CLASSIFICATION.SOURCE, version: 1, accessClass: ACCESS_CLASS.INTERNAL,
  uploadStatus: UPLOAD_STATUS.UPLOADED, pageCount: 8, createdAt: '2025-01-22T12:00:00.000Z', createdBy: 'Records contact (sample)',
});

export const seedDocuments: Document[] = [
  seedDoc('doc-0139-1', 'FOIA-2025-0139', 'inspection-records.pdf', 'Office of Environmental Records', 'rfd-0139-2'),
  seedDoc('doc-0135-1', 'FOIA-2025-0135', 'contract-correspondence-1.pdf', 'Office of Acquisition Records'),
  seedDoc('doc-0135-2', 'FOIA-2025-0135', 'contract-correspondence-2.pdf', 'Office of Acquisition Records'),
  seedDoc('doc-0128-1', 'FOIA-2025-0128', 'grant-program-records.pdf', 'Office of Program Records'),
  seedDoc('doc-0118-1', 'FOIA-2025-0118', 'policy-correspondence.pdf', 'Office of Policy Records'),
  seedDoc('doc-0114-1', 'FOIA-2025-0114', 'environmental-compliance.pdf', 'Office of Environmental Records'),
  seedDoc('doc-0109-1', 'FOIA-2025-0109', 'project-approval.pdf', 'Office of Program Records'),
  seedDoc('doc-0128-2', 'FOIA-2025-0128', 'grant-correspondence.pdf', 'Office of Program Records'),
  { ...seedDoc('doc-0128-review-1', 'FOIA-2025-0128', 'grant-program-review.pdf', 'Office of Program Records'), source: 'Created in processing', classification: DOC_CLASSIFICATION.REVIEW, parentDocId: 'doc-0128-1' },
  { ...seedDoc('doc-0128-review-2', 'FOIA-2025-0128', 'grant-correspondence-review.pdf', 'Office of Program Records'), source: 'Created in processing', classification: DOC_CLASSIFICATION.REVIEW, parentDocId: 'doc-0128-2' },
  { ...seedDoc('doc-0128-candidate-1', 'FOIA-2025-0128', 'grant-program-release.pdf', 'Office of Program Records'), source: 'Created in processing', classification: DOC_CLASSIFICATION.CANDIDATE, parentDocId: 'doc-0128-1' },
  { ...seedDoc('doc-0128-candidate-2', 'FOIA-2025-0128', 'grant-correspondence-release.pdf', 'Office of Program Records'), source: 'Created in processing', classification: DOC_CLASSIFICATION.CANDIDATE, parentDocId: 'doc-0128-2' },
  { ...seedDoc('doc-0114-approved', 'FOIA-2025-0114', 'environmental-compliance-approved.pdf', 'Office of Environmental Records'), source: 'Created in processing', classification: DOC_CLASSIFICATION.APPROVED, parentDocId: 'doc-0114-1' },
  { ...seedDoc('doc-0118-review', 'FOIA-2025-0118', 'policy-correspondence-review.pdf', 'Office of Policy Records'), source: 'Created in processing', classification: DOC_CLASSIFICATION.REVIEW, parentDocId: 'doc-0118-1' },
  { ...seedDoc('doc-0118-approved', 'FOIA-2025-0118', 'policy-correspondence-approved.pdf', 'Office of Policy Records'), source: 'Created in processing', classification: DOC_CLASSIFICATION.APPROVED, parentDocId: 'doc-0118-1' },
  { ...seedDoc('doc-0109-approved', 'FOIA-2025-0109', 'project-approval-release.pdf', 'Office of Program Records'), source: 'Created in processing', classification: DOC_CLASSIFICATION.APPROVED, parentDocId: 'doc-0109-1', accessClass: ACCESS_CLASS.REQUESTER, releasedInRecordId: 'release-0109-final' },
  seedDoc('doc-0103-source', 'FOIA-2025-0103', 'reopened-case-original.pdf', 'Office of Program Records'),
  { ...seedDoc('doc-0103-approved', 'FOIA-2025-0103', 'reopened-case-release.pdf', 'Office of Program Records'), source: 'Created in processing', classification: DOC_CLASSIFICATION.APPROVED, parentDocId: 'doc-0103-source', accessClass: ACCESS_CLASS.REQUESTER, releasedInRecordId: 'release-0103-final' },
];

export const seedReviewDecisions: ReviewDecision[] = [
  { docId: 'doc-0128-1', responsiveness: RESPONSIVENESS.RESPONSIVE, outcome: REVIEW_OUTCOME.RELEASE_FULL, reviewStatus: REVIEW_STATUS.COMPLETE, reviewer: 'A. Carter', at: '2025-01-21T15:00:00.000Z', candidateDocId: 'doc-0128-candidate-1', candidateValidated: true },
  { docId: 'doc-0128-2', responsiveness: RESPONSIVENESS.RESPONSIVE, outcome: REVIEW_OUTCOME.RELEASE_PART, reviewStatus: REVIEW_STATUS.COMPLETE, reviewer: 'A. Carter', at: '2025-01-21T15:10:00.000Z', candidateDocId: 'doc-0128-candidate-2', candidateValidated: true },
  { docId: 'doc-0114-1', responsiveness: RESPONSIVENESS.RESPONSIVE, outcome: REVIEW_OUTCOME.RELEASE_PART, reviewStatus: REVIEW_STATUS.COMPLETE, reviewer: 'S. Patel', at: '2025-01-20T15:00:00.000Z', candidateDocId: 'doc-0114-approved', candidateValidated: true, qcApproved: true },
  { docId: 'doc-0118-1', responsiveness: RESPONSIVENESS.RESPONSIVE, outcome: REVIEW_OUTCOME.RELEASE_FULL, reviewStatus: REVIEW_STATUS.COMPLETE, reviewer: 'S. Patel', at: '2025-01-19T15:00:00.000Z', candidateDocId: 'doc-0118-approved', candidateValidated: true, qcApproved: true },
  { docId: 'doc-0109-1', responsiveness: RESPONSIVENESS.RESPONSIVE, outcome: REVIEW_OUTCOME.RELEASE_FULL, reviewStatus: REVIEW_STATUS.COMPLETE, reviewer: 'S. Patel', at: '2025-01-18T15:00:00.000Z', candidateDocId: 'doc-0109-approved', candidateValidated: true, qcApproved: true },
  { docId: 'doc-0103-source', responsiveness: RESPONSIVENESS.RESPONSIVE, outcome: REVIEW_OUTCOME.RELEASE_FULL, reviewStatus: REVIEW_STATUS.COMPLETE, reviewer: 'S. Patel', at: '2025-01-17T15:00:00.000Z', candidateDocId: 'doc-0103-approved', candidateValidated: true, qcApproved: true },
];

export const seedQcReviews: QCReview[] = [
  { id: 'qc-0128-1', caseId: 'FOIA-2025-0128', round: 1, kind: QC_KIND.RELEASE, docIds: ['doc-0128-1', 'doc-0128-2'], submittedBy: 'A. Carter', submittedAt: '2025-01-21T16:00:00.000Z', checklist: Array(5).fill(QC_ITEM_RESULT.PASS), findings: [], decision: QC_DECISION.PENDING },
  { id: 'qc-0114-1', caseId: 'FOIA-2025-0114', round: 1, kind: QC_KIND.RELEASE, docIds: ['doc-0114-1'], submittedBy: 'S. Patel', submittedAt: '2025-01-20T16:00:00.000Z', checklist: Array(5).fill(QC_ITEM_RESULT.PASS), findings: [], decision: QC_DECISION.APPROVED, decidedBy: 'R. Gomez', decidedAt: '2025-01-20T17:00:00.000Z' },
  { id: 'qc-0118-1', caseId: 'FOIA-2025-0118', round: 1, kind: QC_KIND.RELEASE, docIds: ['doc-0118-1'], submittedBy: 'S. Patel', submittedAt: '2025-01-19T16:00:00.000Z', checklist: Array(5).fill(QC_ITEM_RESULT.PASS), findings: [], decision: QC_DECISION.APPROVED, decidedBy: 'R. Gomez', decidedAt: '2025-01-19T17:00:00.000Z' },
  { id: 'qc-0109-1', caseId: 'FOIA-2025-0109', round: 1, kind: QC_KIND.RELEASE, docIds: ['doc-0109-1'], submittedBy: 'S. Patel', submittedAt: '2025-01-18T16:00:00.000Z', checklist: Array(5).fill(QC_ITEM_RESULT.PASS), findings: [], decision: QC_DECISION.APPROVED, decidedBy: 'R. Gomez', decidedAt: '2025-01-18T17:00:00.000Z' },
];

export const seedDeterminations: Determination[] = [
  { caseId: 'FOIA-2025-0114', disposition: DISPOSITION.PARTIAL, pagesReleasedInFull: 0, pagesReleasedInPart: 8, pagesWithheld: 0, exemptionsUsed: ['(b)(6)'], letterBody: '[Approved wording pending counsel]', status: DETERMINATION_STATUS.DRAFT, preparedBy: 'S. Patel' },
  { caseId: 'FOIA-2025-0118', disposition: DISPOSITION.FULL_GRANT, pagesReleasedInFull: 8, pagesReleasedInPart: 0, pagesWithheld: 0, exemptionsUsed: [], letterBody: '[Approved wording pending counsel]', status: DETERMINATION_STATUS.APPROVED, preparedBy: 'S. Patel', approvedBy: 'R. Gomez' },
  { caseId: 'FOIA-2025-0109', disposition: DISPOSITION.FULL_GRANT, pagesReleasedInFull: 8, pagesReleasedInPart: 0, pagesWithheld: 0, exemptionsUsed: [], letterBody: '[Approved wording pending counsel]', status: DETERMINATION_STATUS.APPROVED, preparedBy: 'S. Patel', approvedBy: 'R. Gomez' },
];

export const seedReleaseRecords: ReleaseRecord[] = [
  { id: 'release-0109-final', caseId: 'FOIA-2025-0109', kind: RELEASE_KIND.FINAL, docIds: ['doc-0109-approved'], correspondenceId: 'correspondence-0109-final', channel: RELEASE_CHANNEL.SECURE_LINK, sentAt: '2025-01-22T15:00:00.000Z', sentBy: 'R. Gomez', deliveryOutcome: DELIVERY_OUTCOME.DELIVERED, publishToReadingRoom: PUBLICATION_CHOICE.NO },
  { id: 'release-0103-final', caseId: 'FOIA-2025-0103', kind: RELEASE_KIND.FINAL, docIds: ['doc-0103-approved'], correspondenceId: 'correspondence-0103-final', channel: RELEASE_CHANNEL.EMAIL, sentAt: '2025-01-15T15:00:00.000Z', sentBy: 'R. Gomez', deliveryOutcome: DELIVERY_OUTCOME.DELIVERED, publishToReadingRoom: PUBLICATION_CHOICE.NOT_APPLICABLE },
];

export const seedExemptionCodes = ['(b)(1)', '(b)(2)', '(b)(3)', '(b)(4)', '(b)(5)', '(b)(6)', '(b)(7)', '(b)(7)(A)', '(b)(7)(B)', '(b)(7)(C)', '(b)(7)(D)', '(b)(7)(E)', '(b)(7)(F)', '(b)(8)', '(b)(9)'];

export const seedCoordinationItems: CoordinationItem[] = [
  { id: 'coordination-0104-transfer', caseId: 'FOIA-2025-0104', kind: COORDINATION_KIND.TRANSFER, destination: 'Other federal agency (sample)', docIds: [], basis: 'Whole request appears to belong with the sample destination; jurisdiction not determined by the prototype.', ownershipAfter: OWNERSHIP_AFTER.WHOLE_REQUEST, status: COORDINATION_STATUS.CLOSED, dueDate: '2025-01-15', createdBy: 'Muskaan Shaikh', createdAt: '2025-01-10T12:00:00.000Z' },
  { id: 'coordination-0135-consultation', caseId: 'FOIA-2025-0135', kind: COORDINATION_KIND.CONSULTATION, destination: 'Other component (sample)', docIds: ['doc-0135-1'], basis: 'Potential equity identified during review.', ownershipAfter: OWNERSHIP_AFTER.RETAINED, status: COORDINATION_STATUS.SENT, dueDate: '2025-01-24', createdBy: 'S. Patel', createdAt: '2025-01-20T12:00:00.000Z' },
];

export const seedFeeRecords: FeeRecord[] = [{
  caseId: 'FOIA-2025-0118', requesterCategory: 'All other (sample)', willingToPayAmount: 100,
  lines: [{ label: 'Search hours', quantity: 2, rate: 20, amount: 40 }], estimateTotal: 40,
  waiver: { requested: false, decision: WAIVER_DECISION.PENDING, rationale: '', decidedBy: '' },
  requesterAgreement: REQUESTER_AGREEMENT.AGREED, payment: { status: PAYMENT_STATUS.NOT_REQUIRED, reference: '' },
  rateScheduleStatus: 'Rates pending fee schedule (V-09)',
}];

export const seedAppeals: Appeal[] = [{
  id: 'APL-0001', caseId: 'FOIA-2025-0103', receivedDate: '2025-01-20', channel: 'Staff-entered',
  appellant: 'Sample requester', challengedReleaseId: 'release-0103-final', grounds: 'Sample remand grounds.',
  status: APPEAL_STATUS.REMANDED, assignedTo: 'D. Wilson', decision: APPEAL_DECISION.REMANDED,
  rationale: 'Additional processing required.', eligibilityNote: 'Eligibility and timing pending counsel (OQ-12)', staffReviewRoute: false,
}];

export const seedOffices: Office[] = [
  { id: 'office-environmental', name: 'Office of Environmental Records', custodianName: 'Jordan Kim (sample)', assignmentTeams: ['FOIA Operations – Environmental'] },
  { id: 'office-acquisition', name: 'Office of Acquisition Records', custodianName: 'Taylor Morgan (sample)', assignmentTeams: ['FOIA Operations – Acquisition'] },
  { id: 'office-program', name: 'Office of Program Records', custodianName: 'Casey Rivera (sample)', assignmentTeams: ['FOIA Operations – Program'] },
  { id: 'office-policy', name: 'Office of Policy Records', custodianName: 'Alex Johnson (sample)', assignmentTeams: ['FOIA Operations – Policy'] },
  { id: 'office-general-counsel', name: 'Office of General Counsel Records', custodianName: 'Riley Chen (sample)', assignmentTeams: ['FOIA Operations – Legal'] },
];

const emptyEvidence = { locationsSearched: '', systems: '', timeSpentHours: 0, searchedBy: '', notes: '' };
export const seedRfds: RFD[] = [
  { id: 'rfd-0139-1', caseId: 'FOIA-2025-0139', office: 'Office of Environmental Records', custodianName: 'Jordan Kim (sample)', systemsOrLocations: 'Environmental records repository', searchTerms: 'facility inspection', dateRangeStart: '2023-01-01', dateRangeEnd: '2024-12-31', instructions: 'Sample search request.', dueDate: '2025-01-18', sentAt: '2025-01-10T14:00:00.000Z', status: RFD_STATUS.SENT, returnedDocIds: [], evidence: emptyEvidence },
  { id: 'rfd-0139-2', caseId: 'FOIA-2025-0139', office: 'Office of Program Records', custodianName: 'Casey Rivera (sample)', systemsOrLocations: 'Program shared drive', searchTerms: 'inspection reports', dateRangeStart: '2023-01-01', dateRangeEnd: '2024-12-31', instructions: 'Sample search request.', dueDate: '2025-01-24', sentAt: '2025-01-11T14:00:00.000Z', status: RFD_STATUS.RETURNED_RECORDS, returnedDocIds: ['doc-0139-1'], evidence: { locationsSearched: 'Program shared drive', systems: 'Records repository', timeSpentHours: 2, searchedBy: 'Casey Rivera (sample)', notes: 'Sample return.' } },
];

export const seedClockEvents: ClockEvent[] = [{
  id: 'clock-0102-hold', caseId: 'FOIA-2025-0102', kind: CLOCK_EVENT_KIND.HOLD_RECORDED,
  holdType: HOLD_TYPE.CLARIFICATION, reason: 'Clarification response requested.', effectiveDate: '2025-01-08',
  authorisedBy: 'A. Carter', authorisedRole: 'Processor', ruleStatus: 'Rule pending counsel/SME approval',
}];

export const seedCorrespondence: Correspondence[] = [{
  id: 'correspondence-0102-clarification', caseId: 'FOIA-2025-0102', type: CORRESPONDENCE_TYPE.CLARIFICATION,
  templateId: 'template-clarification', subject: 'Clarification request for FOIA-2025-0102',
  body: '[Approved template wording pending counsel/SME] FOIA-2025-0102 Sample requester',
  direction: 'Outbound', status: CORRESPONDENCE_STATUS.SENT, requesterVisible: true,
  createdBy: 'A. Carter', approvedBy: 'R. Gomez', sentAt: '2025-01-08T12:00:00.000Z',
}, {
  id: 'correspondence-0118-final', caseId: 'FOIA-2025-0118', type: CORRESPONDENCE_TYPE.FINAL_RESPONSE,
  templateId: 'template-6', subject: 'Final response - FOIA-2025-0118', body: '[Approved template wording pending counsel/SME]',
  direction: 'Outbound', status: CORRESPONDENCE_STATUS.APPROVED, requesterVisible: true, createdBy: 'S. Patel', approvedBy: 'R. Gomez',
}, {
  id: 'correspondence-0109-final', caseId: 'FOIA-2025-0109', type: CORRESPONDENCE_TYPE.FINAL_RESPONSE,
  templateId: 'template-6', subject: 'Final response - FOIA-2025-0109', body: '[Approved template wording pending counsel/SME]',
  direction: 'Outbound', status: CORRESPONDENCE_STATUS.SENT, requesterVisible: true, createdBy: 'S. Patel', approvedBy: 'R. Gomez', sentAt: '2025-01-22T15:00:00.000Z',
}, {
  id: 'correspondence-0103-final', caseId: 'FOIA-2025-0103', type: CORRESPONDENCE_TYPE.FINAL_RESPONSE,
  templateId: 'template-6', subject: 'Earlier final response - FOIA-2025-0103', body: '[Approved template wording pending counsel/SME]',
  direction: 'Outbound', status: CORRESPONDENCE_STATUS.SENT, requesterVisible: true, createdBy: 'S. Patel', approvedBy: 'R. Gomez', sentAt: '2025-01-15T15:00:00.000Z',
}];

const templateBody = '[Approved template wording pending counsel/SME] Case {{caseId}} Requester {{requesterName}}';
const templateDefinitions = [
  [CORRESPONDENCE_TYPE.ACKNOWLEDGEMENT, 'Acknowledgement'],
  [CORRESPONDENCE_TYPE.CLARIFICATION, 'Clarification request'],
  [CORRESPONDENCE_TYPE.FEE_ESTIMATE, 'Fee estimate'],
  [CORRESPONDENCE_TYPE.EXTENSION, 'Extension notice'],
  [CORRESPONDENCE_TYPE.INTERIM_RELEASE, 'Interim release'],
  [CORRESPONDENCE_TYPE.FINAL_RESPONSE, 'Final response'],
] as const satisfies ReadonlyArray<readonly [CorrespondenceTemplate['type'], string]>;

export const seedCorrespondenceTemplates: CorrespondenceTemplate[] = templateDefinitions.map(([type, name], index) => ({ id: `template-${index + 1}`, type, name, subject: `${name} - {{caseId}}`, body: templateBody, version: 1, mergeFields: ['caseId', 'requesterName'] }));

export const seedAdminUsers: AdminUser[] = (Object.entries(DEMO_USERS) as Array<[keyof typeof DEMO_USERS, string]>).map(([roleView, name], index) => ({
  id: `demo-user-${index + 1}`,
  name,
  roleView,
  office: roleView === 'Requester (Portal)' ? 'Public requester' : 'FOIA Office (sample)',
  status: 'Active',
}));

export const seedReferenceData: ReferenceData = {
  tracks: Object.values(PROCESSING_TRACK),
  requestSources: Object.values(REQUEST_SOURCE),
  requesterCategories: Object.values(REQUESTER_CATEGORY),
  exemptionCodes: seedExemptionCodes,
  dispositions: Object.values(DISPOSITION),
  feeRates: [{ label: 'Search hour (illustrative)', rate: 20 }, { label: 'Duplication page (illustrative)', rate: 0.1 }],
  publicStatusMapping: {
    [CASE_STATUS.PENDING_ASSIGNMENT]: 'Submitted',
    [CASE_STATUS.IN_PROGRESS]: 'In process',
    [CASE_STATUS.RECORDS_SEARCH]: 'Searching for records',
    [CASE_STATUS.REVIEW]: 'Reviewing records',
    [CASE_STATUS.QC_REVIEW]: 'Reviewing records',
    [CASE_STATUS.DETERMINATION]: 'Preparing response',
    [CASE_STATUS.PENDING_RESPONSE]: 'Preparing response',
    [CASE_STATUS.CLOSED]: 'Closed',
    [CASE_STATUS.REOPENED]: 'In process',
    [CASE_STATUS.TRANSFERRED]: 'Transferred',
  },
};

export const seedAudit: AuditEvent[] = seedCases.map((record, index) => ({
  id: `audit-seed-${String(index + 1).padStart(3, '0')}`,
  caseId: record.id,
  at: `2025-01-22T${String(8 + Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 10).padStart(2, '0')}:00.000Z`,
  actorName: 'Muskaan Shaikh',
  actorRole: 'Administrator',
  action: 'Seed case available',
  detail: `Sample data loaded for ${record.id}.`,
  visibility: 'Internal',
}));

export const seedNotifications: Notification[] = [
  { id: 'notification-001', forRole: 'Processor', forName: 'A. Carter', caseId: 'FOIA-2025-0147', text: 'Review records task is open.', createdAt: '2025-01-22T10:00:00.000Z', read: false },
  { id: 'notification-002', forRole: 'Reviewer / Redactor', forName: 'S. Patel', caseId: 'FOIA-2025-0135', text: 'Redaction task is in progress.', createdAt: '2025-01-22T10:10:00.000Z', read: false },
  { id: 'notification-003', forRole: 'Supervisor / QC', forName: 'R. Gomez', caseId: 'FOIA-2025-0128', text: 'Response package is ready for review.', createdAt: '2025-01-22T10:20:00.000Z', read: false },
  { id: 'notification-004', forRole: 'FOIA Manager', forName: 'P. Singh', caseId: 'FOIA-2025-0103', text: 'A reopened sample case needs review.', createdAt: '2025-01-22T10:30:00.000Z', read: false },
];
