import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Plus,
  Trash2,
  FileText,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';
import api from '../services/api.js';

export default function AddLeadsPage() {
  const [activeTab, setActiveTab] = useState('excel'); // 'excel' | 'manual'
  const navigate = useNavigate();

  // Excel Upload States
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [excelError, setExcelError] = useState('');

  // Manual Entry States
  const [manualForm, setManualForm] = useState({
    name: '',
    countryCode: '+91',
    phoneNumber: '',
    email: '',
    company: '',
    location: '',
    notes: '',
    consentStatus: true
  });
  const [customFields, setCustomFields] = useState([{ key: '', value: '' }]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState('');
  const [manualError, setManualError] = useState('');

  // Handle Drag & Drop / File Select
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setExcelError('');
    setImportResult(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/leads/preview-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setPreviewData(res.data.preview);
      }
    } catch (err) {
      setExcelError(err.response?.data?.message || err.message || 'Failed to parse spreadsheet');
      setPreviewData(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData || !previewData.validRows || previewData.validRows.length === 0) return;

    setIsCommitting(true);
    setExcelError('');

    try {
      const res = await api.post('/leads/commit-import', {
        leads: previewData.validRows,
        skipDuplicates
      });
      if (res.data.success) {
        setImportResult(res.data.result);
      }
    } catch (err) {
      setExcelError(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setIsCommitting(false);
    }
  };

  // Manual Form Handlers
  const handleCustomFieldChange = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualError('');
    setManualSuccess('');
    setManualLoading(true);

    try {
      // Map custom variables into key-value map
      const customVarsObj = {};
      customFields.forEach(({ key, value }) => {
        if (key.trim()) customVarsObj[key.trim()] = value.trim();
      });

      const formattedPhone = `${manualForm.countryCode}${manualForm.phoneNumber.replace(/^0+/, '')}`;

      const res = await api.post('/leads', {
        name: manualForm.name,
        phoneNumber: formattedPhone,
        email: manualForm.email,
        company: manualForm.company,
        location: manualForm.location,
        notes: manualForm.notes,
        customFields: customVarsObj,
        consentStatus: manualForm.consentStatus
      });

      if (res.data.success) {
        setManualSuccess(`Lead "${manualForm.name}" successfully added to database.`);
        setManualForm({
          name: '',
          countryCode: '+91',
          phoneNumber: '',
          email: '',
          company: '',
          location: '',
          notes: '',
          consentStatus: true
        });
        setCustomFields([{ key: '', value: '' }]);
      }
    } catch (err) {
      setManualError(err.response?.data?.message || err.message || 'Failed to add lead');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Add & Ingest Leads
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Import bulk contact lists via validated spreadsheets or add verified leads manually
        </p>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-[var(--border-color)] space-x-6">
        <button
          onClick={() => setActiveTab('excel')}
          className={`flex items-center space-x-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'excel'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel & CSV Bulk Upload</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center space-x-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Manual Lead Entry</span>
        </button>
      </div>

      {/* ================= TAB A: EXCEL BULK UPLOAD ================= */}
      {activeTab === 'excel' && (
        <div className="space-y-6">
          {/* Upload Drop Zone Card */}
          <div className="p-8 rounded-3xl bg-[var(--bg-card)] border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 transition-all text-center relative group">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {file ? file.name : 'Choose or drop your spreadsheet here'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                Supports Microsoft Excel (.xlsx, .xls) and standard comma-separated (.csv) files up to 15MB.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-[11px] text-[var(--text-muted)]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Automatic column header detection, phone validation, and duplicate screening</span>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isUploading && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Parsing spreadsheet and performing schema validation...
              </p>
            </div>
          )}

          {/* Error Notice */}
          {excelError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-3">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <span>{excelError}</span>
            </div>
          )}

          {/* Import Result Banner */}
          {importResult && (
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-bold">Import Completed Successfully!</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-emerald-500/20 text-xs text-[var(--text-primary)]">
                <div>
                  <span className="text-[var(--text-muted)]">Total Ingested:</span>
                  <div className="text-lg font-extrabold text-emerald-400">
                    {importResult.insertedCount}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Duplicates Skipped:</span>
                  <div className="text-lg font-extrabold text-amber-400">
                    {importResult.skippedCount}
                  </div>
                </div>
                <div className="flex items-end justify-end">
                  <button
                    onClick={() => navigate('/leads')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <span>View All Leads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Spreadsheet Preview & Mapping Panel */}
          {previewData && !importResult && (
            <div className="space-y-6">
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <span className="text-xs text-[var(--text-muted)]">Total Rows In File</span>
                  <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
                    {previewData.totalRows}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-xs text-emerald-400 font-medium">Valid Lead Rows</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {previewData.validCount}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-xs text-rose-400 font-medium">Invalid / Malformed</span>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {previewData.invalidCount}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-xs text-amber-400 font-medium">Existing DB Duplicates</span>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {previewData.duplicateDbCount}
                  </div>
                </div>
              </div>

              {/* Column Mapping Preview */}
              <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  Auto-Detected Column Mapping
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  {Object.entries(previewData.mapping).map(([field, mappedHeader]) => (
                    <div key={field} className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 block truncate">
                        {field}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)] truncate block mt-0.5">
                        {mappedHeader || '(Unmapped)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invalid Rows Warning Table if any */}
              {previewData.invalidRows && previewData.invalidRows.length > 0 && (
                <div className="p-5 rounded-3xl bg-rose-500/5 border border-rose-500/25 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Validation Issues ({previewData.invalidRows.length} rows will be omitted)
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-rose-500/20 text-xs">
                    {previewData.invalidRows.map((inv, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <span className="font-mono text-rose-300 font-semibold">Row #{inv.rowNumber}</span>
                        <span className="text-[var(--text-secondary)]">{inv.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Leads Preview Table */}
              <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Valid Leads Preview (First {previewData.validRows.length} Rows)
                  </span>
                  <label className="flex items-center space-x-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded border-[var(--border-color)] text-indigo-600 focus:ring-0"
                    />
                    <span>Skip already existing phone numbers in database</span>
                  </label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">Lead Name</th>
                        <th className="px-4 py-3">Phone (Normalized)</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">DB Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {previewData.validRows.map((r, i) => (
                        <tr key={i} className="hover:bg-[var(--bg-hover)]">
                          <td className="px-4 py-2.5 font-semibold text-[var(--text-primary)]">{r.name}</td>
                          <td className="px-4 py-2.5 font-mono text-indigo-400">{r.phoneNumber}</td>
                          <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.email || '-'}</td>
                          <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.company || '-'}</td>
                          <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.location || '-'}</td>
                          <td className="px-4 py-2.5">
                            {r.isDuplicateInDb ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                Existing Lead
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                New Lead
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Commit Action Bar */}
                <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setPreviewData(null);
                      setFile(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancel / Re-upload
                  </button>

                  <button
                    onClick={handleCommitImport}
                    disabled={isCommitting || previewData.validCount === 0}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCommitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Import {previewData.validCount} Valid Leads to Database</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB B: MANUAL LEAD ENTRY ================= */}
      {activeTab === 'manual' && (
        <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl">
          <div className="mb-6 pb-4 border-b border-[var(--border-color)]">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Manual Contact Registration
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Add individual prospect with personalized variables for high-intent AI outreach
            </p>
          </div>

          {manualSuccess && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{manualSuccess}</span>
            </div>
          )}

          {manualError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{manualError}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Phone Number with Country Code *
                </label>
                <div className="flex space-x-2">
                  <select
                    value={manualForm.countryCode}
                    onChange={(e) => setManualForm({ ...manualForm, countryCode: e.target.value })}
                    className="w-24 px-2.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+971">+971 (UAE)</option>
                    <option value="+65">+65 (SG)</option>
                  </select>
                  <input
                    type="tel"
                    value={manualForm.phoneNumber}
                    onChange={(e) => setManualForm({ ...manualForm, phoneNumber: e.target.value })}
                    placeholder="9876543210"
                    required
                    className="flex-1 px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  placeholder="rahul@company.com"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={manualForm.company}
                  onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                  placeholder="Apex Logistics"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Location (City / State)
                </label>
                <input
                  type="text"
                  value={manualForm.location}
                  onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                  placeholder="Mumbai, Maharashtra"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Initial Notes for AI Agent
                </label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Interested in shipping tracking automation"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Custom Variables Section */}
            <div className="pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Custom Lead Variables</span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Inject specific details (e.g. orderId, policyNumber, loanAmount) into AI prompt
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Variable</span>
                </button>
              </div>

              <div className="space-y-2">
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Variable Name (e.g. loanAmount)"
                      value={field.key}
                      onChange={(e) => handleCustomFieldChange(idx, 'key', e.target.value)}
                      className="w-1/3 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 5,00,000 INR)"
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(idx)}
                      className="p-2 text-[var(--text-muted)] hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Consent & Compliance Check */}
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-start space-x-3">
              <input
                type="checkbox"
                id="consentCheck"
                checked={manualForm.consentStatus}
                onChange={(e) => setManualForm({ ...manualForm, consentStatus: e.target.checked })}
                className="mt-0.5 rounded border-[var(--border-color)] text-indigo-600 focus:ring-0"
              />
              <label htmlFor="consentCheck" className="text-xs text-[var(--text-secondary)] leading-relaxed cursor-pointer">
                <span className="font-semibold text-[var(--text-primary)] block">
                  Telemarketing & Consent Compliance Confirmation
                </span>
                I certify that this lead has provided the necessary opt-in consent or legitimate legal basis to be contacted via automated outbound voice calls, and does not violate TCPA or national telecom DNC regulations.
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={manualLoading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {manualLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Save Lead to MongoDB</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
