"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, ChevronRight, ChevronDown, BookOpen } from "lucide-react";
import { ACCOUNT_GROUPS } from "@finbooks/shared";

// Demo hesap planı verisi (API entegrasyonu Faz 1 tamamlanınca aktif olacak)
const DEMO_ACCOUNTS = [
  { code: "1", name: "DÖNEN VARLIKLAR", type: "asset", level: 1, hasChildren: true },
  { code: "10", name: "Hazır Değerler", type: "asset", level: 2, hasChildren: true },
  { code: "100", name: "Kasa", type: "asset", level: 3, hasChildren: true },
  { code: "100.01", name: "TL Kasası", type: "asset", level: 4, hasChildren: false },
  { code: "100.02", name: "Döviz Kasası", type: "asset", level: 4, hasChildren: false },
  { code: "101", name: "Alınan Çekler", type: "asset", level: 3, hasChildren: false },
  { code: "102", name: "Bankalar", type: "asset", level: 3, hasChildren: true },
  { code: "102.01", name: "Vadesiz Mevduat - TL", type: "asset", level: 4, hasChildren: false },
  { code: "12", name: "Ticari Alacaklar", type: "asset", level: 2, hasChildren: true },
  { code: "120", name: "Alıcılar", type: "asset", level: 3, hasChildren: false },
  { code: "19", name: "Diğer Dönen Varlıklar", type: "asset", level: 2, hasChildren: true },
  { code: "190", name: "Devreden KDV", type: "asset", level: 3, hasChildren: false },
  { code: "191", name: "İndirilecek KDV", type: "asset", level: 3, hasChildren: false },
  { code: "3", name: "KISA VADELİ YABANCI KAYNAKLAR", type: "liability", level: 1, hasChildren: true },
  { code: "32", name: "Ticari Borçlar", type: "liability", level: 2, hasChildren: true },
  { code: "320", name: "Satıcılar", type: "liability", level: 3, hasChildren: false },
  { code: "391", name: "Hesaplanan KDV", type: "liability", level: 3, hasChildren: false },
  { code: "6", name: "GELİR TABLOSU HESAPLARI", type: "revenue", level: 1, hasChildren: true },
  { code: "600", name: "Yurtiçi Satışlar", type: "revenue", level: 3, hasChildren: false },
  { code: "7", name: "MALİYET HESAPLARI", type: "expense", level: 1, hasChildren: true },
  { code: "770", name: "Genel Yönetim Giderleri", type: "expense", level: 3, hasChildren: false },
];

const typeColors: Record<string, string> = {
  asset: "text-blue-600 bg-blue-50",
  liability: "text-red-600 bg-red-50",
  equity: "text-purple-600 bg-purple-50",
  revenue: "text-green-600 bg-green-50",
  expense: "text-orange-600 bg-orange-50",
};

const typeLabels: Record<string, string> = {
  asset: "Varlık",
  liability: "Yükümlülük",
  equity: "Özkaynak",
  revenue: "Gelir",
  expense: "Gider",
};

export default function AccountsPage() {
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["1", "10", "100"]));

  const toggleGroup = (code: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const filteredAccounts = search
    ? DEMO_ACCOUNTS.filter(
        (a) =>
          a.code.toLowerCase().includes(search.toLowerCase()) ||
          a.name.toLowerCase().includes(search.toLowerCase())
      )
    : DEMO_ACCOUNTS.filter((a) => {
        // Ağaç görünümünde sadece açık grupların çocuklarını göster
        if (a.level === 1) return true;
        // Parent'ın expanded olup olmadığını kontrol et
        const parentCode = a.code.includes(".")
          ? a.code.split(".").slice(0, -1).join(".")
          : a.code.slice(0, -1);
        return expandedGroups.has(parentCode) || expandedGroups.has(a.code.slice(0, 1));
      });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hesap Planı</h1>
          <p className="text-muted-foreground">Tekdüzen Hesap Planı yönetimi</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Yeni Hesap
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hesap kodu veya adı ile ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{DEMO_ACCOUNTS.length} hesap</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Hesap Kodu</TableHead>
                <TableHead>Hesap Adı</TableHead>
                <TableHead className="w-[120px]">Tip</TableHead>
                <TableHead className="w-[120px] text-right">Borç Bakiye</TableHead>
                <TableHead className="w-[120px] text-right">Alacak Bakiye</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow
                  key={account.code}
                  className={account.level <= 2 ? "font-semibold" : ""}
                >
                  <TableCell>
                    <div
                      className="flex items-center gap-1"
                      style={{ paddingLeft: `${(account.level - 1) * 20}px` }}
                    >
                      {account.hasChildren ? (
                        <button
                          onClick={() => toggleGroup(account.code)}
                          className="p-0.5 rounded hover:bg-muted"
                        >
                          {expandedGroups.has(account.code) ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="w-4.5" />
                      )}
                      <code className="text-sm font-mono">{account.code}</code>
                    </div>
                  </TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${typeColors[account.type] ?? ""}`}
                    >
                      {typeLabels[account.type] ?? account.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">₺0,00</TableCell>
                  <TableCell className="text-right font-mono text-sm">₺0,00</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
