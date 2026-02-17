"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Send,
  BookMarked,
  Calculator,
  Landmark,
  FileCheck,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Hesap Planı", icon: BookOpen },
  { href: "/journal", label: "Yevmiye / Fişler", icon: FileText },
  { href: "/contacts", label: "Cari Hesaplar", icon: Users },
  { href: "/invoices", label: "Faturalar", icon: Receipt },
  { href: "/e-invoice", label: "E-Fatura / E-Arşiv", icon: Send },
  { href: "/e-ledger", label: "E-Defter", icon: BookMarked },
  { href: "/tax-declarations", label: "Beyannameler", icon: Calculator },
  { href: "/bank", label: "Banka", icon: Landmark },
  { href: "/checks", label: "Çek / Senet", icon: FileCheck },
  { href: "/cash", label: "Kasa", icon: Wallet },
  { href: "/recurring", label: "Tekrarlayan", icon: RefreshCw },
  { href: "/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!collapsed && (
          <Link href="/" className="text-xl font-bold text-primary">
            FinBooks
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-3">
        {!collapsed && user && (
          <div className="mb-2 px-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? "Çıkış Yap" : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
