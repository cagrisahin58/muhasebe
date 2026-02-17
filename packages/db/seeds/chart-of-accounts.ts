/** Tekdüzen Hesap Planı (Türk Muhasebe Standardı) */
export const TEKDUZEN_HESAP_PLANI = [
  // 1 - DÖNEN VARLIKLAR
  { code: "1", name: "DÖNEN VARLIKLAR", type: "asset", level: 1 },

  // 10 - Hazır Değerler
  { code: "10", name: "Hazır Değerler", type: "asset", level: 2 },
  { code: "100", name: "Kasa", type: "asset", level: 3 },
  { code: "100.01", name: "TL Kasası", type: "asset", level: 4 },
  { code: "100.02", name: "Döviz Kasası", type: "asset", level: 4 },
  { code: "101", name: "Alınan Çekler", type: "asset", level: 3 },
  { code: "102", name: "Bankalar", type: "asset", level: 3 },
  { code: "102.01", name: "Vadesiz Mevduat - TL", type: "asset", level: 4 },
  { code: "102.02", name: "Vadesiz Mevduat - Döviz", type: "asset", level: 4 },
  { code: "103", name: "Verilen Çekler ve Ödeme Emirleri (-)", type: "asset", level: 3 },
  { code: "108", name: "Diğer Hazır Değerler", type: "asset", level: 3 },

  // 11 - Menkul Kıymetler
  { code: "11", name: "Menkul Kıymetler", type: "asset", level: 2 },
  { code: "110", name: "Hisse Senetleri", type: "asset", level: 3 },
  { code: "111", name: "Özel Kesim Tahvil Senet ve Bonoları", type: "asset", level: 3 },
  { code: "112", name: "Kamu Kesimi Tahvil Senet ve Bonoları", type: "asset", level: 3 },
  { code: "118", name: "Diğer Menkul Kıymetler", type: "asset", level: 3 },
  { code: "119", name: "Menkul Kıymetler Değer Düşüklüğü Karşılığı (-)", type: "asset", level: 3 },

  // 12 - Ticari Alacaklar
  { code: "12", name: "Ticari Alacaklar", type: "asset", level: 2 },
  { code: "120", name: "Alıcılar", type: "asset", level: 3 },
  { code: "121", name: "Alacak Senetleri", type: "asset", level: 3 },
  { code: "122", name: "Alacak Senetleri Reeskontu (-)", type: "asset", level: 3 },
  { code: "126", name: "Verilen Depozito ve Teminatlar", type: "asset", level: 3 },
  { code: "128", name: "Şüpheli Ticari Alacaklar", type: "asset", level: 3 },
  { code: "129", name: "Şüpheli Ticari Alacaklar Karşılığı (-)", type: "asset", level: 3 },

  // 13 - Diğer Alacaklar
  { code: "13", name: "Diğer Alacaklar", type: "asset", level: 2 },
  { code: "131", name: "Ortaklardan Alacaklar", type: "asset", level: 3 },
  { code: "132", name: "İştiraklerden Alacaklar", type: "asset", level: 3 },
  { code: "135", name: "Personelden Alacaklar", type: "asset", level: 3 },
  { code: "136", name: "Diğer Çeşitli Alacaklar", type: "asset", level: 3 },
  { code: "137", name: "Diğer Alacak Senetleri Reeskontu (-)", type: "asset", level: 3 },
  { code: "138", name: "Şüpheli Diğer Alacaklar", type: "asset", level: 3 },
  { code: "139", name: "Şüpheli Diğer Alacaklar Karşılığı (-)", type: "asset", level: 3 },

  // 15 - Stoklar
  { code: "15", name: "Stoklar", type: "asset", level: 2 },
  { code: "150", name: "İlk Madde ve Malzeme", type: "asset", level: 3 },
  { code: "151", name: "Yarı Mamuller - Üretim", type: "asset", level: 3 },
  { code: "152", name: "Mamuller", type: "asset", level: 3 },
  { code: "153", name: "Ticari Mallar", type: "asset", level: 3 },
  { code: "157", name: "Diğer Stoklar", type: "asset", level: 3 },
  { code: "158", name: "Stok Değer Düşüklüğü Karşılığı (-)", type: "asset", level: 3 },
  { code: "159", name: "Verilen Sipariş Avansları", type: "asset", level: 3 },

  // 17 - Yıllara Yaygın İnşaat ve Onarım Maliyetleri
  { code: "17", name: "Yıllara Yaygın İnşaat ve Onarım Maliyetleri", type: "asset", level: 2 },
  { code: "170", name: "Yıllara Yaygın İnşaat ve Onarım Maliyetleri", type: "asset", level: 3 },
  { code: "178", name: "Yıllara Yaygın İnşaat Enflasyon Düzeltme Hesabı", type: "asset", level: 3 },
  { code: "179", name: "Taşeronlara Verilen Avanslar", type: "asset", level: 3 },

  // 18 - Gelecek Aylara Ait Giderler ve Gelir Tahakkukları
  { code: "18", name: "Gelecek Aylara Ait Giderler ve Gelir Tahakkukları", type: "asset", level: 2 },
  { code: "180", name: "Gelecek Aylara Ait Giderler", type: "asset", level: 3 },
  { code: "181", name: "Gelir Tahakkukları", type: "asset", level: 3 },

  // 19 - Diğer Dönen Varlıklar
  { code: "19", name: "Diğer Dönen Varlıklar", type: "asset", level: 2 },
  { code: "190", name: "Devreden KDV", type: "asset", level: 3 },
  { code: "191", name: "İndirilecek KDV", type: "asset", level: 3 },
  { code: "192", name: "Diğer KDV", type: "asset", level: 3 },
  { code: "193", name: "Peşin Ödenen Vergiler ve Fonlar", type: "asset", level: 3 },
  { code: "195", name: "İş Avansları", type: "asset", level: 3 },
  { code: "196", name: "Personel Avansları", type: "asset", level: 3 },
  { code: "197", name: "Sayım ve Tesellüm Noksanları", type: "asset", level: 3 },
  { code: "198", name: "Diğer Çeşitli Dönen Varlıklar", type: "asset", level: 3 },
  { code: "199", name: "Diğer Dönen Varlıklar Karşılığı (-)", type: "asset", level: 3 },

  // 2 - DURAN VARLIKLAR
  { code: "2", name: "DURAN VARLIKLAR", type: "asset", level: 1 },

  // 22 - Ticari Alacaklar
  { code: "22", name: "Ticari Alacaklar", type: "asset", level: 2 },
  { code: "220", name: "Alıcılar", type: "asset", level: 3 },
  { code: "221", name: "Alacak Senetleri", type: "asset", level: 3 },
  { code: "222", name: "Alacak Senetleri Reeskontu (-)", type: "asset", level: 3 },
  { code: "226", name: "Verilen Depozito ve Teminatlar", type: "asset", level: 3 },
  { code: "229", name: "Şüpheli Ticari Alacaklar Karşılığı (-)", type: "asset", level: 3 },

  // 24 - Mali Duran Varlıklar
  { code: "24", name: "Mali Duran Varlıklar", type: "asset", level: 2 },
  { code: "240", name: "Bağlı Menkul Kıymetler", type: "asset", level: 3 },
  { code: "242", name: "İştirakler", type: "asset", level: 3 },
  { code: "245", name: "Bağlı Ortaklıklar", type: "asset", level: 3 },
  { code: "246", name: "İştirakler Sermaye Payları Değer Düşüklüğü Karşılığı (-)", type: "asset", level: 3 },
  { code: "247", name: "Bağlı Ortaklıklar Sermaye Payları Değer Düşüklüğü Karşılığı (-)", type: "asset", level: 3 },
  { code: "248", name: "Diğer Mali Duran Varlıklar", type: "asset", level: 3 },
  { code: "249", name: "Diğer Mali Duran Varlıklar Karşılığı (-)", type: "asset", level: 3 },

  // 25 - Maddi Duran Varlıklar
  { code: "25", name: "Maddi Duran Varlıklar", type: "asset", level: 2 },
  { code: "250", name: "Arazi ve Arsalar", type: "asset", level: 3 },
  { code: "251", name: "Yeraltı ve Yerüstü Düzenleri", type: "asset", level: 3 },
  { code: "252", name: "Binalar", type: "asset", level: 3 },
  { code: "253", name: "Tesis, Makine ve Cihazlar", type: "asset", level: 3 },
  { code: "254", name: "Taşıtlar", type: "asset", level: 3 },
  { code: "255", name: "Demirbaşlar", type: "asset", level: 3 },
  { code: "256", name: "Diğer Maddi Duran Varlıklar", type: "asset", level: 3 },
  { code: "257", name: "Birikmiş Amortismanlar (-)", type: "asset", level: 3 },
  { code: "258", name: "Yapılmakta Olan Yatırımlar", type: "asset", level: 3 },
  { code: "259", name: "Verilen Avanslar", type: "asset", level: 3 },

  // 26 - Maddi Olmayan Duran Varlıklar
  { code: "26", name: "Maddi Olmayan Duran Varlıklar", type: "asset", level: 2 },
  { code: "260", name: "Haklar", type: "asset", level: 3 },
  { code: "261", name: "Şerefiye", type: "asset", level: 3 },
  { code: "262", name: "Kuruluş ve Örgütlenme Giderleri", type: "asset", level: 3 },
  { code: "263", name: "Araştırma ve Geliştirme Giderleri", type: "asset", level: 3 },
  { code: "264", name: "Özel Maliyetler", type: "asset", level: 3 },
  { code: "267", name: "Diğer Maddi Olmayan Duran Varlıklar", type: "asset", level: 3 },
  { code: "268", name: "Birikmiş Amortismanlar (-)", type: "asset", level: 3 },
  { code: "269", name: "Verilen Avanslar", type: "asset", level: 3 },

  // 28 - Gelecek Yıllara Ait Giderler ve Gelir Tahakkukları
  { code: "28", name: "Gelecek Yıllara Ait Giderler ve Gelir Tahakkukları", type: "asset", level: 2 },
  { code: "280", name: "Gelecek Yıllara Ait Giderler", type: "asset", level: 3 },
  { code: "281", name: "Gelir Tahakkukları", type: "asset", level: 3 },

  // 29 - Diğer Duran Varlıklar
  { code: "29", name: "Diğer Duran Varlıklar", type: "asset", level: 2 },
  { code: "291", name: "Gelecek Yıllarda İndirilecek KDV", type: "asset", level: 3 },
  { code: "292", name: "Diğer KDV", type: "asset", level: 3 },
  { code: "293", name: "Gelecek Yıllar İhtiyacı Stoklar", type: "asset", level: 3 },
  { code: "294", name: "Elden Çıkarılacak Stoklar ve Maddi Duran Varlıklar", type: "asset", level: 3 },
  { code: "295", name: "Peşin Ödenen Vergiler ve Fonlar", type: "asset", level: 3 },
  { code: "297", name: "Diğer Çeşitli Duran Varlıklar", type: "asset", level: 3 },
  { code: "298", name: "Stok Değer Düşüklüğü Karşılığı (-)", type: "asset", level: 3 },
  { code: "299", name: "Birikmiş Amortismanlar (-)", type: "asset", level: 3 },

  // 3 - KISA VADELİ YABANCI KAYNAKLAR
  { code: "3", name: "KISA VADELİ YABANCI KAYNAKLAR", type: "liability", level: 1 },

  // 30 - Mali Borçlar
  { code: "30", name: "Mali Borçlar", type: "liability", level: 2 },
  { code: "300", name: "Banka Kredileri", type: "liability", level: 3 },
  { code: "301", name: "Finansal Kiralama İşlemlerinden Borçlar", type: "liability", level: 3 },
  { code: "302", name: "Ertelenmiş Finansal Kiralama Borçlanma Maliyetleri (-)", type: "liability", level: 3 },
  { code: "303", name: "Uzun Vadeli Kredilerin Anapara Taksitleri ve Faizleri", type: "liability", level: 3 },
  { code: "304", name: "Tahvil Anapara Borç Taksit ve Faizleri", type: "liability", level: 3 },
  { code: "305", name: "Çıkarılmış Bonolar ve Senetler", type: "liability", level: 3 },
  { code: "306", name: "Çıkarılmış Diğer Menkul Kıymetler", type: "liability", level: 3 },
  { code: "308", name: "Menkul Kıymetler İhraç Farkı (-)", type: "liability", level: 3 },
  { code: "309", name: "Diğer Mali Borçlar", type: "liability", level: 3 },

  // 32 - Ticari Borçlar
  { code: "32", name: "Ticari Borçlar", type: "liability", level: 2 },
  { code: "320", name: "Satıcılar", type: "liability", level: 3 },
  { code: "321", name: "Borç Senetleri", type: "liability", level: 3 },
  { code: "322", name: "Borç Senetleri Reeskontu (-)", type: "liability", level: 3 },
  { code: "326", name: "Alınan Depozito ve Teminatlar", type: "liability", level: 3 },
  { code: "329", name: "Diğer Ticari Borçlar", type: "liability", level: 3 },

  // 33 - Diğer Borçlar
  { code: "33", name: "Diğer Borçlar", type: "liability", level: 2 },
  { code: "331", name: "Ortaklara Borçlar", type: "liability", level: 3 },
  { code: "332", name: "İştiraklere Borçlar", type: "liability", level: 3 },
  { code: "333", name: "Bağlı Ortaklıklara Borçlar", type: "liability", level: 3 },
  { code: "335", name: "Personele Borçlar", type: "liability", level: 3 },
  { code: "336", name: "Diğer Çeşitli Borçlar", type: "liability", level: 3 },
  { code: "337", name: "Diğer Borç Senetleri Reeskontu (-)", type: "liability", level: 3 },

  // 34 - Alınan Avanslar
  { code: "34", name: "Alınan Avanslar", type: "liability", level: 2 },
  { code: "340", name: "Alınan Sipariş Avansları", type: "liability", level: 3 },
  { code: "349", name: "Alınan Diğer Avanslar", type: "liability", level: 3 },

  // 35 - Yıllara Yaygın İnşaat ve Onarım Hakediş Bedelleri
  { code: "35", name: "Yıllara Yaygın İnşaat ve Onarım Hakediş Bedelleri", type: "liability", level: 2 },
  { code: "350", name: "Yıllara Yaygın İnşaat ve Onarım Hakediş Bedelleri", type: "liability", level: 3 },

  // 36 - Ödenecek Vergi ve Diğer Yükümlülükler
  { code: "36", name: "Ödenecek Vergi ve Diğer Yükümlülükler", type: "liability", level: 2 },
  { code: "360", name: "Ödenecek Vergi ve Fonlar", type: "liability", level: 3 },
  { code: "361", name: "Ödenecek Sosyal Güvenlik Kesintileri", type: "liability", level: 3 },
  { code: "368", name: "Vadesi Geçmiş Ertelenmiş veya Taksitlendirilmiş Vergi ve Diğer Yükümlülükler", type: "liability", level: 3 },

  // 37 - Borç ve Gider Karşılıkları
  { code: "37", name: "Borç ve Gider Karşılıkları", type: "liability", level: 2 },
  { code: "370", name: "Dönem Kârı Vergi ve Diğer Yasal Yükümlülük Karşılıkları", type: "liability", level: 3 },
  { code: "371", name: "Dönem Kârının Peşin Ödenen Vergi ve Diğer Yükümlülükleri (-)", type: "liability", level: 3 },
  { code: "372", name: "Kıdem Tazminatı Karşılığı", type: "liability", level: 3 },
  { code: "373", name: "Maliyet Giderleri Karşılığı", type: "liability", level: 3 },
  { code: "379", name: "Diğer Borç ve Gider Karşılıkları", type: "liability", level: 3 },

  // 38 - Gelecek Aylara Ait Gelirler ve Gider Tahakkukları
  { code: "38", name: "Gelecek Aylara Ait Gelirler ve Gider Tahakkukları", type: "liability", level: 2 },
  { code: "380", name: "Gelecek Aylara Ait Gelirler", type: "liability", level: 3 },
  { code: "381", name: "Gider Tahakkukları", type: "liability", level: 3 },

  // 39 - Diğer Kısa Vadeli Yabancı Kaynaklar
  { code: "39", name: "Diğer Kısa Vadeli Yabancı Kaynaklar", type: "liability", level: 2 },
  { code: "391", name: "Hesaplanan KDV", type: "liability", level: 3 },
  { code: "392", name: "Diğer KDV", type: "liability", level: 3 },
  { code: "393", name: "Merkez ve Şubeler Cari Hesabı", type: "liability", level: 3 },
  { code: "397", name: "Sayım ve Tesellüm Fazlaları", type: "liability", level: 3 },
  { code: "399", name: "Diğer Çeşitli Yabancı Kaynaklar", type: "liability", level: 3 },

  // 4 - UZUN VADELİ YABANCI KAYNAKLAR
  { code: "4", name: "UZUN VADELİ YABANCI KAYNAKLAR", type: "liability", level: 1 },

  { code: "40", name: "Mali Borçlar", type: "liability", level: 2 },
  { code: "400", name: "Banka Kredileri", type: "liability", level: 3 },
  { code: "405", name: "Çıkarılmış Tahviller", type: "liability", level: 3 },
  { code: "408", name: "Menkul Kıymetler İhraç Farkı (-)", type: "liability", level: 3 },

  { code: "42", name: "Ticari Borçlar", type: "liability", level: 2 },
  { code: "420", name: "Satıcılar", type: "liability", level: 3 },
  { code: "421", name: "Borç Senetleri", type: "liability", level: 3 },
  { code: "422", name: "Borç Senetleri Reeskontu (-)", type: "liability", level: 3 },
  { code: "426", name: "Alınan Depozito ve Teminatlar", type: "liability", level: 3 },
  { code: "429", name: "Diğer Ticari Borçlar", type: "liability", level: 3 },

  { code: "43", name: "Diğer Borçlar", type: "liability", level: 2 },
  { code: "431", name: "Ortaklara Borçlar", type: "liability", level: 3 },
  { code: "432", name: "İştiraklere Borçlar", type: "liability", level: 3 },
  { code: "436", name: "Diğer Çeşitli Borçlar", type: "liability", level: 3 },
  { code: "437", name: "Diğer Borç Senetleri Reeskontu (-)", type: "liability", level: 3 },
  { code: "438", name: "Kamuya Olan Ertelenmiş veya Taksitlendirilmiş Borçlar", type: "liability", level: 3 },

  { code: "44", name: "Alınan Avanslar", type: "liability", level: 2 },
  { code: "440", name: "Alınan Sipariş Avansları", type: "liability", level: 3 },
  { code: "449", name: "Alınan Diğer Avanslar", type: "liability", level: 3 },

  { code: "47", name: "Borç ve Gider Karşılıkları", type: "liability", level: 2 },
  { code: "472", name: "Kıdem Tazminatı Karşılığı", type: "liability", level: 3 },
  { code: "479", name: "Diğer Borç ve Gider Karşılıkları", type: "liability", level: 3 },

  { code: "48", name: "Gelecek Yıllara Ait Gelirler ve Gider Tahakkukları", type: "liability", level: 2 },
  { code: "480", name: "Gelecek Yıllara Ait Gelirler", type: "liability", level: 3 },
  { code: "481", name: "Gider Tahakkukları", type: "liability", level: 3 },

  { code: "49", name: "Diğer Uzun Vadeli Yabancı Kaynaklar", type: "liability", level: 2 },
  { code: "492", name: "Gelecek Yıllara Ertelenen veya Terkin Edilecek KDV", type: "liability", level: 3 },
  { code: "499", name: "Diğer Çeşitli Uzun Vadeli Yabancı Kaynaklar", type: "liability", level: 3 },

  // 5 - ÖZKAYNAKLAR
  { code: "5", name: "ÖZKAYNAKLAR", type: "equity", level: 1 },

  { code: "50", name: "Ödenmiş Sermaye", type: "equity", level: 2 },
  { code: "500", name: "Sermaye", type: "equity", level: 3 },
  { code: "501", name: "Ödenmemiş Sermaye (-)", type: "equity", level: 3 },

  { code: "52", name: "Sermaye Yedekleri", type: "equity", level: 2 },
  { code: "520", name: "Hisse Senedi İhraç Primleri", type: "equity", level: 3 },
  { code: "521", name: "Hisse Senedi İptal Kârları", type: "equity", level: 3 },
  { code: "522", name: "Maddi Duran Varlıklar Yeniden Değerleme Artışları", type: "equity", level: 3 },
  { code: "523", name: "İştirakler Yeniden Değerleme Artışları", type: "equity", level: 3 },
  { code: "529", name: "Diğer Sermaye Yedekleri", type: "equity", level: 3 },

  { code: "54", name: "Kâr Yedekleri", type: "equity", level: 2 },
  { code: "540", name: "Yasal Yedekler", type: "equity", level: 3 },
  { code: "541", name: "Statü Yedekleri", type: "equity", level: 3 },
  { code: "542", name: "Olağanüstü Yedekler", type: "equity", level: 3 },
  { code: "548", name: "Diğer Kâr Yedekleri", type: "equity", level: 3 },
  { code: "549", name: "Özel Fonlar", type: "equity", level: 3 },

  { code: "57", name: "Geçmiş Yıllar Kârları", type: "equity", level: 2 },
  { code: "570", name: "Geçmiş Yıllar Kârları", type: "equity", level: 3 },

  { code: "58", name: "Geçmiş Yıllar Zararları (-)", type: "equity", level: 2 },
  { code: "580", name: "Geçmiş Yıllar Zararları (-)", type: "equity", level: 3 },

  { code: "59", name: "Dönem Net Kârı (Zararı)", type: "equity", level: 2 },
  { code: "590", name: "Dönem Net Kârı", type: "equity", level: 3 },
  { code: "591", name: "Dönem Net Zararı (-)", type: "equity", level: 3 },

  // 6 - GELİR TABLOSU HESAPLARI
  { code: "6", name: "GELİR TABLOSU HESAPLARI", type: "revenue", level: 1 },

  { code: "60", name: "Brüt Satışlar", type: "revenue", level: 2 },
  { code: "600", name: "Yurtiçi Satışlar", type: "revenue", level: 3 },
  { code: "601", name: "Yurtdışı Satışlar", type: "revenue", level: 3 },
  { code: "602", name: "Diğer Gelirler", type: "revenue", level: 3 },

  { code: "61", name: "Satış İndirimleri (-)", type: "revenue", level: 2 },
  { code: "610", name: "Satıştan İadeler (-)", type: "revenue", level: 3 },
  { code: "611", name: "Satış İskontoları (-)", type: "revenue", level: 3 },
  { code: "612", name: "Diğer İndirimler (-)", type: "revenue", level: 3 },

  { code: "62", name: "Satışların Maliyeti (-)", type: "expense", level: 2 },
  { code: "620", name: "Satılan Mamuller Maliyeti (-)", type: "expense", level: 3 },
  { code: "621", name: "Satılan Ticari Mallar Maliyeti (-)", type: "expense", level: 3 },
  { code: "622", name: "Satılan Hizmet Maliyeti (-)", type: "expense", level: 3 },
  { code: "623", name: "Diğer Satışların Maliyeti (-)", type: "expense", level: 3 },

  { code: "63", name: "Faaliyet Giderleri (-)", type: "expense", level: 2 },
  { code: "630", name: "Araştırma ve Geliştirme Giderleri (-)", type: "expense", level: 3 },
  { code: "631", name: "Pazarlama Satış ve Dağıtım Giderleri (-)", type: "expense", level: 3 },
  { code: "632", name: "Genel Yönetim Giderleri (-)", type: "expense", level: 3 },

  { code: "64", name: "Diğer Faaliyetlerden Olağan Gelir ve Kârlar", type: "revenue", level: 2 },
  { code: "640", name: "İştiraklerden Temettü Gelirleri", type: "revenue", level: 3 },
  { code: "641", name: "Bağlı Ortaklıklardan Temettü Gelirleri", type: "revenue", level: 3 },
  { code: "642", name: "Faiz Gelirleri", type: "revenue", level: 3 },
  { code: "643", name: "Komisyon Gelirleri", type: "revenue", level: 3 },
  { code: "644", name: "Konusu Kalmayan Karşılıklar", type: "revenue", level: 3 },
  { code: "645", name: "Menkul Kıymet Satış Kârları", type: "revenue", level: 3 },
  { code: "646", name: "Kambiyo Kârları", type: "revenue", level: 3 },
  { code: "647", name: "Reeskont Faiz Gelirleri", type: "revenue", level: 3 },
  { code: "648", name: "Enflasyon Düzeltmesi Kârları", type: "revenue", level: 3 },
  { code: "649", name: "Diğer Olağan Gelir ve Kârlar", type: "revenue", level: 3 },

  { code: "65", name: "Diğer Faaliyetlerden Olağan Gider ve Zararlar (-)", type: "expense", level: 2 },
  { code: "653", name: "Komisyon Giderleri (-)", type: "expense", level: 3 },
  { code: "654", name: "Karşılık Giderleri (-)", type: "expense", level: 3 },
  { code: "655", name: "Menkul Kıymet Satış Zararları (-)", type: "expense", level: 3 },
  { code: "656", name: "Kambiyo Zararları (-)", type: "expense", level: 3 },
  { code: "657", name: "Reeskont Faiz Giderleri (-)", type: "expense", level: 3 },
  { code: "658", name: "Enflasyon Düzeltmesi Zararları (-)", type: "expense", level: 3 },
  { code: "659", name: "Diğer Olağan Gider ve Zararlar (-)", type: "expense", level: 3 },

  { code: "66", name: "Finansman Giderleri (-)", type: "expense", level: 2 },
  { code: "660", name: "Kısa Vadeli Borçlanma Giderleri (-)", type: "expense", level: 3 },
  { code: "661", name: "Uzun Vadeli Borçlanma Giderleri (-)", type: "expense", level: 3 },

  { code: "67", name: "Olağandışı Gelir ve Kârlar", type: "revenue", level: 2 },
  { code: "671", name: "Önceki Dönem Gelir ve Kârları", type: "revenue", level: 3 },
  { code: "679", name: "Diğer Olağandışı Gelir ve Kârlar", type: "revenue", level: 3 },

  { code: "68", name: "Olağandışı Gider ve Zararlar (-)", type: "expense", level: 2 },
  { code: "680", name: "Çalışmayan Kısım Gider ve Zararları (-)", type: "expense", level: 3 },
  { code: "681", name: "Önceki Dönem Gider ve Zararları (-)", type: "expense", level: 3 },
  { code: "689", name: "Diğer Olağandışı Gider ve Zararlar (-)", type: "expense", level: 3 },

  { code: "69", name: "Dönem Net Kârı veya Zararı", type: "revenue", level: 2 },
  { code: "690", name: "Dönem Kârı veya Zararı", type: "revenue", level: 3 },
  { code: "691", name: "Dönem Kârı Vergi ve Diğer Yasal Yükümlülük Karşılıkları (-)", type: "expense", level: 3 },
  { code: "692", name: "Dönem Net Kârı veya Zararı", type: "revenue", level: 3 },

  // 7 - MALİYET HESAPLARI
  { code: "7", name: "MALİYET HESAPLARI", type: "expense", level: 1 },

  { code: "70", name: "Maliyet Muhasebesi Bağlantı Hesapları", type: "expense", level: 2 },
  { code: "700", name: "Maliyet Muhasebesi Bağlantı Hesabı", type: "expense", level: 3 },

  { code: "71", name: "Direkt İlk Madde ve Malzeme Giderleri", type: "expense", level: 2 },
  { code: "710", name: "Direkt İlk Madde ve Malzeme Giderleri", type: "expense", level: 3 },
  { code: "711", name: "Direkt İlk Madde ve Malzeme Yansıtma Hesabı", type: "expense", level: 3 },
  { code: "712", name: "Direkt İlk Madde ve Malzeme Fiyat Farkı", type: "expense", level: 3 },
  { code: "713", name: "Direkt İlk Madde ve Malzeme Miktar Farkı", type: "expense", level: 3 },

  { code: "72", name: "Direkt İşçilik Giderleri", type: "expense", level: 2 },
  { code: "720", name: "Direkt İşçilik Giderleri", type: "expense", level: 3 },
  { code: "721", name: "Direkt İşçilik Giderleri Yansıtma Hesabı", type: "expense", level: 3 },
  { code: "722", name: "Direkt İşçilik Ücret Farkları", type: "expense", level: 3 },
  { code: "723", name: "Direkt İşçilik Süre Farkları", type: "expense", level: 3 },

  { code: "73", name: "Genel Üretim Giderleri", type: "expense", level: 2 },
  { code: "730", name: "Genel Üretim Giderleri", type: "expense", level: 3 },
  { code: "731", name: "Genel Üretim Giderleri Yansıtma Hesabı", type: "expense", level: 3 },
  { code: "732", name: "Genel Üretim Giderleri Bütçe Farkları", type: "expense", level: 3 },
  { code: "733", name: "Genel Üretim Giderleri Verimlilik Farkları", type: "expense", level: 3 },
  { code: "734", name: "Genel Üretim Giderleri Kapasite Farkları", type: "expense", level: 3 },

  { code: "74", name: "Hizmet Üretim Maliyeti", type: "expense", level: 2 },
  { code: "740", name: "Hizmet Üretim Maliyeti", type: "expense", level: 3 },
  { code: "741", name: "Hizmet Üretim Maliyeti Yansıtma Hesabı", type: "expense", level: 3 },
  { code: "742", name: "Hizmet Üretim Maliyeti Fark Hesapları", type: "expense", level: 3 },

  { code: "75", name: "Araştırma ve Geliştirme Giderleri", type: "expense", level: 2 },
  { code: "750", name: "Araştırma ve Geliştirme Giderleri", type: "expense", level: 3 },
  { code: "751", name: "Araştırma ve Geliştirme Giderleri Yansıtma Hesabı", type: "expense", level: 3 },
  { code: "752", name: "Araştırma ve Geliştirme Gider Farkları", type: "expense", level: 3 },

  { code: "76", name: "Pazarlama Satış ve Dağıtım Giderleri", type: "expense", level: 2 },
  { code: "760", name: "Pazarlama Satış ve Dağıtım Giderleri", type: "expense", level: 3 },
  { code: "761", name: "Pazarlama Satış ve Dağıtım Giderleri Yansıtma Hesabı", type: "expense", level: 3 },
  { code: "762", name: "Pazarlama Satış ve Dağıtım Gider Farkları", type: "expense", level: 3 },

  { code: "77", name: "Genel Yönetim Giderleri", type: "expense", level: 2 },
  { code: "770", name: "Genel Yönetim Giderleri", type: "expense", level: 3 },
  { code: "771", name: "Genel Yönetim Giderleri Yansıtma Hesabı", type: "expense", level: 3 },
  { code: "772", name: "Genel Yönetim Gider Farkları", type: "expense", level: 3 },

  { code: "78", name: "Finansman Giderleri", type: "expense", level: 2 },
  { code: "780", name: "Finansman Giderleri", type: "expense", level: 3 },
  { code: "781", name: "Finansman Giderleri Yansıtma Hesabı", type: "expense", level: 3 },
  { code: "782", name: "Finansman Giderleri Fark Hesabı", type: "expense", level: 3 },
] as const;

export type ChartOfAccountEntry = (typeof TEKDUZEN_HESAP_PLANI)[number];
