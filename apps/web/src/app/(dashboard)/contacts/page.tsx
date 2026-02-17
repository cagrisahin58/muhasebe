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
import { Plus, Search, Users, Phone, Mail } from "lucide-react";
import { formatCurrency } from "@finbooks/shared";

const CONTACT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  customer: { label: "Müşteri", color: "bg-blue-100 text-blue-800" },
  supplier: { label: "Tedarikçi", color: "bg-orange-100 text-orange-800" },
  both: { label: "Müşteri/Tedarikçi", color: "bg-purple-100 text-purple-800" },
};

// CreateContactModal bileşeni
function CreateContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Yeni Cari Hesap</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Cari Hesap Türü</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="customer">Müşteri</option>
                <option value="supplier">Tedarikçi</option>
                <option value="both">Müşteri/Tedarikçi</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">VKN / TCKN</label>
              <Input placeholder="Vergi Kimlik No veya TC Kimlik No" maxLength={11} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Firma / Kişi Adı</label>
            <Input placeholder="Unvan veya ad soyad" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Vergi Dairesi</label>
              <Input placeholder="Vergi dairesi adı" />
            </div>
            <div>
              <label className="text-sm font-medium">Kısa Ad</label>
              <Input placeholder="Kısa tanım (opsiyonel)" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">E-posta</label>
              <Input type="email" placeholder="ornek@firma.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Telefon</label>
              <Input placeholder="05XX XXX XX XX" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Adres</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Açık adres"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">İl</label>
              <Input placeholder="İl" />
            </div>
            <div>
              <label className="text-sm font-medium">İlçe</label>
              <Input placeholder="İlçe" />
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button>Kaydet</Button>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cari Hesaplar</h1>
          <p className="text-muted-foreground">Müşteri ve tedarikçi yönetimi</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Yeni Cari Hesap
        </Button>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari hesap adı veya VKN ile ara..." className="pl-10" />
            </div>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Tüm Türler</option>
              <option value="customer">Müşteriler</option>
              <option value="supplier">Tedarikçiler</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Cari Hesap Listesi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <div className="text-center">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Henüz cari hesap kaydı yok</p>
              <p className="text-xs">Yeni cari hesap oluşturmak için yukarıdaki butonu kullanın</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateContactModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
