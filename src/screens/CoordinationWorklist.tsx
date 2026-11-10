import { useStore } from '../store';
import { COORDINATION_STATUS } from '../types';

export default function CoordinationWorklist({ onOpen }: { onOpen: (caseId: string) => void }) {
  const { state } = useStore();
  if (!state.settings.coordinationInScope) return <OutOfScope title="Coordination & Referrals"/>;
  return <><header className="page-header"><div><h1>Coordination & Referrals</h1><p>Cross-case consultations, referrals, and transfers.</p><span className="badge badge--conditional">Conditional - pending client decision</span></div></header><section className="case-table-panel"><div className="table-scroll"><table className="management-table"><thead><tr><th>Case</th><th>Kind</th><th>Destination</th><th>Status</th><th>Recorded due date</th></tr></thead><tbody>{state.coordinationItems.map(item => <tr key={item.id}><td><button className="link" onClick={() => onOpen(item.caseId)}>{item.caseId}</button></td><td>{item.kind}</td><td>{item.destination}</td><td>{item.status}{item.dueDate < state.settings.asOfDate && ![COORDINATION_STATUS.APPLIED, COORDINATION_STATUS.CLOSED].includes(item.status as typeof COORDINATION_STATUS.APPLIED | typeof COORDINATION_STATUS.CLOSED) && <span className="badge risk-high">Overdue</span>}</td><td>{item.dueDate}</td></tr>)}</tbody></table></div>{!state.coordinationItems.length && <div className="table-empty"><strong>No coordination items</strong></div>}</section></>;
}

export function OutOfScope({ title }: { title: string }) {
  return <><header className="page-header"><div><h1>{title}</h1><span className="badge badge--conditional">Conditional - pending client decision</span></div></header><div className="placeholder"><h2>Not in scope for this release</h2><p>This conditional prototype feature is disabled in Administration &gt; Prototype Settings.</p></div></>;
}
