"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Landmark,
  Plus,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  X,
} from "lucide-react";

export default function BankPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts" | "transactions" | "reconciliation">("accounts");

  const tabs = [
    { key: "accounts" as const, label: "Banka Hesapları" },
    { key: "transactions" as const, label: "Hareketler" },
    { key: "reconciliation" as const, label: "Mutabakat" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banka</h1>
          <p className="text-muted-foreground">Banka hesapları, ekstre ve mutabakat yönetimi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" />
            CSV Import
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Hesap Ekle
          </Button>
        </div>
      </div>

      {/* Özet */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Landmark className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Banka Hesabı</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <ArrowDownRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0,00 ₺</p>
                <p className="text-xs text-muted-foreground">Toplam Bakiye</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Eşleştirilmemiş</p>
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
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banka Hesapları */}
      {activeTab === "accounts" && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banka</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>Hesap No</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>Döviz</TableHead>
                  <TableHead className="text-right">Bakiye</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <Landmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz banka hesabı tanımlanmadı</p>
                    <Button variant="link" size="sm" onClick={() => setShowCreateModal(true)}>
                      İlk banka hesabını ekleyin
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Hareketler */}
      {activeTab === "transactions" && (
        <Card>
          <CardHeader>
            <CardTitle>Banka Hareketleri</CardTitle>
            <CardDescription>Tüm hesapların ekstre satırları</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Banka</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Referans</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Eşleşme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Henüz banka hareketi bulunmuyor
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mutabakat */}
      {activeTab === "reconciliation" && (
        <Card>
          <CardHeader>
            <CardTitle>Banka Mutabakatı</CardTitle>
            <CardDescription>
              Banka ekstre satırlarını muhasebe kayıtlarıyla otomatik eşleştirin.
              Tutar, tarih ve açıklama benzerliğine göre akıllı eşleştirme yapılır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Mutabakat başlatmak için önce banka hareketlerini import edin</p>
              <Button variant="outline" size="sm" className="mt-3">
                <Upload className="h-4 w-4" />
                CSV Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hesap Oluşturma Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Banka Hesabı Ekle</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Banka</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                  <option>T.C. Ziraat Bankası</option>
                  <option>Türkiye Halk Bankası</option>
                  <option>Türkiye Vakıflar Bankası</option>
                  <option>Akbank</option>
                  <option>Türkiye İş Bankası</option>
                  <option>Yapı ve Kredi Bankası</option>
                  <option>Türkiye Garanti Bankası</option>
                  <option>QNB Finansbank</option>
                  <option>DenizBank</option>
                  <option>ING Bank</option>
                  <option>Diğer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Şube</label>
                  <Input placeholder="Şube adı" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Şube Kodu</label>
                  <Input placeholder="1234" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Hesap No</label>
                <Input placeholder="Hesap numarası" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">IBAN</label>
                <Input placeholder="TR00 0000 0000 0000 0000 0000 00" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Döviz</label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                    <option value="TRY">TRY - Türk Lirası</option>
                    <option value="USD">USD - ABD Doları</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Hesap Türü</label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                    <option value="checking">Vadesiz</option>
                    <option value="savings">Vadeli</option>
                    <option value="credit">Kredi</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Açılış Bakiyesi</label>
                <Input type="number" placeholder="0.00" step="0.01" className="mt-1" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>İptal</Button>
                <Button>Kaydet</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
