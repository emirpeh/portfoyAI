import { z } from 'zod';

export const EmailAnalysisCustomerSchema = z.object({
  name: z.string().nullable().describe('Müşterinin adı ve soyadı'),
  phone: z.string().nullable().describe('Müşterinin telefon numarası'),
  customerType: z
    .enum(['BUYER', 'SELLER', 'BOTH'])
    .nullable()
    .describe('Müşterinin tipi: Alıcı, Satıcı veya Her İkisi'),
});

export type EmailAnalysisCustomer = z.infer<typeof EmailAnalysisCustomerSchema>;

export const EmailAnalysisBuyerPreferencesSchema = z.object({
  propertyTypes: z
    .array(
      z.enum([
        'APARTMENT',
        'HOUSE',
        'VILLA',
        'LAND',
        'COMMERCIAL',
        'OFFICE',
        'OTHER',
      ]),
    )
    .nullable()
    .describe('Alıcının aradığı emlak tipleri'),
  locations: z
    .array(z.string())
    .nullable()
    .describe('Alıcının tercih ettiği şehirler/genel lokasyonlar'),
  districts: z
    .array(z.string())
    .nullable()
    .describe('Alıcının tercih ettiği ilçeler'),
  minPrice: z.number().nullable().describe('Alıcının minimum bütçesi'),
  maxPrice: z.number().nullable().describe('Alıcının maksimum bütçesi'),
  minSize: z.number().nullable().describe('Minimum metrekare'),
  maxSize: z.number().nullable().describe('Maksimum metrekare'),
  roomCount: z
    .number()
    .nullable()
    .describe('Oda sayısı tercihi (Belki min/max olarak geliştirilebilir)'),
  features: z
    .array(z.string())
    .nullable()
    .describe('Alıcının aradığı özel nitelikler (balkon, otopark vb.)'),
  transactionType: z.enum(['SALE', 'RENT']).nullable().describe("İşlem tipi: Satılık mı, Kiralık mı?"),
});

export type EmailAnalysisBuyerPreferences = z.infer<
  typeof EmailAnalysisBuyerPreferencesSchema
>;

export const EmailAnalysisPropertySchema = z.object({
  propertyType: z
    .enum([
      'APARTMENT',
      'HOUSE',
      'VILLA',
      'LAND',
      'COMMERCIAL',
      'OFFICE',
      'OTHER',
    ])
    .nullable()
    .describe('Satıcının listelediği emlak tipi'),
  location: z
    .string()
    .nullable()
    .describe('Emlağın tam adresi veya genel konumu'),
  city: z.string().nullable().describe('Emlağın bulunduğu şehir'),
  district: z.string().nullable().describe('Emlağın bulunduğu ilçe'),
  neighborhood: z
    .string()
    .nullable()
    .describe('Emlağın bulunduğu mahalle/semt'),
  price: z.number().nullable().describe('Emlağın fiyatı'),
  currency: z
    .enum(['TRY', 'USD', 'EUR', 'GBP', 'OTHER'])
    .nullable()
    .describe('Fiyatın para birimi'),
  size: z.number().nullable().describe('Emlağın metrekaresi'),
  roomCount: z.number().nullable().describe('Oda sayısı'),
  bathroomCount: z.number().nullable().describe('Banyo sayısı'),
  floor: z.number().nullable().describe('Dairenin bulunduğu kat'),
  totalFloors: z.number().nullable().describe('Binadaki toplam kat sayısı'),
  hasGarage: z.boolean().nullable().describe('Garaj var mı?'),
  hasGarden: z.boolean().nullable().describe('Bahçe var mı?'),
  hasPool: z.boolean().nullable().describe('Havuz var mı?'),
  isFurnished: z.boolean().nullable().describe('Eşyalı mı?'),
  yearBuilt: z.number().nullable().describe('İnşa yılı'),
  description: z
    .string()
    .nullable()
    .describe('Emlak için GPT tarafından üretilebilecek veya mevcut açıklama'),
  features: z
    .array(z.string())
    .nullable()
    .describe('Emlağın öne çıkan nitelikleri'),
  transactionType: z.enum(['SALE', 'RENT']).nullable().describe("İşlem tipi: Satılık mı, Kiralık mı?"),
});

export type EmailAnalysisProperty = z.infer<typeof EmailAnalysisPropertySchema>;

export const EmailAnalysisViewingRequestSchema = z.object({
  propertyId: z
    .string()
    .nullable()
    .describe('Görülmek istenen emlağın IDsi veya referansı'),
  preferredDate: z
    .string()
    .nullable()
    .describe('Tercih edilen görüntüleme tarihi'),
  message: z.string().nullable().describe('Müşterinin özel mesajı'),
});

export const RealEstateEmailAnalysisSchema = z.object({
  type: z
    .enum([
      'BUYER_INQUIRY',
      'SELLER_LISTING',
      'PROPERTY_VIEWING_REQUEST',
      'OTHER',
    ])
    .describe('E-postanın ana amacı/türü'),
  customer: EmailAnalysisCustomerSchema.nullable(),
  buyerPreferences: EmailAnalysisBuyerPreferencesSchema.nullable(),
  property: EmailAnalysisPropertySchema.nullable(),
  viewingRequest: EmailAnalysisViewingRequestSchema.nullable(),
  summary: z
    .string()
    .nullable()
    .describe('E-postanın GPT tarafından üretilen kısa özeti'),
});

export type RealEstateEmailAnalysis = z.infer<
  typeof RealEstateEmailAnalysisSchema
>;
