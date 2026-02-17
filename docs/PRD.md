# Muhasebe Uygulaması - Product Requirements Document (PRD)

**Proje Adı:** FinBooks - Self-Hosted Türk Muhasebe Yazılımı
**Versiyon:** 1.0
**Tarih:** 2026-02-17
**Durum:** Taslak

---

## 1. Yönetici Özeti

FinBooks, VPS/VDS/Dedicated sunucular üzerinde doğrudan çalışabilen, Türk muhasebe mevzuatına tam uyumlu, modern web tabanlı bir muhasebe uygulamasıdır. Her müşteri kendi sunucusunda bağımsız bir instance çalıştırır; bu mimari merkezi sunucu bağımlılığını ortadan kaldırır, veri egemenliğini sağlar ve yatay ölçeklemeyi doğal olarak çözer.

### 1.1 Vizyon

Türkiye'deki KOBİ'ler ve muhasebe büroları için, kurulumu kolay, GİB entegrasyonlu, KVKK uyumlu, self-hosted bir muhasebe çözümü sunmak.

### 1.2 Hedef Pazar

| Segment | Açıklama |
|---------|----------|
| KOBİ'ler | 1-50 çalışanlı işletmeler |
| Muhasebe Büroları | Çoklu müşteri yöneten SMMM/YMM ofisleri |
| E-Ticaret | Online satış yapan bireysel/kurumsal satıcılar |
| Serbest Meslek | Avukat, doktor, mühendis vb. |

### 1.3 Temel Değer Önerisi

- **Veri Egemenliği:** Veriler müşterinin kendi sunucusunda kalır, üçüncü tarafa bağımlılık yok
- **Ölçeklenebilirlik:** Her instance bağımsız; müşteri sayısı arttıkça yeni VPS = yeni instance
- **Maliyet Avantajı:** SaaS abonelik modeli yerine tek seferlik veya düşük maliyetli lisans
- **Mevzuat Uyumu:** E-Fatura, E-Defter, E-Arşiv, E-İrsaliye tam entegrasyon
- **Kolay Kurulum:** Docker Compose ile tek komutla ayağa kalkan sistem

---

## 2. Mimari Tasarım

### 2.1 Dağıtım Mimarisi

```
┌─────────────────────────────────────────────────────┐
│                  MÜŞTERİ VPS/VDS                    │
│                                                     │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Nginx    │──│ Backend  │──│  PostgreSQL 16    │  │
│  │  Reverse  │  │ (Node.js │  │  + TimescaleDB    │  │
│  │  Proxy +  │  │  /Fastify│  │                   │  │
│  │  SSL/TLS  │  │  API)    │  │  Veriler burada   │  │
│  └───────────┘  └──────────┘  └──────────────────┘  │
│        │              │                              │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Frontend │  │  Redis   │  │  MinIO (S3)      │  │
│  │  (React/  │  │  Cache & │  │  Belge Depolama  │  │
│  │  Next.js) │  │  Queue   │  │  (Fatura PDF vb) │  │
│  └───────────┘  └──────────┘  └──────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Yönetim Paneli (Auto-Update, Backup, Logs)  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
  ┌─────────────┐          ┌──────────────┐
  │  GİB API    │          │  Entegratör  │
  │  (E-Fatura) │          │  (Foriba/    │
  │             │          │   İzibiz)    │
  └─────────────┘          └──────────────┘
```

### 2.2 Teknoloji Stack Kararları

| Katman | Teknoloji | Gerekçe |
|--------|-----------|---------|
| **Frontend** | Next.js 15 + React 19 | SSR desteği, SEO, hızlı sayfa geçişleri, App Router |
| **UI Kit** | shadcn/ui + Tailwind CSS 4 | Erişilebilir, özelleştirilebilir, hafif |
| **Backend** | Node.js 22 LTS + Fastify 5 | Yüksek performans, düşük bellek, TypeScript native |
| **ORM** | Drizzle ORM | Type-safe, hafif, migration desteği, SQL-first yaklaşım |
| **Veritabanı** | PostgreSQL 16 | ACID uyumluluk, JSON desteği, muhasebe için en güvenilir |
| **Cache/Queue** | Redis 7 (Valkey) | Oturum, cache, background job queue (BullMQ) |
| **Dosya Depolama** | MinIO | S3 uyumlu, self-hosted, fatura/belge arşivi |
| **Containerization** | Docker + Docker Compose | Tek komutla kurulum, izole ortam |
| **Reverse Proxy** | Caddy | Otomatik SSL (Let's Encrypt), sıfır konfigürasyon |
| **Monorepo** | Turborepo | Frontend + Backend + Shared paketler tek repoda |
| **Dil** | TypeScript 5.x (strict) | Uçtan uca tip güvenliği |
| **API Protokolü** | tRPC + REST hybrid | Dahili iletişimde tRPC, dış entegrasyonlarda REST |
| **Test** | Vitest + Playwright | Unit/Integration/E2E test coverage |
| **CI/CD** | GitHub Actions | Otomatik test, build, release |

### 2.3 Neden Bu Stack?

**Single-tenant (Tekil Kiracı) Mimarisi seçildi çünkü:**
- Her VPS kendi veritabanına sahip → Veri izolasyonu garantili
- Bir müşterinin sorunu diğerlerini etkilemez
- KVKK uyumluluğu doğal olarak sağlanır
- Yatay ölçekleme = yeni VPS eklemek kadar basit
- Müşteri istediği zaman verisini export edip taşıyabilir

**Multi-tenancy alternatifi değerlendirildi ve reddedildi çünkü:**
- Merkezi sunucu single point of failure
- KVKK açısından veri izolasyonu karmaşıklaşır
- Bir müşterinin yoğun kullanımı diğerlerini etkiler
- VPS/VDS iş modeli ile çelişir

### 2.4 Minimum Sistem Gereksinimleri

| Kaynak | Minimum | Önerilen |
|--------|---------|----------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB SSD | 50 GB SSD |
| OS | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |
| Docker | 24.0+ | En güncel |

---

## 3. Fonksiyonel Gereksinimler

### 3.1 Faz 1 - Temel Muhasebe Çekirdeği (MVP)

**Süre Tahmini: 8-10 hafta**

#### 3.1.1 Kullanıcı Yönetimi ve Kimlik Doğrulama

| ID | Gereksinim | Öncelik | Detay |
|----|-----------|---------|-------|
| AUTH-001 | Email/şifre ile giriş | P0 | Argon2id hash, brute-force koruması |
| AUTH-002 | İki faktörlü doğrulama (2FA) | P0 | TOTP (Google Authenticator uyumlu) |
| AUTH-003 | Rol tabanlı yetkilendirme (RBAC) | P0 | Admin, Muhasebeci, Görüntüleyici, Sınırlı rolleri |
| AUTH-004 | Oturum yönetimi | P0 | JWT (access) + Refresh token, Redis-backed sessions |
| AUTH-005 | Şifre politikası | P0 | Min 12 karakter, complexity rules, breach check |
| AUTH-006 | Audit log | P0 | Tüm giriş/çıkış/işlem kayıtları |
| AUTH-007 | IP bazlı erişim kısıtlama | P1 | Whitelist/Blacklist IP desteği |
| AUTH-008 | SSO desteği | P2 | SAML 2.0 / OIDC (gelecek faz) |

**Rol Matrisi:**

| Yetki | Admin | Muhasebeci | Görüntüleyici | Sınırlı |
|-------|-------|------------|---------------|---------|
| Kullanıcı yönetimi | ✅ | ❌ | ❌ | ❌ |
| Fatura oluşturma | ✅ | ✅ | ❌ | ❌ |
| Fatura görüntüleme | ✅ | ✅ | ✅ | Kendi faturaları |
| Raporlar | ✅ | ✅ | ✅ | ❌ |
| Ayarlar | ✅ | Kısıtlı | ❌ | ❌ |
| Yedekleme | ✅ | ❌ | ❌ | ❌ |
| GİB entegrasyonu | ✅ | ✅ | ❌ | ❌ |

#### 3.1.2 Firma/İşletme Yönetimi

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| FIRM-001 | Çoklu firma desteği (tek instance'da birden fazla firma) | P0 |
| FIRM-002 | Firma bilgileri (VKN/TCKN, unvan, adres, vergi dairesi) | P0 |
| FIRM-003 | Firma logosu ve mühür yükleme | P1 |
| FIRM-004 | Mali yıl tanımlama (Ocak-Aralık veya özel dönem) | P0 |
| FIRM-005 | Şube/Departman yönetimi | P1 |
| FIRM-006 | Firma bazlı ayarlar (para birimi, KDV oranları) | P0 |

#### 3.1.3 Hesap Planı (Tekdüzen Hesap Planı)

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| COA-001 | Tekdüzen Hesap Planı şablonu (1-7 ana grup) | P0 |
| COA-002 | Özel alt hesap ekleme/düzenleme | P0 |
| COA-003 | Hesap planı ağaç görünümü | P0 |
| COA-004 | Hesap bazlı bakiye sorgulama | P0 |
| COA-005 | Hesap planı import/export (Excel, JSON) | P1 |
| COA-006 | Hesap planı şablonları (sektöre özel) | P2 |

**Tekdüzen Hesap Planı Ana Grupları:**

```
1 - DÖNEN VARLIKLAR
  10 - Hazır Değerler
    100 - Kasa
    101 - Alınan Çekler
    102 - Bankalar
    103 - Verilen Çekler ve Ödeme Emirleri (-)
    108 - Diğer Hazır Değerler
  11 - Menkul Kıymetler
  12 - Ticari Alacaklar
    120 - Alıcılar
    121 - Alacak Senetleri
    126 - Verilen Depozito ve Teminatlar
  ...
2 - DURAN VARLIKLAR
3 - KISA VADELİ YABANCI KAYNAKLAR
4 - UZUN VADELİ YABANCI KAYNAKLAR
5 - ÖZKAYNAKLAR
6 - GELİR TABLOSU HESAPLARI
  600 - Yurtiçi Satışlar
  610 - Satıştan İadeler (-)
  620 - Satış İskontoları (-)
  ...
7 - MALİYET HESAPLARI
```

#### 3.1.4 Yevmiye Kaydı (Muhasebe Fişleri)

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| JE-001 | Manuel yevmiye kaydı girişi | P0 |
| JE-002 | Borç-Alacak dengesi kontrolü (çift taraflı kayıt) | P0 |
| JE-003 | Fiş türleri: Mahsup, Tahsil, Tediye, Açılış, Kapanış | P0 |
| JE-004 | Otomatik fiş numaralama (yıl/ay bazlı seri) | P0 |
| JE-005 | Fiş taslak/onay/iptal durumları | P0 |
| JE-006 | Fiş şablonları (tekrarlayan kayıtlar için) | P1 |
| JE-007 | Toplu fiş girişi (Excel import) | P1 |
| JE-008 | Fişe belge/dosya ekleme | P1 |
| JE-009 | Fiş arama ve filtreleme | P0 |
| JE-010 | Fiş kopyalama | P1 |

#### 3.1.5 Cari Hesap Yönetimi

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| CA-001 | Müşteri/Tedarikçi cari kartı oluşturma | P0 |
| CA-002 | Cari hesap ekstre görünümü | P0 |
| CA-003 | VKN/TCKN ile GİB sorgulaması (unvan doğrulama) | P0 |
| CA-004 | Cari hesap bakiye (Borç/Alacak/Bakiye) | P0 |
| CA-005 | Cari hesap mutabakat | P1 |
| CA-006 | Vade takibi ve yaşlandırma analizi | P1 |
| CA-007 | Cari hesap limiti belirleme | P2 |
| CA-008 | Toplu cari import (Excel) | P1 |
| CA-009 | Cari hesap etiketleme/gruplama | P1 |

#### 3.1.6 Temel Raporlar

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| RPT-001 | Mizan (Aylık/Dönemsel) | P0 |
| RPT-002 | Yevmiye defteri | P0 |
| RPT-003 | Kebir (Büyük Defter) | P0 |
| RPT-004 | Bilanço | P0 |
| RPT-005 | Gelir Tablosu | P0 |
| RPT-006 | Cari hesap ekstre raporu | P0 |
| RPT-007 | Kasa raporu | P0 |
| RPT-008 | Banka raporu | P0 |
| RPT-009 | Rapor PDF/Excel export | P0 |

---

### 3.2 Faz 2 - Faturalama ve E-Belge Entegrasyonu

**Süre Tahmini: 8-10 hafta**

#### 3.2.1 Fatura Yönetimi

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| INV-001 | Satış faturası oluşturma | P0 |
| INV-002 | Alış faturası kaydetme | P0 |
| INV-003 | İade faturası | P0 |
| INV-004 | Proforma fatura | P1 |
| INV-005 | Fatura kalemlerinde KDV hesaplama (dahil/hariç) | P0 |
| INV-006 | Çoklu KDV oranı desteği (%1, %10, %20) | P0 |
| INV-007 | Tevkifat (stopaj) hesaplama | P0 |
| INV-008 | İskonto (satır bazlı / toplam) | P0 |
| INV-009 | ÖİV, ÖTV hesaplama | P1 |
| INV-010 | Fatura otomatik muhasebe kaydı oluşturma | P0 |
| INV-011 | Fatura şablonları (özelleştirilebilir) | P1 |
| INV-012 | Seri fatura (toplu faturalama) | P2 |
| INV-013 | Dövizli fatura desteği (USD, EUR, GBP vb.) | P1 |
| INV-014 | TCMB kur otomatik çekme | P1 |

**KDV Tevkifat Oranları (Güncel):**

| Tevkifat Türü | Oran |
|---------------|------|
| İşgücü temin hizmetleri | 9/10 |
| Yapım işleri | 4/10 |
| Etüt, plan-proje, danışmanlık | 9/10 |
| Makine, teçhizat bakım-onarım | 7/10 |
| Yemek servisi | 5/10 |
| Yapı denetim hizmetleri | 9/10 |
| Temizlik hizmetleri | 9/10 |
| Servis taşımacılığı | 5/10 |
| Baskı ve basım hizmetleri | 7/10 |
| Ticari reklam hizmetleri | 3/10 |

#### 3.2.2 E-Fatura Entegrasyonu

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| EF-001 | E-Fatura gönderme (UBL-TR 1.2.1 formatı) | P0 |
| EF-002 | E-Fatura alma ve işleme | P0 |
| EF-003 | Özel Entegratör API entegrasyonu (Foriba/İzibiz/QNB) | P0 |
| EF-004 | E-Fatura mükellef sorgulama | P0 |
| EF-005 | E-Arşiv Fatura gönderme | P0 |
| EF-006 | Fatura durumu takibi (gönderildi/kabul/red/iptal) | P0 |
| EF-007 | Otomatik e-fatura/e-arşiv yönlendirme | P0 |
| EF-008 | E-fatura zarf (envelope) yönetimi | P0 |
| EF-009 | Gelen e-fatura otomatik cari eşleştirme | P1 |
| EF-010 | E-fatura şablonları (TEMELFATURA, TICARIFATURA, vb.) | P0 |

**E-Fatura Akışı:**

```
Fatura Oluştur → UBL-TR XML Üret → Dijital İmzala →
  → Entegratör API'ye Gönder → GİB'e İlet →
    → Alıcı Yanıtı (Kabul/Red) → Durumu Güncelle →
      → Muhasebe Kaydı Oluştur
```

**UBL-TR Zorunlu Alanlar:**
- Fatura numarası (ABC2024000000001 formatı - 3 harf + 4 yıl + 9 sıra no)
- Fatura tarihi ve saati
- Fatura türü (SATIS, IADE, TEVKIFAT, ISTISNA, OZELMATRAH, IHRACKAYITLI)
- Para birimi kodu (TRY, USD, EUR vb.)
- Gönderici/Alıcı bilgileri (VKN/TCKN, Unvan, Adres)
- Vergi dairesi
- Fatura kalemleri (miktar, birim fiyat, KDV oranı, tutar)

#### 3.2.3 E-İrsaliye

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| EW-001 | E-İrsaliye oluşturma ve gönderme | P1 |
| EW-002 | Gelen e-irsaliye işleme | P1 |
| EW-003 | E-İrsaliye yanıt (kabul/red) | P1 |
| EW-004 | İrsaliyeden faturaya dönüştürme | P1 |

#### 3.2.4 E-Defter

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| ED-001 | Yevmiye defteri XBRL-GL formatında üretme | P0 |
| ED-002 | Kebir defteri XBRL-GL formatında üretme | P0 |
| ED-003 | E-defter berat oluşturma | P0 |
| ED-004 | GİB'e berat gönderme | P0 |
| ED-005 | Aylık e-defter dönem kapanışı | P0 |
| ED-006 | E-defter doğrulama (şema validasyonu) | P0 |
| ED-007 | E-defter arşivleme (yasal saklama süresi: 10 yıl) | P0 |

**E-Defter Takvimi:**
- Her ayın e-defteri takip eden 3. ayın sonuna kadar oluşturulmalı
- Beratlar GİB'e süresinde gönderilmeli
- Aralık ayı defteri Gelir Vergisi mükelleflerinde Haziran sonuna kadar

---

### 3.3 Faz 3 - İleri Muhasebe ve Beyanname

**Süre Tahmini: 8-10 hafta**

#### 3.3.1 Vergi Beyannameleri

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| TAX-001 | KDV Beyannamesi (KDV-1) hazırlama | P0 |
| TAX-002 | Muhtasar ve Prim Hizmet Beyannamesi | P0 |
| TAX-003 | Geçici Vergi Beyannamesi | P0 |
| TAX-004 | Yıllık Gelir/Kurumlar Vergisi | P1 |
| TAX-005 | Damga Vergisi Beyannamesi | P1 |
| TAX-006 | Beyanname taslak oluşturma ve doğrulama | P0 |
| TAX-007 | Beyanname verilerini e-Beyanname formatına export | P0 |
| TAX-008 | Vergi takvimi ve hatırlatıcılar | P0 |
| TAX-009 | Beyanname geçmiş dönem karşılaştırma | P1 |

**KDV Beyannamesi Otomatik Hesaplama:**
```
Hesaplanan KDV (391) - İndirilecek KDV (191) = Ödenecek/Devreden KDV
  + Tevkifatlı İşlemler
  + İstisna Kapsamındaki İşlemler
  + İhracat İstisnası
  = KDV-1 Beyannamesi
```

#### 3.3.2 Banka Entegrasyonu

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| BANK-001 | Banka hesap tanımlama (çoklu banka/hesap) | P0 |
| BANK-002 | Banka ekstresi import (CSV/OFX/MT940) | P1 |
| BANK-003 | Otomatik banka mutabakatı (bank reconciliation) | P1 |
| BANK-004 | Banka ekstresi → muhasebe kaydı eşleştirme | P1 |
| BANK-005 | Open Banking API entegrasyonu (PSD2) | P2 |

#### 3.3.3 Stok/Envanter Yönetimi

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| STK-001 | Stok kartı tanımlama (barkod, SKU) | P1 |
| STK-002 | Stok giriş/çıkış hareketleri | P1 |
| STK-003 | Stok değerleme (FIFO, Ağırlıklı Ortalama) | P1 |
| STK-004 | Depo yönetimi (çoklu depo) | P2 |
| STK-005 | Stok sayım işlemi | P2 |
| STK-006 | Minimum stok uyarısı | P2 |
| STK-007 | Stok raporu ve hareket dökümü | P1 |

#### 3.3.4 Çek/Senet Takibi

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| CHK-001 | Alınan çek kaydı ve portföy takibi | P1 |
| CHK-002 | Verilen çek kaydı | P1 |
| CHK-003 | Çek durumları (portföyde, tahsilde, tahsil edildi, karşılıksız) | P1 |
| CHK-004 | Senet takibi (alınan/verilen) | P1 |
| CHK-005 | Çek/Senet vade takibi ve uyarıları | P1 |
| CHK-006 | Çek ciro (endorsement) işlemi | P1 |

#### 3.3.5 Sabit Kıymet Yönetimi

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| FA-001 | Sabit kıymet kartı oluşturma | P1 |
| FA-002 | Amortisman hesaplama (Normal, Azalan Bakiyeler) | P1 |
| FA-003 | Amortisman otomatik muhasebe kaydı | P1 |
| FA-004 | Sabit kıymet satış/hurda işlemi | P2 |
| FA-005 | Maliye amortisman oranları tablosu (VUK) | P1 |

---

### 3.4 Faz 4 - İleri Özellikler ve Entegrasyonlar

**Süre Tahmini: 8-10 hafta**

#### 3.4.1 Dashboard ve Analitik

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| DASH-001 | Ana sayfa dashboard (özet göstergeler) | P0 |
| DASH-002 | Nakit akış grafiği | P1 |
| DASH-003 | Gelir/Gider trend analizi | P1 |
| DASH-004 | Vadesi gelen alacak/borç uyarıları | P1 |
| DASH-005 | KDV özet tablosu (aylık) | P1 |
| DASH-006 | Özelleştirilebilir widget'lar | P2 |
| DASH-007 | Finansal oran analizi (likidite, kaldıraç vb.) | P2 |

#### 3.4.2 Otomasyon ve İş Akışları

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| AUTO-001 | Tekrarlayan işlem şablonları (kira, maaş vb.) | P1 |
| AUTO-002 | Otomatik fiş oluşturma kuralları | P1 |
| AUTO-003 | Dönem sonu kapanış sihirbazı | P1 |
| AUTO-004 | Bildirim sistemi (e-posta, tarayıcı) | P1 |
| AUTO-005 | Webhook desteği (dış entegrasyonlar) | P2 |
| AUTO-006 | API (3. parti entegrasyonlar için REST API) | P1 |

#### 3.4.3 Muhasebe Bürosu Özellikleri

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| OFFICE-001 | Çoklu firma yönetimi (tek panelden) | P0 |
| OFFICE-002 | Firma bazlı kullanıcı yetkilendirme | P0 |
| OFFICE-003 | Firma arası veri izolasyonu | P0 |
| OFFICE-004 | Toplu beyanname hazırlama | P1 |
| OFFICE-005 | Müşteri portalı (müşterilere sınırlı erişim) | P2 |
| OFFICE-006 | Görev/iş takibi (hangi firma ne durumda) | P2 |

#### 3.4.4 E-Ticaret Entegrasyonları

| ID | Gereksinim | Öncelik |
|----|-----------|---------|
| ECOM-001 | Trendyol entegrasyonu (sipariş → fatura) | P2 |
| ECOM-002 | Hepsiburada entegrasyonu | P2 |
| ECOM-003 | Amazon TR entegrasyonu | P2 |
| ECOM-004 | WooCommerce / Shopify entegrasyonu | P2 |
| ECOM-005 | Otomatik e-fatura/e-arşiv oluşturma | P2 |

---

## 4. Fonksiyonel Olmayan Gereksinimler (NFR)

### 4.1 Performans

| ID | Gereksinim | Hedef |
|----|-----------|-------|
| PERF-001 | Sayfa yüklenme süresi (ilk yükleme) | < 2 saniye |
| PERF-002 | API yanıt süresi (95. persentil) | < 200ms |
| PERF-003 | Fatura oluşturma ve kaydetme | < 1 saniye |
| PERF-004 | Mizan raporu üretme (1 yıllık veri) | < 3 saniye |
| PERF-005 | Eş zamanlı kullanıcı desteği (2GB RAM) | 10+ kullanıcı |
| PERF-006 | Yıllık fiş kapasitesi | 500.000+ fiş |
| PERF-007 | Veritabanı sorgu optimizasyonu | Index stratejisi |

### 4.2 Güvenlik

| ID | Gereksinim | Detay |
|----|-----------|-------|
| SEC-001 | HTTPS zorunluluğu | TLS 1.3, otomatik Let's Encrypt |
| SEC-002 | Şifre güvenliği | Argon2id hashing, min 12 karakter |
| SEC-003 | Brute-force koruması | Rate limiting: 5 deneme/15dk, progressive delay |
| SEC-004 | SQL Injection koruması | Parameterized queries (Drizzle ORM) |
| SEC-005 | XSS koruması | CSP headers, React otomatik escape, DOMPurify |
| SEC-006 | CSRF koruması | SameSite cookies + CSRF token |
| SEC-007 | Veri şifreleme (at rest) | AES-256-GCM hassas alanlar, pgcrypto |
| SEC-008 | Veri şifreleme (in transit) | TLS 1.3 |
| SEC-009 | Session güvenliği | HttpOnly, Secure, SameSite=Strict cookies |
| SEC-010 | Audit trail | Tüm CRUD işlemleri loglanır, silinmez |
| SEC-011 | Yedekleme şifreleme | Backup dosyaları AES-256 ile şifreli |
| SEC-012 | Dependency güvenlik taraması | npm audit, Snyk entegrasyonu CI/CD'de |
| SEC-013 | Container güvenliği | Non-root user, read-only filesystem, security scanning |
| SEC-014 | API rate limiting | Per-user ve per-IP rate limit |
| SEC-015 | Input validation | Zod schema validation tüm input'larda |
| SEC-016 | Dosya yükleme güvenliği | Tip kontrolü, boyut limiti, virus tarama |
| SEC-017 | Otomatik güvenlik güncellemeleri | Dependabot + otomatik patch |

**OWASP Top 10 Uyumluluk Matrisi:**

| OWASP Risk | Önlem |
|------------|-------|
| A01 - Broken Access Control | RBAC, row-level security, IDOR koruması |
| A02 - Cryptographic Failures | TLS 1.3, Argon2id, AES-256-GCM |
| A03 - Injection | Parameterized queries, Zod validation |
| A04 - Insecure Design | Threat modeling, security review |
| A05 - Security Misconfiguration | Hardened Docker, security headers |
| A06 - Vulnerable Components | Dependency scanning, auto-update |
| A07 - Auth Failures | 2FA, session management, brute-force protection |
| A08 - Data Integrity Failures | Signed updates, integrity checks |
| A09 - Logging Failures | Comprehensive audit trail |
| A10 - SSRF | Input validation, egress filtering |

### 4.3 KVKK (Kişisel Verilerin Korunması Kanunu) Uyumluluğu

| ID | Gereksinim | Detay |
|----|-----------|-------|
| KVKK-001 | Veri envanteri | Hangi kişisel veri nerede, nasıl saklanıyor |
| KVKK-002 | Açık rıza yönetimi | Kullanıcı onay mekanizması |
| KVKK-003 | Veri silme (Unutulma hakkı) | Kişisel veri anonimleştirme/silme |
| KVKK-004 | Veri taşınabilirliği | JSON/CSV export |
| KVKK-005 | Veri işleme kaydı | VERBİS uyumlu kayıt tutma |
| KVKK-006 | Veri ihlali bildirimi | 72 saat içinde bildirim mekanizması |
| KVKK-007 | Yasal saklama süreleri | Muhasebe verileri: 10 yıl (VUK md. 253) |
| KVKK-008 | Veri minimizasyonu | Sadece gerekli veri toplanır |

**Dikkat:** Self-hosted mimari KVKK uyumluluğunu kolaylaştırır çünkü:
- Veri lokasyonu müşterinin kontrolündedir
- Üçüncü taraf veri paylaşımı minimize edilir
- Her instance kendi veri envanterine sahiptir

### 4.4 Erişilebilirlik

| ID | Gereksinim | Detay |
|----|-----------|-------|
| A11Y-001 | WCAG 2.1 AA uyumluluğu | Tüm sayfalarda |
| A11Y-002 | Klavye navigasyonu | Tüm işlemler klavye ile yapılabilir |
| A11Y-003 | Ekran okuyucu desteği | ARIA labels |
| A11Y-004 | Renk kontrast oranı | Minimum 4.5:1 |
| A11Y-005 | Responsive tasarım | Mobil/tablet/desktop |

### 4.5 Güvenilirlik ve Yedekleme

| ID | Gereksinim | Detay |
|----|-----------|-------|
| REL-001 | Otomatik veritabanı yedekleme | Günlük, şifreli, sıkıştırılmış |
| REL-002 | Point-in-time recovery | PostgreSQL WAL arşivleme |
| REL-003 | Yedekleme doğrulama | Haftalık otomatik restore testi |
| REL-004 | Uzak yedekleme | S3/MinIO, isteğe bağlı harici depolama |
| REL-005 | Yedekten geri dönüş | Tek komutla restore |
| REL-006 | Uptime hedefi | %99.5 (yıllık ~43 saat kesinti) |
| REL-007 | Graceful degradation | Redis çökerse uygulama çalışmaya devam eder |
| REL-008 | Health check endpoint | /health ile sistem durumu kontrolü |
| REL-009 | Otomatik restart | Docker restart policy: unless-stopped |

### 4.6 Gözlemlenebilirlik (Observability)

| ID | Gereksinim | Detay |
|----|-----------|-------|
| OBS-001 | Yapılandırılmış loglama | JSON formatında, Pino logger |
| OBS-002 | Log seviyeleri | ERROR, WARN, INFO, DEBUG |
| OBS-003 | Log rotasyonu | Günlük rotasyon, 30 gün saklama |
| OBS-004 | Hata izleme | Sentry (self-hosted veya cloud) |
| OBS-005 | Metrikler | Prometheus formatında /metrics endpoint |
| OBS-006 | Sistem monitöring | CPU, RAM, Disk kullanımı dashboard |
| OBS-007 | Uygulama metrikleri | İstek/saniye, yanıt süresi, hata oranı |

---

## 5. Veritabanı Tasarımı

### 5.1 Temel Şema (Core Schema)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   tenants    │────<│    users      │     │  fiscal_years    │
│─────────────│     │──────────────│     │──────────────────│
│ id (PK)     │     │ id (PK)      │     │ id (PK)          │
│ name        │     │ tenant_id(FK)│     │ tenant_id (FK)   │
│ tax_id      │     │ email        │     │ start_date       │
│ tax_office  │     │ password_hash│     │ end_date         │
│ address     │     │ role         │     │ is_closed        │
│ settings    │     │ is_active    │     │ is_current       │
│ created_at  │     │ mfa_secret   │     └──────────────────┘
└─────────────┘     └──────────────┘

┌──────────────────┐     ┌──────────────────┐
│  chart_of_accts  │     │  journal_entries  │
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │
│ tenant_id (FK)   │     │ tenant_id (FK)   │
│ code (100-799)   │     │ fiscal_year_id   │
│ name             │     │ entry_no         │
│ parent_id (FK)   │     │ entry_date       │
│ type (A/L/E/R/X) │     │ entry_type       │
│ is_system        │     │ description      │
│ is_active        │     │ status           │
│ level            │     │ created_by (FK)  │
└──────────────────┘     │ approved_by (FK) │
                         └──────────────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐     ┌──────────────────┐
│  account_balances│     │  journal_lines   │
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │
│ account_id (FK)  │     │ entry_id (FK)    │
│ period (YYYY-MM) │     │ account_id (FK)  │
│ debit_total      │     │ debit_amount     │
│ credit_total     │     │ credit_amount    │
│ balance          │     │ description      │
└──────────────────┘     │ contact_id (FK)  │
                         │ currency         │
                         │ exchange_rate    │
                         └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│    contacts      │     │    invoices      │
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │
│ tenant_id (FK)   │     │ tenant_id (FK)   │
│ type (C/S/B)     │     │ contact_id (FK)  │
│ tax_id           │     │ invoice_no       │
│ name             │     │ invoice_date     │
│ email            │     │ due_date         │
│ phone            │     │ type (sale/purch)│
│ address          │     │ status           │
│ tax_office       │     │ subtotal         │
│ credit_limit     │     │ tax_total        │
│ balance          │     │ grand_total      │
└──────────────────┘     │ currency         │
                         │ e_invoice_status │
                         │ journal_entry_id │
                         └──────────────────┘
                                │
                         ┌──────────────────┐
                         │  invoice_lines   │
                         │──────────────────│
                         │ id (PK)          │
                         │ invoice_id (FK)  │
                         │ product_id (FK)  │
                         │ description      │
                         │ quantity         │
                         │ unit_price       │
                         │ discount_rate    │
                         │ tax_rate         │
                         │ withholding_rate │
                         │ line_total       │
                         └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│   audit_logs     │     │   documents      │
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │
│ tenant_id (FK)   │     │ tenant_id (FK)   │
│ user_id (FK)     │     │ entity_type      │
│ action           │     │ entity_id        │
│ entity_type      │     │ file_name        │
│ entity_id        │     │ file_path (MinIO)│
│ old_values (JSON)│     │ mime_type        │
│ new_values (JSON)│     │ size_bytes       │
│ ip_address       │     │ created_at       │
│ user_agent       │     └──────────────────┘
│ created_at       │
└──────────────────┘
```

### 5.2 Veritabanı Tasarım Prensipleri

1. **Çift Taraflı Kayıt Bütünlüğü:** `journal_lines` tablosunda her entry için `SUM(debit) = SUM(credit)` constraint
2. **Immutable Ledger:** Onaylanmış fişler güncellenemez, sadece ters kayıt ile düzeltilebilir
3. **Soft Delete:** Muhasebe verileri asla fiziksel olarak silinmez (`is_deleted` + `deleted_at`)
4. **Temporal Data:** Tüm tablolarda `created_at`, `updated_at` alanları
5. **Multi-currency:** Her satırda `currency` ve `exchange_rate` bilgisi
6. **Audit Trail:** Tüm değişiklikler `audit_logs` tablosuna yazılır
7. **Partitioning:** `journal_lines` ve `audit_logs` tabloları yıl bazlı partitioning

### 5.3 İndeks Stratejisi

```sql
-- Yüksek performanslı sorgular için kritik indeksler
CREATE INDEX idx_journal_entries_tenant_date ON journal_entries(tenant_id, entry_date);
CREATE INDEX idx_journal_entries_tenant_status ON journal_entries(tenant_id, status);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id, entry_id);
CREATE INDEX idx_journal_lines_contact ON journal_lines(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_contacts_tenant_taxid ON contacts(tenant_id, tax_id);
CREATE INDEX idx_invoices_tenant_date ON invoices(tenant_id, invoice_date);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_audit_logs_tenant_date ON audit_logs(tenant_id, created_at);
CREATE INDEX idx_account_balances_period ON account_balances(account_id, period);
```

---

## 6. API Tasarımı

### 6.1 API Mimarisi

```
Frontend (Next.js) ←→ tRPC ←→ Backend (Fastify)
                                    │
External Systems   ←→ REST API ←→ Backend
(Entegratör, vb.)
```

### 6.2 tRPC Router Yapısı

```typescript
// Dahili API (Frontend ↔ Backend)
appRouter
├── auth
│   ├── login
│   ├── logout
│   ├── refreshToken
│   ├── enable2FA
│   └── verify2FA
├── tenant
│   ├── get
│   ├── update
│   └── getSettings
├── accounts
│   ├── list
│   ├── getTree
│   ├── create
│   ├── update
│   └── getBalance
├── journalEntries
│   ├── list
│   ├── get
│   ├── create
│   ├── approve
│   ├── reject
│   └── reverse
├── contacts
│   ├── list
│   ├── get
│   ├── create
│   ├── update
│   ├── getStatement
│   └── verifyTaxId
├── invoices
│   ├── list
│   ├── get
│   ├── create
│   ├── update
│   ├── delete (draft only)
│   ├── sendEInvoice
│   └── getEInvoiceStatus
├── reports
│   ├── trialBalance
│   ├── generalLedger
│   ├── journalBook
│   ├── balanceSheet
│   ├── incomeStatement
│   └── export
├── eInvoice
│   ├── send
│   ├── receive
│   ├── checkStatus
│   ├── queryTaxpayer
│   └── getArchive
├── eLedger
│   ├── generate
│   ├── validate
│   ├── submitBerat
│   └── getStatus
└── admin
    ├── backup
    ├── restore
    ├── getLogs
    ├── getSystemInfo
    └── updateSettings
```

### 6.3 REST API (Dış Entegrasyonlar)

```
# Harici API - API Key + HMAC imzalı
POST   /api/v1/invoices          # Fatura oluştur
GET    /api/v1/invoices/:id      # Fatura detayı
GET    /api/v1/invoices          # Fatura listesi
POST   /api/v1/contacts          # Cari hesap oluştur
GET    /api/v1/contacts/:id      # Cari hesap detayı
GET    /api/v1/reports/balance   # Mizan
POST   /api/v1/webhooks          # Webhook kaydı
```

---

## 7. Proje Yapısı

```
muhasebe/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── app/                      # App Router
│   │   │   ├── (auth)/               # Login, Register sayfaları
│   │   │   ├── (dashboard)/          # Ana uygulama
│   │   │   │   ├── layout.tsx        # Dashboard layout (sidebar, header)
│   │   │   │   ├── page.tsx          # Dashboard ana sayfa
│   │   │   │   ├── accounts/         # Hesap planı
│   │   │   │   ├── journal/          # Yevmiye/Fiş girişi
│   │   │   │   ├── contacts/         # Cari hesaplar
│   │   │   │   ├── invoices/         # Faturalar
│   │   │   │   ├── reports/          # Raporlar
│   │   │   │   ├── e-invoice/        # E-Fatura
│   │   │   │   ├── e-ledger/         # E-Defter
│   │   │   │   ├── tax/              # Beyannameler
│   │   │   │   ├── banking/          # Banka
│   │   │   │   ├── inventory/        # Stok
│   │   │   │   ├── checks/           # Çek/Senet
│   │   │   │   ├── fixed-assets/     # Sabit kıymetler
│   │   │   │   └── settings/         # Ayarlar
│   │   │   └── api/                  # API routes
│   │   ├── components/               # React bileşenleri
│   │   │   ├── ui/                   # shadcn/ui bileşenleri
│   │   │   ├── forms/                # Form bileşenleri
│   │   │   ├── tables/               # Tablo bileşenleri
│   │   │   ├── charts/               # Grafik bileşenleri
│   │   │   └── layout/               # Layout bileşenleri
│   │   ├── lib/                      # Yardımcı fonksiyonlar
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── stores/                   # Zustand state yönetimi
│   │   └── styles/                   # Global stiller
│   │
│   └── api/                          # Fastify Backend
│       ├── src/
│       │   ├── server.ts             # Fastify server setup
│       │   ├── config/               # Konfigürasyon
│       │   ├── routes/               # REST API rotaları
│       │   ├── trpc/                 # tRPC router ve prosedürler
│       │   │   ├── router.ts
│       │   │   ├── auth.ts
│       │   │   ├── accounts.ts
│       │   │   ├── journal.ts
│       │   │   ├── contacts.ts
│       │   │   ├── invoices.ts
│       │   │   ├── reports.ts
│       │   │   ├── e-invoice.ts
│       │   │   └── e-ledger.ts
│       │   ├── services/             # İş mantığı
│       │   │   ├── accounting.service.ts
│       │   │   ├── invoice.service.ts
│       │   │   ├── e-invoice.service.ts
│       │   │   ├── e-ledger.service.ts
│       │   │   ├── report.service.ts
│       │   │   ├── tax.service.ts
│       │   │   └── backup.service.ts
│       │   ├── modules/              # E-belge modülleri
│       │   │   ├── ubl-tr/           # UBL-TR XML oluşturucu
│       │   │   ├── xbrl-gl/          # XBRL-GL e-defter
│       │   │   └── integrators/      # Entegratör adaptörleri
│       │   ├── middleware/           # Auth, validation, rate-limit
│       │   ├── jobs/                 # Background jobs (BullMQ)
│       │   └── utils/               # Yardımcı fonksiyonlar
│       └── tests/                   # Backend testleri
│
├── packages/
│   ├── db/                           # Drizzle ORM şema & migration
│   │   ├── schema/                   # Tablo tanımları
│   │   ├── migrations/               # SQL migration dosyaları
│   │   ├── seeds/                    # Seed data (hesap planı vb.)
│   │   └── drizzle.config.ts
│   ├── shared/                       # Ortak tipler ve yardımcılar
│   │   ├── types/                    # TypeScript type tanımları
│   │   ├── validators/               # Zod şemaları
│   │   ├── constants/                # Sabitler (KDV oranları vb.)
│   │   └── utils/                    # Ortak yardımcı fonksiyonlar
│   └── ui/                           # Paylaşılan UI bileşenleri
│
├── docker/
│   ├── Dockerfile.web                # Frontend Docker image
│   ├── Dockerfile.api                # Backend Docker image
│   ├── docker-compose.yml            # Production compose
│   ├── docker-compose.dev.yml        # Development compose
│   ├── nginx/                        # Nginx konfigürasyonu
│   └── scripts/
│       ├── init-db.sh                # Veritabanı ilk kurulum
│       ├── backup.sh                 # Yedekleme script
│       ├── restore.sh                # Geri yükleme script
│       └── update.sh                 # Güncelleme script
│
├── docs/
│   ├── PRD.md                        # Bu doküman
│   ├── API.md                        # API dokümantasyonu
│   ├── DEPLOYMENT.md                 # Kurulum kılavuzu
│   ├── DEVELOPMENT.md                # Geliştirici kılavuzu
│   └── SECURITY.md                   # Güvenlik politikası
│
├── scripts/
│   ├── install.sh                    # Tek komutla kurulum
│   ├── setup-dev.sh                  # Geliştirme ortamı kurulumu
│   └── generate-keys.sh              # Güvenlik anahtarı üretimi
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Test ve lint
│       ├── release.yml               # Sürüm oluşturma
│       └── security.yml              # Güvenlik taraması
│
├── turbo.json                        # Turborepo konfigürasyonu
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspace
├── tsconfig.base.json                # Paylaşılan TypeScript config
├── .env.example                      # Örnek ortam değişkenleri
└── CLAUDE.md                         # AI geliştirici yardımcısı kuralları
```

---

## 8. Güvenlik Mimarisi

### 8.1 Kimlik Doğrulama Akışı

```
┌──────┐     ┌──────────┐     ┌────────┐     ┌─────────┐
│Client│────>│  Caddy    │────>│Fastify │────>│ Redis   │
│      │     │  (TLS)   │     │ (Auth) │     │(Session)│
└──────┘     └──────────┘     └────────┘     └─────────┘
                                   │
                              ┌────────┐
                              │Postgres│
                              │(Users) │
                              └────────┘
```

**Login Akışı:**
1. Kullanıcı email/şifre gönderir (HTTPS üzerinden)
2. Rate limiter kontrol eder (IP + email bazlı)
3. Argon2id ile şifre doğrulanır
4. 2FA aktifse TOTP kodu istenir
5. JWT access token (15dk) + refresh token (7 gün) üretilir
6. Refresh token Redis'te saklanır
7. Access token HttpOnly cookie ile gönderilir

### 8.2 Veri Şifreleme Katmanları

```
Layer 1: Transport    → TLS 1.3 (Caddy otomatik)
Layer 2: Application  → JWT imzalı tokenlar
Layer 3: Database     → pgcrypto ile hassas alan şifreleme
Layer 4: Storage      → MinIO server-side encryption
Layer 5: Backup       → AES-256-GCM şifreli yedekler
```

### 8.3 Güvenlik Header'ları

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 8.4 Docker Güvenlik Önlemleri

```yaml
# Her container non-root user ile çalışır
security_opt:
  - no-new-privileges:true
read_only: true
tmpfs:
  - /tmp
cap_drop:
  - ALL
cap_add:
  - NET_BIND_SERVICE  # Sadece gerekli capability
```

---

## 9. Test Stratejisi

### 9.1 Test Piramidi

```
        ╱╲
       ╱  ╲         E2E Tests (Playwright)
      ╱    ╲        ~50 senaryo
     ╱──────╲
    ╱        ╲      Integration Tests (Vitest + Supertest)
   ╱          ╲     ~200 test
  ╱────────────╲
 ╱              ╲   Unit Tests (Vitest)
╱                ╲  ~500+ test
╱──────────────────╲
```

### 9.2 Test Kategorileri

| Kategori | Araç | Kapsam | Hedef Coverage |
|----------|------|--------|----------------|
| Unit | Vitest | İş mantığı, hesaplamalar, validasyon | > %90 |
| Integration | Vitest + Supertest | API endpoint'leri, DB işlemleri | > %80 |
| E2E | Playwright | Kritik kullanıcı akışları | > %70 |
| Performans | k6 | API yanıt süreleri, yük testi | Baseline |
| Güvenlik | OWASP ZAP + npm audit | Güvenlik açıkları | Sıfır kritik |
| Erişilebilirlik | axe-core + Playwright | WCAG 2.1 AA | Sıfır violation |

### 9.3 Kritik Test Senaryoları

#### Muhasebe Çekirdeği Testleri
```
✓ Yevmiye kaydında borç-alacak dengesi kontrolü
✓ Borç-alacak eşit olmayan fiş reddedilmeli
✓ Onaylanmış fiş güncellenemez
✓ Fiş ters kayıtla düzeltilir
✓ Mizan borç-alacak toplamları eşit olmalı
✓ Hesap bakiyesi doğru hesaplanmalı
✓ Dönem kapanış işlemi doğru çalışmalı
✓ Çoklu para birimi kur farkı hesaplaması
✓ KDV tevkifat hesaplaması doğruluğu
✓ Fiş numarası sıralı ve benzersiz olmalı
```

#### E-Fatura Testleri
```
✓ UBL-TR XML şema validasyonu
✓ Zorunlu alanların kontrolü
✓ E-Fatura mükellef sorgulama
✓ Fatura gönderme ve yanıt işleme
✓ E-Arşiv fatura oluşturma
✓ Fatura durumu güncelleme
✓ Entegratör API hata yönetimi
```

#### Güvenlik Testleri
```
✓ SQL injection denemesi engellenmeli
✓ XSS payload'ı sanitize edilmeli
✓ Brute-force koruma çalışmalı
✓ Yetkisiz erişim engellenmeli (IDOR)
✓ CSRF koruması aktif olmalı
✓ Session hijacking koruması
✓ Rate limiting çalışmalı
```

### 9.4 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

stages:
  1. Lint & Type Check
     - ESLint
     - TypeScript strict compilation
     - Prettier format check

  2. Unit Tests
     - Vitest --coverage
     - Minimum %90 coverage gate

  3. Integration Tests
     - PostgreSQL test container
     - Redis test container
     - API endpoint testleri

  4. E2E Tests
     - Playwright (Chromium, Firefox)
     - Kritik akış testleri

  5. Security Scan
     - npm audit --audit-level=high
     - Snyk vulnerability check
     - Docker image scan (Trivy)

  6. Build
     - Docker image build
     - Image size optimization check

  7. Release (main branch only)
     - Semantic versioning
     - Docker image push
     - Changelog generation
```

---

## 10. Dağıtım ve Kurulum

### 10.1 Tek Komutla Kurulum

```bash
# Müşteri sunucusunda çalıştırılacak kurulum komutu
curl -fsSL https://get.finbooks.app | bash

# Veya manuel:
git clone https://github.com/your-org/finbooks.git
cd finbooks
cp .env.example .env
# .env dosyasını düzenle
docker compose up -d
```

### 10.2 Docker Compose (Production)

```yaml
version: "3.9"

services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - web
      - api

  web:
    image: finbooks/web:latest
    environment:
      - API_URL=http://api:3001
    depends_on:
      - api

  api:
    image: finbooks/api:latest
    environment:
      - DATABASE_URL=postgresql://finbooks:${DB_PASS}@postgres:5432/finbooks
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - MINIO_ENDPOINT=minio:9000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: finbooks
      POSTGRES_USER: finbooks
      POSTGRES_PASSWORD: ${DB_PASS}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U finbooks"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASS} --maxmemory 256mb
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASS}

  backup:
    image: finbooks/backup:latest
    volumes:
      - backup_data:/backups
    environment:
      - DATABASE_URL=postgresql://finbooks:${DB_PASS}@postgres:5432/finbooks
      - BACKUP_ENCRYPTION_KEY=${BACKUP_KEY}
      - BACKUP_SCHEDULE=0 2 * * *  # Her gece 02:00

volumes:
  postgres_data:
  redis_data:
  minio_data:
  caddy_data:
  backup_data:
```

### 10.3 Ortam Değişkenleri

```bash
# .env.example
# === Veritabanı ===
DB_PASS=                          # PostgreSQL şifresi (otomatik üretilecek)

# === Redis ===
REDIS_PASS=                       # Redis şifresi

# === Güvenlik ===
JWT_SECRET=                       # JWT imzalama anahtarı (min 64 karakter)
ENCRYPTION_KEY=                   # Veri şifreleme anahtarı (AES-256)
BACKUP_KEY=                       # Yedekleme şifreleme anahtarı

# === MinIO (Dosya Depolama) ===
MINIO_USER=finbooks
MINIO_PASS=                       # MinIO şifresi

# === Uygulama ===
APP_URL=https://muhasebe.example.com
APP_PORT=3000
NODE_ENV=production

# === E-Fatura Entegratör ===
EINVOICE_PROVIDER=foriba          # foriba | izibiz | qnb
EINVOICE_API_URL=
EINVOICE_USERNAME=
EINVOICE_PASSWORD=

# === E-Posta (Bildirimler) ===
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=muhasebe@example.com

# === Opsiyonel: Sentry (Hata İzleme) ===
SENTRY_DSN=
```

### 10.4 Güncelleme Stratejisi

```bash
# Otomatik güncelleme (yönetim panelinden veya CLI)
finbooks update

# Perde arkasında:
# 1. Mevcut sürüm yedeklenir
# 2. Yeni Docker image'lar çekilir
# 3. Veritabanı migration'ları çalıştırılır
# 4. Container'lar sırayla yeniden başlatılır
# 5. Health check sonrası tamamlanır
# 6. Başarısız olursa otomatik rollback
```

---

## 11. Faz Planı ve Yol Haritası

### Faz 1 - Temel Muhasebe Çekirdeği (MVP) — 8-10 Hafta

```
Hafta 1-2: Proje altyapı kurulumu
  ├── Monorepo setup (Turborepo + pnpm)
  ├── Docker Compose development ortamı
  ├── PostgreSQL + Drizzle ORM + migration altyapısı
  ├── Fastify + tRPC backend iskelet
  ├── Next.js + shadcn/ui frontend iskelet
  ├── Auth altyapısı (JWT + 2FA + RBAC)
  └── CI/CD pipeline (GitHub Actions)

Hafta 3-4: Firma ve Hesap Planı
  ├── Firma/işletme yönetimi (CRUD)
  ├── Tekdüzen Hesap Planı (seed data + ağaç yapısı)
  ├── Hesap planı UI (ağaç görünümü, arama, filtreleme)
  ├── Mali yıl yönetimi
  └── Hesap planı import/export

Hafta 5-6: Yevmiye ve Cari Hesap
  ├── Yevmiye kaydı (fiş) girişi
  ├── Borç-alacak denge kontrolü
  ├── Fiş türleri ve durumları
  ├── Cari hesap kartı (müşteri/tedarikçi)
  ├── Cari hesap ekstre
  └── VKN/TCKN doğrulama (GİB sorgusu)

Hafta 7-8: Raporlar ve Dashboard
  ├── Mizan raporu
  ├── Yevmiye defteri
  ├── Kebir (büyük defter)
  ├── Bilanço
  ├── Gelir tablosu
  ├── PDF/Excel export
  └── Dashboard ana sayfa (özet göstergeler)

Hafta 9-10: Test, Güvenlik ve Polish
  ├── Unit testler (%90+ coverage)
  ├── Integration testler
  ├── E2E testler (kritik akışlar)
  ├── Güvenlik testi ve hardening
  ├── Performans optimizasyonu
  ├── Hata düzeltmeleri
  └── Docker production build
```

### Faz 2 - Faturalama ve E-Belge (Hafta 11-20)

```
Hafta 11-12: Fatura Yönetimi
  ├── Satış/Alış fatura oluşturma
  ├── KDV hesaplama (dahil/hariç)
  ├── Tevkifat desteği
  ├── İskonto
  └── Fatura → otomatik muhasebe kaydı

Hafta 13-15: E-Fatura Entegrasyonu
  ├── UBL-TR XML üreteci
  ├── Entegratör API adaptörü (Foriba/İzibiz)
  ├── E-Fatura gönderme/alma
  ├── E-Arşiv Fatura
  ├── Fatura durumu takibi
  └── Mükellef sorgulama

Hafta 16-17: E-Defter
  ├── XBRL-GL yevmiye defteri üreteci
  ├── XBRL-GL kebir defteri üreteci
  ├── Berat oluşturma
  ├── GİB'e berat gönderme
  └── E-defter doğrulama

Hafta 18-20: Test ve Stabilizasyon
  ├── E-fatura test senaryoları
  ├── E-defter doğrulama testleri
  ├── Entegratör API mock testleri
  ├── Performans testi
  └── Üretim ortamı pilot test
```

### Faz 3 - İleri Muhasebe (Hafta 21-30)

```
Hafta 21-23: Vergi Beyannameleri
  ├── KDV Beyannamesi otomatik hazırlama
  ├── Muhtasar Beyanname
  ├── Geçici Vergi
  ├── Vergi takvimi
  └── e-Beyanname export

Hafta 24-26: Banka ve Stok
  ├── Banka hesap yönetimi
  ├── Banka ekstresi import
  ├── Otomatik banka mutabakatı
  ├── Stok kartı ve hareketleri
  └── Stok değerleme

Hafta 27-28: Çek/Senet ve Sabit Kıymet
  ├── Çek/Senet takibi
  ├── Çek portföy yönetimi
  ├── Sabit kıymet kartı
  ├── Amortisman hesaplama
  └── Amortisman muhasebe kaydı

Hafta 29-30: Test ve Optimizasyon
  ├── Kapsamlı test
  ├── Performans optimizasyonu
  ├── Kullanıcı geri bildirimi
  └── Bug fix
```

### Faz 4 - İleri Özellikler (Hafta 31-40)

```
Hafta 31-33: Otomasyon ve Analitik
  ├── Dashboard widget'ları
  ├── Nakit akış analizi
  ├── Tekrarlayan işlem şablonları
  ├── Dönem sonu kapanış sihirbazı
  └── Bildirim sistemi

Hafta 34-36: Muhasebe Bürosu ve API
  ├── Çoklu firma panel yönetimi
  ├── REST API (dış entegrasyonlar)
  ├── Webhook desteği
  ├── API dokümantasyonu
  └── Müşteri portalı

Hafta 37-38: E-Ticaret Entegrasyonları
  ├── Trendyol entegrasyonu
  ├── Hepsiburada entegrasyonu
  └── WooCommerce/Shopify

Hafta 39-40: Final
  ├── Kapsamlı güvenlik auditi
  ├── Yük testi (load testing)
  ├── Dokümantasyon tamamlama
  ├── Kurulum kılavuzu
  └── v1.0 Release
```

---

## 12. Başarı Metrikleri (KPI)

| Metrik | Hedef |
|--------|-------|
| Kurulum süresi (sıfırdan çalışır duruma) | < 10 dakika |
| Sayfa yüklenme süresi | < 2 saniye |
| API yanıt süresi (p95) | < 200ms |
| Uptime | > %99.5 |
| Test coverage | > %85 |
| Sıfır kritik güvenlik açığı | CVE-free |
| E-Fatura başarılı gönderim oranı | > %99 |
| Kullanıcı memnuniyeti (NPS) | > 40 |
| Docker image boyutu | < 500MB toplam |
| RAM kullanımı (idle) | < 512MB |

---

## 13. Riskler ve Azaltma Stratejileri

| Risk | Olasılık | Etki | Azaltma |
|------|---------|------|---------|
| GİB API değişiklikleri | Yüksek | Yüksek | Entegratör kullanımı, adaptör pattern |
| Mevzuat değişiklikleri | Yüksek | Orta | Modüler yapı, konfigürasyon tabanlı KDV/vergi oranları |
| VPS kaynak kısıtlılığı | Orta | Orta | Minimum 2GB RAM hedefi, lazy loading, cache stratejisi |
| Veri kaybı | Düşük | Çok Yüksek | Otomatik yedekleme, WAL arşivleme, yedek doğrulama |
| Güvenlik ihlali | Düşük | Çok Yüksek | Defense-in-depth, düzenli güvenlik taraması |
| Entegratör kesintisi | Orta | Yüksek | Çoklu entegratör desteği, kuyruk ile retry |
| Performans sorunları | Orta | Orta | Yük testi, indeks optimizasyonu, cache |
| Docker uyumluluk | Düşük | Orta | Minimum Docker sürümü belirleme, test matrisi |

---

## 14. Teknik Borç Yönetimi

- Her sprintte %20 zaman teknik borç azaltmaya ayrılacak
- SonarQube veya benzeri statik analiz aracı entegre edilecek
- Teknik borç backlog'u ayrı olarak yönetilecek
- Refactoring kararları kod review sürecinde alınacak
- Performance regression testleri CI'da otomatik çalışacak

---

## 15. Sözlük

| Terim | Açıklama |
|-------|----------|
| **Tekdüzen Hesap Planı** | Türkiye'de yasal olarak zorunlu olan standart muhasebe hesap çerçevesi |
| **Yevmiye** | Muhasebe işlemlerinin kronolojik kaydı |
| **Kebir** | Hesap bazlı kayıtların toplandığı defter |
| **Mizan** | Tüm hesapların borç-alacak bakiyelerini gösteren özet tablo |
| **KDV** | Katma Değer Vergisi |
| **Tevkifat** | Vergi kesintisi (stopaj) |
| **UBL-TR** | Türkiye'ye özgü Universal Business Language formatı |
| **XBRL-GL** | E-defter için kullanılan uluslararası veri formatı |
| **GİB** | Gelir İdaresi Başkanlığı |
| **VKN** | Vergi Kimlik Numarası |
| **TCKN** | T.C. Kimlik Numarası |
| **E-Arşiv** | GİB sistemine kayıtlı olmayan mükelleflere kesilen elektronik fatura |
| **E-İrsaliye** | Elektronik sevk irsaliyesi |
| **Berat** | E-defterin GİB'e gönderilen özet belgesi |
| **Ba/Bs** | Mal alım/satım bildirimleri (Eylül 2024 itibariyle kaldırıldı) |
| **KVKK** | Kişisel Verilerin Korunması Kanunu (Türk GDPR'ı) |
| **SMMM** | Serbest Muhasebeci Mali Müşavir |
| **YMM** | Yeminli Mali Müşavir |
| **VUK** | Vergi Usul Kanunu |

---

## 16. Onay

| Rol | İsim | Tarih | İmza |
|-----|------|-------|------|
| Proje Sahibi | | | |
| Teknik Lider | | | |
| Muhasebe Danışmanı | | | |

---

*Bu doküman yaşayan bir dokümandır ve proje ilerledikçe güncellenecektir.*
