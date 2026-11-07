import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleLeads = [
  {
    'Full Name': 'Aditi Rao',
    'Contact Number': '+919876500111',
    'Email Address': 'aditi.rao@fintechcorp.in',
    'Company Name': 'FintechCorp India',
    'City': 'Hyderabad',
    'Loan Requirement': '25,00,000 INR',
    'Industry': 'Financial Services'
  },
  {
    'Full Name': 'Siddharth Sen',
    'Contact Number': '+919876500222',
    'Email Address': 'siddharth@cloudbridge.tech',
    'Company Name': 'CloudBridge Technologies',
    'City': 'Kolkata',
    'Loan Requirement': '50,00,000 INR',
    'Industry': 'Software & Cloud'
  },
  {
    'Full Name': 'Pooja Hegde',
    'Contact Number': '+919876500333',
    'Email Address': 'pooja@hegdeconsulting.com',
    'Company Name': 'Hegde Strategic Consulting',
    'City': 'Bengaluru',
    'Loan Requirement': '15,00,000 INR',
    'Industry': 'Management Consulting'
  },
  {
    'Full Name': 'James Wilson',
    'Contact Number': '+14155550999',
    'Email Address': 'jwilson@pacificventures.com',
    'Company Name': 'Pacific Ventures',
    'City': 'San Francisco',
    'Loan Requirement': '100,000 USD',
    'Industry': 'Venture Capital'
  },
  {
    'Full Name': 'Invalid Record No Phone',
    'Contact Number': 'abc-not-a-phone',
    'Email Address': 'bad.phone@test.com',
    'Company Name': 'Test Bad Org',
    'City': 'Delhi',
    'Loan Requirement': '0 INR',
    'Industry': 'Testing'
  }
];

const worksheet = xlsx.utils.json_to_sheet(sampleLeads);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Leads');

const outputPath = path.join(__dirname, '..', '..', 'sample_leads_to_upload.xlsx');
xlsx.writeFile(workbook, outputPath);
console.log(`✅ Sample Excel file created successfully at: ${outputPath}`);
