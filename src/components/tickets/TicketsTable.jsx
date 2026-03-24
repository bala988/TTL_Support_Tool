import { useEffect, useState } from "react";
import { getTimestamp, formatDuration } from "../../utils/time";

export function TicketsTable({ tickets, onTicketClick, actionLabel = "View", onActionClick, itemsPerPage = 20 }) {
  // Live refresh every second to keep timers updated
  const [tick, setTick] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch per-ticket details to match timers with TicketDetailsView exactly
  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;
  const [detailsMap, setDetailsMap] = useState({});
  useEffect(() => {
    const missing = tickets.filter(t => !detailsMap[t.id]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        missing.map(async (t) => {
          try {
            const res = await fetch(`${API_URL}/api/tickets/${t.id}`);
            const data = await res.json();
            if (res.ok && data && data.ticket) {
              return [t.id, data];
            }
          } catch (_) {}
          return null;
        })
      );
      if (cancelled) return;
      setDetailsMap(prev => {
        const next = { ...prev };
        results.forEach(pair => { if (pair) next[pair[0]] = pair[1]; });
        return next;
      });
    })();
    return () => { cancelled = true; };
    // Intentionally not depending on detailsMap to avoid refetch loop
  }, [tickets, API_URL]);

  const parseTimeline = (tl) => {
    if (!tl) return [];
    if (Array.isArray(tl)) return tl;
    try {
      return JSON.parse(tl);
    } catch {
      return [];
    }
  };

  

  const computeDurations = (t) => {
    const now = Date.now();

    // Prefer details endpoint data if available (exactly what details view uses)
    const detail = detailsMap[t.id];
    const openDateStr = detail?.ticket?.open_date ?? (t.open_date || t.openDate);
    const closeDateStr = detail?.ticket?.close_date ?? (t.close_date || t.closeDate);
    const tl = detail?.ticket?.timeline !== undefined
      ? parseTimeline(detail.ticket.timeline)
      : parseTimeline(t.timeline);

    const openTime = getTimestamp(openDateStr);
    const closeTime = getTimestamp(closeDateStr) || null;
    const endForOpen = closeTime && closeTime > 0 ? closeTime : now;
    const openDurationMs = openTime > 0 ? Math.max(0, endForOpen - openTime) : 0;

    let pendingCustomerMs = 0;
    let pendingTutelarMs = 0;
    let lastPendingCustomerStart = null;
    let lastInProgressStart = null;
    const sorted = [...tl].sort((a, b) => getTimestamp(a.date) - getTimestamp(b.date));
    sorted.forEach((entry) => {
      const ts = getTimestamp(entry.date);
      if (ts === 0) return;
      const ev = String(entry.event || "");
      if (ev.includes("Status changed to Pending from Customer")) {
        lastPendingCustomerStart = ts;
      } else if (ev.includes("Status changed to In Progress")) {
        lastInProgressStart = ts;
        // Leaving other statuses closes any open pending-customer window
        if (lastPendingCustomerStart) {
          pendingCustomerMs += ts - lastPendingCustomerStart;
          lastPendingCustomerStart = null;
        }
      } else if (ev.includes("Status changed to")) {
        if (lastPendingCustomerStart) {
          pendingCustomerMs += ts - lastPendingCustomerStart;
          lastPendingCustomerStart = null;
        }
        if (lastInProgressStart) {
          pendingTutelarMs += ts - lastInProgressStart;
          lastInProgressStart = null;
        }
      }
    });
    const currentEnd = closeTime && closeTime > 0 ? closeTime : now;
    // Add any open pending segment from the timeline
    if (lastPendingCustomerStart) {
      pendingCustomerMs += currentEnd - lastPendingCustomerStart;
    }
    // If ticket is currently Pending from Customer but the list endpoint provided no timeline at all,
    // approximate start at open time so the table shows a live timer consistent with the details view.
    if (String(t.status) === 'Pending from Customer' && (!tl || tl.length === 0)) {
      if (openTime > 0) {
        pendingCustomerMs += Math.max(0, currentEnd - openTime);
      }
    }
    if (lastInProgressStart) {
      pendingTutelarMs += currentEnd - lastInProgressStart;
    }
    const resolutionMs = closeTime && openTime > 0 ? Math.max(0, closeTime - openTime) : 0;
    const pendingHasValue = pendingCustomerMs > 0 || String(t.status) === 'Pending from Customer';
    return {
      openMs: openDurationMs,
      open: formatDuration(openDurationMs),
      pendingCustomerMs,
      pendingCustomer: pendingHasValue ? formatDuration(pendingCustomerMs) : 'N/A',
      pendingHasValue,
      resolutionMs,
      resolution: resolutionMs > 0 ? formatDuration(resolutionMs) : 'Not yet resolved',
    };
  };

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

  // Pagination
  const totalPages = Math.max(1, Math.ceil((tickets?.length || 0) / itemsPerPage));
  const clampedPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const pageTickets = (tickets || []).slice(startIndex, startIndex + itemsPerPage);

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
                Subject
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Open Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Open Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Pending Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Resolution Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Product
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
            {pageTickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="hover:bg-gray-50 dark:hover:bg-servicenow-dark cursor-pointer transition-colors"
                onClick={() => onTicketClick(ticket.id)}
              >
                {(() => { const _d = computeDurations(ticket); return (
                <>
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
                  <span title={(ticket.issue_description || '').trim()}>
                    {ticket.issue_subject || ticket.issueSubject || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.customer}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.openDate}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                    {_d.open}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    _d.pendingHasValue
                      ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                      : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}>
                    {_d.pendingHasValue ? _d.pendingCustomer : 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    String(ticket.status) === 'Closed'
                      ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}>
                    {String(ticket.status) === 'Closed' ? _d.resolution : 'Not yet resolved'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.type || ticket.ticket_type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.product}
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
                </>
                ); })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between p-4 border-t dark:border-slate-700">
        <div className="text-sm text-gray-500 dark:text-slate-400">
          Page {clampedPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={clampedPage <= 1}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-slate-600 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setCurrentPage(n)}
              className={`px-3 py-1 text-sm rounded-md border ${n === clampedPage
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300'}`
              }
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={clampedPage >= totalPages}
            className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-slate-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
