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
import {
  Calculator,
  FileText,
  Clock,
  CheckCircle,
  Send,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from "lucide-react";

type DeclarationType = "kdv" | "muhtasar" | "gecici" | "calendar";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function TaxDeclarationsPage() {
  const [activeTab, setActiveTab] = useState<DeclarationType>("kdv");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showKdvModal, setShowKdvModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const tabs = [
    { key: "kdv" as const, label: "KDV Beyannamesi", icon: Calculator },
    { key: "muhtasar" as const, label: "Muhtasar", icon: FileText },
    { key: "gecici" as const, label: "Geçici Vergi", icon: TrendingUp },
    { key: "calendar" as const, label: "Vergi Takvimi", icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vergi Beyannameleri</h1>
        <p className="text-muted-foreground">KDV, Muhtasar ve Geçici Vergi beyannamesi hazırlama</p>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">KDV Beyannamesi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Muhtasar</p>
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
                <p className="text-xs text-muted-foreground">Bekleyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Gönderilen</p>
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

      {/* KDV Beyannamesi */}
      {activeTab === "kdv" && (
        <Card>
          <CardHeader>
            <CardTitle>KDV-1 Beyannamesi</CardTitle>
            <CardDescription>
              Aylık KDV beyannamesi. Hesaplanan KDV (391) - İndirilecek KDV (191) = Ödenecek/Devreden KDV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem</TableHead>
                  <TableHead className="text-right">Hesaplanan KDV</TableHead>
                  <TableHead className="text-right">İndirilecek KDV</TableHead>
                  <TableHead className="text-right">Ödenecek KDV</TableHead>
                  <TableHead className="text-right">Devreden KDV</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Son Tarih</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MONTHS.map((month, idx) => {
                  const dueDate = new Date(selectedYear, idx + 1, 28);
                  const isPast = dueDate < new Date();
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{month} {selectedYear}</TableCell>
                      <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                      <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                      <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                      <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          Hazırlanmadı
                        </span>
                      </TableCell>
                      <TableCell className={`text-sm ${isPast ? "text-red-500" : "text-muted-foreground"}`}>
                        {dueDate.toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedMonth(idx); setShowKdvModal(true); }}
                        >
                          <Calculator className="h-3.5 w-3.5" />
                          Hesapla
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Muhtasar Beyanname */}
      {activeTab === "muhtasar" && (
        <Card>
          <CardHeader>
            <CardTitle>Muhtasar ve Prim Hizmet Beyannamesi</CardTitle>
            <CardDescription>
              Stopaj (gelir vergisi tevkifatı) hesaplaması: Ücret, serbest meslek, kira ödemeleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem</TableHead>
                  <TableHead className="text-right">Ücret Stopajı</TableHead>
                  <TableHead className="text-right">SM Stopajı</TableHead>
                  <TableHead className="text-right">Kira Stopajı</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MONTHS.map((month, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{month} {selectedYear}</TableCell>
                    <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                    <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                    <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                    <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        Hazırlanmadı
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Calculator className="h-3.5 w-3.5" />
                        Hesapla
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Geçici Vergi */}
      {activeTab === "gecici" && (
        <Card>
          <CardHeader>
            <CardTitle>Geçici Vergi Beyannamesi</CardTitle>
            <CardDescription>
              Üç aylık dönemlerde hesaplanan kurumlar/gelir vergisi avansı (Kurumlar: %25)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dönem</TableHead>
                  <TableHead className="text-right">Gelir</TableHead>
                  <TableHead className="text-right">Gider</TableHead>
                  <TableHead className="text-right">Kâr/Zarar</TableHead>
                  <TableHead className="text-right">Vergi (%25)</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {["Q1 (Ocak-Mart)", "Q2 (Nisan-Haziran)", "Q3 (Temmuz-Eylül)", "Q4 (Ekim-Aralık)"].map(
                  (quarter, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{selectedYear} {quarter}</TableCell>
                      <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                      <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                      <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                      <TableCell className="text-right text-muted-foreground">0,00 ₺</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3" />
                          Hazırlanmadı
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Calculator className="h-3.5 w-3.5" />
                          Hesapla
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Vergi Takvimi */}
      {activeTab === "calendar" && (
        <Card>
          <CardHeader>
            <CardTitle>Vergi Takvimi</CardTitle>
            <CardDescription>Yaklaşan beyanname son tarihleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "KDV-1", day: 28, desc: "Aylık KDV Beyannamesi" },
                { type: "Muhtasar", day: 26, desc: "Muhtasar ve Prim Hizmet Beyannamesi" },
                { type: "Geçici Vergi", day: 17, desc: "Üç aylık geçici vergi (dönem bitiminden itibaren)" },
              ].map((item, idx) => {
                const now = new Date();
                const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, item.day);
                const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 7;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isUrgent ? "border-red-200 bg-red-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isUrgent ? "bg-red-100" : "bg-blue-100"}`}>
                        <Calendar className={`h-4 w-4 ${isUrgent ? "text-red-600" : "text-blue-600"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.type}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isUrgent ? "text-red-600" : ""}`}>
                        {dueDate.toLocaleDateString("tr-TR")}
                      </p>
                      <p className={`text-xs ${isUrgent ? "text-red-500" : "text-muted-foreground"}`}>
                        {daysLeft > 0 ? `${daysLeft} gün kaldı` : "Süresi geçti!"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bilgilendirme */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Beyanname Hazırlama</p>
              <p>Beyannameler muhasebe kayıtlarından otomatik hesaplanır. &quot;Hesapla&quot; butonuna tıkladığınızda ilgili dönemin hesap bakiyeleri kullanılarak beyanname taslağı oluşturulur.</p>
              <p>Hesaplanan beyannameleri doğruladıktan sonra e-Beyanname formatında dışa aktarabilirsiniz.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
