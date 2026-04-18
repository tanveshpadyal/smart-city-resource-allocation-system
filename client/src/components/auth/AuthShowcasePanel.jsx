import authIllustration from "../../assets/login/login.png";

export const AuthShowcasePanel = () => {
  return (
    <div className="relative min-h-[220px] overflow-hidden bg-[linear-gradient(160deg,#0f172a_0%,#1e293b_52%,#2563eb_100%)] md:min-h-full">
      <div className="absolute -right-8 top-6 h-28 w-28 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-6 p-6 text-white md:p-8">
        <div className="max-w-md">
          <span className="inline-flex rounded-full border border-white/15 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-100/90">
            Smart City Assistant
          </span>
          <h2 className="mt-4 text-2xl font-semibold leading-tight md:text-3xl">
            One platform to register, track, and resolve civic complaints.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-100/80 md:text-base">
            Stay connected to complaint progress, operator actions, and admin
            oversight with a clear, secure workflow.
          </p>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-3 text-sm text-slate-100/80">
            <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
              Live complaint tracking for citizens
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm">
              Faster assignments and field updates
            </div>
          </div>

          <img
            src={authIllustration}
            alt="Smart city complaint workflow illustration"
            className="mx-auto w-full max-w-[260px] object-contain drop-shadow-2xl sm:mx-0 md:max-w-[300px]"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthShowcasePanel;
