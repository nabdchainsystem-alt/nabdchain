const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
// Service Methods
// =============================================================================

export const sellerSettingsService = {
  // Get full seller profile
  async getProfile(token: string): Promise<SellerProfile> {
    const response = await fetch(`${API_BASE}/api/seller/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch seller profile');
    }

    return response.json();
  },

  // Update seller profile
  async updateProfile(token: string, data: SellerProfileInput): Promise<SellerProfile> {
    const response = await fetch(`${API_BASE}/api/seller/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return response.json();
  },

  // Update company info
  async updateCompany(token: string, data: SellerCompanyInput): Promise<SellerCompany> {
    const response = await fetch(`${API_BASE}/api/seller/company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update company info');
    }

    return response.json();
  },

  // Update address
  async updateAddress(token: string, data: SellerAddressInput): Promise<SellerAddress> {
    const response = await fetch(`${API_BASE}/api/seller/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update address');
    }

    return response.json();
  },

  // Update bank info
  async updateBank(token: string, data: SellerBankInput): Promise<SellerBank> {
    const response = await fetch(`${API_BASE}/api/seller/bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update bank info');
    }

    return response.json();
  },

  // Update contact info
  async updateContact(token: string, data: SellerContactInput): Promise<SellerContact> {
    const response = await fetch(`${API_BASE}/api/seller/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update contact info');
    }

    return response.json();
  },

  // Upload document
  async uploadDocument(
    token: string,
    documentType: string,
    fileName: string,
    fileUrl: string,
    fileSize?: number,
    mimeType?: string
  ): Promise<SellerDocument> {
    const response = await fetch(`${API_BASE}/api/seller/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documentType, fileName, fileUrl, fileSize, mimeType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload document');
    }

    return response.json();
  },

  // Get documents
  async getDocuments(token: string): Promise<SellerDocument[]> {
    const response = await fetch(`${API_BASE}/api/seller/documents`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  },

  // Get verification status
  async getVerificationStatus(token: string): Promise<VerificationStatus> {
    const response = await fetch(`${API_BASE}/api/seller/verification-status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch verification status');
    }

    return response.json();
  },

  // Check slug availability
  async checkSlugAvailability(token: string, slug: string): Promise<{ available: boolean }> {
    const response = await fetch(`${API_BASE}/api/seller/check-slug/${encodeURIComponent(slug)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check slug availability');
    }

    return response.json();
  },
};

export default sellerSettingsService;
