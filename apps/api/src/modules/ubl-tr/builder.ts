import type { UblInvoiceData, UblParty, UblInvoiceLine } from "./types.js";

/**
 * UBL-TR 1.2.1 formatında e-fatura XML üreteci
 *
 * GİB (Gelir İdaresi Başkanlığı) standartlarına uygun
 * Universal Business Language - Turkey profili
 */
export function buildUblTrInvoiceXml(data: UblInvoiceData): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">

  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <!-- Dijital imza buraya eklenecek (entegratör tarafından) -->
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>

  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2.1</cbc:CustomizationID>
  <cbc:ProfileID>${escapeXml(data.profileId)}</cbc:ProfileID>
  <cbc:ID>${escapeXml(data.invoiceNumber)}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${escapeXml(data.uuid)}</cbc:UUID>
  <cbc:IssueDate>${escapeXml(data.issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${escapeXml(data.issueTime)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${escapeXml(data.invoiceType)}</cbc:InvoiceTypeCode>
${data.notes?.map((note) => `  <cbc:Note>${escapeXml(note)}</cbc:Note>`).join("\n") ?? ""}
  <cbc:DocumentCurrencyCode>${escapeXml(data.currencyCode)}</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${data.lineCountNumeric}</cbc:LineCountNumeric>

${buildSignatoryParty(data.supplier)}

${buildAccountingSupplierParty(data.supplier)}

${buildAccountingCustomerParty(data.customer)}

${data.withholdingTaxTotal ? buildWithholdingTaxTotal(data.withholdingTaxTotal) : ""}

${buildTaxTotal(data.taxSubtotals)}

${buildLegalMonetaryTotal(data)}

${data.lines.map((line, idx) => buildInvoiceLine(line, idx + 1)).join("\n")}

</Invoice>`;

  return xml;
}

function buildSignatoryParty(supplier: UblParty): string {
  return `  <!-- İmza Bilgileri -->
  <cac:Signature>
    <cbc:ID schemeID="VKN_TCKN">${escapeXml(supplier.vkn)}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${escapeXml(supplier.vkn)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(supplier.streetName)}</cbc:StreetName>
        <cbc:CitySubdivisionName>${escapeXml(supplier.citySubdivisionName)}</cbc:CitySubdivisionName>
        <cbc:CityName>${escapeXml(supplier.cityName)}</cbc:CityName>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#Signature</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>`;
}

function buildParty(party: UblParty, schemeId: string): string {
  const isCompany = party.vkn.length === 10;
  return `      <cac:Party>
        <cbc:WebsiteURI>${escapeXml(party.webSite ?? "")}</cbc:WebsiteURI>
        <cac:PartyIdentification>
          <cbc:ID schemeID="${schemeId}">${escapeXml(party.vkn)}</cbc:ID>
        </cac:PartyIdentification>
${
  isCompany
    ? `        <cac:PartyName>
          <cbc:Name>${escapeXml(party.name)}</cbc:Name>
        </cac:PartyName>`
    : ""
}
        <cac:PostalAddress>
          <cbc:StreetName>${escapeXml(party.streetName)}</cbc:StreetName>
          <cbc:CitySubdivisionName>${escapeXml(party.citySubdivisionName)}</cbc:CitySubdivisionName>
          <cbc:CityName>${escapeXml(party.cityName)}</cbc:CityName>
${party.postalZone ? `          <cbc:PostalZone>${escapeXml(party.postalZone)}</cbc:PostalZone>` : ""}
          <cac:Country>
            <cbc:Name>Türkiye</cbc:Name>
          </cac:Country>
        </cac:PostalAddress>
        <cac:PartyTaxScheme>
          <cac:TaxScheme>
            <cbc:Name>${escapeXml(party.taxOffice)}</cbc:Name>
          </cac:TaxScheme>
        </cac:PartyTaxScheme>
        <cac:Contact>
${party.phone ? `          <cbc:Telephone>${escapeXml(party.phone)}</cbc:Telephone>` : ""}
${party.email ? `          <cbc:ElectronicMail>${escapeXml(party.email)}</cbc:ElectronicMail>` : ""}
        </cac:Contact>
${
  isCompany
    ? ""
    : `        <cac:Person>
          <cbc:FirstName>${escapeXml(party.name.split(" ").slice(0, -1).join(" ") || party.name)}</cbc:FirstName>
          <cbc:FamilyName>${escapeXml(party.name.split(" ").pop() || "")}</cbc:FamilyName>
        </cac:Person>`
}
      </cac:Party>`;
}

function buildAccountingSupplierParty(supplier: UblParty): string {
  return `  <!-- Satıcı Bilgileri -->
  <cac:AccountingSupplierParty>
${buildParty(supplier, "VKN")}
  </cac:AccountingSupplierParty>`;
}

function buildAccountingCustomerParty(customer: UblParty): string {
  const schemeId = customer.vkn.length === 11 ? "TCKN" : "VKN";
  return `  <!-- Alıcı Bilgileri -->
  <cac:AccountingCustomerParty>
${buildParty(customer, schemeId)}
  </cac:AccountingCustomerParty>`;
}

function buildTaxTotal(subtotals: UblInvoiceData["taxSubtotals"]): string {
  const totalTax = subtotals.reduce((s, t) => s + t.taxAmount, 0);
  return `  <!-- Vergi Toplamı -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">${totalTax.toFixed(2)}</cbc:TaxAmount>
${subtotals
  .map(
    (st) => `    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">${st.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">${st.taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cbc:Percent>${st.taxRate.toFixed(2)}</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>${st.taxScheme}</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`
  )
  .join("\n")}
  </cac:TaxTotal>`;
}

function buildWithholdingTaxTotal(
  wht: NonNullable<UblInvoiceData["withholdingTaxTotal"]>
): string {
  return `  <!-- Tevkifat -->
  <cac:WithholdingTaxTotal>
    <cbc:TaxAmount currencyID="TRY">${wht.taxAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">${wht.taxSubtotal.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">${wht.taxSubtotal.taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cbc:Percent>${wht.taxSubtotal.percent.toFixed(2)}</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV TEVKIFAT</cbc:Name>
          <cbc:TaxTypeCode>9015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:WithholdingTaxTotal>`;
}

function buildLegalMonetaryTotal(data: UblInvoiceData): string {
  return `  <!-- Parasal Toplamlar -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${data.currencyCode}">${data.lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${data.currencyCode}">${data.taxExclusiveAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${data.currencyCode}">${data.taxInclusiveAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="${data.currencyCode}">${data.allowanceTotalAmount.toFixed(2)}</cbc:AllowanceTotalAmount>
    <cbc:PayableAmount currencyID="${data.currencyCode}">${data.payableAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
}

function buildInvoiceLine(line: UblInvoiceLine, idx: number): string {
  const hasDiscount = (line.discountAmount ?? 0) > 0;
  return `  <!-- Fatura Kalemi ${idx} -->
  <cac:InvoiceLine>
    <cbc:ID>${idx}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${escapeXml(line.unitCode)}">${line.quantity.toFixed(2)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">${line.lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
${
  hasDiscount
    ? `    <cac:AllowanceCharge>
      <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
      <cbc:MultiplierFactorNumeric>${(line.discountRate ?? 0).toFixed(2)}</cbc:MultiplierFactorNumeric>
      <cbc:Amount currencyID="TRY">${(line.discountAmount ?? 0).toFixed(2)}</cbc:Amount>
      <cbc:BaseAmount currencyID="TRY">${(line.quantity * line.unitPrice).toFixed(2)}</cbc:BaseAmount>
    </cac:AllowanceCharge>`
    : ""
}
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">${line.taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">${line.lineExtensionAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">${line.taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cbc:Percent>${line.taxRate.toFixed(2)}</cbc:Percent>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>KDV</cbc:Name>
            <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>${escapeXml(line.description)}</cbc:Description>
      <cbc:Name>${escapeXml(line.description)}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">${line.unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
}

/** XML özel karakterleri escape et */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export { escapeXml };
