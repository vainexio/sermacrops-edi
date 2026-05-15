import { Link, useLocation } from "wouter";
import { useListNotifications } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  Users,
  Network,
  FileText,
  ShieldCheck,
  Languages,
  Bell,
  Settings2,
  Activity,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/partners", label: "Trading Partners", icon: Users },
  { href: "/endpoints", label: "Endpoints", icon: Network },
  { href: "/documents", label: "EDI Documents", icon: FileText },
  { href: "/validation", label: "Validation", icon: ShieldCheck },
  { href: "/translation-logs", label: "Translation Logs", icon: Languages },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/as2-settings", label: "AS2 Settings", icon: Settings2 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: notifications } = useListNotifications({ unreadOnly: true });
  const unreadCount = notifications?.length ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-sidebar-foreground tracking-wide uppercase leading-tight">SERMACROPS</div>
              <div className="text-[10px] text-sidebar-foreground/50 tracking-wider uppercase">EDI Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors relative group",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {label === "Notifications" && unreadCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider">v1.0.0 — ANSI X12</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
