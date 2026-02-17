/**
 * XBRL-GL (Global Ledger) E-Defter Üreteci
 *
 * GİB E-Defter standartlarına uygun:
 * - Yevmiye Defteri (gl-cor + gl-bus)
 * - Kebir Defteri (gl-cor + gl-bus)
 *
 * Her ay için ayrı defter ve berat dosyası üretilir.
 */

export interface ELedgerEntry {
  entryNo: number;
  entryDate: string; // YYYY-MM-DD
  description: string;
  lines: ELedgerLine[];
}

export interface ELedgerLine {
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
}

export interface ELedgerHeader {
  companyName: string;
  companyVkn: string;
  taxOffice: string;
  period: string; // YYYY-MM
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  creationDate: string;
  entryCount: number;
}

/**
 * Yevmiye Defteri XBRL-GL XML üret
 */
export function buildJournalLedgerXml(header: ELedgerHeader, entries: ELedgerEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gl-cor:accountingEntries
  xmlns:gl-cor="http://www.xbrl.org/int/gl/cor/2006-10-25"
  xmlns:gl-bus="http://www.xbrl.org/int/gl/bus/2006-10-25"
  xmlns:gl-muc="http://www.xbrl.org/int/gl/muc/2006-10-25"
  xmlns:xbrli="http://www.xbrl.org/2003/instance"
  xmlns:edefter="http://www.edefter.gov.tr/edefter-v1.0">

  <!-- Doküman Bilgileri -->
  <gl-cor:documentInfo>
    <gl-cor:uniqueID>${header.companyVkn}-${header.period}-Y</gl-cor:uniqueID>
    <gl-cor:documentType>Yevmiye Defteri</gl-cor:documentType>
    <gl-cor:language>tr</gl-cor:language>
    <gl-cor:creationDate>${header.creationDate}</gl-cor:creationDate>
    <gl-cor:periodCoveredStart>${header.periodStart}</gl-cor:periodCoveredStart>
    <gl-cor:periodCoveredEnd>${header.periodEnd}</gl-cor:periodCoveredEnd>
    <gl-cor:entriesComment>FinBooks Muhasebe Yazılımı tarafından üretilmiştir</gl-cor:entriesComment>
    <gl-bus:totalDebit>${entries.reduce((s, e) => s + e.lines.reduce((ls, l) => ls + l.debitAmount, 0), 0).toFixed(2)}</gl-bus:totalDebit>
    <gl-bus:totalCredit>${entries.reduce((s, e) => s + e.lines.reduce((ls, l) => ls + l.creditAmount, 0), 0).toFixed(2)}</gl-bus:totalCredit>
    <gl-bus:sourceApplication>FinBooks v0.1.0</gl-bus:sourceApplication>
  </gl-cor:documentInfo>

  <!-- Firma Bilgileri -->
  <gl-cor:entityInformation>
    <gl-bus:organizationIdentifiers>
      <gl-bus:organizationIdentifier>${escapeXml(header.companyVkn)}</gl-bus:organizationIdentifier>
      <gl-bus:organizationDescription>${escapeXml(header.companyName)}</gl-bus:organizationDescription>
    </gl-bus:organizationIdentifiers>
  </gl-cor:entityInformation>

${entries.map((entry) => buildJournalEntry(entry)).join("\n")}

</gl-cor:accountingEntries>`;
}

/**
 * Kebir Defteri XBRL-GL XML üret
 */
export function buildGeneralLedgerXml(header: ELedgerHeader, entries: ELedgerEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gl-cor:accountingEntries
  xmlns:gl-cor="http://www.xbrl.org/int/gl/cor/2006-10-25"
  xmlns:gl-bus="http://www.xbrl.org/int/gl/bus/2006-10-25"
  xmlns:gl-muc="http://www.xbrl.org/int/gl/muc/2006-10-25"
  xmlns:xbrli="http://www.xbrl.org/2003/instance"
  xmlns:edefter="http://www.edefter.gov.tr/edefter-v1.0">

  <!-- Doküman Bilgileri -->
  <gl-cor:documentInfo>
    <gl-cor:uniqueID>${header.companyVkn}-${header.period}-K</gl-cor:uniqueID>
    <gl-cor:documentType>Büyük Defter</gl-cor:documentType>
    <gl-cor:language>tr</gl-cor:language>
    <gl-cor:creationDate>${header.creationDate}</gl-cor:creationDate>
    <gl-cor:periodCoveredStart>${header.periodStart}</gl-cor:periodCoveredStart>
    <gl-cor:periodCoveredEnd>${header.periodEnd}</gl-cor:periodCoveredEnd>
    <gl-bus:totalDebit>${entries.reduce((s, e) => s + e.lines.reduce((ls, l) => ls + l.debitAmount, 0), 0).toFixed(2)}</gl-bus:totalDebit>
    <gl-bus:totalCredit>${entries.reduce((s, e) => s + e.lines.reduce((ls, l) => ls + l.creditAmount, 0), 0).toFixed(2)}</gl-bus:totalCredit>
    <gl-bus:sourceApplication>FinBooks v0.1.0</gl-bus:sourceApplication>
  </gl-cor:documentInfo>

  <!-- Firma Bilgileri -->
  <gl-cor:entityInformation>
    <gl-bus:organizationIdentifiers>
      <gl-bus:organizationIdentifier>${escapeXml(header.companyVkn)}</gl-bus:organizationIdentifier>
      <gl-bus:organizationDescription>${escapeXml(header.companyName)}</gl-bus:organizationDescription>
    </gl-bus:organizationIdentifiers>
  </gl-cor:entityInformation>

${entries.map((entry) => buildJournalEntry(entry)).join("\n")}

</gl-cor:accountingEntries>`;
}

function buildJournalEntry(entry: ELedgerEntry): string {
  return `  <!-- Yevmiye ${entry.entryNo} -->
  <gl-cor:entryHeader>
    <gl-cor:enteredDate>${entry.entryDate}</gl-cor:enteredDate>
    <gl-cor:entryNumber>
      <gl-cor:entryNumberCounter>${entry.entryNo}</gl-cor:entryNumberCounter>
    </gl-cor:entryNumber>
    <gl-cor:entryComment>${escapeXml(entry.description)}</gl-cor:entryComment>
${entry.lines.map((line, i) => buildEntryDetail(line, i + 1)).join("\n")}
  </gl-cor:entryHeader>`;
}

function buildEntryDetail(line: ELedgerLine, lineNo: number): string {
  const amount = line.debitAmount > 0 ? line.debitAmount : line.creditAmount;
  const signOfAmount = line.debitAmount > 0 ? "D" : "C";

  return `    <gl-cor:entryDetail>
      <gl-cor:lineNumber>${lineNo}</gl-cor:lineNumber>
      <gl-cor:account>
        <gl-cor:accountMainID>${escapeXml(line.accountCode)}</gl-cor:accountMainID>
        <gl-cor:accountMainDescription>${escapeXml(line.accountName)}</gl-cor:accountMainDescription>
      </gl-cor:account>
      <gl-cor:amount>
        <gl-cor:currency>TRY</gl-cor:currency>
        <gl-cor:amountOriginalAmount>${amount.toFixed(2)}</gl-cor:amountOriginalAmount>
        <gl-cor:debitCreditCode>${signOfAmount}</gl-cor:debitCreditCode>
      </gl-cor:amount>
${line.description ? `      <gl-cor:lineNumberComment>${escapeXml(line.description)}</gl-cor:lineNumberComment>` : ""}
    </gl-cor:entryDetail>`;
}

/**
 * E-Defter Berat XML üret
 * (GİB'e gönderilecek özet belge)
 */
export function buildBeratXml(params: {
  vkn: string;
  companyName: string;
  period: string;
  ledgerType: "Y" | "K"; // Yevmiye veya Kebir
  documentHash: string;
  creationDate: string;
}): string {
  const ledgerName = params.ledgerType === "Y" ? "Yevmiye Defteri" : "Büyük Defter";
  return `<?xml version="1.0" encoding="UTF-8"?>
<edefter:Berat
  xmlns:edefter="http://www.edefter.gov.tr/edefter-v1.0"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">

  <edefter:VknTckn>${params.vkn}</edefter:VknTckn>
  <edefter:Unvan>${escapeXml(params.companyName)}</edefter:Unvan>
  <edefter:DefterTuru>${ledgerName}</edefter:DefterTuru>
  <edefter:Donem>${params.period}</edefter:Donem>
  <edefter:OlusturmaTarihi>${params.creationDate}</edefter:OlusturmaTarihi>
  <edefter:DefterHash>${params.documentHash}</edefter:DefterHash>

</edefter:Berat>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
