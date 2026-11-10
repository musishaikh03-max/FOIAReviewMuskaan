import { useMemo, useRef, useState } from 'react';
import { can } from '../permissions';
import { useStore } from '../store';
import { ACCESS_CLASS, CaseRecord, DOC_CLASSIFICATION, Document, UPLOAD_STATUS } from '../types';

export default function RecordsDocumentsTab({ caseRecord }: { caseRecord: CaseRecord }) {
  const { state, addDocument } = useStore();
  const [classification, setClassification] = useState('All');
  const [source, setSource] = useState('All');
  const [office, setOffice] = useState('All');
  const [version, setVersion] = useState('All');
  const [accessClass, setAccessClass] = useState('All');
  const [selected, setSelected] = useState<Document | null>(null);
  const [duplicate, setDuplicate] = useState<{ file: File; parent: Document } | null>(null);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const documents = state.documents.filter(document => document.caseId === caseRecord.id);
  const visible = useMemo(() => documents.filter(document =>
    (classification === 'All' || document.classification === classification) &&
    (source === 'All' || document.source === source) &&
    (office === 'All' || (document.office || 'Not specified') === office) &&
    (version === 'All' || String(document.version) === version) &&
    (accessClass === 'All' || document.accessClass === accessClass)
  ), [documents, classification, source, office, version, accessClass]);

  const saveFile = (file: File, parent?: Document, keepBoth = false) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'exe' || extension === 'zip') {
      setMessage('Unsupported file type - approved formats pending');
      return;
    }
    const failed = file.size > 25 * 1024 * 1024;
    addDocument({
      caseId: caseRecord.id,
      name: file.name,
      sizeKb: Math.round(file.size / 1024),
      mime: file.type || 'application/octet-stream',
      source: 'Created in processing',
      classification: DOC_CLASSIFICATION.WORKING,
      parentDocId: parent && !keepBoth ? parent.id : undefined,
      version: parent && !keepBoth ? parent.version + 1 : 1,
      accessClass: ACCESS_CLASS.INTERNAL,
      uploadStatus: failed ? UPLOAD_STATUS.FAILED : UPLOAD_STATUS.UPLOADED,
      pageCount: 0,
    });
    setMessage(failed ? 'File is over 25 MB and was marked Failed. Use Retry to choose the file again.' : 'Document metadata uploaded.');
  };

  const chooseFile = (file?: File) => {
    if (!file) return;
    const existing = documents.find(document => document.name.toLowerCase() === file.name.toLowerCase());
    if (existing) setDuplicate({ file, parent: existing });
    else saveFile(file);
  };

  const lineage = selected ? (() => {
    const rows: Document[] = [];
    let current: Document | undefined = selected;
    while (current) {
      rows.unshift(current);
      current = current.parentDocId ? documents.find(item => item.id === current?.parentDocId) : undefined;
    }
    rows.push(...documents.filter(item => item.parentDocId === selected.id));
    return [...new Map(rows.map(item => [item.id, item])).values()];
  })() : [];

  return <div className="records-layout">
    <div>
      <div className="viewing-banner">Viewing: {classification === 'All' ? 'All copy types' : classification} - {classification === DOC_CLASSIFICATION.SOURCE ? 'protected, read only' : 'metadata-only prototype view'}</div>
      <section className="workspace-section">
        <div className="workspace-section-title"><h2>Document library</h2>{can(state.ui.roleView, 'uploadDocument') && <button onClick={() => fileRef.current?.click()}>Upload metadata</button>}</div>
        <input ref={fileRef} type="file" hidden onChange={event => { chooseFile(event.target.files?.[0]); event.currentTarget.value = ''; }}/>
        {message && <p className="document-message" role="status">{message}</p>}
        {duplicate && <div className="duplicate-panel"><strong>A document with this file name already exists.</strong><button onClick={() => { saveFile(duplicate.file, duplicate.parent); setDuplicate(null); }}>Link as new version</button><button onClick={() => { saveFile(duplicate.file, duplicate.parent, true); setDuplicate(null); }}>Keep both</button><button onClick={() => setDuplicate(null)}>Cancel</button></div>}
        <div className="document-filters">
          <label>Classification<select value={classification} onChange={event => setClassification(event.target.value)}><option>All</option>{Object.values(DOC_CLASSIFICATION).map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Source<select value={source} onChange={event => setSource(event.target.value)}><option>All</option>{[...new Set(documents.map(item => item.source))].map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Office<select value={office} onChange={event => setOffice(event.target.value)}><option>All</option>{[...new Set(documents.map(item => item.office || 'Not specified'))].map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Version<select value={version} onChange={event => setVersion(event.target.value)}><option>All</option>{[...new Set(documents.map(item => String(item.version)))].map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Access class<select value={accessClass} onChange={event => setAccessClass(event.target.value)}><option>All</option>{Object.values(ACCESS_CLASS).map(item => <option key={item}>{item}</option>)}</select></label>
        </div>
        {visible.length ? <div className="table-scroll"><table className="management-table"><thead><tr><th>Name</th><th>Copy type</th><th>Source</th><th>Office</th><th>Version</th><th>Access</th><th>Upload status</th><th>Actions</th></tr></thead><tbody>{visible.map(document => <tr key={document.id}><td><button className="link" onClick={() => setSelected(document)}>{document.name}</button></td><td>{document.classification}</td><td>{document.source}</td><td>{document.office || 'Not specified'}</td><td>v{document.version}</td><td>{document.accessClass}</td><td>{document.uploadStatus}</td><td>{document.uploadStatus === UPLOAD_STATUS.FAILED && <button onClick={() => fileRef.current?.click()}>Retry</button>}{document.classification === DOC_CLASSIFICATION.SOURCE && <span>Protected, read only</span>}</td></tr>)}</tbody></table></div> : <div className="table-empty"><strong>No documents</strong><span>No document metadata matches these filters.</span></div>}
      </section>
    </div>
    <aside className="lineage-panel"><h2>Version lineage</h2>{selected ? <><p>{selected.name}</p><ol>{lineage.map(document => <li key={document.id}><strong>v{document.version}</strong><span>{document.name}</span></li>)}</ol>{selected.classification === DOC_CLASSIFICATION.SOURCE && <p className="policy-note">Source/original documents cannot be edited or overwritten.</p>}</> : <p>Select a document to view its parent and child versions.</p>}</aside>
  </div>;
}
