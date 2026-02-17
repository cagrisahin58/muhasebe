"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, FileText, Download, CheckCircle, Clock, AlertTriangle, Hash, Calendar } from "lucide-react";

type LedgerTab = "journal" | "general" | "berat";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function ELedgerPage() {
  const [activeTab, setActiveTab] = useState<LedgerTab>("journal");
  const [selectedYear, setSelectedYear] = useState(2026);

  const tabs = [
    { key: "journal" as const, label: "Yevmiye Defteri", icon: FileText },
    { key: "general" as const, label: "Kebir Defteri", icon: BookOpen },
    { key: "berat" as const, label: "Berat Durumu", icon: Hash },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">E-Defter</h1>
        <p className="text-muted-foreground">XBRL-GL formatında yevmiye ve kebir defteri üretimi</p>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Yevmiye Defteri</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Kebir Defteri</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Berat Bekleyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">GİB Onaylı</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Yıl Seçimi */}
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
        >
          <option value={2026}>2026</option>
          <option value={2025}>2025</option>
        </select>
      </div>

      {/* Yevmiye Defteri */}
      {activeTab === "journal" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Yevmiye Defteri (XBRL-GL)</CardTitle>
                <CardDescription>Aylık yevmiye defteri üretimi ve GİB&apos;e gönderimi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem</TableHead>
                  <TableHead>Fiş Sayısı</TableHead>
                  <TableHead>Toplam Borç</TableHead>
                  <TableHead>Toplam Alacak</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MONTHS.map((month, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {month} {selectedYear}
                    </TableCell>
                    <TableCell className="text-muted-foreground">0</TableCell>
                    <TableCell className="text-muted-foreground">0,00 TL</TableCell>
                    <TableCell className="text-muted-foreground">0,00 TL</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        Üretilmedi
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <FileText className="h-3.5 w-3.5" />
                          Üret
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Kebir Defteri */}
      {activeTab === "general" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kebir Defteri (XBRL-GL)</CardTitle>
                <CardDescription>Aylık büyük defter üretimi ve GİB&apos;e gönderimi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem</TableHead>
                  <TableHead>Hesap Sayısı</TableHead>
                  <TableHead>Toplam Borç</TableHead>
                  <TableHead>Toplam Alacak</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MONTHS.map((month, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {month} {selectedYear}
                    </TableCell>
                    <TableCell className="text-muted-foreground">0</TableCell>
                    <TableCell className="text-muted-foreground">0,00 TL</TableCell>
                    <TableCell className="text-muted-foreground">0,00 TL</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        Üretilmedi
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <BookOpen className="h-3.5 w-3.5" />
                          Üret
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Berat Durumu */}
      {activeTab === "berat" && (
        <Card>
          <CardHeader>
            <CardTitle>Berat Durumu</CardTitle>
            <CardDescription>
              Üretilen defterlerin GİB berat durumlarını takip edin. Beratlar defter XML&apos;lerinin
              SHA-256 hash&apos;ini içerir ve GİB&apos;e gönderilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem</TableHead>
                  <TableHead>Defter Türü</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>Oluşturma Tarihi</TableHead>
                  <TableHead>GİB Durumu</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz üretilmiş berat bulunmuyor</p>
                    <p className="text-xs">Önce yevmiye ve kebir defterlerini üretmeniz gerekmektedir</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Bilgilendirme */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">E-Defter Hakkında</p>
              <p>E-Defter, yevmiye defteri ve büyük defterin XBRL-GL formatında elektronik ortamda tutulmasıdır.</p>
              <p>Her ayın sonunda ilgili aya ait defterler üretilmeli ve beratları GİB&apos;e gönderilmelidir.</p>
              <p>Son gönderim tarihi takip eden ayın sonudur (örn: Ocak defteri en geç Şubat sonuna kadar).</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
