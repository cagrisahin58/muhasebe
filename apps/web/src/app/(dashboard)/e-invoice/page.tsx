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
import { Send, Download, Search, CheckCircle, XCircle, Clock, FileText, ArrowUpRight, ArrowDownLeft } from "lucide-react";

type EInvoiceTab = "outgoing" | "incoming" | "taxpayer";

const E_STATUS: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  SENT: { label: "Gönderildi", color: "bg-blue-100 text-blue-800", icon: Clock },
  ACCEPTED: { label: "Kabul Edildi", color: "bg-green-100 text-green-800", icon: CheckCircle },
  REJECTED: { label: "Reddedildi", color: "bg-red-100 text-red-800", icon: XCircle },
  CANCELLED: { label: "İptal Edildi", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

export default function EInvoicePage() {
  const [activeTab, setActiveTab] = useState<EInvoiceTab>("outgoing");
  const [taxpayerVkn, setTaxpayerVkn] = useState("");
  const [taxpayerResult, setTaxpayerResult] = useState<null | { isEInvoice: boolean; isEArchive: boolean }>(null);

  const tabs = [
    { key: "outgoing" as const, label: "Giden E-Faturalar", icon: ArrowUpRight },
    { key: "incoming" as const, label: "Gelen E-Faturalar", icon: ArrowDownLeft },
    { key: "taxpayer" as const, label: "Mükellef Sorgula", icon: Search },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">E-Fatura / E-Arşiv</h1>
        <p className="text-muted-foreground">Elektronik fatura gönderme, alma ve takip</p>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Gönderilen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Kabul Edilen</p>
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
                <Download className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Gelen</p>
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

      {/* Giden E-Faturalar */}
      {activeTab === "outgoing" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Giden E-Faturalar</CardTitle>
              <div className="flex gap-2">
                <Input type="date" className="w-[160px]" />
                <Input type="date" className="w-[160px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz gönderilmiş e-fatura yok</p>
                    <p className="text-xs">Onaylanmış faturalarınızı Faturalar sayfasından e-fatura olarak gönderebilirsiniz</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Gelen E-Faturalar */}
      {activeTab === "incoming" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gelen E-Faturalar</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Gelen Faturaları Kontrol Et
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Gönderen</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <ArrowDownLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Gelen e-fatura bulunmuyor</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mükellef Sorgula */}
      {activeTab === "taxpayer" && (
        <Card>
          <CardHeader>
            <CardTitle>E-Fatura Mükellef Sorgulama</CardTitle>
            <CardDescription>
              Alıcınızın e-fatura mükellefi olup olmadığını sorgulayın.
              E-fatura mükellefi ise e-fatura, değilse e-arşiv fatura gönderilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 max-w-md">
              <Input
                placeholder="VKN veya TCKN girin (10-11 hane)"
                value={taxpayerVkn}
                onChange={(e) => {
                  setTaxpayerVkn(e.target.value);
                  setTaxpayerResult(null);
                }}
                maxLength={11}
              />
              <Button
                onClick={() => {
                  // Mock sonuç
                  setTaxpayerResult({
                    isEInvoice: taxpayerVkn.startsWith("1"),
                    isEArchive: true,
                  });
                }}
                disabled={taxpayerVkn.length < 10}
              >
                <Search className="h-4 w-4" />
                Sorgula
              </Button>
            </div>

            {taxpayerResult && (
              <div className="p-4 border rounded-lg max-w-md space-y-2">
                <div className="flex items-center gap-2">
                  {taxpayerResult.isEInvoice ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    E-Fatura Mükellefi: {taxpayerResult.isEInvoice ? "Evet" : "Hayır"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {taxpayerResult.isEArchive ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    E-Arşiv: {taxpayerResult.isEArchive ? "Evet" : "Hayır"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {taxpayerResult.isEInvoice
                    ? "Bu mükellefe e-fatura gönderilecektir (Ticari/Temel fatura profili)"
                    : "Bu mükellefe e-arşiv fatura gönderilecektir"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
