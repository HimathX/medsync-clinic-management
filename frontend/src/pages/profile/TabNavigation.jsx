export default function TabNavigation({ tabs, activeKey, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`tab ${activeKey === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
      <div className="tab-underline" style={{ '--index': tabs.findIndex(x => x.key === activeKey) }} />
    </div>
  )
}


