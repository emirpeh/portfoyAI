import { Customer, PropertySearchRequest, RealEstateListing, TransactionType } from '@prisma/client';

// getOfferList ve ilgili metodlar için tip tanımlamaları
export interface IPropertySearchRequestWithCustomer
  extends PropertySearchRequest {
  customer: Customer;
}

export type IPropertySearchRequest = PropertySearchRequest & {
  propertyTypes?: string[];
  locations?: IRequestedLocation[];
  requiredFeatures?: string[];
  customer?: Customer;
};

export interface IRequestedLocation {
  city: string;
  district?: string;
  neighborhood?: string;
}

export interface IMatchedProperty {
  id: number;
  searchRequestId: number;
  listingId: number;
  status: string; // MatchedPropertyStatus enum
  matchScore?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MailStatusType =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'VIEWED'
  | 'SEARCH_REQUEST_MISSING_INFO_REMINDER';

export type PropertySearchRequestStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'MATCH_FOUND'
  | 'CLOSED'
  | 'CANCELLED';

export type CreatePropertySearchRequestData = {
  requestNo?: string;
  customerId: string;
  status?: PropertySearchRequestStatus;
  notes?: string;
  propertyRequest?: {
    propertyTypes?: string[];
    locations?: string[];
    minPrice?: number;
    maxPrice?: number;
    minRooms?: number;
    minSize?: number;
    maxSize?: number;
    features?: string[];
    notes?: string;
    transactionType?: TransactionType;
  };
};

export type UpdatePropertySearchRequestData = Partial<
  Omit<CreatePropertySearchRequestData, 'customerId'>
>;

export type CreateMatchedPropertyData = {
  searchRequestId: number;
  listingId: number;
  status: string; // MatchedPropertyStatus enum
  matchScore?: number;
  notes?: string;
};

export type PropertySearchRequestWithDetails = PropertySearchRequest & {
  customer: Customer;
  // ... existing code ...
};