import { useEffect, useState } from 'react';
import { can } from '../permissions';
import { useStore } from '../store';
import { CaseRecord, CORRESPONDENCE_STATUS, CORRESPONDENCE_TYPE } from '../types';

export default function CorrespondenceTab({ caseRecord }: { caseRecord: CaseRecord }) {
  const { state, createCorrespondence, updateCorrespondence } = useStore();
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [requesterVisible, setRequesterVisible] = useState(true);
  const [simulateFailure, setSimulateFailure] = useState('');
  const messages = state.correspondence.filter(item => item.caseId === caseRecord.id).sort((a, b) => String(b.sentAt || b.id).localeCompare(String(a.sentAt || a.id)));
  const internalNotes = state.audit.filter(event => event.caseId === caseRecord.id && event.action === 'Note added');
  const selectedTemplate = state.correspondenceTemplates.find(item => item.id === templateId);

  useEffect(() => {
    if (!selectedTemplate) return;
    const merge = (text: string) => text.replaceAll('{{caseId}}', caseRecord.id).replaceAll('{{requesterName}}', caseRecord.requester);
    setSubject(merge(selectedTemplate.subject));
    setBody(merge(selectedTemplate.body));
  }, [selectedTemplate, caseRecord.id, caseRecord.requester]);

  const saveDraft = () => {
    if (!selectedTemplate || !subject.trim() || !body.trim()) return;
    createCorrespondence({
      caseId: caseRecord.id, type: selectedTemplate.type, templateId: selectedTemplate.id,
      subject, body, direction: 'Outbound', status: CORRESPONDENCE_STATUS.DRAFT, requesterVisible,
    });
    setTemplateId(''); setSubject(''); setBody('');
  };

  const acknowledgement = () => {
    const template = state.correspondenceTemplates.find(item => item.type === CORRESPONDENCE_TYPE.ACKNOWLEDGEMENT);
    if (!template) return;
    const merge = (text: string) => text.replaceAll('{{caseId}}', caseRecord.id).replaceAll('{{requesterName}}', caseRecord.requester);
    createCorrespondence({ caseId: caseRecord.id, type: CORRESPONDENCE_TYPE.ACKNOWLEDGEMENT, templateId: template.id, subject: merge(template.subject), body: merge(template.body), direction: 'Outbound', status: CORRESPONDENCE_STATUS.DRAFT, requesterVisible: true });
  };

  return <div className="correspondence-layout">
    <section className="workspace-section">
      <div className="workspace-section-title"><h2>Correspondence history</h2><button onClick={acknowledgement}>Send acknowledgement</button></div>
      <p className="simulation-banner">Simulated send - nothing is transmitted</p>
      {messages.length ? <ul className="message-list">{messages.map(message => <li key={message.id}><div><strong>{message.subject}</strong><span>{message.direction} · {message.type} · {message.status}</span><small>{message.requesterVisible ? 'Requester-visible' : 'Internal only'} · Prepared by {message.createdBy}{message.approvedBy ? ` · Approved by ${message.approvedBy}` : ''}</small></div><div className="row-actions">
        {message.status === CORRESPONDENCE_STATUS.DRAFT && can(state.ui.roleView, 'composeCorrespondence') && <button onClick={() => updateCorrespondence(message.id, { status: state.settings.outboundApprovalRequired ? CORRESPONDENCE_STATUS.PENDING_APPROVAL : CORRESPONDENCE_STATUS.APPROVED }, 'Correspondence submitted')}>Submit for approval</button>}
        {message.status === CORRESPONDENCE_STATUS.PENDING_APPROVAL && can(state.ui.roleView, 'approveCorrespondence') && <button onClick={() => updateCorrespondence(message.id, { status: CORRESPONDENCE_STATUS.APPROVED }, 'Correspondence approved')}>Approve</button>}
        {message.status === CORRESPONDENCE_STATUS.APPROVED && can(state.ui.roleView, 'sendCorrespondence') && <><label className="failure-toggle"><input type="checkbox" checked={simulateFailure === message.id} onChange={event => setSimulateFailure(event.target.checked ? message.id : '')}/>Simulate delivery failure</label><button onClick={() => updateCorrespondence(message.id, { status: simulateFailure === message.id ? CORRESPONDENCE_STATUS.DELIVERY_FAILED : CORRESPONDENCE_STATUS.SENT }, simulateFailure === message.id ? 'Simulated delivery failure' : 'Correspondence sent (simulated)')}>Send (simulated)</button></>}
        {message.status === CORRESPONDENCE_STATUS.DELIVERY_FAILED && <button onClick={() => updateCorrespondence(message.id, { status: CORRESPONDENCE_STATUS.SENT }, 'Delivery retried (simulated)')}>Retry</button>}
      </div></li>)}</ul> : <div className="table-empty table-empty--compact"><strong>No correspondence</strong><span>No messages have been recorded for this case.</span></div>}
    </section>

    {can(state.ui.roleView, 'composeCorrespondence') && <section className="workspace-section">
      <div className="workspace-section-title"><h2>Composer</h2></div>
      <div className="correspondence-composer">
        <label>Template<select value={templateId} onChange={event => setTemplateId(event.target.value)}><option value="">Select template</option>{state.correspondenceTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
        <label>Subject<input value={subject} onChange={event => setSubject(event.target.value)}/></label>
        <label>Body<textarea value={body} onChange={event => setBody(event.target.value)}/></label>
        <label className="checkbox-label"><input type="checkbox" checked={requesterVisible} onChange={event => setRequesterVisible(event.target.checked)}/>Requester-visible</label>
        <div className="message-preview"><strong>Preview</strong><h3>{subject || 'Subject preview'}</h3><p>{body || 'Choose a template to fill approved merge fields.'}</p></div>
        <button className="button button--primary" disabled={!templateId || !subject.trim() || !body.trim()} onClick={saveDraft}>Save draft</button>
      </div>
    </section>}

    <section className="workspace-section"><div className="workspace-section-title"><h2>Internal notes</h2></div>{internalNotes.length ? <ul className="message-list">{internalNotes.map(note => <li key={note.id}><div><strong>Internal note</strong><p>{note.detail}</p><small>{note.actorName} · {new Date(note.at).toLocaleString()}</small></div></li>)}</ul> : <div className="table-empty table-empty--compact"><strong>No internal notes</strong><span>Internal notes never appear in requester correspondence.</span></div>}</section>
  </div>;
}
