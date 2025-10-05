import styles from './SearchBar.module.css'

export default function SearchBar({ value, onChange }) {
  return (
    <div className={styles.wrapper}>
      <input className={styles.input} placeholder="Search appointments" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}


