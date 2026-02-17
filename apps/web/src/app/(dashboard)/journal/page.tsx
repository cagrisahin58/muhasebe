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
import { Plus, Search, FileText, Check, X, RotateCcw } from "lucide-react";
import { formatCurrency, formatDate } from "@finbooks/shared";

const ENTRY_TYPE_LABELS: Record<string, string> = {
  mahsup: "Mahsup",
  tahsil: "Tahsil",
  tediye: "Tediye",
  acilis: "Açılış",
  kapanis: "Kapanış",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Taslak", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Onaylı", color: "bg-green-100 text-green-800" },
  rejected: { label: "Reddedildi", color: "bg-red-100 text-red-800" },
  reversed: { label: "Ters Kayıt", color: "bg-gray-100 text-gray-800" },
};

// CreateJournalEntryModal bileşeni
function CreateJournalEntryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [lines, setLines] = useState([
    { accountCode: "", accountName: "", debit: "", credit: "", description: "" },
    { accountCode: "", accountName: "", debit: "", credit: "", description: "" },
  ]);

  if (!open) return null;

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const addLine = () => {
    setLines([...lines, { accountCode: "", accountName: "", debit: "", credit: "", description: "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: string, value: string) => {
    setLines(lines.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Yeni Yevmiye Kaydı</h2>
          <p className="text-sm text-muted-foreground">Borç ve alacak toplamları eşit olmalıdır</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Fiş bilgileri */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Tarih</label>
              <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="text-sm font-medium">Fiş Türü</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="mahsup">Mahsup</option>
                <option value="tahsil">Tahsil</option>
                <option value="tediye">Tediye</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Açıklama</label>
              <Input placeholder="Fiş açıklaması" />
            </div>
          </div>

          {/* Satırlar */}
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Hesap Kodu</TableHead>
                  <TableHead>Hesap Adı</TableHead>
                  <TableHead className="w-[140px]">Borç</TableHead>
                  <TableHead className="w-[140px]">Alacak</TableHead>
                  <TableHead className="w-[180px]">Açıklama</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        placeholder="100"
                        value={line.accountCode}
                        onChange={(e) => updateLine(index, "accountCode", e.target.value)}
                        className="font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Hesap adı"
                        value={line.accountName}
                        onChange={(e) => updateLine(index, "accountName", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={line.debit}
                        onChange={(e) => {
                          updateLine(index, "debit", e.target.value);
                          if (e.target.value) updateLine(index, "credit", "");
                        }}
                        className="text-right font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={line.credit}
                        onChange={(e) => {
                          updateLine(index, "credit", e.target.value);
                          if (e.target.value) updateLine(index, "debit", "");
                        }}
                        className="text-right font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Not"
                        value={line.description}
                        onChange={(e) => updateLine(index, "description", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      {lines.length > 2 && (
                        <button
                          onClick={() => removeLine(index)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-3">
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4" />
                Satır Ekle
              </Button>

              <div className="flex items-center gap-6 text-sm font-mono">
                <span>
                  Borç: <strong>{formatCurrency(totalDebit)}</strong>
                </span>
                <span>
                  Alacak: <strong>{formatCurrency(totalCredit)}</strong>
                </span>
                <span className={isBalanced ? "text-green-600" : "text-red-600"}>
                  Fark: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                  {isBalanced ? " ✓" : " ✗"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button disabled={!isBalanced || totalDebit === 0}>
            <Check className="h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yevmiye / Fişler</h1>
          <p className="text-muted-foreground">Muhasebe fişi giriş ve yönetimi</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Yeni Fiş
        </Button>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Fiş no veya açıklama ara..." className="pl-10" />
            </div>
            <Input type="date" className="w-[160px]" />
            <Input type="date" className="w-[160px]" />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="approved">Onaylı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Fiş Listesi */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <div className="text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Henüz yevmiye kaydı yok</p>
              <p className="text-xs">Yeni fiş oluşturmak için yukarıdaki butonu kullanın</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiş oluşturma modalı */}
      <CreateJournalEntryModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
