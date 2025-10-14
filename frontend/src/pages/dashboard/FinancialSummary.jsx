
export default function FinancialSummary({ balance = 0, payments = [] }) {
  const paidLast = payments[0]
  const risk = balance <= 0 ? 'completed' : balance < 200 ? 'scheduled' : 'overdue'
  return (
    <div className="stack-3">
      <div className="stat-row">
        <div>
          <div className="stat-label">Outstanding Balance</div>
          <div className={`stat-value badge-${risk}`}>${balance.toFixed(2)}</div>
        </div>
        <div>
          <div className="stat-label">Most Recent Payment</div>
          <div className="stat-value">{paidLast ? `$${paidLast.amount} on ${paidLast.date}` : '—'}</div>
        </div>
      </div>
    </div>
  )
}



