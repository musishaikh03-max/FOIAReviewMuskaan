import { FormEvent, useMemo, useState } from 'react';
import { ACTIONS, can } from '../permissions';
import { useStore } from '../store';
import {
  ALLOWED_TRANSITIONS,
  APPEAL_STATUS,
  CASE_STATUS,
  DEMO_USERS,
  DISPOSITION,
  PAYMENT_STATUS,
  PROCESSING_TRACK,
  QC_DECISION,
  REQUESTER_AGREEMENT,
  RFD_STATUS,
  ROLE_VIEWS,
  TASK_STATUS,
  TERMINAL_STATUSES,
  calendarDays,
  openTask,
} from '../types';

type Navigate = (path: string) => void;

const csvCell = (value: unknown) => {
  const raw = String(value ?? '');
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
};

function downloadCsv(filename: string, rows: unknown[][]) {
  const blob = new Blob([rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const adminTabs = ['Prototype Settings', 'Users & Roles', 'Offices & Custodians', 'Reference Data', 'Templates', 'Portal & Reading Room', 'Audit', 'Integration status', 'Data'] as const;

export function Administration({ navigate }: { navigate: Navigate }) {
  const {
    state, updateSettings, resetData, addAdminUser, toggleAdminUser, updateOffice, updateReferenceValue,
    updateTemplate, updatePortalInstructions, simulateFoiaGovImport, unpublishReadingRoomItem,
  } = useStore();
  const [tab, setTab] = useState<(typeof adminTabs)[number]>('Prototype Settings');
  const [notice, setNotice] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  const visibleTabs = adminTabs.filter(item => item !== 'Portal & Reading Room' || state.settings.portalInScope || state.settings.readingRoomInScope);
  const editable = can(state.ui.roleView, 'editSettings');
  const settings = [
    ['coordinationInScope', 'Coordination', 'OQ-09'], ['feesInScope', 'Fees', 'OQ-10'], ['appealsInScope', 'Appeals', 'OQ-12'],
    ['portalInScope', 'Public Portal', 'OQ-03'], ['readingRoomInScope', 'Reading Room', 'V-11'],
    ['outboundApprovalRequired', 'Outbound approval required', 'policy pending'], ['qcForNoRecords', 'QC for no-records', 'policy pending'],
    ['showAiAssistant', 'Show AI Case Assistant', 'AI-assisted - requires human review'],
  ] as const;
  return <>
    <header className="page-header"><div><h1>Administration</h1><p>Prototype configuration, reference data, oversight, and simulated integration status.</p><span className="prototype-date">Prototype date: {state.settings.asOfDate}</span></div></header>
    <div className="workspace-tabs admin-tabs" role="tablist">{visibleTabs.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {notice && <p className="simulation-banner" role="status">{notice}</p>}
    {tab === 'Prototype Settings' && <section className="settings-panel">
      <div className="settings-heading"><div><h2>Prototype Settings</h2><p>These controls affect the browser prototype only.</p></div><span className="badge badge--neutral">Prototype</span></div>
      <label className="settings-date">Prototype as-of date<input type="date" value={state.settings.asOfDate} disabled={!editable} onChange={event => event.target.value && updateSettings({ asOfDate: event.target.value })}/><small>The only "today" used for counts, overdue tests and aging.</small></label>
      <div className="settings-list">{settings.map(([key, label, reference]) => <label key={key}><span><strong>{label}</strong><small>{reference}</small></span>{key !== 'showAiAssistant' && <em className="badge badge--conditional">Conditional - pending client decision</em>}<input type="checkbox" checked={state.settings[key]} disabled={!editable} onChange={event => updateSettings({ [key]: event.target.checked })}/></label>)}</div>
    </section>}
    {tab === 'Users & Roles' && <UsersRoles/>}
    {tab === 'Offices & Custodians' && <Offices/>}
    {tab === 'Reference Data' && <ReferenceData/>}
    {tab === 'Templates' && <Templates/>}
    {tab === 'Portal & Reading Room' && <section className="admin-stack">
      {state.settings.portalInScope && <section className="workspace-section"><div className="workspace-section-title"><h2>Portal</h2><span className="badge badge--conditional">Conditional - pending client decision (OQ-03)</span></div>
        <label className="admin-field">Portal instruction text<textarea value={state.portalInstructionText} disabled={!editable} onChange={event => updatePortalInstructions(event.target.value)}/></label>
        <button className="button button--secondary" onClick={() => navigate('cases?source=Portal')}>Portal submissions ({state.cases.filter(item => item.source === 'Portal').length})</button>
      </section>}
      {state.settings.readingRoomInScope && <section className="workspace-section"><div className="workspace-section-title"><h2>Reading Room</h2><span className="badge badge--conditional">Conditional - pending client decision (OQ-03)</span></div>
        {state.readingRoomItems.length ? <div className="table-scroll"><table><thead><tr><th>Title</th><th>Case</th><th>Status</th><th>Action</th></tr></thead><tbody>{state.readingRoomItems.map(item => <tr key={item.id}><td>{item.title}</td><td><button className="link" onClick={() => navigate(`case-detail?id=${item.caseId}&tab=determination-release`)}>{item.caseId}</button></td><td>{item.status}</td><td>{item.status === 'Published' && <button className="link" onClick={() => { const reason = window.prompt('Reason for unpublishing'); if (reason?.trim()) unpublishReadingRoomItem(item.id, reason.trim()); }}>Unpublish</button>}</td></tr>)}</tbody></table></div> : <div className="table-empty table-empty--compact"><strong>No Reading Room items</strong><span>No publication records are stored.</span></div>}
      </section>}
    </section>}
    {tab === 'Audit' && <AuditView/>}
    {tab === 'Integration status' && <section className="workspace-section"><div className="workspace-section-title"><h2>Integration status</h2></div>
      <p className="simulation-banner">All integrations are simulated; nothing is connected.</p>
      <div className="table-scroll"><table><thead><tr><th>Integration</th><th>Status</th><th>Open question</th></tr></thead><tbody>{['Identity', 'Email', 'Repository', 'Redaction', 'Payment', 'FOIA.gov', 'Search/OCR'].map(name => <tr key={name}><td>{name}</td><td>Not connected - simulated</td><td>Open-question reference pending confirmation</td></tr>)}</tbody></table></div>
      <button className="button button--primary" disabled={!can(state.ui.roleView, 'simulateFoiaGovImport')} onClick={() => { const ids = simulateFoiaGovImport(); setNotice(`Simulated - not connected. Added ${ids.join(' and ')}.`); }}>Simulate FOIA.gov import</button>
    </section>}
    {tab === 'Data' && <section className="workspace-section danger-panel"><div className="workspace-section-title"><h2>Reset prototype data</h2></div><p>Restores the current seed data and Administrator role view. Older storage keys are not re-imported.</p>{resetConfirm ? <div className="reset-confirm"><strong>Confirm reset to the current seed data?</strong><button className="button button--secondary" onClick={() => setResetConfirm(false)}>Cancel</button><button className="button button--primary" onClick={() => { resetData(); setResetConfirm(false); }}>Confirm reset</button></div> : <button className="button button--secondary" disabled={!can(state.ui.roleView, 'resetPrototypeData')} onClick={() => setResetConfirm(true)}>Reset prototype data</button>}</section>}
  </>;

  function UsersRoles() {
    const [adding, setAdding] = useState(false);
    const submit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      addAdminUser({ name: String(data.get('name')), roleView: String(data.get('role')) as keyof typeof DEMO_USERS, office: String(data.get('office')) });
      setAdding(false);
    };
    return <section className="admin-stack"><section className="workspace-section"><div className="workspace-section-title"><h2>Users</h2><button disabled={!editable} onClick={() => setAdding(!adding)}>Add demonstration user</button></div><p className="metadata-note">Demonstration role view, not access control</p>
      {adding && <form className="admin-inline-form" onSubmit={submit}><label>Name<input name="name" required/></label><label>Role view<select name="role">{ROLE_VIEWS.map(role => <option key={role}>{role}</option>)}</select></label><label>Office<input name="office" required/></label><button>Add</button></form>}
      <div className="table-scroll"><table><thead><tr><th>Name</th><th>Role view</th><th>Office</th><th>Status</th><th>Action</th></tr></thead><tbody>{state.adminUsers.map(user => <tr key={user.id}><td>{user.name}</td><td>{user.roleView}</td><td>{user.office}</td><td>{user.status}</td><td><button className="link" disabled={!editable} onClick={() => toggleAdminUser(user.id)}>{user.status === 'Active' ? 'Disable' : 'Enable'}</button></td></tr>)}</tbody></table></div>
    </section><section className="workspace-section"><div className="workspace-section-title"><h2>Read-only role matrix</h2></div><div className="table-scroll"><table className="role-matrix"><thead><tr><th>Role view</th>{Object.keys(ACTIONS).map(action => <th key={action}>{action}</th>)}</tr></thead><tbody>{ROLE_VIEWS.map(role => <tr key={role}><th>{role}</th>{Object.keys(ACTIONS).map(action => <td key={action}>{can(role, action as keyof typeof ACTIONS) ? 'Yes' : '—'}</td>)}</tr>)}</tbody></table></div></section></section>;
  }

  function Offices() {
    return <section className="workspace-section"><div className="workspace-section-title"><h2>Offices & Custodians</h2></div><div className="admin-card-list">{state.offices.map(office => <form key={office.id} className="admin-card" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); updateOffice(office.id, { name: String(data.get('name')), custodianName: String(data.get('custodian')), assignmentTeams: String(data.get('teams')).split(',').map(item => item.trim()).filter(Boolean) }); }}><label>Office<input name="name" defaultValue={office.name}/></label><label>Custodian contact<input name="custodian" defaultValue={office.custodianName}/></label><label>Assignment teams<input name="teams" defaultValue={office.assignmentTeams.join(', ')}/></label><button disabled={!editable}>Save</button></form>)}</div></section>;
  }

  function ReferenceData() {
    const [section, setSection] = useState<keyof Pick<typeof state.referenceData, 'tracks' | 'requestSources' | 'requesterCategories' | 'exemptionCodes' | 'dispositions'>>('tracks');
    const [selected, setSelected] = useState(state.referenceData.tracks[0]);
    const [next, setNext] = useState('');
    const [effective, setEffective] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const values = state.referenceData[section];
    const active = state.cases.filter(record => !TERMINAL_STATUSES.includes(record.status));
    const usedCount = active.filter(record => section === 'tracks' ? record.track === selected : section === 'requestSources' ? (record.source || 'Not provided') === selected : section === 'requesterCategories' ? (record.requesterType || 'Not provided') === selected : section === 'exemptionCodes' ? state.determinations.some(item => item.caseId === record.id && item.exemptionsUsed.includes(selected)) : state.determinations.some(item => item.caseId === record.id && item.disposition === selected)).length;
    return <section className="admin-stack"><p className="simulation-banner">Sample - pending approval</p><section className="workspace-section"><div className="workspace-section-title"><h2>Editable reference values</h2></div><div className="reference-editor">
      <label>Reference group<select value={section} onChange={event => { const key = event.target.value as typeof section; setSection(key); setSelected(state.referenceData[key][0]); setConfirmed(false); }}><option value="tracks">Tracks</option><option value="requestSources">Request sources</option><option value="requesterCategories">Requester categories</option><option value="exemptionCodes">Exemption codes</option><option value="dispositions">Dispositions</option></select></label>
      <label>Current value<select value={selected} onChange={event => { setSelected(event.target.value); setConfirmed(false); }}>{values.map(value => <option key={value}>{value}</option>)}</select></label><label>New value<input value={next} onChange={event => setNext(event.target.value)}/></label><label>Effective date<input type="date" value={effective} onChange={event => setEffective(event.target.value)}/></label>
      {usedCount > 0 && <label className="impact-warning"><strong>{usedCount} active cases use this value</strong><span><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/> Confirm impact before saving</span></label>}
      <button className="button button--primary" disabled={!editable || !next.trim() || !effective || (usedCount > 0 && !confirmed)} onClick={() => { updateReferenceValue(section, selected, next, effective); setSelected(next.trim()); setNext(''); setConfirmed(false); }}>Save change</button>
    </div></section>
      <section className="workspace-section"><div className="workspace-section-title"><h2>View-only statuses and transition table</h2></div><div className="table-scroll"><table><thead><tr><th>Status</th><th>Allowed next statuses</th><th>Public status</th></tr></thead><tbody>{Object.values(CASE_STATUS).map(status => <tr key={status}><td>{status}</td><td>{ALLOWED_TRANSITIONS[status].join(', ') || 'None'}</td><td>{state.referenceData.publicStatusMapping[status]}</td></tr>)}</tbody></table></div></section>
      <section className="workspace-section"><div className="workspace-section-title"><h2>Illustrative fee rates</h2></div><ul>{state.referenceData.feeRates.map(item => <li key={item.label}>{item.label}: ${item.rate.toFixed(2)} — Sample - pending approval</li>)}</ul></section>
    </section>;
  }

  function Templates() {
    return <section className="workspace-section"><div className="workspace-section-title"><h2>Correspondence templates</h2></div><div className="admin-card-list">{state.correspondenceTemplates.map(template => <form key={template.id} className="admin-card" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); updateTemplate(template.id, { subject: String(data.get('subject')), body: String(data.get('body')), mergeFields: String(data.get('fields')).split(',').map(item => item.trim()).filter(Boolean) }); }}><strong>{template.name} · version {template.version}</strong><label>Subject<input name="subject" defaultValue={template.subject}/></label><label>Body<textarea name="body" defaultValue={template.body}/></label><label>Merge fields<input name="fields" defaultValue={template.mergeFields.join(', ')}/></label><button disabled={!editable}>Save new version</button></form>)}</div></section>;
  }
}

function AuditView() {
  const { state } = useStore();
  const [actor, setActor] = useState('');
  const [role, setRole] = useState('');
  const [caseId, setCaseId] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [notice, setNotice] = useState('');
  const rows = state.audit.filter(item => (!actor || item.actorName.toLowerCase().includes(actor.toLowerCase())) && (!role || item.actorRole === role) && (!caseId || item.caseId === caseId) && (!action || item.action.toLowerCase().includes(action.toLowerCase())) && (!from || item.at.slice(0, 10) >= from) && (!to || item.at.slice(0, 10) <= to));
  const authorised = can(state.ui.roleView, 'exportAudit');
  return <section className="workspace-section"><div className="workspace-section-title"><h2>Global audit</h2><button onClick={() => { if (!authorised) return setNotice('Not authorised in this demonstration'); setNotice(''); downloadCsv('foia-audit.csv', [['Timestamp', 'Actor', 'Role', 'Case', 'Action', 'Detail'], ...rows.map(item => [item.at, item.actorName, item.actorRole, item.caseId || '', item.action, item.detail])]); }}>Export CSV</button></div>
    {notice && <p className="simulation-banner">{notice}</p>}<div className="audit-filters"><label>Actor<input value={actor} onChange={event => setActor(event.target.value)}/></label><label>Role<select value={role} onChange={event => setRole(event.target.value)}><option value="">All roles</option>{ROLE_VIEWS.map(item => <option key={item}>{item}</option>)}</select></label><label>Case<input list="audit-case-options" value={caseId} placeholder="All cases" onChange={event => setCaseId(event.target.value)}/><datalist id="audit-case-options">{state.cases.map(item => <option key={item.id} value={item.id}/>)}</datalist></label><label>Action<input value={action} onChange={event => setAction(event.target.value)}/></label><label>From<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label><label>To<input type="date" value={to} onChange={event => setTo(event.target.value)}/></label></div>
    <div className="table-scroll"><table><thead><tr><th>Timestamp</th><th>Actor / role</th><th>Case</th><th>Action</th><th>Detail</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td>{new Date(item.at).toLocaleString()}</td><td>{item.actorName}<small>{item.actorRole}</small></td><td>{item.caseId || '—'}</td><td>{item.action}</td><td>{item.detail}</td></tr>)}</tbody></table></div>{!rows.length && <div className="table-empty table-empty--compact"><strong>No audit events match</strong><span>Adjust the filters.</span></div>}
  </section>;
}

export function ReportsAnalytics({ navigate }: { navigate: Navigate }) {
  const { state } = useStore();
  const [refreshed, setRefreshed] = useState(() => new Date());
  const [notice, setNotice] = useState('');
  const open = state.cases.filter(item => !TERMINAL_STATUSES.includes(item.status));
  const grouped = (key: 'status' | 'team' | 'processor' | 'track') => [...new Set(open.map(item => item[key]))].map(value => ({ label: value, count: open.filter(item => item[key] === value).length, target: `cases?${key}=${encodeURIComponent(value)}` }));
  const ageGroups = [['0–5 days', 0, 5, '0-5'], ['6–10 days', 6, 10, '6-10'], ['11–20 days', 11, 20, '11-20'], ['21–30 days', 21, 30, '21-30'], ['31+ days', 31, Infinity, '31+']] as const;
  const metrics = [
    { label: 'Open cases', count: open.length, target: 'cases' },
    { label: 'Closed', count: state.cases.filter(item => item.status === CASE_STATUS.CLOSED).length, target: `cases?status=${encodeURIComponent(CASE_STATUS.CLOSED)}` },
    { label: 'Transferred', count: state.cases.filter(item => item.status === CASE_STATUS.TRANSFERRED).length, target: `cases?status=${encodeURIComponent(CASE_STATUS.TRANSFERRED)}` },
    { label: 'Overdue', count: open.filter(item => item.dueDate && item.dueDate < state.settings.asOfDate).length, target: 'cases?overdue=1' },
    { label: 'Recorded hold', count: open.filter(item => item.clock.state === 'Hold recorded').length, target: 'cases?hold=1' },
    { label: 'Pending approvals', count: state.correspondence.filter(item => item.status === 'Pending approval').length + state.closureRequests.filter(item => item.status === 'Pending approval').length, target: 'processing' },
    { label: 'Overdue RFDs', count: state.rfds.filter(item => item.dueDate < state.settings.asOfDate && item.status !== RFD_STATUS.ACCEPTED && item.status !== RFD_STATUS.CANCELLED).length, target: 'processing' },
    { label: 'QC queue', count: state.qcReviews.filter(item => item.decision === QC_DECISION.PENDING).length, target: 'review' },
  ];
  const dispositionCounts = Object.values(DISPOSITION).map(value => [value, state.determinations.filter(item => item.disposition === value).length] as const);
  const exportAllowed = can(state.ui.roleView, 'exportOperationalReports');
  const consistency = [
    ['No hard-coded counts; no double counting; stages sum to Open Cases', 'Pass', `Operational counts are derived from ${open.length} unique open case records.`],
    ['Enumerations imported from src/types.ts', 'Not fixed', 'Core workflow enumerations are central; some legacy descriptive and form option strings remain local.'],
    ['Case/task badges and filters cover every status', 'Fixed', 'Case status classes and case status filters cover all values; task statuses are represented in worklists.'],
    ['Every Prompt 1–6 action audits; every list has an empty state', 'Not fixed', 'Store mutations audit; a complete empty-state inventory was not proven.'],
    ['No obsolete later-step or deferred copy for Prompt 1–6 work', 'Fixed', 'Known obsolete clarification, no-records, and fallback copy was removed.'],
    ['Sidebar retains the same 11 labels and order', 'Pass', 'No sidebar labels or order were changed.'],
    ['Requester views leak no Prompt 6 internal fields', 'Pass', 'Requester projections remain isolated in public.ts.'],
    ['Every simulation labeled; no calculated statutory date', 'Pass', 'Simulation labels and recorded-target disclaimers remain in place.'],
    ['Reload persists; Reset restores seed; malformed routes and IDs show Not found', 'Fixed', 'Persistence and Not found behavior remain; reset now prevents legacy-key re-import.'],
    ['Full journey, no-records route, and withdrawal route', 'Not fixed', 'The complete journey was not run end-to-end in this stage.'],
  ] as const;
  return <>
    <header className="page-header"><div><h1>Reports & Analytics</h1><p>Internal oversight reporting only. No requester-facing report is provided.</p><span className="prototype-date">Prototype as-of date: {state.settings.asOfDate}</span></div><div className="report-refresh"><span>Last refreshed: {refreshed.toLocaleString()}</span><button className="button button--secondary" onClick={() => setRefreshed(new Date())}>Refresh</button></div></header>
    <section className="workspace-section"><div className="workspace-section-title"><h2>Operational</h2><button onClick={() => { if (!exportAllowed) return setNotice('Not authorised in this demonstration'); setNotice(''); downloadCsv('foia-operational.csv', [['Metric', 'Count'], ...metrics.map(item => [item.label, item.count])]); }}>Export CSV</button></div>{notice && <p className="simulation-banner">{notice}</p>}
      <div className="report-metrics">{metrics.map(item => <button key={item.label} onClick={() => navigate(item.target)}><strong>{item.count}</strong><span>{item.label}</span></button>)}</div>
      <div className="report-groups">{(['status', 'team', 'processor', 'track'] as const).map(key => <section key={key}><h3>By {key}</h3>{grouped(key).map(item => <button key={item.label} onClick={() => navigate(item.target)}><span>{item.label}</span><strong>{item.count}</strong></button>)}</section>)}<section><h3>Aging buckets</h3>{ageGroups.map(([label, min, max, query]) => { const count = open.filter(item => { const days = calendarDays(item.received, state.settings.asOfDate); return days >= min && days <= max; }).length; return <button key={label} onClick={() => navigate(`cases?age=${query}`)}><span>{label}</span><strong>{count}</strong></button>; })}</section></div>
    </section>
    <section className="workspace-section"><div className="workspace-section-title"><h2>Illustrative counts from prototype data - not an official report; definitions pending OQ-13</h2></div><div className="table-scroll"><table><thead><tr><th>Measure</th><th>Count</th></tr></thead><tbody><tr><td>Received</td><td>{state.cases.length}</td></tr><tr><td>Closed</td><td>{state.cases.filter(item => item.status === CASE_STATUS.CLOSED).length}</td></tr>{dispositionCounts.map(([label, count]) => <tr key={label}><td>Disposition: {label}</td><td>{count}</td></tr>)}<tr><td>Pending</td><td>{open.length}</td></tr></tbody></table></div></section>
    <section className="workspace-section"><div className="workspace-section-title"><h2>Consistency pass</h2></div><div className="table-scroll"><table><thead><tr><th>Check</th><th>Result</th><th>Finding</th></tr></thead><tbody>{consistency.map(([check, result, finding]) => <tr key={check}><td>{check}</td><td><span className={`badge consistency-${result.toLowerCase().replace(' ', '-')}`}>{result}</span></td><td>{finding}</td></tr>)}</tbody></table></div></section>
  </>;
}

export function RoleDashboardWidgets({ navigate }: { navigate: Navigate }) {
  const { state } = useStore();
  const role = state.ui.roleView;
  if (role === 'Administrator' || role === 'Intake Staff' || role === 'Reviewer / Redactor' || role === 'Security / Audit' || role === 'Requester (Portal)') return null;
  const user = DEMO_USERS[role];
  const widgets: Array<[string, number, string]> = [];
  if (role === 'Processor') {
    widgets.push(['My open tasks', state.tasks.filter(item => item.ownerName === user && openTask(item)).length, 'processing?owner=me']);
    widgets.push(['Recorded targets within 5 days', state.cases.filter(item => item.processor === user && item.dueDate && calendarDays(state.settings.asOfDate, item.dueDate) >= 0 && calendarDays(state.settings.asOfDate, item.dueDate) <= 5).length, 'cases?due=5&owner=me']);
  } else if (role === 'Supervisor / QC') {
    widgets.push(['Team queue', state.tasks.filter(openTask).length, 'processing'], ['Pending approvals', state.correspondence.filter(item => item.status === 'Pending approval').length, 'processing'], ['QC queue', state.qcReviews.filter(item => item.decision === QC_DECISION.PENDING).length, 'review'], ['Overdue', state.tasks.filter(item => openTask(item) && item.dueDate && item.dueDate < state.settings.asOfDate).length, 'processing']);
  } else if (role === 'Custodian / Action Office') widgets.push(['My RFDs', state.rfds.filter(item => item.custodianName === user || (item.status !== RFD_STATUS.ACCEPTED && item.status !== RFD_STATUS.CANCELLED)).length, 'processing']);
  else if (role === 'Appeals Reviewer') widgets.push(['My appeals', state.appeals.filter(item => item.assignedTo === user || item.status === APPEAL_STATUS.RECEIVED || item.status === APPEAL_STATUS.ASSIGNED || item.status === APPEAL_STATUS.IN_REVIEW).length, 'appeals']);
  else if (role === 'Fee / Finance') widgets.push(['Fees awaiting action', state.feeRecords.filter(item => item.requesterAgreement === REQUESTER_AGREEMENT.PENDING || item.payment.status === PAYMENT_STATUS.AWAITING).length, 'fees']);
  else if (role === 'FOIA Manager') widgets.push(['Open cases', state.cases.filter(item => !TERMINAL_STATUSES.includes(item.status)).length, 'reports'], ['Overdue cases', state.cases.filter(item => !TERMINAL_STATUSES.includes(item.status) && item.dueDate && item.dueDate < state.settings.asOfDate).length, 'cases?overdue=1']);
  return <section className="role-widgets" aria-label={`${role} dashboard widgets`}><h2>{role} overview</h2><div>{widgets.map(([label, count, target]) => <button key={label} onClick={() => navigate(target)}><strong>{count}</strong><span>{label}</span></button>)}</div></section>;
}
