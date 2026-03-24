import { useEffect, useState } from "react";

export function TicketsTable({ tickets, onTicketClick, actionLabel = "View", onActionClick }) {
  // Live refresh every second to keep timers updated
  const [tick, setTick] = useState(0);
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

  const getTimestamp = (dateStr) => {
    if (!dateStr) return 0;
    if (dateStr instanceof Date) {
      const t = dateStr.getTime();
      return isNaN(t) ? 0 : t;
    }
    if (typeof dateStr === 'number') {
      return dateStr;
    }
    const s = String(dateStr).trim();
    // ISO format: 2026-03-20T10:00:00.000Z
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    // MySQL DATETIME: 2026-03-20 10:00:00 (treat as UTC to avoid tz drift)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      const d = new Date(s.replace(' ', 'T') + 'Z');
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    // Locale: MM/DD/YYYY, HH:MM(:SS)? AM/PM
    const localeMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (localeMatch) {
      const mm = parseInt(localeMatch[1], 10) - 1;
      const dd = parseInt(localeMatch[2], 10);
      const yyyy = parseInt(localeMatch[3], 10);
      let hh = parseInt(localeMatch[4], 10);
      const min = parseInt(localeMatch[5], 10);
      const sec = localeMatch[6] ? parseInt(localeMatch[6], 10) : 0;
      const ampm = localeMatch[7].toUpperCase();
      if (ampm === 'PM' && hh < 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
      const d = new Date(yyyy, mm, dd, hh, min, sec);
      const t = d.getTime();
      return isNaN(t) ? 0 : t;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const formatDuration = (ms) => {
    if (ms <= 0) return "0s";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
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
                Open Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Pending Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Resolution Time
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
                  {ticket.type || ticket.ticket_type}
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
    </div>
  )
}
