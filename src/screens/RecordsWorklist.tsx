import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { ACCESS_CLASS, DOC_CLASSIFICATION } from '../types';

export default function RecordsWorklist({ onOpen }: { onOpen: (caseId: string, tab: string) => void }) {
  const { state } = useStore();
  const [caseId, setCaseId] = useState('');
  const [requester, setRequester] = useState('');
  const [classification, setClassification] = useState('All');
  const [source, setSource] = useState('All');
  const [access, setAccess] = useState('All');
  const rows = useMemo(() => state.documents.filter(document => {
    const record = state.cases.find(item => item.id === document.caseId);
    return (!caseId || document.caseId.toLowerCase().includes(caseId.toLowerCase())) &&
      (!requester || record?.requester.toLowerCase().includes(requester.toLowerCase())) &&
      (classification === 'All' || document.classification === classification) &&
      (source === 'All' || document.source === source) &&
      (access === 'All' || document.accessClass === access);
  }), [state.documents, state.cases, caseId, requester, classification, source, access]);
  return <>
    <header className="page-header"><div><h1>Records & Documents</h1><p>Cross-case document metadata and case-linked records.</p><span className="prototype-date">Prototype date: {state.settings.asOfDate}</span></div></header>
    <section className="document-filters worklist-filters">
      <label>Case ID<input value={caseId} onChange={event => setCaseId(event.target.value)} placeholder="Filter case ID"/></label>
      <label>Requester<input value={requester} onChange={event => setRequester(event.target.value)} placeholder="Filter requester"/></label>
      <label>Classification<select value={classification} onChange={event => setClassification(event.target.value)}><option>All</option>{Object.values(DOC_CLASSIFICATION).map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Source<select value={source} onChange={event => setSource(event.target.value)}><option>All</option>{[...new Set(state.documents.map(item => item.source))].map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Access class<select value={access} onChange={event => setAccess(event.target.value)}><option>All</option>{Object.values(ACCESS_CLASS).map(item => <option key={item}>{item}</option>)}</select></label>
    </section>
    <section className="case-table-panel"><div className="table-scroll"><table className="management-table"><thead><tr><th>Document</th><th>Case ID</th><th>Requester</th><th>Classification</th><th>Source</th><th>Office</th><th>Version</th><th>Access</th></tr></thead><tbody>{rows.map(document => { const record = state.cases.find(item => item.id === document.caseId); return <tr key={document.id}><td>{document.name}</td><td><button className="link" onClick={() => onOpen(document.caseId, 'records-documents')}>{document.caseId}</button></td><td>{record?.requester || 'Case not found'}</td><td>{document.classification}</td><td>{document.source}</td><td>{document.office || 'Not specified'}</td><td>v{document.version}</td><td>{document.accessClass}</td></tr>; })}</tbody></table></div>{!rows.length && <div className="table-empty"><strong>No documents</strong><span>No document metadata matches these filters.</span></div>}</section>
  </>;
}
