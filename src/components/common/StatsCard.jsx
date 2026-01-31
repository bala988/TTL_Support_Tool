const colorStyles = {
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconFg: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    iconBg: "bg-orange-50 dark:bg-orange-900/30",
    iconFg: "text-orange-600 dark:text-orange-400",
  },
  green: {
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    iconFg: "text-emerald-600 dark:text-emerald-400",
  },
  red: {
    iconBg: "bg-red-50 dark:bg-red-900/30",
    iconFg: "text-red-600 dark:text-red-400",
  },
};

export function StatsCard({ icon: Icon, title, value, color, subtitle, trend }) {
  const colors = colorStyles[color] ?? colorStyles.blue;

  return (
    <div className="rounded-2xl bg-white dark:bg-servicenow-light p-5 shadow-sm border border-slate-100 dark:border-servicenow-dark flex flex-col gap-3 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.iconBg}`}
            >
              <Icon className={`w-5 h-5 ${colors.iconFg}`} />
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
        {trend && (
          <p
            className={`text-xs font-medium ${
              trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
