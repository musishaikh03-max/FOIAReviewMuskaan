import { useState } from 'react';
import { useStore } from '../store';
import { DEMO_USERS, DOC_CLASSIFICATION, QC_DECISION, REVIEW_STATUS } from '../types';

const segments = ['My Reviews', 'QC Queue', 'Ready for Release'] as const;

export default function ReviewWorklist({ onOpen }: { onOpen: (caseId: string, tab: string) => void }) {
  const { state } = useStore();
  const [segment, setSegment] = useState<(typeof segments)[number]>('My Reviews');
  const user = DEMO_USERS[state.ui.roleView];
  const rows = segment === 'My Reviews' ? state.reviewDecisions.filter(item => item.reviewer === user && item.reviewStatus !== REVIEW_STATUS.COMPLETE).map(item => {
    const document = state.documents.find(doc => doc.id === item.docId);
    return { id: item.docId, caseId: document?.caseId || '', item: document?.name || item.docId, status: item.reviewStatus, detail: item.outcome, tab: 'review-redaction' };
  }) : segment === 'QC Queue' ? state.qcReviews.filter(item => item.decision === QC_DECISION.PENDING).map(item => ({ id: item.id, caseId: item.caseId, item: `QC round ${item.round}`, status: item.decision, detail: `${item.docIds.length} document(s)`, tab: 'review-redaction' }))
    : state.documents.filter(item => item.classification === DOC_CLASSIFICATION.APPROVED && !item.releasedInRecordId).map(item => ({ id: item.id, caseId: item.caseId, item: item.name, status: 'Approved release copy (prototype)', detail: 'Not yet released', tab: 'determination-release' }));
  return <>
    <header className="page-header"><div><h1>Review & Redaction</h1><p>Cross-case document review, quality control, and release-readiness queues.</p><span className="prototype-date">Prototype date: {state.settings.asOfDate}</span></div></header>
    <div className="segment-control">{segments.map(item => <button key={item} className={segment === item ? 'active' : ''} onClick={() => setSegment(item)}>{item}</button>)}</div>
    <section className="case-table-panel"><div className="table-scroll"><table className="management-table"><thead><tr><th>Case ID</th><th>Item</th><th>Status</th><th>Detail</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><button className="link" onClick={() => onOpen(row.caseId, row.tab)}>{row.caseId}</button></td><td>{row.item}</td><td>{row.status}</td><td>{row.detail}</td></tr>)}</tbody></table></div>{!rows.length && <div className="table-empty"><strong>No queue items</strong><span>This segment has no matching records.</span></div>}</section>
  </>;
}
