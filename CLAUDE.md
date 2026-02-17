# FinBooks - Self-Hosted Muhasebe Uygulaması

## Proje Yapısı
Bu proje Turborepo + pnpm monorepo yapısındadır.

- `apps/web` - Next.js 15 frontend (React 19, shadcn/ui, Tailwind CSS 4)
- `apps/api` - Fastify 5 backend (tRPC, Drizzle ORM)
- `packages/db` - PostgreSQL 16 veritabanı şeması ve migration'lar
- `packages/shared` - Ortak tipler, validatörler, sabitler, yardımcı fonksiyonlar

## Komutlar
```bash
pnpm install              # Bağımlılıkları yükle
pnpm dev                  # Tüm uygulamaları geliştirme modunda başlat
pnpm build                # Tüm uygulamaları derle
pnpm test                 # Testleri çalıştır
pnpm db:migrate           # Veritabanı migration'larını çalıştır
pnpm db:seed              # Tekdüzen Hesap Planı ve demo veri yükle
docker compose up -d      # PostgreSQL, Redis, MinIO başlat
```

## Mimari Kurallar
- TypeScript strict mode zorunlu
- Tüm API input'ları Zod ile valide edilir
- Çift taraflı kayıt: Her yevmiye kaydında borç = alacak
- Onaylanmış fişler güncellenemez, sadece ters kayıtla düzeltilir
- Tüm CRUD işlemleri audit_logs tablosuna yazılır
- Muhasebe verileri asla fiziksel olarak silinmez (soft delete)
- Tenant isolation: Tüm sorgularda tenant_id filtresi zorunlu

## Türk Muhasebe Kuralları
- Tekdüzen Hesap Planı (1-7 ana grup) kullanılır
- E-Fatura UBL-TR 1.2.1 formatı
- E-Defter XBRL-GL formatı
- KDV oranları: %0, %1, %10, %20
- Fatura numarası: ABC2024000000001 (3 harf + 4 yıl + 9 sıra)
