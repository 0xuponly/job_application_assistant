interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
}

export default function Modal({ open, title, onClose, children, actions }: Props) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          {actions && <div className="modal-actions">{actions}</div>}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
