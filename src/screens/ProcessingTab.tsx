import { FormEvent, useMemo, useState } from 'react';
import CloseCaseDialog from '../components/CloseCaseDialog';
import { allowedRoles, can } from '../permissions';
import { useStore } from '../store';
import {
  CASE_STATUS,
  CLOCK_EVENT_KIND,
  CaseRecord,
  CORRESPONDENCE_STATUS,
  CORRESPONDENCE_TYPE,
  DEMO_USERS,
  displayDueDate,
  HOLD_TYPE,
  openTask,
  PROCESSING_TRACK,
  RFD,
  RFD_STATUS,
  RfdStatus,
  TASK_STATUS,
  calendarDays,
} from '../types';

const emptyRfd = { office: '', systemsOrLocations: '', searchTerms: '', dateRangeStart: '', dateRangeEnd: '', instructions: '', dueDate: '' };

export default function ProcessingTab({ caseRecord, nextAction }: { caseRecord: CaseRecord; nextAction: string }) {
  const {
    state, updateCase, recordClockEvent, createCorrespondence, recordRequesterReply, updateTask, addTask,
    requestClosure, decideClosure, createRfd, updateRfd, returnRfd, completeSearch,
  } = useStore();
  const [clockForm, setClockForm] = useState<'controlling' | 'target' | 'hold' | 'extension' | 'expedite' | null>(null);
  const [date, setDate] = useState('');
  const [basis, setBasis] = useState('Received date');
  const [reason, setReason] = useState('');
  const [targetSource, setTargetSource] = useState('');
  const [holdType, setHoldType] = useState(HOLD_TYPE.CLARIFICATION);
  const [expedite, setExpedite] = useState('Pending');
  const [clarificationText, setClarificationText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyDate, setReplyDate] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [closureOpen, setClosureOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwner, setTaskOwner] = useState(caseRecord.processor);
  const [taskDue, setTaskDue] = useState('');
  const [rfdOpen, setRfdOpen] = useState(false);
  const [rfdDraft, setRfdDraft] = useState(emptyRfd);
  const [returning, setReturning] = useState<RFD | null>(null);
  const [returnKind, setReturnKind] = useState<'records' | 'none'>('records');
  const [returnFiles, setReturnFiles] = useState<File[]>([]);
  const [evidence, setEvidence] = useState({ locationsSearched: '', systems: '', timeSpentHours: 0, searchedBy: '', notes: '' });
  const [statement, setStatement] = useState('');
  const [custodianOffice, setCustodianOffice] = useState(state.offices[0]?.name || '');
  const role = state.ui.roleView;
  const clockEvents = state.clockEvents.filter(event => event.caseId === caseRecord.id).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  const tasks = state.tasks.filter(task => task.caseId === caseRecord.id);
  const rfds = state.rfds.filter(item => item.caseId === caseRecord.id);
  const pendingClosures = state.closureRequests.filter(item => item.caseId === caseRecord.id && item.status === 'Pending approval');
  const clarification = state.correspondence.find(item => item.caseId === caseRecord.id && item.type === CORRESPONDENCE_TYPE.CLARIFICATION && item.direction === 'Outbound');
  const allReconciled = rfds.length > 0 && rfds.every(item => item.status === RFD_STATUS.ACCEPTED || item.status === RFD_STATUS.CANCELLED);
  const accepted = rfds.filter(item => item.status === RFD_STATUS.ACCEPTED).length;
  const outstanding = rfds.filter(item => item.status !== RFD_STATUS.ACCEPTED && item.status !== RFD_STATUS.CANCELLED);
  const allNoRecords = rfds.some(item => item.status === RFD_STATUS.ACCEPTED) && rfds.filter(item => item.status === RFD_STATUS.ACCEPTED).every(item => item.noRecordsStatement);

  const resetClock = () => { setClockForm(null); setDate(''); setReason(''); setTargetSource(''); };
  const submitClock = (event: FormEvent) => {
    event.preventDefault();
    if (!clockForm || !date || !reason.trim()) return;
    if (clockForm === 'controlling') {
      recordClockEvent({ caseId: caseRecord.id, kind: CLOCK_EVENT_KIND.CONTROLLING_DATE, reason, effectiveDate: date }, {
        controllingDate: { receivedDate: date, perfectedDate: basis === 'Date entered as considered perfected' ? date : undefined, basis, setBy: DEMO_USERS[role], setAt: new Date().toISOString() },
      });
    } else if (clockForm === 'target') {
      recordClockEvent({ caseId: caseRecord.id, kind: CLOCK_EVENT_KIND.TARGET_DATE, reason: `${targetSource}: ${reason}`, effectiveDate: date }, { dueDate: date, dueDateBasis: 'Entered by user', clock: { ...caseRecord.clock, state: 'Recorded' } });
    } else if (clockForm === 'hold') {
      recordClockEvent({ caseId: caseRecord.id, kind: CLOCK_EVENT_KIND.HOLD_RECORDED, holdType, reason, effectiveDate: date }, { clock: { state: 'Hold recorded', holdType, holdSince: date } });
    } else if (clockForm === 'extension') {
      recordClockEvent({ caseId: caseRecord.id, kind: CLOCK_EVENT_KIND.EXTENSION, reason, effectiveDate: date }, {}, { draftExtension: true });
    } else if (clockForm === 'expedite') {
      recordClockEvent({ caseId: caseRecord.id, kind: CLOCK_EVENT_KIND.EXPEDITE, reason: `${expedite}: ${reason}`, effectiveDate: date }, expedite === 'Granted' ? { track: PROCESSING_TRACK.EXPEDITED } : {});
    }
    resetClock();
  };

  const addRfd = (event: FormEvent) => {
    event.preventDefault();
    const office = state.offices.find(item => item.name === rfdDraft.office);
    if (!office || !rfdDraft.dueDate) return;
    createRfd({ caseId: caseRecord.id, office: office.name, custodianName: office.custodianName, ...rfdDraft });
    setRfdDraft(emptyRfd); setRfdOpen(false);
  };

  const submitReturn = (event: FormEvent) => {
    event.preventDefault();
    if (!returning) return;
    returnRfd(returning.id, returnKind === 'none', evidence, returnFiles.map(file => ({ name: file.name, sizeKb: Math.round(file.size / 1024), mime: file.type || 'application/octet-stream' })), statement);
    setReturning(null); setReturnFiles([]); setStatement('');
  };

  const suggestedDraft = () => {
    const office = state.offices[0];
    setRfdDraft({ office: office.name, systemsOrLocations: 'Program repositories and shared records locations', searchTerms: caseRecord.title, dateRangeStart: caseRecord.dateRangeStart || '', dateRangeEnd: caseRecord.dateRangeEnd || '', instructions: 'Confirm scope and document the systems and locations searched.', dueDate: '' });
    setRfdOpen(true);
  };

  return <div className="processing-stack">
    <section className="next-action-banner"><strong>Next action</strong><span>{nextAction}</span></section>

    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Recorded dates and clock</h2></div>
      <div className="processing-summary">
        <div><span>Received date</span><strong>{displayDueDate(caseRecord.received)}</strong></div>
        <div><span>Controlling date and basis</span><strong>{caseRecord.controllingDate ? `${displayDueDate(caseRecord.controllingDate.receivedDate)} - ${caseRecord.controllingDate.basis}` : 'Not established'}</strong></div>
        <div><span>Recorded target date</span><strong>{caseRecord.dueDate ? `${displayDueDate(caseRecord.dueDate)} - ${caseRecord.dueDateBasis}` : 'Not established - no date is generated'}</strong><small>Recorded target - not a statutory deadline</small></div>
        <div><span>Calendar days to target</span><strong>{caseRecord.dueDate ? calendarDays(state.settings.asOfDate, caseRecord.dueDate) : 'Not established'}</strong></div>
        <div><span>Clock state</span><strong>{caseRecord.clock.state}</strong></div>
      </div>
      {can(role, 'manageClock') && <div className="section-actions">
        <button onClick={() => setClockForm('controlling')}>Set controlling date</button><button onClick={() => setClockForm('target')}>Record target date</button>
        {caseRecord.clock.state === 'Hold recorded' ? <button onClick={() => recordClockEvent({ caseId: caseRecord.id, kind: CLOCK_EVENT_KIND.HOLD_ENDED, reason: 'Hold ended by authorised user.', effectiveDate: state.settings.asOfDate }, { clock: { ...caseRecord.clock, state: 'Recorded' } })}>End hold</button> : <button onClick={() => setClockForm('hold')}>Record hold</button>}
        <button onClick={() => setClockForm('extension')}>Record extension</button>
        {can(role, 'decideExpedite') && <button onClick={() => setClockForm('expedite')}>Expedite decision</button>}
      </div>}
      {clockForm && <form className="inline-action-form" onSubmit={submitClock}>
        {clockForm === 'controlling' && <label>Basis<select value={basis} onChange={event => setBasis(event.target.value)}><option>Received date</option><option>Date entered as considered perfected</option></select></label>}
        {clockForm === 'hold' && <label>Hold type<select value={holdType} onChange={event => setHoldType(event.target.value as typeof holdType)}>{Object.values(HOLD_TYPE).map(item => <option key={item}>{item}</option>)}</select></label>}
        {clockForm === 'expedite' && <label>Decision<select value={expedite} onChange={event => setExpedite(event.target.value)}><option>Pending</option><option>Granted</option><option>Denied</option></select><small>Eligibility criteria pending counsel/SME</small></label>}
        {clockForm === 'target' && <label>Source<input value={targetSource} onChange={event => setTargetSource(event.target.value)} required placeholder="Enter the recorded source"/></label>}
        <label>Effective date<input type="date" value={date} onChange={event => setDate(event.target.value)} required/></label>
        <label>Reason<textarea value={reason} onChange={event => setReason(event.target.value)} required/></label>
        {clockForm === 'hold' && <p>Effect on any statutory clock pending counsel/SME approval</p>}
        <div><button type="button" onClick={resetClock}>Cancel</button><button className="button button--primary">Record</button></div>
      </form>}
      {clockEvents.length ? <ul className="event-list">{clockEvents.map(item => <li key={item.id}><strong>{item.kind}</strong><span>{item.effectiveDate} · {item.reason} · {item.authorisedBy}</span><small>{item.ruleStatus}</small></li>)}</ul> : <div className="tab-empty tab-empty--small"><p>No recorded clock events.</p></div>}
    </section>

    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Clarification</h2></div>
      <div className="section-body">
        {caseRecord.needsClarification && <p className="status-flag">Needs clarification</p>}
        {!clarification && <div className="inline-action-form"><label>Clarification requested<textarea value={clarificationText} onChange={event => setClarificationText(event.target.value)}/></label><button disabled={!clarificationText.trim()} onClick={() => createCorrespondence({ caseId: caseRecord.id, type: CORRESPONDENCE_TYPE.CLARIFICATION, templateId: 'template-2', subject: `Clarification request - ${caseRecord.id}`, body: clarificationText, direction: 'Outbound', status: CORRESPONDENCE_STATUS.DRAFT, requesterVisible: true })}>Request clarification</button></div>}
        {clarification && <p><strong>{clarification.status}</strong> · Sending alone does not resolve the clarification flag.</p>}
        {clarification?.status === CORRESPONDENCE_STATUS.SENT && caseRecord.clock.state !== 'Hold recorded' && <button className="text-action" onClick={() => recordClockEvent({ caseId: caseRecord.id, kind: CLOCK_EVENT_KIND.HOLD_RECORDED, holdType: HOLD_TYPE.CLARIFICATION, reason: 'Clarification response requested.', effectiveDate: state.settings.asOfDate }, { clock: { state: 'Hold recorded', holdType: HOLD_TYPE.CLARIFICATION, holdSince: state.settings.asOfDate } }, { awaitRequesterTask: true })}>Record clarification hold</button>}
        <p className="policy-note">Allowed only if the agency rule permits - pending OQ-05</p>
        <div className="inline-action-form"><h3>Record requester response</h3><label>Received date<input type="date" value={replyDate} onChange={event => setReplyDate(event.target.value)}/></label><label>Response text<textarea value={replyText} onChange={event => setReplyText(event.target.value)}/></label><label>Optional documents<input type="file" multiple onChange={event => setReplyFiles(Array.from(event.target.files || []))}/></label><button disabled={!replyDate || !replyText.trim()} onClick={() => { recordRequesterReply(caseRecord.id, replyText, replyDate, replyFiles.map(file => ({ name: file.name, sizeKb: Math.round(file.size / 1024), mime: file.type || 'application/octet-stream' }))); setReplyText(''); setReplyFiles([]); }}>Record requester response</button></div>
        <div className="section-actions"><button onClick={() => updateCase(caseRecord.id, { needsClarification: false }, 'Clarification need explicitly resolved after review.')}>Resolve clarification need</button><button onClick={() => updateCase(caseRecord.id, {}, 'Scope update recorded after clarification response review.')}>Record scope update</button></div>
      </div>
    </section>

    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Closure requests</h2>{can(role, 'requestClosure') && <button onClick={() => setClosureOpen(true)}>Request closure</button>}</div>
      {pendingClosures.length ? <ul className="event-list">{pendingClosures.map(item => <li key={item.id}><strong>{item.kind}</strong><span>{item.reason} · Requested by {item.requestedBy}</span>{can(role, 'approveClosure') && <div><button onClick={() => decideClosure(item.id, true, 'Supervisor / QC approval recorded.')}>Approve</button><button onClick={() => decideClosure(item.id, false, 'Supervisor / QC rejection recorded.')}>Reject</button></div>}</li>)}</ul> : <div className="tab-empty tab-empty--small"><p>No pending closure requests.</p></div>}
      {closureOpen && <CloseCaseDialog onClose={() => setClosureOpen(false)} onSubmit={(kind, closureReason) => { requestClosure(caseRecord.id, kind, closureReason); setClosureOpen(false); }}/>}
    </section>

    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Tasks</h2></div>
      {can(role, 'manageTasks') && <form className="inline-action-form inline-action-form--row" onSubmit={event => { event.preventDefault(); if (!taskTitle.trim()) return; addTask({ caseId: caseRecord.id, type: 'General', title: taskTitle, ownerName: taskOwner, ownerRole: 'Processor', status: TASK_STATUS.OPEN, dueDate: taskDue || null }); setTaskTitle(''); }}>
        <label>Task title<input value={taskTitle} onChange={event => setTaskTitle(event.target.value)}/></label><label>Owner<input value={taskOwner} onChange={event => setTaskOwner(event.target.value)}/></label><label>Due date<input type="date" value={taskDue} onChange={event => setTaskDue(event.target.value)}/></label><button>Add task</button>
      </form>}
      <div className="table-scroll"><table className="management-table"><thead><tr><th>Type</th><th>Task</th><th>Owner</th><th>Due</th><th>Task status</th><th>Actions</th></tr></thead><tbody>{tasks.map(task => <tr key={task.id}><td>{task.type}</td><td>{task.title}</td><td>{task.ownerName}</td><td>{displayDueDate(task.dueDate)} {task.dueDate && task.dueDate < state.settings.asOfDate && openTask(task) && <span className="badge risk-high">Overdue</span>}</td><td><span className={`badge status-${task.status.toLowerCase().replaceAll(' ', '-')}`}>{task.status}</span></td><td>{can(role, 'manageTasks') && openTask(task) && <><button onClick={() => updateTask(task.id, { status: TASK_STATUS.DONE }, 'Task completed.')}>Complete</button><button onClick={() => { const why = window.prompt('Reason for task cancellation'); if (why?.trim()) updateTask(task.id, { status: TASK_STATUS.CANCELLED }, why.trim()); }}>Cancel</button><button onClick={() => { const owner = window.prompt('New task owner', caseRecord.processor); if (!owner?.trim()) return; const why = window.prompt('Reason for task reassignment'); if (why?.trim()) updateTask(task.id, { ownerName: owner.trim() }, why.trim()); }}>Reassign</button></>}</td></tr>)}</tbody></table></div>
      {!tasks.length && <div className="table-empty table-empty--compact"><strong>No tasks</strong></div>}
    </section>

    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Search Plan & RFDs</h2>{can(role, 'manageRfd') && <button onClick={() => setRfdOpen(true)}>Add RFD</button>}</div>
      {role === 'Custodian / Action Office' && <label className="office-role-selector">Acting as office contact<select value={custodianOffice} onChange={event => setCustodianOffice(event.target.value)}>{state.offices.map(office => <option key={office.id}>{office.name}</option>)}</select><small>{state.offices.find(office => office.name === custodianOffice)?.custodianName}</small></label>}
      <div className="ai-draft-card"><strong>Suggested search plan</strong><span>AI-assisted - requires human review</span><p>Search offices likely to maintain records described by “{caseRecord.title}”, using the confirmed scope and date range.</p><button onClick={suggestedDraft}>Use as draft</button></div>
      {rfdOpen && <form className="inline-action-form" onSubmit={addRfd}>
        <label>Office<select value={rfdDraft.office} onChange={event => setRfdDraft(value => ({ ...value, office: event.target.value }))}><option value="">Select office</option>{state.offices.map(office => <option key={office.id}>{office.name}</option>)}</select></label>
        <label>Systems or locations<input value={rfdDraft.systemsOrLocations} onChange={event => setRfdDraft(value => ({ ...value, systemsOrLocations: event.target.value }))}/></label>
        <label>Search terms<input value={rfdDraft.searchTerms} onChange={event => setRfdDraft(value => ({ ...value, searchTerms: event.target.value }))}/></label>
        <label>Date range start<input type="date" value={rfdDraft.dateRangeStart} onChange={event => setRfdDraft(value => ({ ...value, dateRangeStart: event.target.value }))}/></label>
        <label>Date range end<input type="date" value={rfdDraft.dateRangeEnd} onChange={event => setRfdDraft(value => ({ ...value, dateRangeEnd: event.target.value }))}/></label>
        <label>Recorded operational due date<input type="date" value={rfdDraft.dueDate} onChange={event => setRfdDraft(value => ({ ...value, dueDate: event.target.value }))}/></label>
        <label>Instructions<textarea value={rfdDraft.instructions} onChange={event => setRfdDraft(value => ({ ...value, instructions: event.target.value }))}/></label>
        <div><button type="button" onClick={() => setRfdOpen(false)}>Cancel</button><button>Create draft</button></div>
      </form>}
      <div className="reconciliation"><div><strong>{rfds.length}</strong><span>Expected returns</span></div><div><strong>{accepted}</strong><span>Accepted</span></div><div><strong>{outstanding.length}</strong><span>Outstanding</span></div><p>{outstanding.length ? `Outstanding offices: ${outstanding.map(item => item.office).join(', ')}` : 'No outstanding offices'}</p></div>
      {rfds.length ? <ul className="rfd-list">{rfds.map(rfd => <li key={rfd.id}><div><strong>{rfd.office}</strong><span>{rfd.custodianName} · {rfd.status} · target {displayDueDate(rfd.dueDate)}</span></div><div className="row-actions">
        {can(role, 'manageRfd') && rfd.status === RFD_STATUS.DRAFT && <button onClick={() => updateRfd(rfd.id, { status: RFD_STATUS.SENT }, 'RFD sent (simulated)')}>Send RFD (simulated)</button>}
        {can(role, 'manageRfd') && rfd.status === RFD_STATUS.SENT && <button onClick={() => updateRfd(rfd.id, {}, 'RFD reminder sent (simulated)')}>Send reminder (simulated)</button>}
        {can(role, 'returnRfd') && rfd.office === custodianOffice && ([RFD_STATUS.SENT, RFD_STATUS.FOLLOW_UP] as RfdStatus[]).includes(rfd.status) && <button onClick={() => setReturning(rfd)}>Record return</button>}
        {can(role, 'manageRfd') && ([RFD_STATUS.RETURNED_RECORDS, RFD_STATUS.RETURNED_NO_RECORDS] as RfdStatus[]).includes(rfd.status) && <><button onClick={() => updateRfd(rfd.id, { status: RFD_STATUS.ACCEPTED }, 'RFD return accepted')}>Accept</button><button onClick={() => updateRfd(rfd.id, { status: RFD_STATUS.FOLLOW_UP }, 'RFD follow-up requested')}>Request follow-up</button></>}
        {can(role, 'manageRfd') && !([RFD_STATUS.ACCEPTED, RFD_STATUS.CANCELLED] as RfdStatus[]).includes(rfd.status) && <button onClick={() => { const why = window.prompt('Reason for RFD cancellation'); if (why?.trim()) updateRfd(rfd.id, { status: RFD_STATUS.CANCELLED, cancellationReason: why.trim() }, 'RFD cancelled', why.trim()); }}>Cancel</button>}
      </div>{rfd.noRecordsStatement && <p>Attestation content pending SME (OQ-08): {rfd.noRecordsStatement.text}</p>}</li>)}</ul> : <div className="table-empty table-empty--compact"><strong>No RFDs</strong><span>Add an RFD to begin the recorded search plan.</span></div>}
      {returning && <form className="inline-action-form" onSubmit={submitReturn}><h3>Return from {returning.office}</h3><fieldset className="return-outcome"><legend>Outcome</legend><label><input type="radio" checked={returnKind === 'records'} onChange={() => setReturnKind('records')}/>Upload records</label><label><input type="radio" checked={returnKind === 'none'} onChange={() => setReturnKind('none')}/>No responsive records</label></fieldset>{returnKind === 'records' ? <label>Files<input type="file" multiple onChange={event => setReturnFiles(Array.from(event.target.files || []))}/></label> : <label>No-records statement<textarea value={statement} onChange={event => setStatement(event.target.value)}/><small>Attestation content pending SME (OQ-08)</small></label>}<label>Locations searched<input value={evidence.locationsSearched} onChange={event => setEvidence(value => ({ ...value, locationsSearched: event.target.value }))}/></label><label>Systems<input value={evidence.systems} onChange={event => setEvidence(value => ({ ...value, systems: event.target.value }))}/></label><label>Time spent hours<input type="number" min="0" step=".25" value={evidence.timeSpentHours} onChange={event => setEvidence(value => ({ ...value, timeSpentHours: Number(event.target.value) }))}/></label><label>Searched by<input value={evidence.searchedBy} onChange={event => setEvidence(value => ({ ...value, searchedBy: event.target.value }))}/></label><label>Notes<textarea value={evidence.notes} onChange={event => setEvidence(value => ({ ...value, notes: event.target.value }))}/></label><div><button type="button" onClick={() => setReturning(null)}>Cancel</button><button>Record return</button></div></form>}
      <div className="section-actions"><button disabled={!allReconciled} title={!allReconciled ? 'Every RFD must be Accepted or Cancelled.' : undefined} onClick={() => completeSearch(caseRecord.id)}>Search complete</button><button onClick={() => setRfdOpen(true)}>Add another RFD</button></div>
      {allNoRecords && <div className="deferred-card"><strong>No responsive records returned</strong><p>Use the no-records determination and QC controls to continue.</p></div>}
    </section>
  </div>;
}
