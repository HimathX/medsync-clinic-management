export default function FormSection({ title, description, right, children }) {
  return (
    <section className="form-section">
      <header>
        <div>
          <h3>{title}</h3>
          {description ? <p className="muted">{description}</p> : null}
        </div>
        <div>{right}</div>
      </header>
      <div className="section-body">{children}</div>
    </section>
  )
}


