const StatCard = ({ title, value, subtitle, icon: Icon, tone = "indigo" }) => {
  const toneStyles = {
    indigo: {
      icon: "bg-indigo-100 text-indigo-700",
      accent:
        "from-indigo-500/35 to-blue-500/35 dark:from-indigo-400/80 dark:to-blue-400/80",
    },
    blue: {
      icon: "bg-blue-100 text-blue-700",
      accent:
        "from-blue-500/35 to-sky-500/35 dark:from-blue-400/80 dark:to-sky-400/80",
    },
    emerald: {
      icon: "bg-emerald-100 text-emerald-700",
      accent:
        "from-emerald-500/35 to-green-500/35 dark:from-emerald-400/80 dark:to-green-400/80",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
      accent:
        "from-amber-500/35 to-yellow-500/35 dark:from-amber-400/80 dark:to-yellow-400/80",
    },
    rose: {
      icon: "bg-rose-100 text-rose-700",
      accent:
        "from-rose-500/35 to-pink-500/35 dark:from-rose-400/80 dark:to-pink-400/80",
    },
  };

  const currentTone = toneStyles[tone] || toneStyles.indigo;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${currentTone.accent}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-200">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`rounded-xl p-2.5 ${currentTone.icon} dark:bg-slate-800 dark:text-indigo-300`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
