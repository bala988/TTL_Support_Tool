export function TicketsTable({ tickets, onTicketClick, actionLabel = "View", onActionClick }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900'
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900'
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900'
      case 'In Progress':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-900'
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
    }
  }

  return (
    <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-servicenow-dark border-b border-gray-200 dark:border-servicenow-dark">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Ticket ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Open Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="hover:bg-gray-50 dark:hover:bg-servicenow-dark cursor-pointer transition-colors"
                onClick={() => onTicketClick(ticket.id)}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {ticket.ticket_number || ticket.id}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getSeverityColor(ticket.severity)}`}
                  >
                    {ticket.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.customer}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.product}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.openDate}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onActionClick) {
                        onActionClick(ticket.id);
                      } else {
                        onTicketClick(ticket.id);
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                  >
                    {typeof actionLabel === 'function' ? actionLabel(ticket) : actionLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
