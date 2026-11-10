import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { DEMO_USERS, RFD_STATUS, RfdStatus, TASK_STATUS, TERMINAL_STATUSES, openTask } from '../types';

const segments = ['My Tasks', 'Team Queue', 'Overdue', 'Awaiting Custodians', 'On Hold'] as const;

export default function ProcessingWorklist({ onOpen, initialSegment }: { onOpen: (caseId: string, tab: string) => void; initialSegment?: string }) {
  const { state } = useStore();
  const [segment, setSegment] = useState<(typeof segments)[number]>(segments.includes(initialSegment as (typeof segments)[number]) ? initialSegment as (typeof segments)[number] : 'My Tasks');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  useEffect(() => {
    if (segments.includes(initialSegment as (typeof segments)[number])) setSegment(initialSegment as (typeof segments)[number]);
  }, [initialSegment]);
  const user = DEMO_USERS[state.ui.roleView];
  const myTasks = state.tasks.filter(task => openTask(task) && (state.ui.roleView === 'Administrator' || task.ownerName === user));
  const rows = segment === 'My Tasks' ? myTasks.map(task => ({ id: task.id, caseId: task.caseId, item: task.title, owner: task.ownerName, status: task.status, target: task.dueDate || 'Not established' }))
    : segment === 'Team Queue' ? state.cases.filter(record => !TERMINAL_STATUSES.includes(record.status)).map(record => ({ id: record.id, caseId: record.id, item: record.title, owner: record.processor, status: record.status, target: record.dueDate || 'Not established' }))
    : segment === 'Overdue' ? state.tasks.filter(task => openTask(task) && task.dueDate && task.dueDate < state.settings.asOfDate).map(task => ({ id: task.id, caseId: task.caseId, item: task.title, owner: task.ownerName, status: task.status, target: task.dueDate! }))
    : segment === 'Awaiting Custodians' ? state.rfds.filter(rfd => ([RFD_STATUS.SENT, RFD_STATUS.FOLLOW_UP] as RfdStatus[]).includes(rfd.status)).map(rfd => ({ id: rfd.id, caseId: rfd.caseId, item: rfd.office, owner: rfd.custodianName, status: rfd.status, target: rfd.dueDate }))
    : state.cases.filter(record => record.clock.state === 'Hold recorded').map(record => ({ id: record.id, caseId: record.id, item: record.title, owner: record.processor, status: record.clock.state, target: record.clock.holdSince || 'Not established' }));
  const filteredRows = rows.filter(row => statusFilter === 'All statuses' || row.status === statusFilter);
  const badgeClass = (value: string) => `status-${value.toLowerCase().replaceAll(' ', '-').replace('–', '-')}`;
  return <>
    <header className="page-header"><div><h1>Processing & Work</h1><p>Cross-case work queues for the active prototype role.</p><span className="prototype-date">Prototype date: {state.settings.asOfDate}</span></div></header>
    <div className="segment-control">{segments.map(item => <button key={item} className={segment === item ? 'active' : ''} onClick={() => setSegment(item)}>{item}</button>)}</div>
    <div className="worklist-status-filter"><label>Task status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>All statuses</option>{Object.values(TASK_STATUS).map(status => <option key={status}>{status}</option>)}</select></label></div>
    <section className="case-table-panel"><div className="table-scroll"><table className="management-table"><thead><tr><th>Case ID</th><th>Work item</th><th>Owner</th><th>Status</th><th>Recorded target</th></tr></thead><tbody>{filteredRows.map(row => <tr key={row.id}><td><button className="link" onClick={() => onOpen(row.caseId, 'processing')}>{row.caseId}</button></td><td>{row.item}</td><td>{row.owner}</td><td><span className={`badge ${badgeClass(row.status)}`}>{row.status}</span></td><td>{row.target}</td></tr>)}</tbody></table></div>{!filteredRows.length && <div className="table-empty"><strong>No work items</strong><span>This segment and status filter have no matching records.</span></div>}</section>
  </>;
}
