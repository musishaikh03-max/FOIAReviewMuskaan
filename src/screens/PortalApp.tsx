import { FormEvent, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { publicStatus, requesterAction, requesterDocuments, requesterTimeline } from '../public';
import {
  CORRESPONDENCE_TYPE, DELIVERY_OUTCOME, PUBLICATION_CHOICE, REQUEST_TYPE, RequestType,
} from '../types';

export default function PortalApp({ page, params, navigate, guard, onStaff }: { page: string; params: URLSearchParams; navigate: (route: string) => void; guard: boolean; onStaff: () => void }) {
  const { state, setPortalRequester } = useStore();
  const requesterKeys = [...new Set(state.cases.map(item => item.requesterKey))].sort();
  const activeKey = state.ui.portalRequesterKey || requesterKeys[0] || '';
  const requesterName = state.cases.find(item => item.requesterKey === activeKey)?.requester || 'Demo requester';
  if (!state.settings.portalInScope) return <div className="portal-shell"><PortalTop onStaff={onStaff}/><main className="portal-main"><div className="placeholder"><h1>Not in scope for this release</h1><p>The conditional requester portal is disabled in Prototype Settings.</p></div></main></div>;
  const portalPage = page.startsWith('portal') ? page : 'portal';
  return <div className="portal-shell">
    <PortalTop onStaff={onStaff}/>
    {portalPage !== 'portal/reading-room' && <div className="portal-identity"><label>Sign in as a demo requester<select value={activeKey} onChange={event => setPortalRequester(event.target.value)}>{requesterKeys.map(key => <option key={key} value={key}>{state.cases.find(item => item.requesterKey === key)?.requester} ({key})</option>)}</select></label><span>Signed in as {requesterName}</span></div>}
    {guard && <div className="portal-guard">This redirect is a demonstration guard, not security</div>}
    <main className="portal-main">
      {portalPage === 'portal' && <PortalHome navigate={navigate}/>}
      {portalPage === 'portal/submit' && <PortalSubmit navigate={navigate}/>}
      {portalPage === 'portal/requests' && <PortalRequests requesterKey={activeKey} navigate={navigate}/>}
      {portalPage === 'portal/request' && <PortalRequest id={params.get('id') || ''} requesterKey={activeKey} navigate={navigate}/>}
      {portalPage === 'portal/reading-room' && <PortalReadingRoom/>}
      {portalPage === 'portal/appeal' && <PortalAppeal id={params.get('id') || ''} requesterKey={activeKey} navigate={navigate}/>}
    </main>
  </div>;
}

function PortalTop({ onStaff }: { onStaff: () => void }) {
  return <><header className="portal-topbar"><strong>Agency FOIA Portal (Prototype)</strong><button onClick={onStaff}>Switch back to staff view</button></header><div className="portal-simulation">Simulated portal - no real sign-in and no FOIA.gov connection</div></>;
}

function PortalHome({ navigate }: { navigate: (route: string) => void }) {
  const { state } = useStore();
  return <><section className="portal-hero"><p>Requester prototype</p><h1>Request records and track your requests</h1><span>This browser demonstration does not submit information to a government system.</span></section><div className="portal-card-grid"><button onClick={() => navigate('portal/submit')}><strong>Submit a request</strong><span>Enter a new FOIA or Privacy Act request.</span></button><button onClick={() => navigate('portal/requests')}><strong>My requests</strong><span>View public status, correspondence, and released documents.</span></button><button onClick={() => navigate('portal/reading-room')}><strong>Reading Room search</strong><span>Search approved, published records without signing in.</span></button></div><section className="portal-instructions"><h2>Before you begin</h2><p>{state.portalInstructionText}</p></section></>;
}

function PortalSubmit({ navigate }: { navigate: (route: string) => void }) {
  const { state, createCase } = useStore();
  const [requestType, setRequestType] = useState<RequestType>(REQUEST_TYPE.FOIA);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tracking, setTracking] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const record = createCase({
      title, requester: name, received: String(data.get('received')), requestType, source: 'Portal',
      requesterType: String(data.get('requesterType')), email: String(data.get('email')), phone: String(data.get('phone')),
      address: String(data.get('address')), description, dateRangeStart: String(data.get('start')), dateRangeEnd: String(data.get('end')),
      expeditedRequested: data.get('expedite') === 'on', willingToPayFees: data.get('fees') === 'on',
      attachments: files.map(file => ({ name: file.name, sizeKb: Math.round(file.size / 1024), mime: file.type || 'application/octet-stream' })),
    }, { navigate: false });
    setTracking(record.id);
  };
  if (tracking) return <section className="portal-confirmation"><h1>Request submitted</h1><p>Your tracking number is <strong>{tracking}</strong>.</p><button onClick={() => navigate(`portal/request?id=${encodeURIComponent(tracking)}`)}>View request</button></section>;
  return <section className="portal-panel"><div className="portal-heading"><h1>Submit a request</h1><p>Attachments are metadata only; file contents are not stored.</p></div><form className="portal-form" onSubmit={submit}>
    <fieldset><legend>Request type</legend><label><input type="radio" checked={requestType === REQUEST_TYPE.FOIA} onChange={() => setRequestType(REQUEST_TYPE.FOIA)}/>{REQUEST_TYPE.FOIA}</label><label><input type="radio" checked={requestType === REQUEST_TYPE.PRIVACY_ACT} onChange={() => setRequestType(REQUEST_TYPE.PRIVACY_ACT)}/>{REQUEST_TYPE.PRIVACY_ACT}</label></fieldset>
    {requestType === REQUEST_TYPE.PRIVACY_ACT && <p className="portal-notice">Identity verification is handled by staff outside this prototype</p>}
    <label>Requester type<select name="requesterType"><option>Individual</option><option>Organization</option></select></label>
    <label>Full name<input value={name} onChange={event => setName(event.target.value)} required/></label>
    <label>Email<input name="email" type="email"/></label><label>Phone<input name="phone"/></label>
    <label className="span-two">Mailing address<input name="address"/></label><label>Date submitted<input name="received" type="date" defaultValue={state.settings.asOfDate} required/></label>
    <label className="span-two">Request title<input value={title} onChange={event => setTitle(event.target.value)} required/></label>
    <label className="span-two">Description<textarea value={description} onChange={event => setDescription(event.target.value)} required/></label>
    <label>Records date range start<input name="start" type="date"/></label><label>Records date range end<input name="end" type="date"/></label>
    <label className="checkbox-label"><input name="fees" type="checkbox"/>Willing to pay fees</label><label className="checkbox-label"><input name="expedite" type="checkbox"/>Expedited processing requested</label>
    <p className="portal-note span-two">A request does not indicate approval</p>
    <label className="span-two">Attachments<input type="file" multiple onChange={event => setFiles(Array.from(event.target.files || []))}/></label>
    <div className="span-two"><button className="button button--primary">Submit request</button></div>
  </form></section>;
}

function PortalRequests({ requesterKey, navigate }: { requesterKey: string; navigate: (route: string) => void }) {
  const { state } = useStore();
  const cases = state.cases.filter(item => item.requesterKey === requesterKey);
  return <section className="portal-panel"><div className="portal-heading"><h1>My requests</h1><p>Public requester view only.</p></div>{cases.length ? <div className="portal-request-list">{cases.map(item => <button key={item.id} onClick={() => navigate(`portal/request?id=${encodeURIComponent(item.id)}`)}><strong>{item.id}</strong><span>{item.title}</span><time>{item.received}</time><em>{publicStatus(item, state)}</em></button>)}</div> : <div className="table-empty"><strong>No requests</strong></div>}</section>;
}

function PortalRequest({ id, requesterKey, navigate }: { id: string; requesterKey: string; navigate: (route: string) => void }) {
  const { state, portalRequesterReply, portalFeeResponse } = useStore();
  const record = state.cases.find(item => item.id === id && item.requesterKey === requesterKey);
  const [reply, setReply] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [feeText, setFeeText] = useState('');
  if (!record) return <div className="placeholder"><h1>Not found</h1><p>This request does not exist or does not belong to the selected demo requester.</p><button onClick={() => navigate('portal/requests')}>My requests</button></div>;
  const action = requesterAction(record.id, state);
  const timeline = requesterTimeline(record, state);
  const documents = requesterDocuments(record, state);
  const correspondence = state.correspondence.filter(item => item.caseId === record.id && item.requesterVisible);
  return <div className="portal-detail"><div className="portal-heading"><button className="link" onClick={() => navigate('portal/requests')}>My requests</button><h1>{record.title}</h1><p>{record.id}</p><span className="portal-status">{publicStatus(record, state)}</span></div>
    {action === 'clarification' && <section className="portal-action-card"><h2>Action required - clarification</h2><label>Your response<textarea value={reply} onChange={event => setReply(event.target.value)}/></label><label>Optional documents<input type="file" multiple onChange={event => setFiles(Array.from(event.target.files || []))}/></label><button disabled={!reply.trim()} onClick={() => { if (portalRequesterReply(record.id, reply, files.map(file => ({ name: file.name, sizeKb: Math.round(file.size / 1024), mime: file.type || 'application/octet-stream' })))) { setReply(''); setFiles([]); } }}>Submit response</button></section>}
    {action === 'fee' && state.settings.feesInScope && <section className="portal-action-card"><h2>Action required - fee</h2><p>Payment is not simulated in this prototype</p><textarea value={feeText} onChange={event => setFeeText(event.target.value)} placeholder="Optional explanation"/><div><button onClick={() => portalFeeResponse(record.id, 'Agree', feeText)}>Agree</button><button onClick={() => portalFeeResponse(record.id, 'Decline', feeText)}>Decline</button><button onClick={() => portalFeeResponse(record.id, 'Waiver or narrower scope', feeText)}>Request a waiver or narrower scope</button></div></section>}
    <div className="portal-detail-grid"><section className="portal-panel"><h2>Timeline</h2><ol className="portal-timeline">{timeline.map(item => <li key={item.id}><time>{new Date(item.at).toLocaleDateString()}</time><strong>{item.title}</strong><span>{item.detail}</span></li>)}</ol></section>
    <section className="portal-panel"><h2>Correspondence</h2>{correspondence.length ? correspondence.map(item => <article className="portal-message" key={item.id}><strong>{item.subject}</strong><span>{item.type} - {item.status}</span><p>{item.body}</p></article>) : <p>No requester-visible correspondence.</p>}</section></div>
    <section className="portal-panel"><h2>Released documents</h2>{documents.length ? <ul className="portal-documents">{documents.map(document => <li key={document.id}><strong>{document.name}</strong><button>Download (simulated)</button></li>)}</ul> : <p>No released documents are available.</p>}{state.settings.appealsInScope && <button onClick={() => navigate(`portal/appeal?id=${encodeURIComponent(record.id)}`)}>Submit appeal</button>}</section>
  </div>;
}

function PortalAppeal({ id, requesterKey, navigate }: { id: string; requesterKey: string; navigate: (route: string) => void }) {
  const { state, registerAppeal } = useStore();
  const record = state.cases.find(item => item.id === id && item.requesterKey === requesterKey);
  const [grounds, setGrounds] = useState('');
  const [confirmation, setConfirmation] = useState('');
  if (!state.settings.appealsInScope) return <div className="placeholder"><h1>Not in scope for this release</h1></div>;
  if (!record) return <div className="placeholder"><h1>Not found</h1></div>;
  const final = state.releaseRecords.find(item => item.caseId === id && item.kind === 'Final' && item.deliveryOutcome === DELIVERY_OUTCOME.DELIVERED);
  const staffReview = !final;
  return <section className="portal-panel"><div className="portal-heading"><h1>Submit an appeal</h1><p>{record.id}</p></div><p className="portal-notice">Appeal timing is not calculated - pending counsel</p>{staffReview && <p>Eligibility and timing pending counsel. This submission will use the staff-review route.</p>}{confirmation ? <p><strong>{confirmation}</strong></p> : <><label>Grounds<textarea value={grounds} onChange={event => setGrounds(event.target.value)}/></label><button disabled={!grounds.trim()} onClick={() => { const appeal = registerAppeal({ caseId: id, receivedDate: state.settings.asOfDate, channel: 'Portal', appellant: record.requester, challengedReleaseId: final?.id, grounds, staffReviewRoute: staffReview }); setConfirmation(`Appeal ${appeal.id} received.`); }}>Submit appeal</button></>}<button onClick={() => navigate(`portal/request?id=${encodeURIComponent(id)}`)}>Back to request</button></section>;
}

function PortalReadingRoom() {
  const { state } = useStore();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('All');
  const published = state.readingRoomItems.filter(item => item.status === 'Published');
  const categories = [...new Set(published.map(item => item.category))];
  const results = published.filter(item => (!keyword || `${item.title} ${item.description}`.toLowerCase().includes(keyword.toLowerCase())) && (category === 'All' || item.category === category));
  return <section className="portal-panel"><div className="portal-heading"><h1>Reading Room</h1><p>Public, approved publication metadata only.</p></div><div className="reading-search"><label>Keyword<input value={keyword} onChange={event => setKeyword(event.target.value)}/></label><label>Category<select value={category} onChange={event => setCategory(event.target.value)}><option>All</option>{categories.map(item => <option key={item}>{item}</option>)}</select></label></div>{results.length ? <div className="reading-results">{results.map(item => <article key={item.id}><strong>{item.title}</strong><span>{item.category} - {new Date(item.publishedAt).toLocaleDateString()}</span><p>{item.description}</p><small>{item.docIds.length} published document(s)</small></article>)}</div> : <div className="table-empty"><strong>No published items found</strong></div>}</section>;
}
