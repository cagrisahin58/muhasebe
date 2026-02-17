"use client";

import { useAuthStore } from "@/stores/auth";
import { Bell, Building2 } from "lucide-react";

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 size={16} />
        <span>{user?.tenantId ? "Demo Şirket A.Ş." : "FinBooks"}</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-md hover:bg-muted transition-colors relative">
          <Bell size={20} className="text-muted-foreground" />
        </button>
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {user?.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}
