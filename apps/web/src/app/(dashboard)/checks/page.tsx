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
  FileCheck,
  Plus,
  X,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Clock,
} from "lucide-react";

type CheckTab = "received" | "given" | "upcoming";

export default function ChecksPage() {
  const [activeTab, setActiveTab] = useState<CheckTab>("received");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tabs = [
    { key: "received" as const, label: "Alınan Çek/Senet" },
    { key: "given" as const, label: "Verilen Çek/Senet" },
    { key: "upcoming" as const, label: "Vadesi Yaklaşan" },
  ];

  const statusLabels: Record<string, { label: string; color: string }> = {
    portfolio: { label: "Portföyde", color: "bg-blue-100 text-blue-700" },
    in_collection: { label: "Tahsilde", color: "bg-yellow-100 text-yellow-700" },
    collected: { label: "Tahsil Edildi", color: "bg-green-100 text-green-700" },
    endorsed: { label: "Ciro Edildi", color: "bg-purple-100 text-purple-700" },
    bounced: { label: "Karşılıksız", color: "bg-red-100 text-red-700" },
    paid: { label: "Ödendi", color: "bg-green-100 text-green-700" },
    cancelled: { label: "İptal", color: "bg-gray-100 text-gray-700" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Çek / Senet</h1>
          <p className="text-muted-foreground">Çek ve senet portföy takibi, vade ve ciro işlemleri</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Yeni Kayıt
        </Button>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <ArrowDownRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Alınan Çek</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <ArrowUpRight className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Verilen Çek</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Portföyde</p>
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
                <p className="text-xs text-muted-foreground">Vadesi Yaklaşan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
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

      {/* Alınan Çek/Senet */}
      {activeTab === "received" && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seri No</TableHead>
                  <TableHead>Cari</TableHead>
                  <TableHead>Banka</TableHead>
                  <TableHead>Düzenleme</TableHead>
                  <TableHead>Vade</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz alınan çek/senet kaydı yok</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Verilen Çek/Senet */}
      {activeTab === "given" && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seri No</TableHead>
                  <TableHead>Cari</TableHead>
                  <TableHead>Banka</TableHead>
                  <TableHead>Düzenleme</TableHead>
                  <TableHead>Vade</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz verilen çek/senet kaydı yok</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Vadesi Yaklaşan */}
      {activeTab === "upcoming" && (
        <Card>
          <CardHeader>
            <CardTitle>Vadesi Yaklaşan Çek/Senetler</CardTitle>
            <CardDescription>Önümüzdeki 30 gün içinde vadesi dolacak çek ve senetler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Yaklaşan vadesi olan çek/senet bulunmuyor</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Oluşturma Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Çek/Senet Kayıt</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tür</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                  <option value="received_check">Alınan Çek</option>
                  <option value="given_check">Verilen Çek</option>
                  <option value="received_note">Alınan Senet</option>
                  <option value="given_note">Verilen Senet</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Seri No</label>
                <Input placeholder="Çek/Senet seri numarası" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Cari Hesap</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm mt-1 bg-background">
                  <option>Cari hesap seçin...</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Banka</label>
                <Input placeholder="Keşideci banka" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Tutar</label>
                <Input type="number" placeholder="0.00" step="0.01" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Düzenleme Tarihi</label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Vade Tarihi</label>
                  <Input type="date" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Not</label>
                <Input placeholder="Açıklama (opsiyonel)" className="mt-1" />
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
