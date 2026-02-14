import { portalApiClient } from './portalApiClient';

// =============================================================================
// Types
// =============================================================================

export interface SellerProfile {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  shortDescription?: string;
  logoUrl?: string;
  coverUrl?: string;
  status: 'incomplete' | 'pending_review' | 'approved' | 'suspended';
  profileComplete: boolean;
  companyVerified: boolean;
  bankVerified: boolean;
  documentsVerified: boolean;
  canPublish: boolean;
  createdAt: string;
  updatedAt: string;
  company?: SellerCompany;
  address?: SellerAddress;
  bank?: SellerBank;
  contact?: SellerContact;
  documents?: SellerDocument[];
}

export interface SellerCompany {
  id: string;
  sellerId: string;
  legalName: string;
  crNumber?: string;
  vatNumber?: string;
  vatDocumentUrl?: string;
  companyType?: string;
  dateOfEstablishment?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface SellerAddress {
  id: string;
  sellerId: string;
  country: string;
  city: string;
  district?: string;
  street?: string;
  buildingNumber?: string;
  postalCode?: string;
  additionalInfo?: string;
}

export interface SellerBank {
  id: string;
  sellerId: string;
  bankName: string;
  accountHolderName: string;
  iban: string; // Masked
  currency: string;
  bankCountry: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  rejectionReason?: string;
  updatedAt: string;
}

export interface SellerContact {
  id: string;
  sellerId: string;
  businessEmail: string;
  phoneNumber: string;
  whatsapp?: string;
  supportContactName?: string;
}

export interface SellerDocument {
  id: string;
  sellerId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedAt?: string;
  rejectionReason?: string;
  uploadedAt: string;
}

export interface VerificationStatus {
  profileStatus: 'complete' | 'incomplete';
  documentsStatus: 'pending' | 'approved' | 'rejected';
  payoutStatus: 'verified' | 'not_verified';
  canPublish: boolean;
  companyVerified: boolean;
  bankVerified: boolean;
}

export interface SellerProfileInput {
  displayName: string;
  slug?: string;
  shortDescription?: string;
  logoUrl?: string;
  coverUrl?: string;
}

export interface SellerCompanyInput {
  legalName: string;
  crNumber?: string;
  vatNumber?: string;
  vatDocumentUrl?: string;
  companyType?: string;
  dateOfEstablishment?: string;
}

export interface SellerAddressInput {
  country: string;
  city: string;
  district?: string;
  street?: string;
  buildingNumber?: string;
  postalCode?: string;
  additionalInfo?: string;
}

export interface SellerBankInput {
  bankName: string;
  accountHolderName: string;
  iban: string;
  currency?: string;
  bankCountry?: string;
}

export interface SellerContactInput {
  businessEmail: string;
  phoneNumber: string;
  whatsapp?: string;
  supportContactName?: string;
}

// =============================================================================
// Service Methods (uses portalApiClient for automatic auth + token refresh)
// =============================================================================

export const sellerSettingsService = {
  async getProfile(_token: string): Promise<SellerProfile> {
    return portalApiClient.get<SellerProfile>('/api/seller/profile');
  },

  async updateProfile(_token: string, data: SellerProfileInput): Promise<SellerProfile> {
    return portalApiClient.post<SellerProfile>('/api/seller/profile', data);
  },

  async updateCompany(_token: string, data: SellerCompanyInput): Promise<SellerCompany> {
    return portalApiClient.post<SellerCompany>('/api/seller/company', data);
  },

  async updateAddress(_token: string, data: SellerAddressInput): Promise<SellerAddress> {
    return portalApiClient.post<SellerAddress>('/api/seller/address', data);
  },

  async updateBank(_token: string, data: SellerBankInput): Promise<SellerBank> {
    return portalApiClient.post<SellerBank>('/api/seller/bank', data);
  },

  async updateContact(_token: string, data: SellerContactInput): Promise<SellerContact> {
    return portalApiClient.post<SellerContact>('/api/seller/contact', data);
  },

  async uploadDocument(
    _token: string,
    documentType: string,
    fileName: string,
    fileUrl: string,
    fileSize?: number,
    mimeType?: string,
  ): Promise<SellerDocument> {
    return portalApiClient.post<SellerDocument>('/api/seller/documents/upload', {
      documentType,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
    });
  },

  async getDocuments(_token: string): Promise<SellerDocument[]> {
    return portalApiClient.get<SellerDocument[]>('/api/seller/documents');
  },

  async getVerificationStatus(_token: string): Promise<VerificationStatus> {
    return portalApiClient.get<VerificationStatus>('/api/seller/verification-status');
  },

  async checkSlugAvailability(_token: string, slug: string): Promise<{ available: boolean }> {
    return portalApiClient.get<{ available: boolean }>(`/api/seller/check-slug/${encodeURIComponent(slug)}`);
  },
};

export default sellerSettingsService;
