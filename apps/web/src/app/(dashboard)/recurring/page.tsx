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
  RefreshCw,
  Plus,
  X,
  Clock,
  Calendar,
} from "lucide-react";

export default function RecurringPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tekrarlayan İşlemler</h1>
          <p className="text-muted-foreground">Kira, maaş, abonelik gibi periyodik muhasebe kayıtları</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Yeni Şablon
        </Button>
      </div>

      {/* Özet */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Aktif Şablon</p>
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
                <p className="text-xs text-muted-foreground">Bekleyen Çalıştırma</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Bu Ay Oluşturulan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Şablon Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Şablonlar</CardTitle>
          <CardDescription>
            Tekrarlayan işlem şablonları otomatik olarak belirlenen periyotta muhasebe fişi oluşturur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Şablon Adı</TableHead>
                <TableHead>Periyot</TableHead>
                <TableHead>Sonraki Çalışma</TableHead>
                <TableHead>Son Çalışma</TableHead>
                <TableHead>Çalışma Sayısı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz tekrarlayan işlem şablonu tanımlanmadı</p>
                  <Button variant="link" size="sm" onClick={() => setShowCreateModal(true)}>
                    İlk şablonunuzu oluşturun
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Örnek Şablonlar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hazır Şablonlar</CardTitle>
          <CardDescription>Sık kullanılan tekrarlayan işlem örnekleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { name: "Aylık Kira Ödemesi", desc: "770 Genel Yönetim Giderleri → 102 Bankalar", freq: "Aylık" },
              { name: "Maaş Ödemesi", desc: "770 Personel Giderleri → 102 Bankalar / 335 SGK", freq: "Aylık" },
              { name: "İnternet/Telefon", desc: "770 Haberleşme Giderleri → 320 Satıcılar", freq: "Aylık" },
              { name: "Ofis Kirası (Stopajlı)", desc: "770 Kira → 360 Vergi Borçları / 102 Banka", freq: "Aylık" },
              { name: "Amortisman Kaydı", desc: "730 Amortisman Giderleri → 257 Birikmiş Amort.", freq: "Aylık" },
              { name: "Yıllık Sigorta", desc: "770 Sigorta Giderleri → 102 Bankalar", freq: "Yıllık" },
            ].map((tpl, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
              >
                <p className="text-sm font-medium">{tpl.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{tpl.desc}</p>
                <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-2">
                  {tpl.freq}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Oluşturma Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tekrarlayan İşlem Şablonu</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Şablon Adı</label>
                <Input placeholder="Örn: Aylık Kira Ödemesi" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Açıklama</label>
                <Input placeholder="Opsiyonel açıklama" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Periyot</label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                    <option value="monthly">Aylık</option>
                    <option value="weekly">Haftalık</option>
                    <option value="quarterly">3 Aylık</option>
                    <option value="yearly">Yıllık</option>
                    <option value="daily">Günlük</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Ayın Günü</label>
                  <Input type="number" min={1} max={31} placeholder="1" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Başlangıç Tarihi</label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bitiş Tarihi (Opsiyonel)</label>
                  <Input type="date" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Fiş Türü</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                  <option value="mahsup">Mahsup</option>
                  <option value="tediye">Tediye (Ödeme)</option>
                  <option value="tahsil">Tahsil</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fiş Satırları</label>
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
                    <span>Hesap</span>
                    <span>Borç</span>
                    <span>Alacak</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select className="border rounded px-2 py-1.5 text-sm bg-background">
                      <option>Hesap seçin...</option>
                    </select>
                    <Input placeholder="0.00" className="text-sm" />
                    <Input placeholder="0.00" className="text-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select className="border rounded px-2 py-1.5 text-sm bg-background">
                      <option>Hesap seçin...</option>
                    </select>
                    <Input placeholder="0.00" className="text-sm" />
                    <Input placeholder="0.00" className="text-sm" />
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Plus className="h-3 w-3" /> Satır Ekle
                  </Button>
                </div>
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
