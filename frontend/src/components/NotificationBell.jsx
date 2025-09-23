export default function NotificationBell({ count = 0, onOpen }) {
  return (
    <button className="notif-bell" aria-label="Notifications" onClick={onOpen}>
      🔔
      {count > 0 && <span className="notif-dot" aria-hidden>{count}</span>}
    </button>
  )
}


