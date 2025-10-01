export default function BranchSelector({ value, onChange }) {
  return (
    <label className="input-field">
      <span className="float-label">Branch</span>
      <select className="input" value={value} onChange={(e) => onChange && onChange(e.target.value)}>
        <option>Colombo</option>
        <option>Kandy</option>
        <option>Galle</option>
      </select>
    </label>
  )
}



