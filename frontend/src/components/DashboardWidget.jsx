export default function DashboardWidget({ title, className = '', children }) {
  return (
    <section className={`widget ${className}`}>
      <header className="widget-header">
        <h2>{title}</h2>
      </header>
      <div className="widget-body">
        {children}
      </div>
    </section>
  )
}


