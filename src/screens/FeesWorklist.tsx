import { useState } from 'react';
import { useStore } from '../store';
import { PAYMENT_STATUS, REQUESTER_AGREEMENT } from '../types';
import { OutOfScope } from './CoordinationWorklist';

export default function FeesWorklist({ onOpen }: { onOpen: (caseId: string) => void }) {
  const { state } = useStore();
  const [filter, setFilter] = useState('All');
  if (!state.settings.feesInScope) return <OutOfScope title="Fees & Payments"/>;
  const rows = state.feeRecords.filter(item => filter === 'All' ||
    (filter === 'Awaiting agreement' && item.requesterAgreement === REQUESTER_AGREEMENT.PENDING) ||
    (filter === 'Awaiting payment' && item.payment.status === PAYMENT_STATUS.AWAITING) ||
    (filter === 'Disputed' && item.payment.status === PAYMENT_STATUS.DISPUTED) ||
    (filter === 'Past recorded due date' && Boolean(state.cases.find(record => record.id === item.caseId)?.dueDate && state.cases.find(record => record.id === item.caseId)!.dueDate! < state.settings.asOfDate)));
  return <><header className="page-header"><div><h1>Fees & Payments</h1><p>Recorded fee estimates, agreements, and manual payment states.</p><span className="badge badge--conditional">Conditional - pending client decision</span></div></header><div className="segment-control">{['All', 'Awaiting agreement', 'Awaiting payment', 'Disputed', 'Past recorded due date'].map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><p className="simulation-banner">No payment is processed</p><section className="case-table-panel"><div className="table-scroll"><table className="management-table"><thead><tr><th>Case</th><th>Category</th><th>Illustrative estimate</th><th>Agreement</th><th>Payment</th></tr></thead><tbody>{rows.map(item => <tr key={item.caseId}><td><button className="link" onClick={() => onOpen(item.caseId)}>{item.caseId}</button></td><td>{item.requesterCategory}</td><td>${item.estimateTotal.toFixed(2)}</td><td>{item.requesterAgreement}</td><td>{item.payment.status}</td></tr>)}</tbody></table></div>{!rows.length && <div className="table-empty"><strong>No fee records</strong></div>}</section></>;
}
