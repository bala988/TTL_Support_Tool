const colorStyles = {
  blue: {
    iconBg: "bg-blue-50",
    iconFg: "text-blue-600",
  },
  orange: {
    iconBg: "bg-orange-50",
    iconFg: "text-orange-600",
  },
  green: {
    iconBg: "bg-emerald-50",
    iconFg: "text-emerald-600",
  },
  red: {
    iconBg: "bg-red-50",
    iconFg: "text-red-600",
  },
};

export function StatsCard({ icon: Icon, title, value, color, subtitle, trend }) {
  const colors = colorStyles[color] ?? colorStyles.blue;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
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
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {trend && (
          <p
            className={`text-xs font-medium ${
              trend.isPositive ? "text-emerald-600" : "text-red-600"
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
