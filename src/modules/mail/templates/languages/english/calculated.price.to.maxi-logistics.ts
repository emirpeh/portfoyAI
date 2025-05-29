export interface EnglishCalculatedPriceTemplateProps {
  offerNo: string;
  originalPrice: string;
  calculatedPrice: string;
  rate: string;
  profitMargin: string;
  supplierContact: {
    name: string;
    email: string;
    companyName: string;
  };
}

export const createEnglishCalculatedPriceTitleTemplate = (offerNo: string) => {
  return `Quote Price - ${offerNo}`;
};

export const createEnglishCalculatedPriceTemplate = ({
  offerNo,
  calculatedPrice,
}: EnglishCalculatedPriceTemplateProps) => {
  /* e.g. “1,250.00 EUR” */
  const prettyPrice =
    new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 2,
    }).format(Number(calculatedPrice)) + ' EUR';

  return /* html */ `
<div style="font-family: Arial, sans-serif; line-height:1.6;">
  Dear Sir / Madam,<br><br>

  Thank you very much for your interest in Maxi Logistics.<br><br>

  For your enquiry <b>No. ${offerNo}</b> we are pleased to offer the following
  <b>part-load (LTL) freight rate: ${prettyPrice}</b>.<br><br>

  <u>Additional charges / notes</u><br>
  • Customs clearance abroad (single HS code)  +100 EUR  
    (except CH, UK, IE, GR)<br>
  • Consolidated departures every <b>Friday</b> and <b>Saturday</b><br>
  • Indicative transit time, subject to normal border traffic: <b>xxx</b> days*<br><br>

  <ul style="margin:0 0 16px 16px;padding:0;">
    <li>Rate to be revised for temporary export, transit cargo or three-party trades unless otherwise stated.</li>
    <li>Valid for non-hazardous goods (no ADR / IMO).</li>
    <li>Sanitary and radiometric fees are not included.</li>
    <li>Free loading time for partial loads: 6 h; thereafter EUR 200 per day waiting.</li>
    <li>Furniture, marble and glass are excluded from CMR insurance coverage.</li>
    <li>For cargo value above EUR 50,000 an additional security surcharge applies.</li>
    <li>Offer is valid for 5 business days; payment in advance upon loading.</li>
    <li>Rate based on a standard curtain-sided trailer.</li>
  </ul>

  We hope the above meets your requirements and look forward to receiving your
  booking.<br><br>

  <b>Key destinations we cover (selection)</b><br>
  Balkans – North Macedonia, Albania, Kosovo, Serbia, Croatia, Bosnia & Herzegovina, Greece, Romania, Bulgaria …<br>
  Europe – Germany, Netherlands, Belgium, France, Italy, Austria, Switzerland, Nordics, Spain, Portugal …<br><br>

  Have you tried our <i>Express Panel-van</i> or Intermodal services?<br><br>

  Best regards,<br>
  Maxi Logistics
</div>
`.trim();
};
