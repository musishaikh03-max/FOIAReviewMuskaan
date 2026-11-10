import { FormEvent, useState } from 'react';
import { can } from '../permissions';
import { useStore } from '../store';
import { APPEAL_DECISION, APPEAL_STATUS, AppealDecision, CASE_STATUS, DEMO_USERS } from '../types';
import { OutOfScope } from './CoordinationWorklist';

export default function AppealsPage({ onCase }: { onCase: (caseId: string) => void }) {
  const { state, registerAppeal, updateAppeal, remandAppeal, reopenLateRecords } = useStore();
  const [selectedId, setSelectedId] = useState('');
  const [caseId, setCaseId] = useState(state.cases[0]?.id || '');
  const [received, setReceived] = useState('');
  const [channel, setChannel] = useState('Staff-entered');
  const [grounds, setGrounds] = useState('');
  const [releaseId, setReleaseId] = useState('');
  const [staffRoute, setStaffRoute] = useState(false);
  const [staffReason, setStaffReason] = useState('');
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState<AppealDecision>(APPEAL_DECISION.AFFIRMED);
  const [rationale, setRationale] = useState('');
  const [message, setMessage] = useState('');
  const [queueStatus, setQueueStatus] = useState('All');
  if (!state.settings.appealsInScope) return <OutOfScope title="Appeals & Reopenings"/>;
  const selected = state.appeals.find(item => item.id === selectedId);
  const original = selected && state.cases.find(item => item.id === selected.caseId);
  const determination = selected && state.determinations.find(item => item.caseId === selected.caseId);
  const releases = selected ? state.releaseRecords.filter(item => item.caseId === selected.caseId) : [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const record = state.cases.find(item => item.id === caseId);
    if (!record || !received || !grounds.trim() || (staffRoute && !staffReason.trim())) return;
    try {
      const appeal = registerAppeal({ caseId, receivedDate: received, channel, appellant: record.requester, challengedReleaseId: releaseId || undefined, grounds: `${grounds}${staffRoute ? ` Staff review reason: ${staffReason}` : ''}`, staffReviewRoute: staffRoute });
      setSelectedId(appeal.id); setMessage('Appeal registered. Eligibility and timing pending counsel.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Appeal could not be registered.'); }
  };

  return <><header className="page-header"><div><h1>Appeals & Reopenings</h1><p>Separate appeal records and authorised case reopenings. No timeliness calculation.</p><span className="badge badge--conditional">Conditional - pending client decision</span></div></header>
    {message && <p className="document-message">{message}</p>}
    <div className="appeals-layout"><section className="workspace-section"><div className="workspace-section-title"><h2>Appeal queue</h2></div><div className="segment-control">{['All', APPEAL_STATUS.RECEIVED, APPEAL_STATUS.ASSIGNED, APPEAL_STATUS.IN_REVIEW, APPEAL_STATUS.DECIDED, APPEAL_STATUS.REMANDED].map(item => <button key={item} className={queueStatus === item ? 'active' : ''} onClick={() => setQueueStatus(item)}>{item}</button>)}</div><div className="table-scroll"><table className="management-table"><thead><tr><th>Appeal</th><th>Case</th><th>Status</th><th>Assigned</th></tr></thead><tbody>{state.appeals.filter(item => queueStatus === 'All' || item.status === queueStatus).map(item => <tr key={item.id}><td><button className="link" onClick={() => setSelectedId(item.id)}>{item.id}</button></td><td>{item.caseId}</td><td>{item.status}</td><td>{item.assignedTo || 'Unassigned'}</td></tr>)}</tbody></table></div></section>
      <section className="workspace-section"><div className="workspace-section-title"><h2>Register appeal</h2></div><form className="inline-action-form" onSubmit={submit}><label>Original case<select value={caseId} onChange={event => { setCaseId(event.target.value); setReleaseId(''); }}><option value="">Select case</option>{state.cases.map(item => <option key={item.id} value={item.id}>{item.id} - {item.requester}</option>)}</select></label><label>Received date<input type="date" value={received} onChange={event => setReceived(event.target.value)}/></label><label>Channel<input value={channel} onChange={event => setChannel(event.target.value)}/></label><label>Challenged release<select value={releaseId} onChange={event => setReleaseId(event.target.value)}><option value="">No release selected</option>{state.releaseRecords.filter(item => item.caseId === caseId).map(item => <option key={item.id} value={item.id}>{item.kind} - {item.id}</option>)}</select></label><label className="span-two">Grounds<textarea value={grounds} onChange={event => setGrounds(event.target.value)}/></label><label className="checkbox-label"><input type="checkbox" checked={staffRoute} onChange={event => setStaffRoute(event.target.checked)}/>Staff-review route</label>{staffRoute && <label>Staff-review reason<textarea value={staffReason} onChange={event => setStaffReason(event.target.value)}/></label>}<p>Eligibility and timing pending counsel (OQ-12)</p><button>Register appeal</button></form></section></div>
      {selected && original && <section className="workspace-section appeal-workspace"><div className="workspace-section-title"><h2>{selected.id} Appeal workspace</h2></div><div className="appeal-summary"><div><span>Original case</span><button className="link" onClick={() => onCase(original.id)}>{original.id}</button></div><div><span>Case status</span><strong>{original.status}</strong></div><div><span>Determination</span><strong>{determination?.disposition || 'Not recorded'}</strong></div><div><span>Release records</span><strong>{releases.length}</strong></div><div><span>Eligibility</span><strong>{selected.eligibilityNote}</strong></div></div><div className="section-actions"><button onClick={() => updateAppeal(selected.id, { assignedTo: DEMO_USERS['Appeals Reviewer'], status: APPEAL_STATUS.ASSIGNED }, 'Assigned to Appeals Reviewer')}>Assign to Appeals Reviewer</button><button onClick={() => updateAppeal(selected.id, { status: APPEAL_STATUS.IN_REVIEW, rationale: notes }, `Review note: ${notes}`)}>Save review note</button></div><div className="inline-action-form"><label>Review notes<textarea value={notes} onChange={event => setNotes(event.target.value)}/></label><label>Decision<select value={decision} onChange={event => setDecision(event.target.value as typeof decision)}>{Object.values(APPEAL_DECISION).map(item => <option key={item}>{item}</option>)}</select></label><label>Rationale<textarea value={rationale} onChange={event => setRationale(event.target.value)}/></label><button onClick={() => updateAppeal(selected.id, { decision, rationale, status: decision === APPEAL_DECISION.REMANDED ? APPEAL_STATUS.REMANDED : APPEAL_STATUS.DECIDED }, 'Appeal decision recorded; notice drafted')}>Record decision</button>{(decision === APPEAL_DECISION.REMANDED || selected.status === APPEAL_STATUS.REMANDED) && <button disabled={!rationale.trim()} onClick={() => remandAppeal(selected.id, rationale)}>Remand original case</button>}</div><h3>Original case history</h3><ul className="event-list">{state.audit.filter(item => item.caseId === original.id).slice(0, 8).map(item => <li key={item.id}><strong>{item.action}</strong><span>{item.detail}</span></li>)}</ul></section>}
    <section className="workspace-section"><div className="workspace-section-title"><h2>Reopened cases</h2></div><ul className="event-list">{state.cases.filter(item => item.status === CASE_STATUS.REOPENED).map(item => <li key={item.id}><strong>{item.id}</strong><span>{state.appeals.some(appeal => appeal.caseId === item.id && appeal.status === APPEAL_STATUS.REMANDED) ? 'Appeal remand' : 'Late-found records'}</span></li>)}</ul>{can(state.ui.roleView, 'reopenCase') && <div className="section-actions">{state.cases.filter(item => item.status === CASE_STATUS.CLOSED).map(item => <button key={item.id} onClick={() => { const reason = window.prompt(`Reason to reopen ${item.id} for late-found records`); if (reason?.trim()) reopenLateRecords(item.id, reason.trim()); }}>Reopen {item.id} - late-found records</button>)}</div>}</section>
  </>;
}
