export const CASE_STATUS = {
  PENDING_ASSIGNMENT: 'Intake – Pending Assignment',
  IN_PROGRESS: 'In Progress',
  RECORDS_SEARCH: 'Records Search',
  REVIEW: 'Review',
  QC_REVIEW: 'QC Review',
  DETERMINATION: 'Determination',
  PENDING_RESPONSE: 'Pending Response',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
  TRANSFERRED: 'Transferred',
} as const;

export type CaseStatus = (typeof CASE_STATUS)[keyof typeof CASE_STATUS];
export const TERMINAL_STATUSES: CaseStatus[] = [CASE_STATUS.CLOSED, CASE_STATUS.TRANSFERRED];
export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  [CASE_STATUS.PENDING_ASSIGNMENT]: [CASE_STATUS.IN_PROGRESS, CASE_STATUS.CLOSED, CASE_STATUS.TRANSFERRED],
  [CASE_STATUS.IN_PROGRESS]: [CASE_STATUS.RECORDS_SEARCH, CASE_STATUS.REVIEW, CASE_STATUS.CLOSED, CASE_STATUS.TRANSFERRED],
  [CASE_STATUS.RECORDS_SEARCH]: [CASE_STATUS.REVIEW, CASE_STATUS.QC_REVIEW, CASE_STATUS.DETERMINATION, CASE_STATUS.CLOSED, CASE_STATUS.TRANSFERRED],
  [CASE_STATUS.REVIEW]: [CASE_STATUS.QC_REVIEW, CASE_STATUS.RECORDS_SEARCH, CASE_STATUS.CLOSED],
  [CASE_STATUS.QC_REVIEW]: [CASE_STATUS.DETERMINATION, CASE_STATUS.REVIEW, CASE_STATUS.CLOSED, CASE_STATUS.TRANSFERRED],
  [CASE_STATUS.DETERMINATION]: [CASE_STATUS.PENDING_RESPONSE, CASE_STATUS.REVIEW, CASE_STATUS.CLOSED, CASE_STATUS.TRANSFERRED],
  [CASE_STATUS.PENDING_RESPONSE]: [CASE_STATUS.CLOSED, CASE_STATUS.TRANSFERRED],
  [CASE_STATUS.CLOSED]: [CASE_STATUS.REOPENED],
  [CASE_STATUS.REOPENED]: [CASE_STATUS.IN_PROGRESS, CASE_STATUS.RECORDS_SEARCH, CASE_STATUS.CLOSED, CASE_STATUS.TRANSFERRED],
  [CASE_STATUS.TRANSFERRED]: [],
};

export const ROLE_VIEWS = [
  'Administrator',
  'Intake Staff',
  'Processor',
  'Reviewer / Redactor',
  'Supervisor / QC',
  'Custodian / Action Office',
  'Appeals Reviewer',
  'Fee / Finance',
  'FOIA Manager',
  'Security / Audit',
  'Requester (Portal)',
] as const;
export type RoleView = (typeof ROLE_VIEWS)[number];

export const DEMO_USERS: Record<RoleView, string> = {
  Administrator: 'Muskaan Shaikh',
  'Intake Staff': 'E. Hart',
  Processor: 'A. Carter',
  'Reviewer / Redactor': 'S. Patel',
  'Supervisor / QC': 'R. Gomez',
  'Custodian / Action Office': 'Records contact (sample)',
  'Appeals Reviewer': 'D. Wilson',
  'Fee / Finance': 'T. Adams',
  'FOIA Manager': 'P. Singh',
  'Security / Audit': 'C. Lopez',
  'Requester (Portal)': 'Requester (sample)',
};

export const TASK_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
} as const;
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const DOC_CLASSIFICATION = {
  SOURCE: 'Source/original',
  WORKING: 'Working copy',
  REVIEW: 'Review copy',
  CANDIDATE: 'Candidate release',
  APPROVED: 'Approved release copy (prototype)',
} as const;
export type DocumentClassification = (typeof DOC_CLASSIFICATION)[keyof typeof DOC_CLASSIFICATION];

export const ACCESS_CLASS = {
  INTERNAL: 'Internal only',
  REQUESTER: 'Requester-visible',
  PUBLIC: 'Public-safe',
} as const;
export type AccessClass = (typeof ACCESS_CLASS)[keyof typeof ACCESS_CLASS];

export const UPLOAD_STATUS = {
  UPLOADED: 'Uploaded',
  FAILED: 'Failed',
  QUARANTINED: 'Quarantined',
} as const;
export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];

export const REQUEST_TYPE = {
  FOIA: 'FOIA',
  PRIVACY_ACT: 'Privacy Act',
} as const;
export type RequestType = (typeof REQUEST_TYPE)[keyof typeof REQUEST_TYPE];

export const COMPLETENESS = {
  COMPLETE: 'Complete - register',
  NEEDS_CLARIFICATION: 'Needs clarification - register and flag',
} as const;
export type Completeness = (typeof COMPLETENESS)[keyof typeof COMPLETENESS];

export const PROCESSING_TRACK = {
  NOT_SET: 'Not set',
  STANDARD: 'Standard',
  COMPLEX: 'Complex',
  EXPEDITED: 'Expedited',
} as const;
export type ProcessingTrack = (typeof PROCESSING_TRACK)[keyof typeof PROCESSING_TRACK];

export const REQUEST_SOURCE = {
  PORTAL: 'Portal',
  FOIA_GOV_SIMULATED: 'FOIA.gov (simulated import)',
  EMAIL: 'Email',
  POSTAL_MAIL: 'Postal mail',
  FAX: 'Fax',
  STAFF_ENTERED: 'Staff-entered',
  OTHER: 'Other',
  NOT_PROVIDED: 'Not provided',
} as const;

export const REQUESTER_CATEGORY = {
  COMMERCIAL: 'Commercial',
  EDUCATIONAL: 'Educational / noncommercial scientific',
  NEWS_MEDIA: 'News media',
  ALL_OTHER: 'All other',
} as const;

export const RFD_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  RETURNED_RECORDS: 'Returned - records',
  RETURNED_NO_RECORDS: 'Returned - no records',
  FOLLOW_UP: 'Follow-up requested',
  ACCEPTED: 'Accepted',
  CANCELLED: 'Cancelled',
} as const;
export type RfdStatus = (typeof RFD_STATUS)[keyof typeof RFD_STATUS];

export const CORRESPONDENCE_TYPE = {
  ACKNOWLEDGEMENT: 'Acknowledgement',
  CLARIFICATION: 'Clarification request',
  FEE_ESTIMATE: 'Fee estimate',
  EXTENSION: 'Extension notice',
  INTERIM_RELEASE: 'Interim release',
  FINAL_RESPONSE: 'Final response',
  COORDINATION_NOTICE: 'Consultation/Referral notice',
  REQUESTER_REPLY: 'Requester reply',
  OTHER: 'Other',
} as const;
export type CorrespondenceType = (typeof CORRESPONDENCE_TYPE)[keyof typeof CORRESPONDENCE_TYPE];

export const CORRESPONDENCE_STATUS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  SENT: 'Sent (simulated)',
  DELIVERY_FAILED: 'Delivery failed (simulated)',
} as const;
export type CorrespondenceStatus = (typeof CORRESPONDENCE_STATUS)[keyof typeof CORRESPONDENCE_STATUS];

export const CLOCK_EVENT_KIND = {
  CONTROLLING_DATE: 'Controlling date set',
  HOLD_RECORDED: 'Hold recorded',
  HOLD_ENDED: 'Hold ended',
  EXTENSION: 'Extension recorded',
  EXPEDITE: 'Expedite decision',
  TARGET_DATE: 'Target date recorded',
  TRACK_CHANGED: 'Track changed',
} as const;
export type ClockEventKind = (typeof CLOCK_EVENT_KIND)[keyof typeof CLOCK_EVENT_KIND];

export const HOLD_TYPE = {
  CLARIFICATION: 'Clarification',
  FEE: 'Fee',
  OTHER: 'Other approved',
} as const;
export type HoldType = (typeof HOLD_TYPE)[keyof typeof HOLD_TYPE];

export const CLOSURE_KIND = {
  WITHDRAWN: 'Withdrawn by requester',
  NO_RESPONSE: 'No response - administrative',
  FINAL_RESPONSE: 'Final response',
} as const;
export type ClosureKind = (typeof CLOSURE_KIND)[keyof typeof CLOSURE_KIND];

export const CLOSURE_STATUS = {
  PENDING: 'Pending approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;
export type ClosureStatus = (typeof CLOSURE_STATUS)[keyof typeof CLOSURE_STATUS];

export const RESPONSIVENESS = {
  RESPONSIVE: 'Responsive',
  NON_RESPONSIVE: 'Non-responsive',
  NOT_REVIEWED: 'Not reviewed',
} as const;
export type Responsiveness = (typeof RESPONSIVENESS)[keyof typeof RESPONSIVENESS];

export const REVIEW_OUTCOME = {
  RELEASE_FULL: 'Release in full',
  RELEASE_PART: 'Release in part',
  WITHHOLD_FULL: 'Withhold in full',
  REFERRED: 'Referred to another entity',
  CONSULTATION: 'Pending consultation',
  NOT_APPLICABLE: 'Not applicable',
} as const;
export type ReviewOutcome = (typeof REVIEW_OUTCOME)[keyof typeof REVIEW_OUTCOME];

export const REVIEW_STATUS = {
  NOT_STARTED: 'Not started',
  IN_REVIEW: 'In review',
  COMPLETE: 'Review complete',
  REWORK: 'Needs rework',
} as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

export const SEGREGABILITY_DECISION = {
  RELEASED: 'Reasonably segregable portions released',
  WITHHELD: 'Withheld in full',
} as const;

export const QC_KIND = {
  RELEASE: 'Release package',
  NO_RECORDS: 'No-records determination',
} as const;
export const QC_ITEM_RESULT = {
  PASS: 'Pass',
  FAIL: 'Fail',
  NOT_APPLICABLE: 'Not applicable',
} as const;
export type QcItemResult = (typeof QC_ITEM_RESULT)[keyof typeof QC_ITEM_RESULT];
export const QC_DECISION = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  RETURNED: 'Returned',
} as const;

export const DETERMINATION_STATUS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
} as const;
export const DISPOSITION = {
  FULL_GRANT: 'Full grant',
  PARTIAL: 'Grant in part / deny in part',
  FULL_DENIAL: 'Full denial',
  NO_RECORDS: 'No records',
  OTHER: 'Other approved',
} as const;

export const RELEASE_KIND = {
  INTERIM: 'Interim',
  FINAL: 'Final',
} as const;
export const RELEASE_CHANNEL = {
  SECURE_LINK: 'Secure link (simulated)',
  EMAIL: 'Email (simulated)',
  MAIL: 'Mail',
} as const;
export const DELIVERY_OUTCOME = {
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
} as const;
export const PUBLICATION_CHOICE = {
  YES: 'Yes',
  NO: 'No',
  NOT_APPLICABLE: 'Not applicable',
} as const;

export const COORDINATION_KIND = {
  CONSULTATION: 'Consultation',
  REFERRAL: 'Referral',
  TRANSFER: 'Transfer',
} as const;
export type CoordinationKind = (typeof COORDINATION_KIND)[keyof typeof COORDINATION_KIND];
export const OWNERSHIP_AFTER = {
  RETAINED: 'Retained by this office',
  DESTINATION: 'Responsibility passes to destination',
  WHOLE_REQUEST: 'Whole request moves',
} as const;
export const COORDINATION_STATUS = {
  IDENTIFIED: 'Identified',
  APPROVED: 'Approved to send',
  SENT: 'Sent',
  ACKNOWLEDGED: 'Acknowledged',
  RESPONSE: 'Response received',
  APPLIED: 'Recommendation applied',
  CLOSED: 'Closed',
} as const;

export const WAIVER_DECISION = {
  PENDING: 'Pending',
  GRANTED: 'Granted',
  PARTIAL: 'Partially granted',
  DENIED: 'Denied',
} as const;
export const REQUESTER_AGREEMENT = {
  PENDING: 'Pending',
  AGREED: 'Agreed',
  DECLINED: 'Declined',
  NO_RESPONSE: 'No response',
} as const;
export const PAYMENT_STATUS = {
  NOT_REQUIRED: 'Not required',
  AWAITING: 'Awaiting payment',
  PAID: 'Paid (recorded manually)',
  FAILED: 'Failed (simulated)',
  DISPUTED: 'Disputed',
} as const;

export const APPEAL_STATUS = {
  RECEIVED: 'Received',
  ASSIGNED: 'Assigned',
  IN_REVIEW: 'In review',
  DECIDED: 'Decided',
  REMANDED: 'Remanded',
  WITHDRAWN: 'Withdrawn',
  CLOSED: 'Closed',
} as const;
export const APPEAL_DECISION = {
  AFFIRMED: 'Affirmed',
  MODIFIED: 'Modified',
  REVERSED: 'Reversed',
  REMANDED: 'Remanded',
} as const;
export type AppealDecision = (typeof APPEAL_DECISION)[keyof typeof APPEAL_DECISION];

export type DueDateBasis = 'Seeded sample' | 'Entered by user' | 'Not established';
export type ClockState = 'Not established' | 'Recorded' | 'Hold recorded' | 'Ended';

export interface CaseRecord {
  id: string;
  title: string;
  requester: string;
  received: string;
  status: CaseStatus;
  team: string;
  processor: string;
  track: string;
  risk: string;
  source?: string;
  requesterType?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateRange?: string;
  responseFormat?: string;
  secondaryProcessor?: string;
  assignmentNotes?: string;
  requestType: RequestType;
  needsClarification: boolean;
  expeditedRequested: boolean;
  willingToPayFees: boolean;
  feeCategory?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  requesterKey: string;
  relatedCaseIds: string[];
  dueDate: string | null;
  dueDateBasis: DueDateBasis;
  controllingDate: {
    receivedDate: string;
    perfectedDate?: string;
    basis: string;
    setBy: string;
    setAt: string;
  } | null;
  clock: { state: ClockState; holdType?: string; holdSince?: string };
  closureReason?: string;
}

export interface Task {
  id: string;
  caseId: string;
  type: string;
  title: string;
  ownerName: string;
  ownerRole: RoleView;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  completedAt?: string;
  linkedRef?: string;
}

export interface Document {
  id: string;
  caseId: string;
  rfdId?: string;
  name: string;
  sizeKb: number;
  mime: string;
  source: 'Requester-supplied' | 'Custodian return' | 'Created in processing';
  classification: DocumentClassification;
  parentDocId?: string;
  version: number;
  accessClass: AccessClass;
  uploadStatus: UploadStatus;
  pageCount: number;
  createdAt: string;
  createdBy: string;
  office?: string;
  releasedInRecordId?: string | null;
  lockedByQcId?: string;
}

export interface ReviewDecision {
  docId: string;
  responsiveness: Responsiveness;
  outcome: ReviewOutcome;
  reviewStatus: ReviewStatus;
  reviewer: string;
  at: string;
  candidateDocId?: string;
  candidateValidated?: boolean;
  candidateFailureReason?: string;
  qcApproved?: boolean;
}

export interface Redaction {
  id: string;
  docId: string;
  page: number;
  lines: number[];
  exemptionCode: string;
  rationale: string;
  createdBy: string;
  createdAt: string;
}

export interface WithholdingRecord {
  docId: string;
  exemptionCodes: string[];
  rationale: string;
}

export interface Segregability {
  docId: string;
  decision: (typeof SEGREGABILITY_DECISION)[keyof typeof SEGREGABILITY_DECISION];
  note: string;
}

export interface QCReview {
  id: string;
  caseId: string;
  round: number;
  kind: (typeof QC_KIND)[keyof typeof QC_KIND];
  docIds: string[];
  submittedBy: string;
  submittedAt: string;
  checklist: QcItemResult[];
  findings: Array<{ docId?: string; text: string }>;
  decision: (typeof QC_DECISION)[keyof typeof QC_DECISION];
  decidedBy?: string;
  decidedAt?: string;
}

export interface Determination {
  caseId: string;
  disposition: (typeof DISPOSITION)[keyof typeof DISPOSITION];
  pagesReleasedInFull: number;
  pagesReleasedInPart: number;
  pagesWithheld: number;
  exemptionsUsed: string[];
  feeOutcome?: string;
  letterBody: string;
  status: (typeof DETERMINATION_STATUS)[keyof typeof DETERMINATION_STATUS];
  preparedBy: string;
  approvedBy?: string;
  correctionReason?: string;
}

export interface ReleaseRecord {
  id: string;
  caseId: string;
  kind: (typeof RELEASE_KIND)[keyof typeof RELEASE_KIND];
  docIds: string[];
  correspondenceId: string;
  channel: (typeof RELEASE_CHANNEL)[keyof typeof RELEASE_CHANNEL];
  sentAt: string;
  sentBy: string;
  deliveryOutcome: (typeof DELIVERY_OUTCOME)[keyof typeof DELIVERY_OUTCOME];
  publishToReadingRoom: (typeof PUBLICATION_CHOICE)[keyof typeof PUBLICATION_CHOICE];
}

export interface CoordinationItem {
  id: string;
  caseId: string;
  kind: CoordinationKind;
  destination: string;
  docIds: string[];
  basis: string;
  ownershipAfter: (typeof OWNERSHIP_AFTER)[keyof typeof OWNERSHIP_AFTER];
  status: (typeof COORDINATION_STATUS)[keyof typeof COORDINATION_STATUS];
  dueDate: string;
  noticeCorrespondenceId?: string;
  responseText?: string;
  createdBy: string;
  createdAt: string;
}

export interface FeeRecord {
  caseId: string;
  requesterCategory: string;
  willingToPayAmount?: number;
  lines: Array<{ label: string; quantity: number; rate: number; amount: number }>;
  estimateTotal: number;
  waiver: {
    requested: boolean;
    decision: (typeof WAIVER_DECISION)[keyof typeof WAIVER_DECISION];
    rationale: string;
    decidedBy: string;
  };
  requesterAgreement: (typeof REQUESTER_AGREEMENT)[keyof typeof REQUESTER_AGREEMENT];
  payment: { status: (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]; reference: string };
  rateScheduleStatus: 'Rates pending fee schedule (V-09)';
}

export interface Appeal {
  id: string;
  caseId: string;
  receivedDate: string;
  channel: string;
  appellant: string;
  challengedReleaseId?: string;
  grounds: string;
  status: (typeof APPEAL_STATUS)[keyof typeof APPEAL_STATUS];
  assignedTo?: string;
  decision?: (typeof APPEAL_DECISION)[keyof typeof APPEAL_DECISION];
  rationale?: string;
  eligibilityNote: 'Eligibility and timing pending counsel (OQ-12)';
  staffReviewRoute: boolean;
}

export interface ReadingRoomItem {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  docIds: string[];
  status: 'Draft' | 'Pending approval' | 'Published' | 'Unpublished';
  preparedBy: string;
  approvedBy?: string;
  publicationBasis: 'Policy pending';
  unpublishReason?: string;
}

export interface RFD {
  id: string;
  caseId: string;
  office: string;
  custodianName: string;
  systemsOrLocations: string;
  searchTerms: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  instructions: string;
  dueDate: string;
  sentAt?: string;
  status: RfdStatus;
  returnedDocIds: string[];
  evidence: {
    locationsSearched: string;
    systems: string;
    timeSpentHours: number;
    searchedBy: string;
    notes: string;
  };
  noRecordsStatement?: { text: string; by: string; at: string };
  cancellationReason?: string;
}

export interface Correspondence {
  id: string;
  caseId: string;
  type: CorrespondenceType;
  templateId: string;
  subject: string;
  body: string;
  direction: 'Outbound' | 'Inbound';
  status: CorrespondenceStatus;
  requesterVisible: boolean;
  createdBy: string;
  createdAt?: string;
  approvedBy?: string;
  sentAt?: string;
}

export interface CorrespondenceTemplate {
  id: string;
  type: CorrespondenceType;
  name: string;
  subject: string;
  body: string;
  version: number;
  mergeFields: string[];
}

export interface ClockEvent {
  id: string;
  caseId: string;
  kind: ClockEventKind;
  holdType?: HoldType;
  reason: string;
  effectiveDate: string;
  authorisedBy: string;
  authorisedRole: RoleView;
  ruleStatus: 'Rule pending counsel/SME approval';
}

export interface Office {
  id: string;
  name: string;
  custodianName: string;
  assignmentTeams: string[];
}

export interface AdminUser {
  id: string;
  name: string;
  roleView: RoleView;
  office: string;
  status: 'Active' | 'Disabled';
}

export interface ReferenceData {
  tracks: string[];
  requestSources: string[];
  requesterCategories: string[];
  exemptionCodes: string[];
  dispositions: string[];
  feeRates: Array<{ label: string; rate: number }>;
  publicStatusMapping: Record<CaseStatus, string>;
}

export interface ClosureRequest {
  id: string;
  caseId: string;
  kind: ClosureKind;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: ClosureStatus;
}

export interface AuditEvent {
  id: string;
  caseId?: string;
  at: string;
  actorName: string;
  actorRole: RoleView;
  action: string;
  detail: string;
  from?: string;
  to?: string;
  reason?: string;
  visibility: 'Internal';
}

export interface Notification {
  id: string;
  forRole?: RoleView;
  forName?: string;
  caseId?: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Settings {
  asOfDate: string;
  coordinationInScope: boolean;
  feesInScope: boolean;
  appealsInScope: boolean;
  portalInScope: boolean;
  readingRoomInScope: boolean;
  outboundApprovalRequired: boolean;
  qcForNoRecords: boolean;
  showAiAssistant: boolean;
}

export interface StoreState {
  cases: CaseRecord[];
  tasks: Task[];
  documents: Document[];
  audit: AuditEvent[];
  notifications: Notification[];
  rfds: RFD[];
  correspondence: Correspondence[];
  correspondenceTemplates: CorrespondenceTemplate[];
  clockEvents: ClockEvent[];
  offices: Office[];
  closureRequests: ClosureRequest[];
  reviewDecisions: ReviewDecision[];
  redactions: Redaction[];
  withholdingRecords: WithholdingRecord[];
  segregability: Segregability[];
  qcReviews: QCReview[];
  determinations: Determination[];
  releaseRecords: ReleaseRecord[];
  exemptionCodes: string[];
  coordinationItems: CoordinationItem[];
  feeRecords: FeeRecord[];
  appeals: Appeal[];
  readingRoomItems: ReadingRoomItem[];
  adminUsers: AdminUser[];
  referenceData: ReferenceData;
  portalInstructionText: string;
  settings: Settings;
  ui: { roleView: RoleView; portalRequesterKey?: string };
  schemaVersion: number;
  message?: string;
}

export type NewCaseData = Pick<CaseRecord, 'title' | 'requester' | 'received'> &
  Partial<Omit<CaseRecord, 'id' | 'title' | 'requester' | 'received' | 'status'>> & {
    attachments?: Array<Pick<Document, 'name' | 'sizeKb' | 'mime'>>;
  };

export function requesterKey(name: string) {
  return name.trim().toLowerCase();
}

export function displayDueDate(date: string | null) {
  return date
    ? new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not established';
}

export function calendarDays(from: string, to: string) {
  return Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86400000);
}

export function openTask(task: Task) {
  return task.status !== TASK_STATUS.DONE && task.status !== TASK_STATUS.CANCELLED;
}
