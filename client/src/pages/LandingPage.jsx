import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Lightbulb,
  MapPinned,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const categories = [
  { label: "Roads", icon: Wrench },
  { label: "Water Supply", icon: Droplets },
  { label: "Electricity", icon: Lightbulb },
  { label: "Garbage", icon: Trash2 },
  { label: "Public Property Damage", icon: Building2 },
  { label: "Other", icon: AlertTriangle },
];

const stats = [
  { label: "Total Complaints", value: "12,480" },
  { label: "Resolved", value: "10,912" },
  { label: "In Progress", value: "1,138" },
  { label: "Pending", value: "430" },
];

export const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b1220] dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#020617]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-700 text-white">
              <MapPinned size={16} />
            </span>
            City Resource CMS
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {isDark ? "Light" : "Dark"}
            </button>
            <Link
              to="/login"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-800"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,58,138,0.14),rgba(15,118,110,0.06))] dark:bg-[linear-gradient(180deg,rgba(30,58,138,0.24),rgba(15,118,110,0.10))]" />
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24 lg:px-8">
            <div className="relative">
              <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                Smart Governance
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Report & Track City Issues Seamlessly
              </h1>
              <p className="mt-4 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                A modern complaint lifecycle platform for citizens, operators,
                and city administrators.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
                >
                  Report a Complaint
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Track Status
                </Link>
              </div>
            </div>
            <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
              <p className="text-sm font-semibold">How It Works</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    1. Report
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Submit complaint with location and evidence.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    2. Assigned
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Auto/manual assignment to area operator.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    3. Resolved
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Track timeline till verified resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Complaint Categories</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/30"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  <item.icon size={17} />
                </div>
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-[#020617]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold">Real-Time Stats</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Trusted City Operations Platform</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#020617]">
              <ShieldCheck className="text-emerald-600 dark:text-emerald-400" />
              <p className="mt-3 text-sm font-semibold">Secure & Auditable</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                End-to-end role-based access and action logs.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#020617]">
              <ClipboardList className="text-emerald-600 dark:text-emerald-400" />
              <p className="mt-3 text-sm font-semibold">Lifecycle Visibility</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Clear complaint status from report to resolution.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#020617]">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
              <p className="mt-3 text-sm font-semibold">Operationally Efficient</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Faster assignment and improved SLA adherence.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-[#020617]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-sm text-slate-600 dark:text-slate-300 sm:px-6 lg:px-8">
          <p>City Helpline: 1800-123-000 | Emergency: 112</p>
          <p>Contact: support@city.gov | Municipal Command Center</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
