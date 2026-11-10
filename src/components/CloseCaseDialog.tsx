import { FormEvent, useState } from 'react';
import { CLOSURE_KIND, ClosureKind } from '../types';

export default function CloseCaseDialog({ onClose, onSubmit, initialKind = CLOSURE_KIND.WITHDRAWN }: { onClose: () => void; onSubmit: (kind: ClosureKind, reason: string) => void; initialKind?: ClosureKind }) {
  const [kind, setKind] = useState<ClosureKind>(initialKind);
  const [reason, setReason] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) return;
    onSubmit(kind, reason.trim());
  };
  return <div className="dialog-backdrop" role="presentation">
    <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="close-case-title">
      <h2 id="close-case-title">Request case closure</h2>
      <p>Closure requires Supervisor / QC approval. No release or QC step is created for these closure kinds.</p>
      <form onSubmit={submit}>
        <label>Closure kind<select value={kind} onChange={event => setKind(event.target.value as ClosureKind)}>
          <option>{CLOSURE_KIND.WITHDRAWN}</option><option>{CLOSURE_KIND.NO_RESPONSE}</option><option>{CLOSURE_KIND.FINAL_RESPONSE}</option>
        </select></label>
        <label>Reason<textarea value={reason} onChange={event => setReason(event.target.value)} required placeholder="Enter the documented reason"/></label>
        {kind === CLOSURE_KIND.NO_RESPONSE && <p className="policy-note">Policy pending</p>}
        <div><button type="button" className="button button--secondary" onClick={onClose}>Cancel</button><button className="button button--primary" disabled={!reason.trim()}>Submit for approval</button></div>
      </form>
    </section>
  </div>;
}
