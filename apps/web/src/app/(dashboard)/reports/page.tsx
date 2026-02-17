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
  TableFooter,
} from "@/components/ui/table";
import { BarChart3, FileSpreadsheet, FileDown, BookOpen } from "lucide-react";

type ReportTab = "mizan" | "yevmiye" | "kebir";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("mizan");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  const tabs: { key: ReportTab; label: string; icon: typeof BarChart3 }[] = [
    { key: "mizan", label: "Mizan", icon: BarChart3 },
    { key: "yevmiye", label: "Yevmiye Defteri", icon: BookOpen },
    { key: "kebir", label: "Kebir (Büyük Defter)", icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground">Mali raporlar ve analizler</p>
        </div>
        <Button variant="outline">
          <FileDown className="h-4 w-4" />
          Excel Export
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tarih Filtresi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium">Başlangıç</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bitiş</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="pt-5">
              <Button>Rapor Oluştur</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mizan Raporu */}
      {activeTab === "mizan" && (
        <Card>
          <CardHeader>
            <CardTitle>
              Mizan Raporu ({startDate} - {endDate})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Hesap Kodu</TableHead>
                  <TableHead>Hesap Adı</TableHead>
                  <TableHead className="text-right">Borç Toplamı</TableHead>
                  <TableHead className="text-right">Alacak Toplamı</TableHead>
                  <TableHead className="text-right">Borç Bakiye</TableHead>
                  <TableHead className="text-right">Alacak Bakiye</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Dönem içinde onaylanmış fiş bulunmuyor. Mizan raporu için fişleri
                    onaylayın.
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">
                    TOPLAM
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">₺0,00</TableCell>
                  <TableCell className="text-right font-mono font-bold">₺0,00</TableCell>
                  <TableCell className="text-right font-mono font-bold">₺0,00</TableCell>
                  <TableCell className="text-right font-mono font-bold">₺0,00</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Yevmiye Defteri */}
      {activeTab === "yevmiye" && (
        <Card>
          <CardHeader>
            <CardTitle>Yevmiye Defteri ({startDate} - {endDate})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <div className="text-center">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Onaylanmış yevmiye kaydı bulunmuyor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kebir */}
      {activeTab === "kebir" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <CardTitle>Kebir (Büyük Defter)</CardTitle>
              <Input placeholder="Hesap kodu seçin (ör: 100)" className="max-w-[200px]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <div className="text-center">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Hesap seçerek kebir raporunu görüntüleyin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
