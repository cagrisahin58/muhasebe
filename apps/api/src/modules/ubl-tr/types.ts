/** UBL-TR 1.2.1 Fatura Tipleri */

export type UblInvoiceType =
  | "SATIS"
  | "IADE"
  | "TEVKIFAT"
  | "ISTISNA"
  | "OZELMATRAH"
  | "IHRACKAYITLI";

export type UblInvoiceProfile = "TEMELFATURA" | "TICARIFATURA" | "YOLCUBERABERFATURA";

export interface UblParty {
  vkn: string;
  name: string;
  taxOffice: string;
  streetName: string;
  cityName: string;
  citySubdivisionName: string;
  country: string;
  postalZone?: string;
  phone?: string;
  email?: string;
  webSite?: string;
}

export interface UblInvoiceLine {
  lineId: string;
  quantity: number;
  unitCode: string; // C62 (adet), KGM (kg), LTR (litre), MTR (metre), vb.
  unitPrice: number;
  lineExtensionAmount: number;
  discountRate?: number;
  discountAmount?: number;
  taxRate: number;
  taxAmount: number;
  withholdingRate?: number;
  withholdingAmount?: number;
  description: string;
}

export interface UblInvoiceData {
  uuid: string;
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:mm:ss
  invoiceType: UblInvoiceType;
  profileId: UblInvoiceProfile;
  currencyCode: string;
  lineCountNumeric: number;

  supplier: UblParty;
  customer: UblParty;

  lines: UblInvoiceLine[];

  // Toplamlar
  lineExtensionAmount: number; // Mal/hizmet toplam tutarı
  taxExclusiveAmount: number; // Vergiler hariç toplam
  taxInclusiveAmount: number; // Vergiler dahil toplam
  allowanceTotalAmount: number; // İskonto toplam
  payableAmount: number; // Ödenecek tutar

  // KDV kırılımı
  taxSubtotals: {
    taxableAmount: number;
    taxAmount: number;
    taxRate: number;
    taxScheme: string; // "0015" = KDV
  }[];

  // Tevkifat
  withholdingTaxTotal?: {
    taxAmount: number;
    taxSubtotal: {
      taxableAmount: number;
      taxAmount: number;
      percent: number;
    };
  };

  notes?: string[];
}

/** E-Fatura Zarf Bilgileri */
export interface UblEnvelopeData {
  uuid: string;
  senderId: string;
  receiverId: string;
  date: string;
  time: string;
}

/** Entegratör API Yanıtı */
export interface EInvoiceResponse {
  success: boolean;
  uuid?: string;
  envelopeId?: string;
  status?: "SENT" | "RECEIVED" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  message?: string;
  errorCode?: string;
}
