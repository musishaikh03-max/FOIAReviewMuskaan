import { useMemo, useState } from 'react';
import { can } from '../permissions';
import { useStore } from '../store';
import {
  CaseRecord, COORDINATION_KIND, DOC_CLASSIFICATION, OWNERSHIP_AFTER, QC_DECISION, QC_ITEM_RESULT, QC_KIND, QcItemResult,
  RESPONSIVENESS, Responsiveness, REVIEW_OUTCOME, ReviewOutcome, REVIEW_STATUS, ReviewDecision, SEGREGABILITY_DECISION,
} from '../types';

const qcLabels = [
  'Search complete and RFDs reconciled',
  'Responsiveness, exemption coding and segregability',
  'Redaction quality and release-copy integrity',
  'Response completeness and outcomes of fees/consultations',
  'Required approvals',
];

export default function ReviewRedactionTab({ caseRecord }: { caseRecord: CaseRecord }) {
  const { state, startReview, saveReviewDecision, addRedaction, createCandidate, submitQc, decideQc, prepareNoRecords, createCoordination } = useStore();
  const sources = state.documents.filter(document => document.caseId === caseRecord.id && document.classification === DOC_CLASSIFICATION.SOURCE);
  const [activeId, setActiveId] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [responsiveness, setResponsiveness] = useState<Responsiveness>(RESPONSIVENESS.NOT_REVIEWED);
  const [outcome, setOutcome] = useState<ReviewOutcome>(REVIEW_OUTCOME.NOT_APPLICABLE);
  const [exemption, setExemption] = useState('');
  const [rationale, setRationale] = useState('');
  const [segDecision, setSegDecision] = useState(SEGREGABILITY_DECISION.RELEASED);
  const [segNote, setSegNote] = useState('');
  const [candidateChecks, setCandidateChecks] = useState([false, false, false, false]);
  const [candidateReason, setCandidateReason] = useState('');
  const [batch, setBatch] = useState<string[]>([]);
  const [equityDocs, setEquityDocs] = useState<string[]>([]);
  const [equityPages, setEquityPages] = useState('');
  const [equityDestination, setEquityDestination] = useState('Other federal agency (sample)');
  const [equityBasis, setEquityBasis] = useState('');
  const [equityDue, setEquityDue] = useState('');
  const [qcChecks, setQcChecks] = useState<QcItemResult[]>(Array(5).fill(QC_ITEM_RESULT.PASS));
  const [finding, setFinding] = useState('');
  const active = sources.find(document => document.id === activeId);
  const activeDecision = state.reviewDecisions.find(item => item.docId === activeId);
  const activeRedactions = state.redactions.filter(item => item.docId === activeId);
  const pageCount = active ? 3 + [...active.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3 : 3;
  const lines = useMemo(() => active ? Array.from({ length: 8 }, (_, index) => `Sample page content ${index + 1} for ${active.id}, page ${page}. This text is generated for display and is not a stored record.`) : [], [active, page]);
  const eligible = sources.filter(document => {
    const decision = state.reviewDecisions.find(item => item.docId === document.id);
    return decision?.reviewStatus === REVIEW_STATUS.COMPLETE && (
      ([REVIEW_OUTCOME.RELEASE_FULL, REVIEW_OUTCOME.RELEASE_PART] as string[]).includes(decision.outcome) ? Boolean(decision.candidateValidated && decision.candidateDocId) :
      decision.outcome === REVIEW_OUTCOME.WITHHOLD_FULL ? state.withholdingRecords.some(item => item.docId === document.id) : false
    );
  });
  const qcHistory = state.qcReviews.filter(item => item.caseId === caseRecord.id).sort((a, b) => b.round - a.round);
  const pendingQc = qcHistory.find(item => item.decision === QC_DECISION.PENDING);
  const noRecordsAvailable = state.audit.some(event => event.caseId === caseRecord.id && event.action === 'Search complete - no responsive records');

  const openReview = (docId: string) => {
    const decision = state.reviewDecisions.find(item => item.docId === docId);
    if (!decision) startReview(docId);
    setActiveId(docId); setPage(1); setSelectedLines([]);
    setResponsiveness(decision?.responsiveness || RESPONSIVENESS.NOT_REVIEWED);
    setOutcome(decision?.outcome || REVIEW_OUTCOME.NOT_APPLICABLE);
  };

  const save = () => {
    if (!active) return;
    const decision: ReviewDecision = {
      ...(activeDecision || { docId: active.id }), docId: active.id, responsiveness, outcome,
      reviewStatus: REVIEW_STATUS.COMPLETE, reviewer: state.ui.roleView === 'Reviewer / Redactor' ? 'S. Patel' : state.ui.roleView,
      at: new Date().toISOString(),
    };
    saveReviewDecision(
      decision,
      { docId: active.id, decision: segDecision, note: segNote },
      outcome === REVIEW_OUTCOME.WITHHOLD_FULL ? { docId: active.id, exemptionCodes: exemption ? [exemption] : [], rationale } : undefined,
    );
  };

  return <div className="review-stack">
    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Document review list</h2></div>
      {sources.length ? <div className="table-scroll"><table className="management-table"><thead><tr><th>Select</th><th>Document</th><th>Review status</th><th>Responsiveness</th><th>Outcome</th><th>Candidate</th><th>Action</th></tr></thead><tbody>{sources.map(document => {
        const decision = state.reviewDecisions.find(item => item.docId === document.id);
        const locked = Boolean(document.releasedInRecordId || document.lockedByQcId);
        const referred = decision?.outcome === REVIEW_OUTCOME.REFERRED;
        return <tr key={document.id}><td><input type="checkbox" disabled={!eligible.some(item => item.id === document.id)} checked={batch.includes(document.id)} onChange={() => setBatch(ids => ids.includes(document.id) ? ids.filter(id => id !== document.id) : [...ids, document.id])}/></td><td>{document.name}{document.releasedInRecordId && <small> Released and locked</small>}{referred && <small> Referred - not processed by this office</small>}</td><td>{decision?.reviewStatus || REVIEW_STATUS.NOT_STARTED}</td><td>{decision?.responsiveness || RESPONSIVENESS.NOT_REVIEWED}</td><td>{decision?.outcome || REVIEW_OUTCOME.NOT_APPLICABLE}</td><td>{decision?.candidateDocId ? 'Yes' : 'No'}</td><td><button disabled={locked || referred || !can(state.ui.roleView, 'reviewDocuments')} onClick={() => openReview(document.id)}>{decision ? 'Open review' : 'Start review'}</button></td></tr>;
      })}</tbody></table></div> : <div className="table-empty"><strong>No Source/original documents</strong><span>Review begins from protected source documents.</span></div>}
      <div className="section-actions"><button disabled={!batch.length || !can(state.ui.roleView, 'submitQc')} onClick={() => { if (submitQc(caseRecord.id, batch)) setBatch([]); }}>Submit for QC</button>{noRecordsAvailable && <button onClick={() => prepareNoRecords(caseRecord.id)}>Prepare no-records determination</button>}</div>
      {state.settings.coordinationInScope && <div className="equity-flag-panel"><h3>Flag another entity's equity</h3><p>Conditional - pending client decision</p><div>{sources.filter(document => state.reviewDecisions.some(item => item.docId === document.id)).map(document => <label key={document.id}><input type="checkbox" checked={equityDocs.includes(document.id)} onChange={() => setEquityDocs(ids => ids.includes(document.id) ? ids.filter(id => id !== document.id) : [...ids, document.id])}/>{document.name}</label>)}</div><label>Pages<input value={equityPages} onChange={event => setEquityPages(event.target.value)} placeholder="Example: 1-3, 7"/></label><label>Destination<select value={equityDestination} onChange={event => setEquityDestination(event.target.value)}><option>Other federal agency (sample)</option><option>Other component (sample)</option></select></label><label>Basis<textarea value={equityBasis} onChange={event => setEquityBasis(event.target.value)}/></label><label>Recorded due date<input type="date" value={equityDue} onChange={event => setEquityDue(event.target.value)}/></label><button disabled={!equityDocs.length || !equityBasis.trim() || !equityDue} onClick={() => { createCoordination({ caseId: caseRecord.id, kind: COORDINATION_KIND.CONSULTATION, destination: equityDestination, docIds: equityDocs, basis: `${equityBasis} Pages: ${equityPages || 'Not specified'}`, ownershipAfter: OWNERSHIP_AFTER.RETAINED, dueDate: equityDue }); setEquityDocs([]); setEquityBasis(''); }}>Flag equity</button></div>}
    </section>

    {active && <section className="review-workspace">
      <div className="redaction-warning">Visual simulation - not secure redaction; redaction tool pending (OQ-07)</div>
      <div className="review-main">
        <div className="page-viewer">
          <div className="page-toolbar"><strong>{active.name}</strong><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage(value => value + 1)}>Next</button></div>
          <p className="sample-page-label">Sample page content</p>
          <ol>{lines.map((line, index) => {
            const lineNumber = index + 1;
            const redacted = activeRedactions.some(item => item.page === page && item.lines.includes(lineNumber));
            const aiFlag = lineNumber === 2 || lineNumber === 6;
            return <li key={lineNumber} className={`${redacted ? 'simulated-redaction' : ''} ${aiFlag ? 'ai-flag-line' : ''}`}><label><input type="checkbox" disabled={!can(state.ui.roleView, 'redactDocuments') || redacted} checked={selectedLines.includes(lineNumber)} onChange={() => setSelectedLines(values => values.includes(lineNumber) ? values.filter(value => value !== lineNumber) : [...values, lineNumber])}/><span>{redacted ? '████████████████████████' : line}</span></label></li>;
          })}</ol>
          <p className="ai-flag-note">AI-assisted - sample only - requires human review. Highlighted lines are not automatically redacted.</p>
        </div>
        <aside className="review-controls">
          <label>Responsiveness<select value={responsiveness} onChange={event => setResponsiveness(event.target.value as typeof responsiveness)}>{Object.values(RESPONSIVENESS).map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Outcome<select value={outcome} onChange={event => setOutcome(event.target.value as typeof outcome)}>{Object.values(REVIEW_OUTCOME).map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Segregability<select value={segDecision} onChange={event => setSegDecision(event.target.value as typeof segDecision)}>{Object.values(SEGREGABILITY_DECISION).map(item => <option key={item}>{item}</option>)}</select><small>Criteria pending counsel (V-07)</small></label>
          <label>Segregability note<textarea value={segNote} onChange={event => setSegNote(event.target.value)}/></label>
          <label>Exemption code<select value={exemption} onChange={event => setExemption(event.target.value)}><option value="">Select code</option>{state.exemptionCodes.map(code => <option key={code}>{code}</option>)}</select><small>Sample list - approved list pending V-07</small></label>
          <label>Rationale<textarea value={rationale} onChange={event => setRationale(event.target.value)}/></label>
          <button disabled={!selectedLines.length || !exemption || !rationale.trim() || !can(state.ui.roleView, 'redactDocuments')} onClick={() => { addRedaction({ docId: active.id, page, lines: selectedLines, exemptionCode: exemption, rationale }); setSelectedLines([]); }}>Apply visual redaction</button>
          <button onClick={save}>Save review decision</button>
          <div className="redaction-list"><strong>Recorded redactions</strong>{activeRedactions.length ? activeRedactions.map(item => <span key={item.id}>Page {item.page}, lines {item.lines.join(', ')} · {item.exemptionCode}</span>) : <span>None</span>}</div>
        </aside>
      </div>
      {([REVIEW_OUTCOME.RELEASE_FULL, REVIEW_OUTCOME.RELEASE_PART] as string[]).includes(outcome) && <div className="candidate-checklist"><h3>Create candidate release</h3><p>Simulated validation - real validation requires the approved tool</p>{['No text recoverable under redactions', 'Hidden data and metadata checked', 'Every redaction has an exemption code', 'Page count matches'].map((label, index) => <label key={label}><input type="checkbox" checked={candidateChecks[index]} onChange={() => setCandidateChecks(values => values.map((value, item) => item === index ? !value : value))}/>{label}</label>)}<label>Failure reason<textarea value={candidateReason} onChange={event => setCandidateReason(event.target.value)}/></label><button onClick={() => createCandidate(active.id, candidateChecks, candidateReason)}>Create candidate release</button></div>}
    </section>}

    {qcHistory.length > 0 && <section className="workspace-section qc-section">
      <div className="workspace-section-title"><h2>Quality control</h2><span>Simulated workflow approval - not proof of redaction integrity or release safety</span></div>
      {pendingQc && <div className="qc-decision-form"><h3>Round {pendingQc.round} · {pendingQc.kind}</h3>{qcLabels.map((label, index) => <label key={label}>{label}<select value={qcChecks[index]} onChange={event => setQcChecks(values => values.map((value, item) => item === index ? event.target.value as QcItemResult : value))}>{Object.values(QC_ITEM_RESULT).map(item => <option key={item}>{item}</option>)}</select></label>)}<label>Finding<textarea value={finding} onChange={event => setFinding(event.target.value)}/></label><div><button onClick={() => decideQc(pendingQc.id, false, qcChecks, finding.trim() ? [{ text: finding.trim() }] : [{ text: 'Returned for correction.' }])}>Return</button><button onClick={() => decideQc(pendingQc.id, true, qcChecks, finding.trim() ? [{ text: finding.trim() }] : [])}>Approve</button></div></div>}
      <ol className="qc-history">{qcHistory.map(item => <li key={item.id}><strong>Round {item.round}: {item.decision}</strong><span>{item.kind} · Submitted by {item.submittedBy}{item.decidedBy ? ` · Decided by ${item.decidedBy}` : ''}</span>{item.findings.map((findingItem, index) => <p key={index}>{findingItem.text}</p>)}</li>)}</ol>
    </section>}
  </div>;
}
