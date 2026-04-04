// import { Bell, Menu } from "lucide-react";
// import { useMemo } from "react";
// import { useLocation } from "react-router-dom";
// import useNotificationStore from "../../store/notificationStore";

// const routeMeta = [
//   {
//     match: (pathname) => pathname.startsWith("/admin/dashboard"),
//     eyebrow: "Dashboard",
//     title: "Admin Overview",
//     subtitle: "Manage and track complaints",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/operator/dashboard"),
//     eyebrow: "Dashboard",
//     title: "Operator Overview",
//     subtitle: "Clean view of your queue, progress, and SLA pressure.",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/citizen/dashboard"),
//     eyebrow: "Dashboard",
//     title: "Citizen Overview",
//     subtitle: "Track complaint progress and recent updates.",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/admin/pending-complaints"),
//     eyebrow: "Complaints",
//     title: "Complaint Queue",
//     subtitle: "View all complaints, filter by status, and assign pending ones.",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/admin/users"),
//     eyebrow: "Users",
//     title: "User Management",
//     subtitle: "View users, update status, and manage contractor coverage.",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/admin/add-operator"),
//     eyebrow: "Contractors",
//     title: "Add Contractor",
//     subtitle: "Create a contractor account and assign operating areas.",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/admin/activity-logs"),
//     eyebrow: "Activity",
//     title: "Activity Logs",
//     subtitle: "Review admin actions and system change history.",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/operator/complaints"),
//     eyebrow: "Complaints",
//     title: "My Complaints",
//     subtitle: "Monitor assigned complaints and take action quickly.",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/operator/profile"),
//     eyebrow: "Profile",
//     title: "Operator Profile",
//     subtitle: "Check your profile, workload, and performance summary.",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/citizen/my-requests"),
//     eyebrow: "Complaints",
//     title: "My Complaints",
//     subtitle: "Check current status and history of your complaints.",
//   },
//   {
//     match: (pathname) => pathname.startsWith("/citizen/create-request"),
//     eyebrow: "Create",
//     title: "Register Complaint",
//     subtitle: "Share the issue details and upload a supporting image.",
//   },
// ];

// export const TopUtilityBar = ({ onOpenSidebar, sidebarOpen = false }) => {
//   const location = useLocation();
//   const notifications = useNotificationStore((state) => state.notifications);
//   const togglePanel = useNotificationStore((state) => state.togglePanel);
//   const unreadCount = notifications.filter((item) => !item.read).length;

//   const meta = useMemo(
//     () =>
//       routeMeta.find((item) => item.match(location.pathname)) || {
//         eyebrow: "Dashboard",
//         title: "Smart City Complaint System",
//         subtitle: "Stay updated with complaint activity.",
//       },
//     [location.pathname],
//   );

//   return (
//     <div className="relative mb-5">
//       {typeof onOpenSidebar === "function" ? (
//         <div className="sticky top-3 z-[120] mb-3 lg:hidden">
//           <button
//             type="button"
//             onClick={onOpenSidebar}
//             className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-[0.96] dark:bg-indigo-500 dark:hover:bg-indigo-400 ${
//               sidebarOpen ? "invisible pointer-events-none opacity-0" : ""
//             }`}
//             aria-label="Open menu"
//           >
//             <Menu size={18} />
//           </button>
//         </div>
//       ) : null}
//       <div className="flex items-start justify-between gap-4 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/30 md:px-5 md:py-5">
//         <div className="min-w-0">
//           <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
//             {meta.eyebrow}
//           </span>
//           <h1 className="text-2xl font-bold text-neutral-900 dark:text-slate-200">
//             {meta.title}
//           </h1>
//           <p className="text-sm text-neutral-600 dark:text-slate-400">
//             {meta.subtitle}
//           </p>
//         </div>
//         <div className="flex shrink-0 items-center">
//           <button
//             type="button"
//             onClick={togglePanel}
//             className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
//             aria-label="Notifications"
//           >
//             <Bell size={16} />
//             {unreadCount > 0 ? (
//               <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
//                 {unreadCount > 9 ? "9+" : unreadCount}
//               </span>
//             ) : null}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TopUtilityBar;

import { Bell, Menu } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useNotificationStore from "../../store/notificationStore";

const routeMeta = [
  {
    match: (pathname) => pathname.startsWith("/admin/dashboard"),
    eyebrow: "Dashboard",
    title: "Admin Overview",
    subtitle: "Manage and track complaints",
  },
  {
    match: (pathname) => pathname.startsWith("/operator/dashboard"),
    eyebrow: "Dashboard",
    title: "Operator Overview",
    subtitle: "Clean view of your queue, progress, and SLA pressure.",
  },
  {
    match: (pathname) => pathname.startsWith("/citizen/dashboard"),
    eyebrow: "Dashboard",
    title: "Citizen Overview",
    subtitle: "Track complaint progress and recent updates.",
  },
  {
    match: (pathname) => pathname.startsWith("/admin/pending-complaints"),
    eyebrow: "Complaints",
    title: "Complaint Queue",
    subtitle: "View all complaints, filter by status, and assign pending ones.",
  },
  {
    match: (pathname) => pathname.startsWith("/admin/users"),
    eyebrow: "Users",
    title: "User Management",
    subtitle: "View users, update status, and manage contractor coverage.",
  },
  {
    match: (pathname) => pathname.startsWith("/admin/add-operator"),
    eyebrow: "Contractors",
    title: "Add Contractor",
    subtitle: "Create a contractor account and assign operating areas.",
  },
  {
    match: (pathname) => pathname.startsWith("/admin/activity-logs"),
    eyebrow: "Activity",
    title: "Activity Logs",
    subtitle: "Review admin actions and system change history.",
  },
  {
    match: (pathname) => pathname.startsWith("/operator/complaints"),
    eyebrow: "Complaints",
    title: "My Complaints",
    subtitle: "Monitor assigned complaints and take action quickly.",
  },
  {
    match: (pathname) => pathname.startsWith("/operator/profile"),
    eyebrow: "Profile",
    title: "Operator Profile",
    subtitle: "Check your profile, workload, and performance summary.",
  },
  {
    match: (pathname) => pathname.startsWith("/citizen/my-requests"),
    eyebrow: "Complaints",
    title: "My Complaints",
    subtitle: "Check current status and history of your complaints.",
  },
  {
    match: (pathname) => pathname.startsWith("/citizen/create-request"),
    eyebrow: "Create",
    title: "Register Complaint",
    subtitle: "Share the issue details and upload a supporting image.",
  },
];

export const TopUtilityBar = ({ onOpenSidebar, sidebarOpen = false }) => {
  const location = useLocation();
  const notifications = useNotificationStore((state) => state.notifications);
  const togglePanel = useNotificationStore((state) => state.togglePanel);
  const unreadCount = notifications.filter((item) => !item.read).length;

  // 🔥 SCROLL STATE
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const meta = useMemo(
    () =>
      routeMeta.find((item) => item.match(location.pathname)) || {
        eyebrow: "Dashboard",
        title: "Smart City Complaint System",
        subtitle: "Stay updated with complaint activity.",
      },
    [location.pathname],
  );

  return (
    <>
      {/* 🔥 MENU BUTTON (SCROLL → FLOAT) */}
      {typeof onOpenSidebar === "function" && (
        <div
          className={`transition-all duration-300 ${
            isScrolled ? "fixed top-4 left-4 z-[999]" : "relative mb-3"
          } lg:hidden`}
        >
          <button
            type="button"
            onClick={onOpenSidebar}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-95 ${
              sidebarOpen ? "invisible opacity-0 pointer-events-none" : ""
            }`}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>
      )}

      {/* 🔹 TOP BAR */}
      <div className="relative mb-5">
        <div className="flex items-start justify-between gap-4 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/30 md:px-5 md:py-5">
          {/* LEFT CONTENT */}
          <div className="min-w-0">
            <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {meta.eyebrow}
            </span>

            <h1 className="text-2xl font-bold text-neutral-900 dark:text-slate-200">
              {meta.title}
            </h1>

            <p className="text-sm text-neutral-600 dark:text-slate-400">
              {meta.subtitle}
            </p>
          </div>

          {/* RIGHT ICON */}
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={togglePanel}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Notifications"
            >
              <Bell size={16} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopUtilityBar;
