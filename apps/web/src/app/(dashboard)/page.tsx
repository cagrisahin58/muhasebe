"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Users,
  AlertCircle,
  Landmark,
  Receipt,
  Clock,
  DollarSign,
  PieChart,
  Activity,
  Calendar,
} from "lucide-react";
import Link from "next/link";

const MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Finansal durumunuzun genel görünümü</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tax-declarations">
              <Calendar className="h-4 w-4" />
              Vergi Takvimi
            </Link>
          </Button>
        </div>
      </div>

      {/* Ana Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Alacak</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0,00 ₺</div>
            <p className="text-xs text-muted-foreground">120 - Alıcılar hesabı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Borç</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0,00 ₺</div>
            <p className="text-xs text-muted-foreground">320 - Satıcılar hesabı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kasa Bakiyesi</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0,00 ₺</div>
            <p className="text-xs text-muted-foreground">100 - Kasa hesabı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banka Bakiyesi</CardTitle>
            <Landmark className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0,00 ₺</div>
            <p className="text-xs text-muted-foreground">102 - Bankalar hesabı</p>
          </CardContent>
        </Card>
      </div>

      {/* İkinci Satır: Likidite + İstatistikler */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Likidite</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0,00 ₺</div>
            <p className="text-xs text-muted-foreground">Kasa + Banka toplamı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Fiş</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Bu dönem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cari Hesap</CardTitle>
            <Users className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Müşteri + Tedarikçi</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafikler Satırı */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Nakit Akış Grafiği */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Nakit Akışı
            </CardTitle>
            <CardDescription>Son 6 aylık nakit giriş/çıkış</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MONTHS_SHORT.slice(0, 6).map((month, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">{month}</span>
                  <div className="flex-1 flex gap-1">
                    <div
                      className="h-5 bg-green-200 rounded-sm flex items-center justify-end px-1"
                      style={{ width: "0%" }}
                    >
                      <span className="text-[10px] text-green-700">0</span>
                    </div>
                    <div
                      className="h-5 bg-red-200 rounded-sm flex items-center justify-end px-1"
                      style={{ width: "0%" }}
                    >
                      <span className="text-[10px] text-red-700">0</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-200 rounded-sm" />
                  Giriş
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-200 rounded-sm" />
                  Çıkış
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gelir/Gider Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Gelir / Gider Trendi
            </CardTitle>
            <CardDescription>Son 12 aylık gelir ve gider karşılaştırması</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MONTHS_SHORT.map((month, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">{month}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-blue-200 rounded-full" style={{ width: "0%" }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">0 ₺</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Finansal Oranlar + KDV Özet */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Finansal Oranlar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-500" />
              Finansal Oranlar
            </CardTitle>
            <CardDescription>Likidite ve kaldıraç göstergeleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Cari Oran</p>
                  <p className="text-xs text-muted-foreground">Dönen Varlıklar / KV Yab. Kaynaklar</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">0,00</p>
                  <p className="text-xs text-muted-foreground">{"İdeal: > 1,5"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Borç/Özkaynak Oranı</p>
                  <p className="text-xs text-muted-foreground">Toplam Borç / Özkaynaklar</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">0,00</p>
                  <p className="text-xs text-muted-foreground">{"İdeal: < 2,0"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-600">Dönen Varlıklar</p>
                  <p className="text-sm font-bold">0,00 ₺</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-xs text-red-600">KV Yab. Kaynaklar</p>
                  <p className="text-sm font-bold">0,00 ₺</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-xs text-green-600">Toplam Aktif</p>
                  <p className="text-sm font-bold">0,00 ₺</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <p className="text-xs text-purple-600">Özkaynaklar</p>
                  <p className="text-sm font-bold">0,00 ₺</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KDV Özet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-500" />
              KDV Özet Tablosu
            </CardTitle>
            <CardDescription>Son aylardaki KDV beyanname durumu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MONTHS_SHORT.slice(0, 6).map((month, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border text-sm">
                  <span className="text-muted-foreground">{month} 2026</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">0,00 ₺</span>
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      Hazırlanmadı
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/tax-declarations">
                    Tüm Beyannameleri Gör
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alt Bilgi: Son İşlemler + Yaklaşan Vadeler */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Son İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz yevmiye kaydı yok</p>
                <Button variant="link" size="sm" asChild>
                  <Link href="/journal">İlk fişinizi oluşturun</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Yaklaşan Vadeler
            </CardTitle>
            <CardDescription>30 gün içinde vadesi dolacak fatura ve çek/senetler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Yaklaşan vade bulunmuyor</p>
                <p className="text-xs">Vadesi gelen fatura, çek ve senetler burada görünecek</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hızlı Erişim Butonları */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/journal">
                <FileText className="h-5 w-5" />
                <span className="text-xs">Yeni Fiş</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/invoices">
                <Receipt className="h-5 w-5" />
                <span className="text-xs">Yeni Fatura</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/cash">
                <Wallet className="h-5 w-5" />
                <span className="text-xs">Kasa Hareketi</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/reports">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">Raporlar</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
