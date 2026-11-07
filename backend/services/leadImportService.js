import xlsx from 'xlsx';
import Lead from '../models/Lead.js';

class LeadImportService {
  /**
   * Parses buffer from uploaded file (CSV or XLSX)
   */
  parseSpreadsheet(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    return rawRows;
  }

  /**
   * Intelligently auto-maps column headers to our schema fields
   */
  autoMapColumns(headers) {
    const mapping = {
      name: '',
      phoneNumber: '',
      email: '',
      company: '',
      location: ''
    };

    headers.forEach((h) => {
      const lower = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (['name', 'fullname', 'leadname', 'contactname', 'customername'].includes(lower)) {
        mapping.name = h;
      } else if (['phone', 'phonenumber', 'mobile', 'cell', 'telephone', 'contactnumber', 'contact'].includes(lower)) {
        mapping.phoneNumber = h;
      } else if (['email', 'emailaddress', 'mail'].includes(lower)) {
        mapping.email = h;
      } else if (['company', 'companyname', 'organization', 'business', 'org'].includes(lower)) {
        mapping.company = h;
      } else if (['location', 'city', 'state', 'country', 'address'].includes(lower)) {
        mapping.location = h;
      }
    });

    return mapping;
  }

  /**
   * Validates and normalizes phone number
   */
  validatePhoneNumber(rawPhone) {
    if (!rawPhone) return { isValid: false, normalized: '', reason: 'Phone number is empty' };

    let cleaned = String(rawPhone).trim().replace(/[\s\-\(\)\.]/g, '');

    // If starts with +, verify length
    if (cleaned.startsWith('+')) {
      const digitsOnly = cleaned.slice(1);
      if (/^\d{9,15}$/.test(digitsOnly)) {
        return { isValid: true, normalized: cleaned };
      }
    } else {
      // If 10 digits (common Indian / US format), normalize with default or allow
      if (/^\d{10}$/.test(cleaned)) {
        return { isValid: true, normalized: `+91${cleaned}` }; // Default to +91 or preserve standard
      }
      if (/^\d{11,15}$/.test(cleaned)) {
        return { isValid: true, normalized: `+${cleaned}` };
      }
    }

    return {
      isValid: false,
      normalized: cleaned,
      reason: 'Invalid phone format. Must contain 10-15 digits with valid country code.'
    };
  }

  /**
   * Previews and audits file before committing to database
   */
  async previewAndValidate(buffer) {
    const rawRows = this.parseSpreadsheet(buffer);
    if (!rawRows || rawRows.length === 0) {
      return {
        headers: [],
        mapping: {},
        totalRows: 0,
        validRows: [],
        invalidRows: [],
        duplicateCount: 0
      };
    }

    const headers = Object.keys(rawRows[0]);
    const mapping = this.autoMapColumns(headers);

    const validRows = [];
    const invalidRows = [];
    const seenPhoneNumbersInSheet = new Set();

    // Check existing phone numbers in database for duplicate detection
    const allPhones = rawRows
      .map((r) => r[mapping.phoneNumber])
      .filter(Boolean)
      .map((p) => String(p).trim().replace(/[\s\-\(\)\.]/g, ''));

    const existingLeads = await Lead.find({
      phoneNumber: { $in: allPhones.map((p) => (p.startsWith('+') ? p : `+${p}`)) }
    }).select('phoneNumber');

    const existingDbPhones = new Set(existingLeads.map((l) => l.phoneNumber));

    rawRows.forEach((row, index) => {
      const name = String(row[mapping.name] || '').trim();
      const rawPhone = row[mapping.phoneNumber];
      const email = String(row[mapping.email] || '').trim();
      const company = String(row[mapping.company] || '').trim();
      const location = String(row[mapping.location] || '').trim();

      const phoneValidation = this.validatePhoneNumber(rawPhone);

      // Collect custom fields
      const customFields = {};
      headers.forEach((h) => {
        if (![mapping.name, mapping.phoneNumber, mapping.email, mapping.company, mapping.location].includes(h)) {
          if (row[h] !== undefined && row[h] !== '') {
            customFields[h] = String(row[h]);
          }
        }
      });

      if (!name) {
        invalidRows.push({
          rowNumber: index + 1,
          data: row,
          reason: 'Missing name'
        });
        return;
      }

      if (!phoneValidation.isValid) {
        invalidRows.push({
          rowNumber: index + 1,
          data: row,
          reason: phoneValidation.reason
        });
        return;
      }

      const normalizedPhone = phoneValidation.normalized;

      if (seenPhoneNumbersInSheet.has(normalizedPhone)) {
        invalidRows.push({
          rowNumber: index + 1,
          data: row,
          reason: 'Duplicate phone number inside file'
        });
        return;
      }

      const isDuplicateInDb = existingDbPhones.has(normalizedPhone);
      seenPhoneNumbersInSheet.add(normalizedPhone);

      validRows.push({
        rowNumber: index + 1,
        name,
        phoneNumber: normalizedPhone,
        email,
        company,
        location,
        customFields,
        isDuplicateInDb
      });
    });

    return {
      headers,
      mapping,
      totalRows: rawRows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      duplicateDbCount: validRows.filter((r) => r.isDuplicateInDb).length,
      validRows: validRows.slice(0, 50), // Send first 50 for preview table
      invalidRows,
      sampleRows: rawRows.slice(0, 5)
    };
  }

  /**
   * Commits validated leads into MongoDB
   */
  async commitImport(leadsData, adminId, skipExistingDuplicates = true) {
    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of leadsData) {
      if (skipExistingDuplicates && item.isDuplicateInDb) {
        skippedCount++;
        continue;
      }

      // Check one more time before inserting
      const existing = await Lead.findOne({ phoneNumber: item.phoneNumber });
      if (existing) {
        if (skipExistingDuplicates) {
          skippedCount++;
          continue;
        } else {
          // Update existing
          existing.name = item.name;
          if (item.email) existing.email = item.email;
          if (item.company) existing.company = item.company;
          if (item.location) existing.location = item.location;
          await existing.save();
          insertedCount++;
          continue;
        }
      }

      await Lead.create({
        name: item.name,
        phoneNumber: item.phoneNumber,
        email: item.email || '',
        company: item.company || '',
        location: item.location || '',
        customFields: item.customFields || {},
        status: 'New',
        consentStatus: true,
        consentDate: new Date(),
        consentSource: 'Bulk Excel Import',
        createdBy: adminId
      });

      insertedCount++;
    }

    return {
      success: true,
      insertedCount,
      skippedCount,
      totalProcessed: leadsData.length
    };
  }
}

export const leadImportService = new LeadImportService();
export default leadImportService;
