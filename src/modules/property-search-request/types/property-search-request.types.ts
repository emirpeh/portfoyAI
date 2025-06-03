import { Prisma, Customer, PropertySearchRequest } from '@prisma/client';

// getOfferList ve ilgili metodlar için tip tanımlamaları
export interface MailLog {
  id: number;
  type: string;
  externalId?: string;
  from: string;
  to: string;
  cc?: string;
  contentTitle?: string;
  contentBody?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  language?: string;
  supplierOfferId?: number;
  customerMailListId?: number;
  supplierContactId?: number;
  offerId?: number;
  status: PropertySearchRequestStatus;
  customer?: Customer;
}

export interface SupplierContact {
  id: number;
  name?: string;
  email: string;
  companyName?: string;
  gender?: string;
  countries?: string;
  foreignTrades?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface SupplierOfferType {
  id: number;
  status: string;
  supplierId: number;
  createdAt: Date;
  updatedAt: Date;
  offerId?: number;
  supplierContactId?: number;
  price?: string;
  note?: string;
  supplierContact: SupplierContact;
}

export interface OfferResultType {
  id: number;
  offerId: number;
  supplierContactId: number;
  price: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferType {
  id: number;
  offerNo: string;
  status: string;
  customerId: number;
  createdAt: Date;
  updatedAt: Date;
  supplierId?: number;
  supplierOfferId?: number;
  mailLogs: MailLog[];
  SupplierOffer: SupplierOfferType[];
  OfferResult: OfferResultType[];
}

export interface OfferListResponse {
  data: OfferType[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// PropertySearchRequest için temel arayüz
export interface IPropertySearchRequest extends Omit<PropertySearchRequest, 'propertyTypes' | 'locations' | 'requiredFeatures' | 'status'> {
  propertyTypes?: string[];
  locations?: IRequestedLocation[];
  requiredFeatures?: string[];
  status: PropertySearchRequestStatus;
  customer?: Customer;
}

export interface IRequestedLocation {
  city: string;
  district?: string;
  neighborhood?: string;
  suggestionReason?: string;
}

// MatchedProperty için temel arayüz
export interface IMatchedProperty {
  id: number;
  searchRequestId: number;
  listingId: number;
  status: MatchedPropertyStatus;
  matchScore?: number;
  suggestionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enum importları
import { PropertySearchRequestStatus } from './property-search-request.status.enum';
import { MatchedPropertyStatus } from './matched-property.status.enum';

// Servis metotları veya DTO'lar için kullanılabilecek diğer yardımcı tipler
export interface CreatePropertySearchRequestData {
  customerId: number;
  propertyTypes?: string[];
  locations?: IRequestedLocation[];
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  minSize?: number;
  maxSize?: number;
  minRooms?: number;
  maxRooms?: number;
  requiredFeatures?: string[];
  notes?: string;
  status?: PropertySearchRequestStatus;
}

export interface UpdatePropertySearchRequestData {
  propertyTypes?: string[];
  locations?: IRequestedLocation[];
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  minSize?: number;
  maxSize?: number;
  minRooms?: number;
  maxRooms?: number;
  requiredFeatures?: string[];
  notes?: string;
  status?: PropertySearchRequestStatus;
}

export interface CreateMatchedPropertyData {
  searchRequestId: number;
  listingId: number;
  status?: MatchedPropertyStatus;
  matchScore?: number;
  suggestionReason?: string;
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  LAND = 'LAND',
  COMMERCIAL = 'COMMERCIAL',
  OTHER = 'OTHER',
}

export enum MailStatusType {
  USER_NEW_PROPERTY_SEARCH_REQUEST = 'USER_NEW_PROPERTY_SEARCH_REQUEST',
  GPT_ANALYSIS_COMPLETE_FOR_SEARCH_REQUEST = 'GPT_ANALYSIS_COMPLETE_FOR_SEARCH_REQUEST',
  MATCHING_PROPERTIES_FOUND_FOR_REQUEST = 'MATCHING_PROPERTIES_FOUND_FOR_REQUEST',
  NO_MATCHING_PROPERTIES_FOR_REQUEST = 'NO_MATCHING_PROPERTIES_FOR_REQUEST',
  SENT_MATCHING_PROPERTIES_TO_BUYER = 'SENT_MATCHING_PROPERTIES_TO_BUYER',
  NEW_LISTING_NOTIFICATION_TO_MATCHING_BUYERS = 'NEW_LISTING_NOTIFICATION_TO_MATCHING_BUYERS',
  CUSTOMER_REQUEST_CORRECTION = 'CUSTOMER_REQUEST_CORRECTION',
  CUSTOMER_REQUEST_CORRECTION_REMINDED = 'CUSTOMER_REQUEST_CORRECTION_REMINDED',
  LISTING_ANALYSIS_COMPLETE = 'LISTING_ANALYSIS_COMPLETE',
  SEARCH_REQUEST_MISSING_INFO_REMINDER = 'SEARCH_REQUEST_MISSING_INFO_REMINDER',
  NEW_LISTING_MATCH_NOTIFICATION = 'NEW_LISTING_MATCH_NOTIFICATION',
  GENERAL_REMINDER_TO_CUSTOMER = 'GENERAL_REMINDER_TO_CUSTOMER',
} 