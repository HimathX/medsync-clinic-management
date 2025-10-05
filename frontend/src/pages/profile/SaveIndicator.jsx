export default function SaveIndicator({ state }) {
  return (
    <div className={`save-indicator ${state}`}>
      {state === 'saving' && 'Saving...'}
      {state === 'saved' && 'All changes saved'}
      {state === 'error' && 'Failed to save'}
    </div>
  )
}


