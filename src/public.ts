import {
  ACCESS_CLASS,
  APPEAL_STATUS,
  CASE_STATUS,
  CaseRecord,
  CORRESPONDENCE_STATUS,
  CORRESPONDENCE_TYPE,
  DELIVERY_OUTCOME,
  REQUESTER_AGREEMENT,
  StoreState,
} from './types';

export type RequesterAction = 'clarification' | 'fee' | null;

const correspondenceTime = (item: StoreState['correspondence'][number]) => item.sentAt || item.createdAt || item.id;

export function requesterAction(caseId: string, state: StoreState): RequesterAction {
  const messages = state.correspondence.filter(item => item.caseId === caseId);
  const clarification = messages.filter(item => item.type === CORRESPONDENCE_TYPE.CLARIFICATION && item.status === CORRESPONDENCE_STATUS.SENT).sort((a, b) => correspondenceTime(b).localeCompare(correspondenceTime(a)))[0];
  const reply = messages.filter(item => item.type === CORRESPONDENCE_TYPE.REQUESTER_REPLY && item.direction === 'Inbound').sort((a, b) => correspondenceTime(b).localeCompare(correspondenceTime(a)))[0];
  if (clarification && (!reply || correspondenceTime(reply) <= correspondenceTime(clarification))) return 'clarification';
  const feeNotice = messages.some(item => item.type === CORRESPONDENCE_TYPE.FEE_ESTIMATE && item.status === CORRESPONDENCE_STATUS.SENT);
  const fee = state.feeRecords.find(item => item.caseId === caseId);
  if (feeNotice && fee?.requesterAgreement === REQUESTER_AGREEMENT.PENDING) return 'fee';
  return null;
}

export function publicStatus(caseRecord: CaseRecord, state: StoreState) {
  const action = requesterAction(caseRecord.id, state);
  if (action === 'clarification') return 'Action required - clarification';
  if (action === 'fee') return 'Action required - fee';
  if (caseRecord.status === CASE_STATUS.CLOSED) {
    const finalRelease = state.releaseRecords.some(item => item.caseId === caseRecord.id && item.kind === 'Final' && item.deliveryOutcome === DELIVERY_OUTCOME.DELIVERED);
    const disposition = state.determinations.find(item => item.caseId === caseRecord.id)?.disposition;
    return finalRelease && disposition ? `Closed - ${disposition}` : 'Closed';
  }
  return state.referenceData.publicStatusMapping[caseRecord.status];
}

export function requesterDocuments(caseRecord: CaseRecord, state: StoreState) {
  if (caseRecord.requestType === 'Privacy Act') return [];
  const sentIds = new Set(state.releaseRecords.filter(item => item.caseId === caseRecord.id && item.deliveryOutcome === DELIVERY_OUTCOME.DELIVERED).flatMap(item => item.docIds));
  return state.documents.filter(item => item.caseId === caseRecord.id && item.releasedInRecordId && sentIds.has(item.id) && [ACCESS_CLASS.REQUESTER, ACCESS_CLASS.PUBLIC].includes(item.accessClass as typeof ACCESS_CLASS.REQUESTER | typeof ACCESS_CLASS.PUBLIC));
}

export function requesterTimeline(caseRecord: CaseRecord, state: StoreState) {
  const registration = [{ id: `registration-${caseRecord.id}`, at: `${caseRecord.received}T12:00:00.000Z`, title: 'Request registered', detail: `Tracking number ${caseRecord.id}` }];
  const correspondence = state.correspondence.filter(item => item.caseId === caseRecord.id && item.requesterVisible).map(item => ({
    id: item.id, at: correspondenceTime(item), title: item.type, detail: `${item.direction} - ${item.status}`,
  }));
  const releases = state.releaseRecords.filter(item => item.caseId === caseRecord.id).map(item => ({
    id: item.id, at: item.sentAt, title: `${item.kind} release`, detail: `${item.deliveryOutcome} - ${item.docIds.length} document(s)`,
  }));
  const appeals = state.appeals.filter(item => item.caseId === caseRecord.id).map(item => ({
    id: item.id, at: `${item.receivedDate}T12:00:00.000Z`, title: 'Appeal update', detail: `${item.id} - ${item.status === APPEAL_STATUS.RECEIVED ? 'Received' : item.status}`,
  }));
  return [...registration, ...correspondence, ...releases, ...appeals].sort((a, b) => b.at.localeCompare(a.at));
}
