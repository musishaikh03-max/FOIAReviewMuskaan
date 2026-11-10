import { FormEvent, useState } from 'react';
import { can } from '../permissions';
import { useStore } from '../store';
import {
  CaseRecord, CLOCK_EVENT_KIND, CLOSURE_KIND, COORDINATION_KIND, COORDINATION_STATUS, CoordinationKind,
  DOC_CLASSIFICATION, HOLD_TYPE, OWNERSHIP_AFTER, PAYMENT_STATUS, REQUESTER_AGREEMENT, REVIEW_OUTCOME,
  TASK_STATUS, WAIVER_DECISION,
} from '../types';

const destinations = ['Other federal agency (sample)', 'Other component (sample)'];

export default function CoordinationFeesTab({ caseRecord }: { caseRecord: CaseRecord }) {
  const { state, createCoordination, updateCoordination, confirmTransfer, saveFee, draftFeeNotice, recordClockEvent, requestClosure } = useStore();
  const [kind, setKind] = useState<CoordinationKind>(COORDINATION_KIND.CONSULTATION);
  const [destination, setDestination] = useState(destinations[0]);
  const [basis, setBasis] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [docs, setDocs] = useState<string[]>([]);
  const [response, setResponse] = useState('');
  const [applyOutcome, setApplyOutcome] = useState(REVIEW_OUTCOME.RELEASE_PART);
  const [taskChoices, setTaskChoices] = useState<Record<string, 'Transferred' | 'Retained' | 'Stopped'>>({});
  const [transferReason, setTransferReason] = useState('');
  const existingFee = state.feeRecords.find(item => item.caseId === caseRecord.id);
  const [category, setCategory] = useState(existingFee?.requesterCategory || caseRecord.feeCategory || 'All other (sample)');
  const [willing, setWilling] = useState(existingFee?.willingToPayAmount ?? 0);
  const [lines, setLines] = useState(existingFee?.lines || [
    { label: 'Search hours', quantity: 0, rate: 20, amount: 0 },
    { label: 'Review hours', quantity: 0, rate: 35, amount: 0 },
    { label: 'Duplication pages', quantity: 0, rate: .1, amount: 0 },
  ]);
  const [waiverRequested, setWaiverRequested] = useState(existingFee?.waiver.requested || false);
  const [waiverDecision, setWaiverDecision] = useState(existingFee?.waiver.decision || WAIVER_DECISION.PENDING);
  const [waiverRationale, setWaiverRationale] = useState(existingFee?.waiver.rationale || '');
  const [agreement, setAgreement] = useState(existingFee?.requesterAgreement || REQUESTER_AGREEMENT.PENDING);
  const [payment, setPayment] = useState(existingFee?.payment.status || PAYMENT_STATUS.NOT_REQUIRED);
  const [paymentReference, setPaymentReference] = useState(existingFee?.payment.reference || '');
  const coordination = state.coordinationItems.filter(item => item.caseId === caseRecord.id);
  const sourceDocs = state.documents.filter(item => item.caseId === caseRecord.id && item.classification === DOC_CLASSIFICATION.SOURCE);
  const openTasks = state.tasks.filter(task => task.caseId === caseRecord.id && task.status !== TASK_STATUS.DONE && task.status !== TASK_STATUS.CANCELLED);
  const total = lines.reduce((sum, line) => sum + line.quantity * line.rate, 0);

  const ownership = kind === COORDINATION_KIND.CONSULTATION ? OWNERSHIP_AFTER.RETAINED : kind === COORDINATION_KIND.REFERRAL ? OWNERSHIP_AFTER.DESTINATION : OWNERSHIP_AFTER.WHOLE_REQUEST;
  const submitCoordination = (event: FormEvent) => {
    event.preventDefault();
    if (!basis.trim() || !dueDate || (kind !== COORDINATION_KIND.TRANSFER && !docs.length)) return;
    createCoordination({ caseId: caseRecord.id, kind, destination, docIds: kind === COORDINATION_KIND.TRANSFER ? [] : docs, basis, ownershipAfter: ownership, dueDate });
    setBasis(''); setDueDate(''); setDocs([]);
  };

  const saveFees = () => saveFee({
    caseId: caseRecord.id, requesterCategory: category, willingToPayAmount: willing,
    lines: lines.map(line => ({ ...line, amount: line.quantity * line.rate })), estimateTotal: total,
    waiver: { requested: waiverRequested, decision: waiverDecision, rationale: waiverRationale, decidedBy: can(state.ui.roleView, 'manageFees') ? state.ui.roleView : '' },
    requesterAgreement: agreement, payment: { status: payment, reference: paymentReference },
    rateScheduleStatus: 'Rates pending fee schedule (V-09)',
  });

  return <div className="coordination-fees-stack">
    {state.settings.coordinationInScope ? <section className="workspace-section">
      <div className="workspace-section-title"><h2>Coordination & Referrals</h2><span className="badge badge--conditional">Conditional - pending client decision</span></div>
      <div className="definition-grid"><article><strong>Consultation</strong><p>This office keeps ownership and asks another entity how its equities should be treated.</p></article><article><strong>Referral</strong><p>The other entity owns or originated the records and takes responsibility for review and response.</p></article><article><strong>Transfer</strong><p>The whole request is moved to the correct office. The prototype never determines jurisdiction.</p></article></div>
      <p className="policy-note section-note">SME-described practice; legal, clock and reporting effects pending SME/counsel (OQ-09). The SME also used 'transfer' for sending pages to another agency - terminology to be confirmed.</p>
      {can(state.ui.roleView, 'manageCoordination') && <form className="inline-action-form" onSubmit={submitCoordination}>
        <label>Kind<select value={kind} onChange={event => setKind(event.target.value as CoordinationKind)}>{Object.values(COORDINATION_KIND).map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Destination<select value={destination} onChange={event => setDestination(event.target.value)}>{destinations.map(item => <option key={item}>{item}</option>)}</select></label>
        {kind !== COORDINATION_KIND.TRANSFER && <fieldset className="span-two document-choice"><legend>Documents</legend>{sourceDocs.map(document => <label key={document.id}><input type="checkbox" checked={docs.includes(document.id)} onChange={() => setDocs(ids => ids.includes(document.id) ? ids.filter(id => id !== document.id) : [...ids, document.id])}/>{document.name}</label>)}</fieldset>}
        <label>Recorded due date<input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)}/></label>
        <label>Ownership after<input value={ownership} readOnly/></label>
        <label className="span-two">Basis / scope / reason<textarea value={basis} onChange={event => setBasis(event.target.value)}/></label>
        <button>Create identified item</button>
      </form>}
      {coordination.length ? <ul className="coordination-list">{coordination.map(item => {
        const overdue = item.dueDate < state.settings.asOfDate && ![COORDINATION_STATUS.APPLIED, COORDINATION_STATUS.CLOSED].includes(item.status as typeof COORDINATION_STATUS.APPLIED | typeof COORDINATION_STATUS.CLOSED);
        return <li key={item.id}><div><strong>{item.kind} · {item.destination}</strong><span>{item.status} · {item.ownershipAfter}</span>{overdue && <em className="badge risk-high">Overdue</em>}<p>{item.basis}</p></div><div className="coordination-actions">
          {item.status === COORDINATION_STATUS.IDENTIFIED && <button onClick={() => updateCoordination(item.id, COORDINATION_STATUS.APPROVED)}>Approve to send</button>}
          {item.status === COORDINATION_STATUS.APPROVED && <button onClick={() => updateCoordination(item.id, COORDINATION_STATUS.SENT)}>Send (simulated)</button>}
          {item.status === COORDINATION_STATUS.SENT && <><button onClick={() => updateCoordination(item.id, COORDINATION_STATUS.ACKNOWLEDGED)}>Record acknowledgement</button><button onClick={() => updateCoordination(item.id, item.status, 'Simulated reminder sent.')}>Send reminder (simulated)</button></>}
          {item.status === COORDINATION_STATUS.ACKNOWLEDGED && <><textarea value={response} onChange={event => setResponse(event.target.value)} placeholder="Response text"/><button disabled={!response.trim()} onClick={() => { updateCoordination(item.id, COORDINATION_STATUS.RESPONSE, response); setResponse(''); }}>Record response</button></>}
          {item.status === COORDINATION_STATUS.RESPONSE && item.kind === COORDINATION_KIND.CONSULTATION && <><select value={applyOutcome} onChange={event => setApplyOutcome(event.target.value as typeof applyOutcome)}>{Object.values(REVIEW_OUTCOME).map(value => <option key={value}>{value}</option>)}</select><button onClick={() => updateCoordination(item.id, COORDINATION_STATUS.APPLIED, '', applyOutcome)}>Recommendation applied</button></>}
          {item.kind === COORDINATION_KIND.TRANSFER && item.status !== COORDINATION_STATUS.CLOSED && can(state.ui.roleView, 'confirmTransfer') && <div className="transfer-confirm"><p>Transfer ownership and reporting effects pending SME/counsel</p>{openTasks.map(task => <label key={task.id}>{task.title}<select value={taskChoices[task.id] || 'Retained'} onChange={event => setTaskChoices(values => ({ ...values, [task.id]: event.target.value as 'Transferred' | 'Retained' | 'Stopped' }))}><option>Transferred</option><option>Retained</option><option>Stopped</option></select></label>)}<textarea value={transferReason} onChange={event => setTransferReason(event.target.value)} placeholder="Authorised confirmation reason"/><button disabled={!transferReason.trim()} onClick={() => confirmTransfer(item.id, taskChoices, transferReason)}>Confirm transfer</button></div>}
        </div></li>;
      })}</ul> : <div className="table-empty table-empty--compact"><strong>No coordination items</strong></div>}
    </section> : null}

    {state.settings.feesInScope ? <section className="workspace-section">
      <div className="workspace-section-title"><h2>Fees</h2><span className="badge badge--conditional">Conditional - pending client decision</span></div>
      <p className="simulation-banner">No payment is processed</p>
      <div className="fee-form">
        <label>Requester category<select value={category} onChange={event => setCategory(event.target.value)}><option>Commercial (sample)</option><option>Educational / news media (sample)</option><option>All other (sample)</option></select><small>Sample - pending approval</small></label>
        <label>Willing-to-pay amount<input type="number" min="0" value={willing} onChange={event => setWilling(Number(event.target.value))}/></label>
        <div className="span-two fee-lines"><strong>Estimate lines</strong>{lines.map((line, index) => <div key={line.label}><span>{line.label}</span><label>Quantity<input type="number" min="0" value={line.quantity} onChange={event => setLines(values => values.map((value, item) => item === index ? { ...value, quantity: Number(event.target.value) } : value))}/></label><label>Rate<input type="number" min="0" step=".01" value={line.rate} onChange={event => setLines(values => values.map((value, item) => item === index ? { ...value, rate: Number(event.target.value) } : value))}/></label><strong>${(line.quantity * line.rate).toFixed(2)}</strong></div>)}</div>
        <div className="fee-total"><span>Estimate total</span><strong>${total.toFixed(2)}</strong><small>Illustrative arithmetic · Sample rates - not the agency fee schedule</small></div>
        {total > willing && <div className="fee-warning"><strong>Estimate exceeds stated willingness to pay: consider a fee notice</strong><button onClick={() => draftFeeNotice(caseRecord.id)}>Draft Fee estimate Correspondence</button></div>}
        <label className="checkbox-label"><input type="checkbox" checked={waiverRequested} onChange={event => setWaiverRequested(event.target.checked)}/>Waiver requested</label>
        <label>Waiver decision<select value={waiverDecision} onChange={event => setWaiverDecision(event.target.value as typeof waiverDecision)}>{Object.values(WAIVER_DECISION).map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Waiver rationale<textarea value={waiverRationale} onChange={event => setWaiverRationale(event.target.value)}/></label>
        <label>Requester agreement<select value={agreement} onChange={event => setAgreement(event.target.value as typeof agreement)}>{Object.values(REQUESTER_AGREEMENT).map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Payment status<select value={payment} onChange={event => setPayment(event.target.value as typeof payment)}>{Object.values(PAYMENT_STATUS).map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Payment reference<input value={paymentReference} onChange={event => setPaymentReference(event.target.value)}/></label>
        <div className="fee-actions"><button disabled={!can(state.ui.roleView, 'manageFees')} onClick={saveFees}>Save fee record</button><button disabled={!can(state.ui.roleView, 'manageClock')} onClick={() => recordClockEvent({ caseId: caseRecord.id, kind: CLOCK_EVENT_KIND.HOLD_RECORDED, holdType: HOLD_TYPE.FEE, reason: 'Fee hold recorded by authorised user.', effectiveDate: state.settings.asOfDate }, { clock: { state: 'Hold recorded', holdType: HOLD_TYPE.FEE, holdSince: state.settings.asOfDate } })}>Record fee hold</button>{agreement === REQUESTER_AGREEMENT.NO_RESPONSE && <button disabled={!can(state.ui.roleView, 'requestClosure')} onClick={() => requestClosure(caseRecord.id, CLOSURE_KIND.NO_RESPONSE, 'No response to recorded fee notice.')}>Request closure - no response</button>}</div>
      </div>
    </section> : null}

    {!state.settings.coordinationInScope && !state.settings.feesInScope && <div className="placeholder"><h2>Not in scope for this release</h2></div>}
  </div>;
}
