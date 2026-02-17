"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Building2, Shield, Database, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">Uygulama ve firma ayarları</p>
      </div>

      {/* Firma Bilgileri */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Firma Bilgileri</CardTitle>
          </div>
          <CardDescription>Firma ve vergi bilgilerinizi yönetin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Firma Unvanı</label>
              <Input defaultValue="Demo Şirket A.Ş." />
            </div>
            <div>
              <label className="text-sm font-medium">VKN / TCKN</label>
              <Input defaultValue="1234567890" disabled />
            </div>
            <div>
              <label className="text-sm font-medium">Vergi Dairesi</label>
              <Input defaultValue="Büyük Mükellefler" />
            </div>
            <div>
              <label className="text-sm font-medium">Telefon</label>
              <Input defaultValue="02121234567" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Adres</label>
              <Input defaultValue="Atatürk Cad. No: 123, Şişli / İstanbul" />
            </div>
          </div>
          <Button>Kaydet</Button>
        </CardContent>
      </Card>

      {/* Güvenlik */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Güvenlik</CardTitle>
          </div>
          <CardDescription>Şifre ve iki faktörlü doğrulama ayarları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Mevcut Şifre</label>
              <Input type="password" />
            </div>
            <div />
            <div>
              <label className="text-sm font-medium">Yeni Şifre</label>
              <Input type="password" />
            </div>
            <div>
              <label className="text-sm font-medium">Yeni Şifre (Tekrar)</label>
              <Input type="password" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm font-medium">İki Faktörlü Doğrulama (2FA)</p>
              <p className="text-xs text-muted-foreground">
                Google Authenticator ile hesabınızı koruyun
              </p>
            </div>
            <Button variant="outline">Etkinleştir</Button>
          </div>
          <Button>Şifre Güncelle</Button>
        </CardContent>
      </Card>

      {/* Yedekleme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Yedekleme</CardTitle>
          </div>
          <CardDescription>Veritabanı yedekleme ve geri yükleme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Otomatik Yedekleme</p>
              <p className="text-xs text-muted-foreground">Her gece 02:00'da otomatik yedek alınır</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Aktif</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Manuel Yedek Al</Button>
            <Button variant="outline">Yedekten Geri Yükle</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
