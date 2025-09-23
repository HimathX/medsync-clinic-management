import { useState } from 'react'

const actions = [
  { id: 'book', label: 'Book Appointment' },
  { id: 'records', label: 'View Records' },
  { id: 'pay', label: 'Make Payment' },
  { id: 'emergency', label: 'Emergency' },
]

export default function QuickActions({ onAction }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  return (
    <>
      <div className="quick-actions">
        {actions.map(a => (
          <button key={a.id} className={`qa-btn qa-${a.id}`} onClick={() => { setSelected(a.id); setOpen(true); onAction && onAction(a.id) }}>{a.label}</button>
        ))}
      </div>
      {open && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{actions.find(a => a.id === selected)?.label}</h3>
            <p className="muted">This is a demo modal. Hook up real flows here.</p>
            <div className="actions-row">
              <button className="btn-outline" onClick={() => setOpen(false)}>Close</button>
              <button className="btn-primary" onClick={() => setOpen(false)}>Continue</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


