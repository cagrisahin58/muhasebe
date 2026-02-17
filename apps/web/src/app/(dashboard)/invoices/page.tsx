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
import { Plus, Search, FileText, Send, Eye, Trash2 } from "lucide-react";
import { formatCurrency, KDV_RATES, WITHHOLDING_RATES } from "@finbooks/shared";

const TYPE_LABELS: Record<string, string> = {
  sale: "Satış",
  purchase: "Alış",
  sale_return: "Satış İade",
  purchase_return: "Alış İade",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Taslak", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Onaylı", color: "bg-green-100 text-green-800" },
  sent: { label: "Gönderildi", color: "bg-blue-100 text-blue-800" },
  cancelled: { label: "İptal", color: "bg-red-100 text-red-800" },
};

interface InvoiceLine {
  description: string;
  quantity: string;
  unitPrice: string;
  discountRate: string;
  taxRate: number;
  withholdingRate: string;
}

function CreateInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState("sale");
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: "", quantity: "1", unitPrice: "", discountRate: "0", taxRate: 20, withholdingRate: "0" },
  ]);

  if (!open) return null;

  const addLine = () => {
    setLines([...lines, { description: "", quantity: "1", unitPrice: "", discountRate: "0", taxRate: 20, withholdingRate: "0" }]);
  };

  const updateLine = (index: number, field: keyof InvoiceLine, value: string | number) => {
    setLines(lines.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) setLines(lines.filter((_, i) => i !== index));
  };

  // Hesaplamalar
  const calculated = lines.map((l) => {
    const qty = parseFloat(l.quantity) || 0;
    const price = parseFloat(l.unitPrice) || 0;
    const disc = parseFloat(l.discountRate) || 0;
    const wh = parseFloat(l.withholdingRate) || 0;
    const subtotal = qty * price;
    const discAmt = subtotal * (disc / 100);
    const net = subtotal - discAmt;
    const tax = net * (l.taxRate / 100);
    const whAmt = tax * wh;
    const total = net + tax - whAmt;
    return { subtotal, discAmt, net, tax, whAmt, total };
  });

  const totals = {
    subtotal: calculated.reduce((s, c) => s + c.subtotal, 0),
    discount: calculated.reduce((s, c) => s + c.discAmt, 0),
    net: calculated.reduce((s, c) => s + c.net, 0),
    tax: calculated.reduce((s, c) => s + c.tax, 0),
    withholding: calculated.reduce((s, c) => s + c.whAmt, 0),
    grandTotal: calculated.reduce((s, c) => s + c.total, 0),
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Yeni Fatura</h2>
          <p className="text-sm text-muted-foreground">Satış veya alış faturası oluşturun</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Fatura bilgileri */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Fatura Türü</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="sale">Satış Faturası</option>
                <option value="purchase">Alış Faturası</option>
                <option value="sale_return">Satış İade</option>
                <option value="purchase_return">Alış İade</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Cari Hesap</label>
              <Input placeholder="Cari hesap seçin" />
            </div>
            <div>
              <label className="text-sm font-medium">Fatura Tarihi</label>
              <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="text-sm font-medium">Vade Tarihi</label>
              <Input type="date" />
            </div>
          </div>

          {/* Kalemler */}
          <div>
            <h3 className="text-sm font-medium mb-2">Fatura Kalemleri</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="w-[80px]">Miktar</TableHead>
                  <TableHead className="w-[110px]">Birim Fiyat</TableHead>
                  <TableHead className="w-[80px]">İskonto %</TableHead>
                  <TableHead className="w-[90px]">KDV %</TableHead>
                  <TableHead className="w-[100px]">Tevkifat</TableHead>
                  <TableHead className="w-[110px] text-right">Tutar</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        placeholder="Mal/hizmet açıklaması"
                        value={line.description}
                        onChange={(e) => updateLine(idx, "description", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                        className="text-right font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.discountRate}
                        onChange={(e) => updateLine(idx, "discountRate", e.target.value)}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={line.taxRate}
                        onChange={(e) => updateLine(idx, "taxRate", parseInt(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                      >
                        {KDV_RATES.map((r) => (
                          <option key={r} value={r}>%{r}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <select
                        value={line.withholdingRate}
                        onChange={(e) => updateLine(idx, "withholdingRate", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                      >
                        <option value="0">Yok</option>
                        {Object.entries(WITHHOLDING_RATES).map(([key, val]) => (
                          <option key={key} value={(val.numerator / val.denominator).toString()}>
                            {val.numerator}/{val.denominator}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(calculated[idx]?.total ?? 0)}
                    </TableCell>
                    <TableCell>
                      {lines.length > 1 && (
                        <button onClick={() => removeLine(idx)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-start justify-between mt-3">
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4" />
                Kalem Ekle
              </Button>

              {/* Toplamlar */}
              <div className="border rounded-lg p-4 min-w-[280px] space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam:</span>
                  <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">İskonto:</span>
                    <span className="font-mono text-red-600">-{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">KDV:</span>
                  <span className="font-mono">{formatCurrency(totals.tax)}</span>
                </div>
                {totals.withholding > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tevkifat:</span>
                    <span className="font-mono text-red-600">-{formatCurrency(totals.withholding)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t">
                  <span>Genel Toplam:</span>
                  <span className="font-mono">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="text-sm font-medium">Notlar</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Fatura notu (opsiyonel)"
            />
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button disabled={totals.grandTotal <= 0}>
            <FileText className="h-4 w-4" />
            Fatura Oluştur
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faturalar</h1>
          <p className="text-muted-foreground">Satış ve alış faturaları yönetimi</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Yeni Fatura
        </Button>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Fatura no veya cari hesap ara..." className="pl-10" />
            </div>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Tüm Türler</option>
              <option value="sale">Satış</option>
              <option value="purchase">Alış</option>
            </select>
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="approved">Onaylı</option>
              <option value="sent">Gönderildi</option>
            </select>
            <Input type="date" className="w-[160px]" />
            <Input type="date" className="w-[160px]" />
          </div>
        </CardContent>
      </Card>

      {/* Fatura Tablosu */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura No</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Cari Hesap</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>E-Fatura</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="w-[100px]">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Henüz fatura kaydı yok</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateInvoiceModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
