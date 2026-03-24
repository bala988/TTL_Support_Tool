
export const getTimestamp = (dateStr) => {
    if (!dateStr) return 0;
    if (dateStr instanceof Date) {
      const t = dateStr.getTime();
      return isNaN(t) ? 0 : t;
    }
    if (typeof dateStr === 'number') {
      return dateStr;
    }
    const s = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      const d = new Date(s.replace(' ', 'T') + 'Z');
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
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

export const formatDuration = (ms) => {
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
