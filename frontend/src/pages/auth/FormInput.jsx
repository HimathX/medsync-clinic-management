export default function FormInput({ label, type = 'text', value, onChange, placeholder, error }) {
  return (
    <label className={`input-field ${error ? 'has-error' : ''}`}>
      <span className="float-label">{label}</span>
      <input className="input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange && onChange(e.target.value)} />
      {error && <span className="error-text">{error}</span>}
    </label>
  )
}


