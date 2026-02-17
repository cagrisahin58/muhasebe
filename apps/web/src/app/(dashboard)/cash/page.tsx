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
  Wallet,
  Plus,
  X,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

export default function CashPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"registers" | "transactions">("registers");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kasa</h1>
          <p className="text-muted-foreground">Nakit kasa yönetimi ve hareket takibi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTransactionModal(true)}>
            <TrendingUp className="h-4 w-4" />
            Hareket Ekle
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Kasa Ekle
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Kasa Sayısı</p>
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
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Bu Ay Hareket</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("registers")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "registers"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Kasalar
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "transactions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Hareketler
        </button>
      </div>

      {/* Kasalar */}
      {activeTab === "registers" && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kasa Adı</TableHead>
                  <TableHead>Döviz</TableHead>
                  <TableHead className="text-right">Bakiye</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz kasa tanımlanmadı</p>
                    <Button variant="link" size="sm" onClick={() => setShowCreateModal(true)}>
                      İlk kasanızı oluşturun
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
            <CardTitle>Kasa Hareketleri</CardTitle>
            <CardDescription>Tüm kasaların giriş ve çıkış hareketleri</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kasa</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Cari</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Henüz kasa hareketi bulunmuyor
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Kasa Oluşturma Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Kasa Ekle</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Kasa Adı</label>
                <Input placeholder="Örn: Ana Kasa" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Döviz</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                  <option value="TRY">TRY - Türk Lirası</option>
                  <option value="USD">USD - ABD Doları</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
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

      {/* Hareket Ekleme Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Kasa Hareketi</h2>
              <button onClick={() => setShowTransactionModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Kasa</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                  <option>Kasa seçin...</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">İşlem Türü</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                  <option value="income">Tahsilat (Giriş)</option>
                  <option value="expense">Ödeme (Çıkış)</option>
                  <option value="transfer">Virman (Transfer)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Tarih</label>
                <Input type="date" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Tutar</label>
                <Input type="number" placeholder="0.00" step="0.01" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Açıklama</label>
                <Input placeholder="İşlem açıklaması" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Cari Hesap (Opsiyonel)</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                  <option value="">Seçiniz...</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowTransactionModal(false)}>İptal</Button>
                <Button>Kaydet</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
