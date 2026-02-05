import express, { Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sellerService } from '../services/sellerService';

const router = express.Router();

// =============================================================================
// GET /api/seller/profile - Get full seller profile
// =============================================================================
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const profile = await sellerService.getSellerProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error('Error getting seller profile:', error);
    res.status(500).json({ error: 'Failed to get seller profile' });
  }
});

// =============================================================================
// POST /api/seller/profile - Create/Update seller profile
// =============================================================================
router.post('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { displayName, slug, shortDescription, logoUrl, coverUrl } = req.body;

    if (!displayName) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const profile = await sellerService.updateSellerProfile(userId, {
      displayName,
      slug,
      shortDescription,
      logoUrl,
      coverUrl,
    });

    res.json(profile);
  } catch (error: any) {
    console.error('Error updating seller profile:', error);
    if (error.message === 'Slug already in use') {
      return res.status(400).json({ error: 'This username is already taken' });
    }
    res.status(500).json({ error: 'Failed to update seller profile' });
  }
});

// =============================================================================
// PUT /api/seller/profile - Update seller profile (alias for POST)
// =============================================================================
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { displayName, slug, shortDescription, logoUrl, coverUrl } = req.body;

    if (!displayName) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const profile = await sellerService.updateSellerProfile(userId, {
      displayName,
      slug,
      shortDescription,
      logoUrl,
      coverUrl,
    });

    res.json(profile);
  } catch (error: any) {
    console.error('Error updating seller profile:', error);
    if (error.message === 'Slug already in use') {
      return res.status(400).json({ error: 'This username is already taken' });
    }
    res.status(500).json({ error: 'Failed to update seller profile' });
  }
});

// =============================================================================
// POST /api/seller/company - Create/Update company info
// =============================================================================
router.post('/company', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { legalName, crNumber, vatNumber, vatDocumentUrl, companyType, dateOfEstablishment } = req.body;

    if (!legalName) {
      return res.status(400).json({ error: 'Legal company name is required' });
    }

    const company = await sellerService.updateCompanyInfo(userId, {
      legalName,
      crNumber,
      vatNumber,
      vatDocumentUrl,
      companyType,
      dateOfEstablishment,
    });

    res.json(company);
  } catch (error) {
    console.error('Error updating company info:', error);
    res.status(500).json({ error: 'Failed to update company information' });
  }
});

// =============================================================================
// PUT /api/seller/company - Update company info
// =============================================================================
router.put('/company', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { legalName, crNumber, vatNumber, vatDocumentUrl, companyType, dateOfEstablishment } = req.body;

    if (!legalName) {
      return res.status(400).json({ error: 'Legal company name is required' });
    }

    const company = await sellerService.updateCompanyInfo(userId, {
      legalName,
      crNumber,
      vatNumber,
      vatDocumentUrl,
      companyType,
      dateOfEstablishment,
    });

    res.json(company);
  } catch (error) {
    console.error('Error updating company info:', error);
    res.status(500).json({ error: 'Failed to update company information' });
  }
});

// =============================================================================
// POST /api/seller/address - Create/Update address
// =============================================================================
router.post('/address', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { country, city, district, street, buildingNumber, postalCode, additionalInfo } = req.body;

    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    const address = await sellerService.updateAddress(userId, {
      country: country || 'SA',
      city,
      district,
      street,
      buildingNumber,
      postalCode,
      additionalInfo,
    });

    res.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// =============================================================================
// PUT /api/seller/address - Update address
// =============================================================================
router.put('/address', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { country, city, district, street, buildingNumber, postalCode, additionalInfo } = req.body;

    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    const address = await sellerService.updateAddress(userId, {
      country: country || 'SA',
      city,
      district,
      street,
      buildingNumber,
      postalCode,
      additionalInfo,
    });

    res.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// =============================================================================
// POST /api/seller/bank - Create/Update bank info
// =============================================================================
router.post('/bank', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { bankName, accountHolderName, iban, currency, bankCountry } = req.body;

    if (!bankName || !accountHolderName || !iban) {
      return res.status(400).json({ error: 'Bank name, account holder name, and IBAN are required' });
    }

    // Basic IBAN validation (Saudi IBAN starts with SA and is 24 characters)
    if (bankCountry === 'SA' && (!iban.startsWith('SA') || iban.replace(/\s/g, '').length !== 24)) {
      return res.status(400).json({ error: 'Invalid Saudi IBAN format' });
    }

    const bank = await sellerService.updateBankInfo(userId, {
      bankName,
      accountHolderName,
      iban: iban.replace(/\s/g, ''), // Remove spaces
      currency,
      bankCountry,
    });

    res.json(bank);
  } catch (error) {
    console.error('Error updating bank info:', error);
    res.status(500).json({ error: 'Failed to update bank information' });
  }
});

// =============================================================================
// PUT /api/seller/bank - Update bank info
// =============================================================================
router.put('/bank', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { bankName, accountHolderName, iban, currency, bankCountry } = req.body;

    if (!bankName || !accountHolderName || !iban) {
      return res.status(400).json({ error: 'Bank name, account holder name, and IBAN are required' });
    }

    const bank = await sellerService.updateBankInfo(userId, {
      bankName,
      accountHolderName,
      iban: iban.replace(/\s/g, ''),
      currency,
      bankCountry,
    });

    res.json(bank);
  } catch (error) {
    console.error('Error updating bank info:', error);
    res.status(500).json({ error: 'Failed to update bank information' });
  }
});

// =============================================================================
// POST /api/seller/contact - Create/Update contact info
// =============================================================================
router.post('/contact', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { businessEmail, phoneNumber, whatsapp, supportContactName } = req.body;

    if (!businessEmail || !phoneNumber) {
      return res.status(400).json({ error: 'Business email and phone number are required' });
    }

    const contact = await sellerService.updateContactInfo(userId, {
      businessEmail,
      phoneNumber,
      whatsapp,
      supportContactName,
    });

    res.json(contact);
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({ error: 'Failed to update contact information' });
  }
});

// =============================================================================
// PUT /api/seller/contact - Update contact info
// =============================================================================
router.put('/contact', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { businessEmail, phoneNumber, whatsapp, supportContactName } = req.body;

    if (!businessEmail || !phoneNumber) {
      return res.status(400).json({ error: 'Business email and phone number are required' });
    }

    const contact = await sellerService.updateContactInfo(userId, {
      businessEmail,
      phoneNumber,
      whatsapp,
      supportContactName,
    });

    res.json(contact);
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({ error: 'Failed to update contact information' });
  }
});

// =============================================================================
// POST /api/seller/documents/upload - Upload document
// =============================================================================
router.post('/documents/upload', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { documentType, fileName, fileUrl, fileSize, mimeType } = req.body;

    if (!documentType || !fileName || !fileUrl) {
      return res.status(400).json({ error: 'Document type, file name, and file URL are required' });
    }

    const document = await sellerService.uploadDocument(
      userId,
      documentType,
      fileName,
      fileUrl,
      fileSize,
      mimeType
    );

    res.json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// =============================================================================
// GET /api/seller/documents - Get all documents
// =============================================================================
router.get('/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const documents = await sellerService.getDocuments(userId);
    res.json(documents);
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// =============================================================================
// GET /api/seller/documents/status - Get documents verification status
// =============================================================================
router.get('/documents/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const status = await sellerService.getVerificationStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// =============================================================================
// GET /api/seller/verification-status - Get overall verification status
// =============================================================================
router.get('/verification-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const status = await sellerService.getVerificationStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// =============================================================================
// GET /api/seller/check-slug/:slug - Check slug availability
// =============================================================================
router.get('/check-slug/:slug', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).auth.userId;
    const { slug } = req.params;
    const result = await sellerService.checkSlugAvailability(slug, userId);
    res.json(result);
  } catch (error) {
    console.error('Error checking slug:', error);
    res.status(500).json({ error: 'Failed to check slug availability' });
  }
});

export default router;
