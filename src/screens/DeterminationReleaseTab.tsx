import { useMemo, useState } from 'react';
import CloseCaseDialog from '../components/CloseCaseDialog';
import { can } from '../permissions';
import { useStore } from '../store';
import {
  ACCESS_CLASS, CASE_STATUS, CaseRecord, CLOSURE_KIND, COORDINATION_STATUS, CORRESPONDENCE_STATUS, CORRESPONDENCE_TYPE,
  DELIVERY_OUTCOME, DEMO_USERS, Determination, DETERMINATION_STATUS, DISPOSITION, DOC_CLASSIFICATION,
  PUBLICATION_CHOICE, RELEASE_CHANNEL, RELEASE_KIND, REQUEST_TYPE, REVIEW_OUTCOME, RESPONSIVENESS, TASK_STATUS,
} from '../types';

export default function DeterminationReleaseTab({ caseRecord }: { caseRecord: CaseRecord }) {
  const {
    state, saveDetermination, approveDetermination, createCorrespondence, updateCorrespondence,
    dispatchRelease, retryRelease, returnToReview, requestClosure, decideClosure,
    createReadingRoomItem, approveReadingRoomItem, unpublishReadingRoomItem,
  } = useStore();
  const existing = state.determinations.find(item => item.caseId === caseRecord.id);
  const decisions = state.reviewDecisions.filter(item => state.documents.some(document => document.id === item.docId && document.caseId === caseRecord.id));
  const withholding = state.withholdingRecords.filter(item => decisions.some(decision => decision.docId === item.docId));
  const derivedExemptions = [...new Set([...state.redactions.filter(item => decisions.some(decision => decision.docId === item.docId)).map(item => item.exemptionCode), ...withholding.flatMap(item => item.exemptionCodes)])];
  const derivedCounts = decisions.reduce((counts, decision) => {
    const pages = state.documents.find(document => document.id === decision.docId)?.pageCount || 0;
    if (decision.outcome === REVIEW_OUTCOME.RELEASE_FULL) counts.full += pages;
    if (decision.outcome === REVIEW_OUTCOME.RELEASE_PART) counts.part += pages;
    if (decision.outcome === REVIEW_OUTCOME.WITHHOLD_FULL) counts.withheld += pages;
    return counts;
  }, { full: 0, part: 0, withheld: 0 });
  const [disposition, setDisposition] = useState(existing?.disposition || DISPOSITION.FULL_GRANT);
  const [fullPages, setFullPages] = useState(existing?.pagesReleasedInFull ?? derivedCounts.full);
  const [partPages, setPartPages] = useState(existing?.pagesReleasedInPart ?? derivedCounts.part);
  const [withheldPages, setWithheldPages] = useState(existing?.pagesWithheld ?? derivedCounts.withheld);
  const [exemptions, setExemptions] = useState((existing?.exemptionsUsed || derivedExemptions).join(', '));
  const [letterBody, setLetterBody] = useState(existing?.letterBody || '[Approved wording pending counsel]');
  const [correctionReason, setCorrectionReason] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [kind, setKind] = useState(RELEASE_KIND.FINAL);
  const [channel, setChannel] = useState(RELEASE_CHANNEL.SECURE_LINK);
  const [publication, setPublication] = useState(PUBLICATION_CHOICE.NOT_APPLICABLE);
  const [messageId, setMessageId] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [closureOpen, setClosureOpen] = useState(false);
  const [readingTitle, setReadingTitle] = useState(caseRecord.title);
  const [readingDescription, setReadingDescription] = useState('');
  const [readingCategory, setReadingCategory] = useState('Frequently requested records');
  const [readingDocs, setReadingDocs] = useState<string[]>([]);
  const approvedCopies = state.documents.filter(document => document.caseId === caseRecord.id && document.classification === DOC_CLASSIFICATION.APPROVED);
  const messages = state.correspondence.filter(item => item.caseId === caseRecord.id && [CORRESPONDENCE_TYPE.INTERIM_RELEASE, CORRESPONDENCE_TYPE.FINAL_RESPONSE].includes(item.type as typeof CORRESPONDENCE_TYPE.INTERIM_RELEASE | typeof CORRESPONDENCE_TYPE.FINAL_RESPONSE));
  const finalLetter = messages.find(item => item.type === CORRESPONDENCE_TYPE.FINAL_RESPONSE);
  const releases = state.releaseRecords.filter(item => item.caseId === caseRecord.id).sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  const pendingClosure = state.closureRequests.find(item => item.caseId === caseRecord.id && item.kind === CLOSURE_KIND.FINAL_RESPONSE && item.status === 'Pending approval');
  const openTasks = state.tasks.filter(task => task.caseId === caseRecord.id && task.status !== TASK_STATUS.DONE && task.status !== TASK_STATUS.CANCELLED);
  const unresolvedRfds = state.rfds.filter(item => item.caseId === caseRecord.id && !['Accepted', 'Cancelled'].includes(item.status));
  const unresolvedResponsive = decisions.filter(item => item.responsiveness === RESPONSIVENESS.RESPONSIVE && item.outcome === REVIEW_OUTCOME.NOT_APPLICABLE);
  const missingQc = decisions.filter(item => item.responsiveness === RESPONSIVENESS.RESPONSIVE && !item.qcApproved);
  const unresolvedCoordination = state.coordinationItems.filter(item => item.caseId === caseRecord.id && ![COORDINATION_STATUS.APPLIED, COORDINATION_STATUS.CLOSED].includes(item.status as typeof COORDINATION_STATUS.APPLIED | typeof COORDINATION_STATUS.CLOSED));
  const deliveredFinal = releases.some(item => item.kind === RELEASE_KIND.FINAL && item.deliveryOutcome === DELIVERY_OUTCOME.DELIVERED);
  const readingEligibleRelease = releases.some(item => item.kind === RELEASE_KIND.FINAL && item.deliveryOutcome === DELIVERY_OUTCOME.DELIVERED && item.publishToReadingRoom === PUBLICATION_CHOICE.YES);
  const readingItems = state.readingRoomItems.filter(item => item.caseId === caseRecord.id);
  const blockers = [
    ...openTasks.map(task => `Open task: ${task.title}`),
    ...unresolvedRfds.map(item => `Unresolved RFD: ${item.office}`),
    ...unresolvedResponsive.map(item => `Responsive document without final outcome: ${item.docId}`),
    ...missingQc.map(item => `Missing QC approval: ${item.docId}`),
    ...unresolvedCoordination.map(item => `Unresolved coordination: ${item.kind} with ${item.destination}`),
    ...(!deliveredFinal ? ['No Delivered final release'] : []),
  ];
  const finalOutcomesBlocked = decisions.some(item => item.responsiveness === RESPONSIVENESS.RESPONSIVE && item.outcome === REVIEW_OUTCOME.NOT_APPLICABLE);
  const correctedValues = fullPages !== derivedCounts.full || partPages !== derivedCounts.part || withheldPages !== derivedCounts.withheld || exemptions !== derivedExemptions.join(', ');

  const save = (status: Determination['status']) => {
    const next: Determination = {
      caseId: caseRecord.id, disposition, pagesReleasedInFull: fullPages, pagesReleasedInPart: partPages,
      pagesWithheld: withheldPages, exemptionsUsed: exemptions.split(',').map(item => item.trim()).filter(Boolean),
      letterBody, status, preparedBy: existing?.preparedBy || DEMO_USERS[state.ui.roleView], approvedBy: existing?.approvedBy,
      correctionReason: correctedValues ? correctionReason : undefined,
    };
    saveDetermination(next);
  };

  const createLetter = (type: typeof CORRESPONDENCE_TYPE.FINAL_RESPONSE | typeof CORRESPONDENCE_TYPE.INTERIM_RELEASE) => {
    const template = state.correspondenceTemplates.find(item => item.type === type) || state.correspondenceTemplates.find(item => item.type === CORRESPONDENCE_TYPE.FINAL_RESPONSE);
    if (!template) return;
    createCorrespondence({
      caseId: caseRecord.id, type, templateId: template.id, subject: template.subject.replaceAll('{{caseId}}', caseRecord.id).replaceAll('{{requesterName}}', caseRecord.requester),
      body: letterBody, direction: 'Outbound', status: CORRESPONDENCE_STATUS.DRAFT, requesterVisible: true,
    });
  };

  return <div className="determination-stack">
    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Determination builder</h2><span>Disposition placeholders pending OQ-11</span></div>
      <div className="determination-form">
        <label>Disposition<select value={disposition} onChange={event => setDisposition(event.target.value as typeof disposition)}>{Object.values(DISPOSITION).map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Pages released in full<input type="number" min="0" value={fullPages} onChange={event => setFullPages(Number(event.target.value))}/></label>
        <label>Pages released in part<input type="number" min="0" value={partPages} onChange={event => setPartPages(Number(event.target.value))}/></label>
        <label>Pages withheld<input type="number" min="0" value={withheldPages} onChange={event => setWithheldPages(Number(event.target.value))}/></label>
        <label className="span-two">Exemptions used<input value={exemptions} onChange={event => setExemptions(event.target.value)}/><small>Sample list - approved list pending V-07</small></label>
        <label className="span-two">Correction reason<textarea value={correctionReason} onChange={event => setCorrectionReason(event.target.value)} placeholder="Required when correcting derived values"/></label>
        <label className="span-two">Response letter body<textarea value={letterBody} onChange={event => setLetterBody(event.target.value)}/></label>
        <div className="span-two determination-actions"><button disabled={correctedValues && !correctionReason.trim()} onClick={() => save(DETERMINATION_STATUS.DRAFT)}>Save draft</button><button disabled={finalOutcomesBlocked || (correctedValues && !correctionReason.trim())} onClick={() => save(DETERMINATION_STATUS.PENDING_APPROVAL)}>Submit determination</button>{can(state.ui.roleView, 'approveDetermination') && <button onClick={() => approveDetermination(caseRecord.id)}>Approve final response</button>}</div>
      </div>
      <div className="response-elements"><strong>Response letter elements</strong><p>Elements discussed in the SME meeting; the mandatory list is pending counsel (V-08)</p>{['Requester and request ID', 'What was sought', 'Number or extent of pages released', 'Explanation of partial denial and exemptions', 'Appeal and OGIS language [pending counsel]', 'Fee or invoice information where applicable'].map(item => <label key={item}><input type="checkbox"/>{item}</label>)}</div>
    </section>

    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Response letter approval</h2>{!finalLetter && <button onClick={() => createLetter(CORRESPONDENCE_TYPE.FINAL_RESPONSE)}>Create Final response draft</button>}</div>
      {messages.length ? <ul className="message-list">{messages.map(message => <li key={message.id}><div><strong>{message.subject}</strong><span>{message.type} · {message.status} · Prepared by {message.createdBy}</span></div><div className="row-actions">{message.status === CORRESPONDENCE_STATUS.DRAFT && <button onClick={() => updateCorrespondence(message.id, { status: CORRESPONDENCE_STATUS.PENDING_APPROVAL }, 'Response letter submitted')}>Submit for approval</button>}{message.status === CORRESPONDENCE_STATUS.PENDING_APPROVAL && can(state.ui.roleView, 'approveCorrespondence') && <button onClick={() => updateCorrespondence(message.id, { status: CORRESPONDENCE_STATUS.APPROVED }, 'Response letter approved')}>Approve</button>}</div></li>)}</ul> : <div className="table-empty table-empty--compact"><strong>No response letter</strong></div>}
    </section>

    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Release package</h2><button onClick={() => createLetter(CORRESPONDENCE_TYPE.INTERIM_RELEASE)}>Create Interim release draft</button></div>
      <p className="simulation-banner">Simulated send - nothing is transmitted</p>
      <div className="release-manifest">{state.documents.filter(document => document.caseId === caseRecord.id).map(document => {
        const referred = state.reviewDecisions.some(item => item.candidateDocId === document.id && item.outcome === REVIEW_OUTCOME.REFERRED);
        const reason = document.classification !== DOC_CLASSIFICATION.APPROVED ? `${document.classification} cannot be released` : referred ? 'Referred - not processed by this office' : document.releasedInRecordId ? 'Already released and locked' : '';
        return <label key={document.id} className={reason ? 'disabled' : ''}><input type="checkbox" disabled={Boolean(reason)} checked={selectedDocs.includes(document.id)} onChange={() => setSelectedDocs(ids => ids.includes(document.id) ? ids.filter(id => id !== document.id) : [...ids, document.id])}/><span>{document.name}</span><small>{reason || 'Approved release copy (prototype) - eligible'}</small></label>;
      })}</div>
      <div className="release-controls">
        <label>Release kind<select value={kind} onChange={event => setKind(event.target.value as typeof kind)}><option>{RELEASE_KIND.INTERIM}</option><option>{RELEASE_KIND.FINAL}</option></select></label>
        <label>Approved correspondence<select value={messageId} onChange={event => setMessageId(event.target.value)}><option value="">Select approved message</option>{messages.filter(item => item.status === CORRESPONDENCE_STATUS.APPROVED && (kind === RELEASE_KIND.FINAL ? item.type === CORRESPONDENCE_TYPE.FINAL_RESPONSE : item.type === CORRESPONDENCE_TYPE.INTERIM_RELEASE)).map(item => <option key={item.id} value={item.id}>{item.subject}</option>)}</select></label>
        <label>Channel<select value={channel} onChange={event => setChannel(event.target.value as typeof channel)}>{Object.values(RELEASE_CHANNEL).map(item => <option key={item}>{item}</option>)}</select></label>
        {kind === RELEASE_KIND.FINAL && <label>Publish to Reading Room?<select value={publication} onChange={event => setPublication(event.target.value as typeof publication)}>{Object.values(PUBLICATION_CHOICE).map(item => <option key={item}>{item}</option>)}</select><small>Publication criteria pending policy</small></label>}
        <label className="checkbox-label"><input type="checkbox" checked={simulateFailure} onChange={event => setSimulateFailure(event.target.checked)}/>Simulate delivery failure</label>
        <button disabled={!messageId || (disposition !== DISPOSITION.NO_RECORDS && !selectedDocs.length)} onClick={() => dispatchRelease({ caseId: caseRecord.id, kind, docIds: disposition === DISPOSITION.NO_RECORDS ? [] : selectedDocs, correspondenceId: messageId, channel, publishToReadingRoom: publication }, simulateFailure)}>Dispatch (simulated)</button>
      </div>
      <p className="policy-note">Appeal timing and rights - pending counsel (OQ-12)</p>
      {releases.length ? <ul className="release-history">{releases.map(release => <li key={release.id}><strong>{release.kind} release · {release.deliveryOutcome}</strong><span>{release.docIds.length} document(s) · {release.channel} · {new Date(release.sentAt).toLocaleString()}</span>{release.deliveryOutcome === DELIVERY_OUTCOME.FAILED && <button onClick={() => retryRelease(release.id)}>Retry</button>}</li>)}</ul> : <div className="table-empty table-empty--compact"><strong>No release records</strong></div>}
      {caseRecord.status === CASE_STATUS.DETERMINATION && releases.some(item => item.kind === RELEASE_KIND.INTERIM) && <button className="text-action" onClick={() => { const reason = window.prompt('Reason for returning to Review'); if (reason?.trim()) returnToReview(caseRecord.id, reason.trim()); }}>Return to Review for remaining records</button>}
    </section>

    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Reading Room publication</h2><span className="badge badge--conditional">Conditional - pending client decision (OQ-03)</span></div>
      {!state.settings.readingRoomInScope ? <div className="table-empty table-empty--compact"><strong>Not in scope for this release</strong></div> : caseRecord.requestType === REQUEST_TYPE.PRIVACY_ACT ? <p className="status-flag">Blocked pending counsel review</p> : !readingEligibleRelease ? <div className="table-empty table-empty--compact"><strong>Not yet eligible</strong><span>A Delivered Final release marked Publish to Reading Room = Yes is required.</span></div> : <div className="reading-staff">
        <label>Public title<input value={readingTitle} onChange={event => setReadingTitle(event.target.value)}/></label><label>Public description<textarea value={readingDescription} onChange={event => setReadingDescription(event.target.value)}/></label><label>Category<input value={readingCategory} onChange={event => setReadingCategory(event.target.value)}/></label>
        <fieldset><legend>Released, approved documents</legend>{approvedCopies.filter(document => document.releasedInRecordId).map(document => <label key={document.id}><input type="checkbox" checked={readingDocs.includes(document.id)} onChange={() => setReadingDocs(ids => ids.includes(document.id) ? ids.filter(id => id !== document.id) : [...ids, document.id])}/>{document.name} · {document.classification}</label>)}</fieldset>
        <p>Publication basis: Policy pending</p><button disabled={!readingTitle.trim() || !readingDescription.trim() || !readingDocs.length} onClick={() => createReadingRoomItem({ caseId: caseRecord.id, title: readingTitle, description: readingDescription, category: readingCategory, docIds: readingDocs })}>Submit for publication approval</button>
      </div>}
      {readingItems.length > 0 && <ul className="message-list">{readingItems.map(item => <li key={item.id}><div><strong>{item.title}</strong><span>{item.status} · Prepared by {item.preparedBy}{item.approvedBy ? ` · Approved by ${item.approvedBy}` : ''}</span></div><div className="row-actions">{item.status === 'Pending approval' && <button onClick={() => approveReadingRoomItem(item.id)}>Approve and publish</button>}{item.status === 'Published' && <button onClick={() => { const reason = window.prompt('Reason for unpublishing'); if (reason?.trim()) unpublishReadingRoomItem(item.id, reason.trim()); }}>Unpublish</button>}</div></li>)}</ul>}
    </section>

    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Close case</h2>{caseRecord.status === CASE_STATUS.PENDING_RESPONSE && <button disabled={blockers.length > 0} onClick={() => setClosureOpen(true)}>Close case</button>}</div>
      {blockers.length ? <ul className="blocker-list">{blockers.map(item => <li key={item}>{item}</li>)}</ul> : <p className="ready-card">No final-closure blockers remain.</p>}
      {pendingClosure && can(state.ui.roleView, 'approveClosure') && <div className="section-actions"><button onClick={() => decideClosure(pendingClosure.id, true, 'Final response closure approved.')}>Approve final closure</button><button onClick={() => decideClosure(pendingClosure.id, false, 'Final response closure rejected.')}>Reject</button></div>}
      {closureOpen && <CloseCaseDialog initialKind={CLOSURE_KIND.FINAL_RESPONSE} onClose={() => setClosureOpen(false)} onSubmit={(closureKind, reason) => { requestClosure(caseRecord.id, closureKind, reason); setClosureOpen(false); }}/>}
    </section>
  </div>;
}
