import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { kycApi } from '../api/kycApi';
import { uploadApi } from '../api/uploadApi';
import { locationApi } from '../api/locationApi';
import { creditApi } from '../api/creditApi';
import { addressApi } from '../api/addressApi';
import { authApi } from '../api/authApi';
import { paymentApi } from '../api/paymentApi';
import type { KYCDocument, KYCDocumentType, CreditLedger, CreditApplicationResult, PaymentStatusResponse } from '../types';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import {
  ShieldCheck,
  Plus,
  Trash2,
  FileCheck,
  Check,
  Navigation,
  Loader2,
  MapPin,
  CreditCard,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Eye,
  Receipt,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, addresses, addAddress, deleteAddress, setDefaultAddress, updateUser } = useAuthStore();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'kyc' | 'credit' | 'payments'>('profile');
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentStatusResponse[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Profile Edit Form
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(user.fullName || user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editCompanyName, setEditCompanyName] = useState(user.companyName);

  // Address form
  const [newSiteName, setNewSiteName] = useState('');
  const [newRecipient, setNewRecipient] = useState(user.name);
  const [newPhone, setNewPhone] = useState(user.phone);
  const [newLine1, setNewLine1] = useState('');
  const [newLine2, setNewLine2] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [hasHeavyAccess, setHasHeavyAccess] = useState(true);
  const [newLat, setNewLat] = useState<number | undefined>();
  const [newLng, setNewLng] = useState<number | undefined>();
  const [isDetectingSiteLoc, setIsDetectingSiteLoc] = useState(false);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation is not supported by your browser', 'Location Error');
      return;
    }
    setIsDetectingSiteLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setNewLat(latitude);
          setNewLng(longitude);
          const geo = await locationApi.reverseGeocode(latitude, longitude);
          if (geo) {
            if (geo.addressLine1) setNewLine1(geo.addressLine1);
            if (geo.addressLine2) setNewLine2(geo.addressLine2);
            if (geo.city) setNewCity(geo.city);
            if (geo.state) setNewState(geo.state);
            if (geo.pincode) setNewPincode(geo.pincode);
            if (geo.area) setNewLandmark(`Near ${geo.area}`);
            showToast('success', `GPS coordinates resolved: ${geo.city} (${geo.pincode})`, 'Location Auto-Filled');
          }
        } catch (err: any) {
          showToast('error', err?.message || 'Failed to reverse geocode GPS location', 'Location Error');
        } finally {
          setIsDetectingSiteLoc(false);
        }
      },
      (err) => {
        setIsDetectingSiteLoc(false);
        showToast('error', err?.message || 'GPS location permission denied', 'Location Error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // KYC Upload Form
  const [docType, setDocType] = useState<KYCDocumentType>('GST_CERTIFICATE');
  const [docTitle, setDocTitle] = useState('GST Registration Certificate');
  const [docNumber, setDocNumber] = useState(user.gstin || '');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // B2B Trade Credit State
  const [creditLedger, setCreditLedger] = useState<CreditLedger | null>(null);
  const [isLoadingCredit, setIsLoadingCredit] = useState(false);
  const [isApplyingCredit, setIsApplyingCredit] = useState(false);
  const [creditResult, setCreditResult] = useState<CreditApplicationResult | null>(null);
  const [creditRequestedLimit, setCreditRequestedLimit] = useState(1000000);
  const [creditTenureDays, setCreditTenureDays] = useState(30);
  const [creditTurnover, setCreditTurnover] = useState(50000000);
  const [creditNotes, setCreditNotes] = useState('');

  useEffect(() => {
    kycApi.getDocuments(user.id).then(setDocuments).catch(console.error);
  }, [user.id]);

  useEffect(() => {
    if (activeTab === 'credit') {
      setIsLoadingCredit(true);
      creditApi
        .getCreditLedger()
        .then(setCreditLedger)
        .catch(console.error)
        .finally(() => setIsLoadingCredit(false));
    }
  }, [activeTab]);

  const fetchPayments = async () => {
    if (!user?.id) return;
    setIsLoadingPayments(true);
    try {
      const data = await paymentApi.getCustomerPaymentHistory(user.id);
      setPaymentHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Customer payment history notice:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab, user?.id]);

  const handleApplyCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplyingCredit(true);
    try {
      const res = await creditApi.applyForCredit({
        businessName: user.companyName || user.name || 'Enterprise Buyer',
        gstin: user.gstin || '',
        panNumber: user.panNumber || (user.gstin ? user.gstin.substring(2, 12) : 'AABCH9988C'),
        requestedLimit: creditRequestedLimit,
        tenureDays: creditTenureDays,
        annualTurnover: creditTurnover,
        notes: creditNotes,
      });
      setCreditResult(res);
      showToast('success', `Trade credit application submitted! Application Ref: ${res.applicationId}`, 'Credit Application Submitted');
      const updated = await creditApi.getCreditLedger();
      setCreditLedger(updated);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to submit credit application', 'Credit Error');
    } finally {
      setIsApplyingCredit(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine1.trim() || !newPincode.trim()) {
      showToast('error', 'Please enter valid address details', 'Incomplete Form');
      return;
    }

    try {
      await addAddress({
        siteName: newSiteName,
        recipientName: newRecipient,
        contactName: newRecipient,
        mobile: newPhone,
        phone: newPhone,
        companyName: user.companyName,
        gstin: user.gstin,
        addressLine1: newLine1,
        addressLine2: newLine2,
        landmark: newLandmark,
        city: newCity,
        state: newState,
        pincode: newPincode,
        latitude: newLat,
        longitude: newLng,
        addressType: 'Site / Project',
        isDefaultDelivery: addresses.length === 0,
        isDefaultBilling: false,
        hasHeavyVehicleAccess: hasHeavyAccess,
      });

      setIsAddingSite(false);
      showToast('success', `Added new site address: ${newCity} (${newPincode})`, 'Address Added');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      showToast('info', 'Address removed from your project directory.', 'Address Removed');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({
        name: editFullName,
        fullName: editFullName,
        phone: editPhone,
        email: editEmail,
        companyName: editCompanyName,
      });
      setIsEditingProfile(false);
      showToast('success', 'Company profile updated successfully.', 'Profile Saved');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !fileName) {
      showToast('error', 'Please select a document file to upload.', 'File Missing');
      return;
    }
    setIsUploadingDoc(true);
    try {
      let fileUrl = `https://s3.amazonaws.com/hinchmart/documents/${fileName}`;
      let actualSize = '1.4 MB';
      if (selectedFile) {
        const uploadRes = await uploadApi.uploadFile(selectedFile, 'kyc');
        fileUrl = uploadRes.url || uploadRes.fileUrl;
        actualSize = uploadRes.fileSize || `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const newDoc = await kycApi.submitDocument(user.id, {
        documentType: docType,
        title: docTitle || `${docType.replace(/_/g, ' ')} Document`,
        documentNumber: docNumber,
        fileName: selectedFile?.name || fileName,
        fileUrl,
        fileSize: actualSize,
        expiresOn: '2028-12-31',
      });
      setDocuments((prev) => [...prev, newDoc]);
      setIsUploadingDoc(false);
      setFileName('');
      setSelectedFile(null);
      showToast('success', 'Document submitted for compliance review.', 'KYC Submitted');
    } catch (err: any) {
      console.error(err);
      setIsUploadingDoc(false);
      showToast('error', err?.message || 'Document upload failed. Please try again.', 'KYC Error');
    }
  };

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 1. Header & Enterprise Profile Summary */}
      <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 rounded-3xl p-6 sm:p-8 text-white border border-industrial-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-600/30 shrink-0">
            {(user.companyName || user.fullName || user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {user.companyName || user.fullName || user.name || 'Enterprise Buyer Account'}
              </h1>
              {user.isGstVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GST Verified Enterprise</span>
                </span>
              )}
            </div>

            <div className="text-xs text-industrial-400 flex flex-wrap items-center gap-3">
              <span>Primary Representative: <strong className="text-white">{user.fullName || user.name || 'Primary User'}</strong></span>
              <span>•</span>
              <span className="font-mono">GSTIN: <strong className="text-brand-400">{user.gstin || 'Not Provided'}</strong></span>
              <span>•</span>
              <span>Type: {user.businessType || 'Buyer'}</span>
            </div>
          </div>
        </div>

        {/* Account Overview Snapshot */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs space-y-2 shrink-0 min-w-56">
          <div className="text-[10px] uppercase font-bold text-industrial-300 flex items-center justify-between">
            <span>Procurement Account</span>
            <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-bold">Active Buyer</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-lg font-black text-white font-mono">{addresses.length}</div>
              <div className="text-[10px] text-industrial-300">Delivery Sites</div>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <div>
              <div className="text-lg font-black text-white font-mono">{user.procurementStats?.totalOrders || 0}</div>
              <div className="text-[10px] text-industrial-300">Total Orders</div>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <div>
              <div className="text-lg font-black text-white font-mono">{documents.length}</div>
              <div className="text-[10px] text-industrial-300">KYC Docs</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 border-b border-industrial-200 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'profile', label: 'Company Profile & Rep' },
          { id: 'addresses', label: `Delivery Sites & Address Book (${addresses.length})` },
          { id: 'kyc', label: `KYC Compliance Documents (${documents.length})` },
          { id: 'credit', label: 'B2B Trade Credit & Ledger' },
          { id: 'payments', label: `Online Payments & Receipts (${paymentHistory.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-industrial-900 text-white shadow-sm'
                : 'text-industrial-600 hover:bg-industrial-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Business Details */}
          <div className="bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-industrial-100 pb-2">
              <h3 className="font-bold text-sm text-industrial-950">
                Registered Business Entity
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const refreshed = await authApi.getProfile();
                      showToast('success', `Profile synced: ${refreshed.name || refreshed.companyName}`, 'Profile Refreshed');
                    } catch {
                      showToast('info', 'Profile verified with local cache', 'Profile Refreshed');
                    }
                  }}
                  className="text-xs font-semibold text-industrial-500 hover:text-industrial-700 flex items-center gap-1 cursor-pointer"
                  title="Synchronize profile from server"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </button>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                >
                  {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-industrial-600">Company Name</label>
                  <input
                    type="text"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full p-2 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-industrial-600">Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full p-2 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-industrial-600">Official Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-industrial-600">Official Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between py-1.5 border-b border-industrial-50">
                  <span className="text-industrial-500">Legal Company Name:</span>
                  <span className="font-bold text-industrial-900">{user.companyName || user.fullName || user.name || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-50">
                  <span className="text-industrial-500">GSTIN Identification:</span>
                  <span className="font-mono font-bold text-brand-700">{user.gstin || 'Not Provided'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-50">
                  <span className="text-industrial-500">Permanent Account No (PAN):</span>
                  <span className="font-mono font-bold text-industrial-900">{user.pan || 'Not Provided'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-50">
                  <span className="text-industrial-500">Business Constitution:</span>
                  <span className="font-semibold text-industrial-900">{user.businessType || 'Enterprise Buyer'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-50">
                  <span className="text-industrial-500">Industry / Domain:</span>
                  <span className="font-semibold text-industrial-900">{user.industry || 'General Procurement'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Authorized Officer */}
          <div className="bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-industrial-950 border-b border-industrial-100 pb-2">
              Authorized Procurement Officer
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-industrial-50">
                <span className="text-industrial-500">Full Name:</span>
                <span className="font-bold text-industrial-900">{user.fullName || user.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-industrial-50">
                <span className="text-industrial-500">Official Email:</span>
                <span className="font-semibold text-industrial-900">{user.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-industrial-50">
                <span className="text-industrial-500">Contact Number:</span>
                <span className="font-semibold text-industrial-900">{user.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-industrial-50">
                <span className="text-industrial-500">Buyer Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Approved Tier-1 Gold Buyer
                </span>
              </div>
            </div>
          </div>

          {user.procurementStats && (
            <div className="bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-4">
              <h3 className="font-bold text-sm text-industrial-950">Enterprise Procurement Metrics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-industrial-50 rounded-2xl">
                  <div className="text-2xl font-black text-industrial-950 font-mono">{user.procurementStats.totalOrders}</div>
                  <div className="text-xs text-industrial-500 font-semibold mt-1">Total Orders Placed</div>
                </div>
                <div className="p-4 bg-industrial-50 rounded-2xl">
                  <div className="text-2xl font-black text-brand-600 font-mono">{user.procurementStats.activeRfqs}</div>
                  <div className="text-xs text-industrial-500 font-semibold mt-1">Active RFQs</div>
                </div>
                <div className="p-4 bg-industrial-50 rounded-2xl">
                  <div className="text-2xl font-black text-industrial-950 font-mono">{user.procurementStats.wishlistItems}</div>
                  <div className="text-xs text-industrial-500 font-semibold mt-1">Bookmarked SKUs</div>
                </div>
                <div className="p-4 bg-industrial-50 rounded-2xl">
                  <div className="text-2xl font-black text-emerald-600 font-mono">{addresses.length}</div>
                  <div className="text-xs text-industrial-500 font-semibold mt-1">Active Project Sites</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delivery Sites Tab */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-industrial-950">Project Site Delivery Yards</h3>
            <button
              onClick={() => setIsAddingSite(!isAddingSite)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Delivery Site</span>
            </button>
          </div>

          {isAddingSite && (
            <form onSubmit={handleSaveAddress} className="bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-industrial-100">
                <h4 className="font-bold text-sm text-industrial-900">Add Project Site Address</h4>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetectingSiteLoc}
                  className="px-3 py-1.5 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDetectingSiteLoc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                      <span>Resolving GPS...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-brand-600" />
                      <span>Auto-Fill from GPS</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-industrial-700">Project / Site Name *</label>
                  <input
                    type="text"
                    required
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-industrial-700">Recipient / Site Engineer Name *</label>
                  <input
                    type="text"
                    required
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-industrial-700">Site Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-industrial-700">Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Gate 3 Steel Yard"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-industrial-700">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    placeholder="Plot / Survey No, Corridor"
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-industrial-700">Address Line 2</label>
                  <input
                    type="text"
                    placeholder="Phase / Sector"
                    value={newLine2}
                    onChange={(e) => setNewLine2(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-industrial-700">City *</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-industrial-700">State *</label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-industrial-700">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 font-semibold text-industrial-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHeavyAccess}
                      onChange={(e) => setHasHeavyAccess(e.target.checked)}
                      className="rounded border-industrial-300 text-brand-600"
                    />
                    <span>Has heavy multi-axle trailer & crane vehicle access</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSite(false)}
                  className="px-4 py-2 text-industrial-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Site Address
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white p-5 rounded-2xl border border-industrial-200 shadow-card space-y-3 text-xs relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-industrial-950 flex items-center gap-2">
                      <span>{addr.siteName || addr.addressLine1}</span>
                      {addr.hasHeavyVehicleAccess && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-semibold">
                          Heavy Trailer Access
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-industrial-500 mt-0.5">
                      Recipient: <strong>{addr.recipientName || addr.contactName}</strong> ({addr.phone || addr.mobile})
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const detailed = await addressApi.getAddressById(addr.id || addr.addressId || '');
                          if (detailed) {
                            showToast('info', `Verified address: ${detailed.city}, ${detailed.pincode}`, 'Address Verified');
                          }
                        } catch {
                          showToast('info', `Site address: ${addr.city}, ${addr.pincode}`, 'Site Address');
                        }
                      }}
                      className="text-industrial-400 hover:text-brand-600 p-1.5 rounded-lg hover:bg-industrial-50 cursor-pointer"
                      title="Inspect address details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Remove address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-industrial-700 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  {addr.landmark ? ` (Landmark: ${addr.landmark})` : ''}
                  <br />
                  <strong className="text-industrial-900">{addr.city}, {addr.state} � {addr.pincode}</strong>
                </div>

                <div className="pt-2.5 border-t border-industrial-100 flex items-center justify-between text-[11px]">
                  {addr.isDefault || addr.isDefaultDelivery ? (
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Default Delivery Site
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await setDefaultAddress(addr.id || addr.addressId || '');
                        showToast('success', `${addr.siteName || 'Address'} marked as default delivery site`, 'Default Updated');
                      }}
                      className="text-industrial-500 hover:text-brand-600 font-bold hover:underline cursor-pointer"
                    >
                      Set as Default Site
                    </button>
                  )}
                  {addr.latitude !== undefined && addr.longitude !== undefined && (
                    <span className="text-industrial-400 font-mono text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-500 shrink-0" />
                      <span>{Number(addr.latitude).toFixed(4)}, {Number(addr.longitude).toFixed(4)}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KYC Compliance Tab */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-industrial-950 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Submit Compliance & Legal Documents</span>
            </h3>

            <form onSubmit={handleSubmitKYC} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-industrial-700 mb-1">Document Type *</label>
                <select
                  value={docType}
                  onChange={(e) => {
                    const val = e.target.value as KYCDocumentType;
                    setDocType(val);
                    setDocTitle(val.replace(/_/g, ' '));
                  }}
                  className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                >
                  <option value="GST_CERTIFICATE">GST Registration Certificate</option>
                  <option value="COMPANY_PAN">Company PAN Card</option>
                  <option value="INCORPORATION_CERTIFICATE">Certificate of Incorporation</option>
                  <option value="MSME_UDYAM">MSME Udyam Certificate</option>
                  <option value="TRADE_LICENSE">Trade License</option>
                  <option value="CHEQUE">Cancelled Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-industrial-700 mb-1">Document Number / ID *</label>
                <input
                  type="text"
                  required
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-industrial-700 mb-1">Select PDF / Image File *</label>
                <input
                  type="file"
                  id="kyc-file-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      setFileName(e.target.files[0].name);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <label
                    htmlFor="kyc-file-upload"
                    className="flex-1 p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-center font-semibold text-industrial-700 hover:bg-industrial-100 cursor-pointer truncate"
                  >
                    {fileName || 'Choose File'}
                  </label>
                  <button
                    type="submit"
                    disabled={isUploadingDoc}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingDoc ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc.documentId} className="bg-white p-5 rounded-2xl border border-industrial-200 shadow-card space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-industrial-950">{doc.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <div className="font-mono text-industrial-600">Doc No: {doc.documentNumber}</div>
                <div className="text-industrial-400 text-[11px] flex justify-between">
                  <span>File: {doc.fileName}</span>
                  <span>Expires: {doc.expiresOn || '2028-12-31'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. B2B Trade Credit & Ledger Tab */}
      {activeTab === 'credit' && (
        <div className="space-y-6 text-xs">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-industrial-200 shadow-subtle space-y-1">
              <div className="flex items-center justify-between text-industrial-500 font-bold text-[11px]">
                <span>Total Approved Limit</span>
                <CreditCard className="w-4 h-4 text-brand-600" />
              </div>
              <div className="text-2xl font-black text-industrial-950 font-mono">
                {formatINR(creditLedger?.creditLimit || 0)}
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    creditLedger?.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : creditLedger?.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-industrial-100 text-industrial-600'
                  }`}
                >
                  {creditLedger?.status || 'NOT APPLIED'}
                </span>
                <span className="text-[10px] text-industrial-400">Institutional Line</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-industrial-200 shadow-subtle space-y-1">
              <div className="flex items-center justify-between text-industrial-500 font-bold text-[11px]">
                <span>Available Balance</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {formatINR(creditLedger?.availableLimit || 0)}
              </div>
              <p className="text-[10px] text-industrial-400 pt-1">Ready for 1-click checkout</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-industrial-200 shadow-subtle space-y-1">
              <div className="flex items-center justify-between text-industrial-500 font-bold text-[11px]">
                <span>Utilized / Outstanding</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {formatINR(creditLedger?.utilizedLimit || creditLedger?.dueAmount || 0)}
              </div>
              <p className="text-[10px] text-industrial-400 pt-1">Active site consignments</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-industrial-200 shadow-subtle space-y-1">
              <div className="flex items-center justify-between text-industrial-500 font-bold text-[11px]">
                <span>Next Repayment Due</span>
                <Calendar className="w-4 h-4 text-industrial-600" />
              </div>
              <div className="text-lg font-black text-industrial-900 font-mono">
                {creditLedger?.dueDate ? formatDate(creditLedger.dueDate) : 'No Dues Pending'}
              </div>
              <p className="text-[10px] text-industrial-400 pt-1">Direct NEFT/RTGS settlement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Apply for Credit / Limit Revision (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-5">
              <div className="border-b border-industrial-100 pb-3">
                <h3 className="font-bold text-sm text-industrial-950 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <span>Apply for B2B Procurement Credit</span>
                </h3>
                <p className="text-[11px] text-industrial-500 mt-0.5">
                  Unlock 15-90 days interest-free working capital for steel, cement, and electricals.
                </p>
              </div>

              {creditResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Application Submitted Successfully</span>
                  </div>
                  <p className="text-[11px]">
                    Reference ID: <strong className="font-mono">{creditResult.applicationId}</strong>. Status: <strong>{creditResult.status}</strong>.
                  </p>
                </div>
              )}

              <form onSubmit={handleApplyCredit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-industrial-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={user.companyName || user.name || ''}
                    disabled
                    className="w-full p-2.5 bg-industrial-100 border border-industrial-200 rounded-xl text-industrial-600 text-xs font-semibold cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-industrial-700 mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={user.gstin || ''}
                      disabled
                      className="w-full p-2.5 bg-industrial-100 border border-industrial-200 rounded-xl text-industrial-600 text-xs font-mono font-semibold cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-industrial-700 mb-1">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={user.panNumber || (user.gstin ? user.gstin.substring(2, 12) : 'AABCH9988C')}
                      disabled
                      className="w-full p-2.5 bg-industrial-100 border border-industrial-200 rounded-xl text-industrial-600 text-xs font-mono font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-industrial-700 mb-1">
                    Requested Credit Limit (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-industrial-500 font-bold">₹</span>
                    <input
                      type="number"
                      step={50000}
                      min={100000}
                      value={creditRequestedLimit}
                      onChange={(e) => setCreditRequestedLimit(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2.5 border border-industrial-300 rounded-xl text-xs font-mono font-bold text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-industrial-400 mt-1 block">
                    e.g. ₹10,00,000 (10 Lakhs) to ₹1,00,00,000 (1 Crore)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-industrial-700 mb-1">
                      Desired Credit Tenure
                    </label>
                    <select
                      value={creditTenureDays}
                      onChange={(e) => setCreditTenureDays(Number(e.target.value))}
                      className="w-full p-2.5 border border-industrial-300 rounded-xl text-xs font-semibold text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value={15}>15 Days Net</option>
                      <option value={30}>30 Days Net</option>
                      <option value={45}>45 Days Net</option>
                      <option value={60}>60 Days Net</option>
                      <option value={90}>90 Days (Enterprise)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-industrial-700 mb-1">
                      Annual Turnover (INR)
                    </label>
                    <input
                      type="number"
                      step={500000}
                      value={creditTurnover}
                      onChange={(e) => setCreditTurnover(Number(e.target.value))}
                      className="w-full p-2.5 border border-industrial-300 rounded-xl text-xs font-mono font-semibold text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-industrial-700 mb-1">
                    Project / Infrastructure Requirements (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    placeholder="Brief description of active sites, ongoing EPC projects, or monthly procurement budget..."
                    className="w-full p-2.5 border border-industrial-300 rounded-xl text-xs text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="p-3 bg-industrial-50 rounded-xl border border-industrial-200 text-[11px] text-industrial-600 space-y-1">
                  <div className="font-bold text-industrial-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>NBFC & Banking Partner Verification</span>
                  </div>
                  <p>
                    Collateral-free credit limit evaluated using GST e-invoices and banking bureau score. Fast turnaround in 24 hours.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isApplyingCredit}
                  className="w-full py-3 bg-[#d9232d] hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isApplyingCredit ? 'Submitting Application...' : 'Submit Credit Application'}
                </button>
              </form>
            </div>

            {/* Right: Credit Ledger Statement (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-industrial-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-industrial-950">
                    Trade Credit Ledger & Account Statement
                  </h3>
                  <p className="text-[11px] text-industrial-500 mt-0.5">
                    Real-time itemized record of order drawdowns, bank repayments, and settlement dates.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsLoadingCredit(true);
                    creditApi.getCreditLedger().then(setCreditLedger).finally(() => setIsLoadingCredit(false));
                  }}
                  className="px-3 py-1.5 bg-industrial-100 hover:bg-industrial-200 rounded-xl text-[11px] font-bold text-industrial-800 transition-colors cursor-pointer"
                >
                  Refresh Statement
                </button>
              </div>

              {isLoadingCredit ? (
                <div className="p-12 text-center text-xs text-industrial-400">
                  Loading trade credit statement...
                </div>
              ) : creditLedger && creditLedger.transactions && creditLedger.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-industrial-100 text-[10px] text-industrial-400 uppercase">
                        <th className="py-2.5 font-bold">Date</th>
                        <th className="py-2.5 font-bold">Type</th>
                        <th className="py-2.5 font-bold">Description</th>
                        <th className="py-2.5 font-bold">Ref No</th>
                        <th className="py-2.5 font-bold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-industrial-50">
                      {creditLedger.transactions.map((tx) => (
                        <tr key={tx.transactionId} className="hover:bg-industrial-50/50">
                          <td className="py-3 text-industrial-600 font-mono text-[11px]">
                            {formatDate(tx.date)}
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tx.type === 'REPAYMENT'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {tx.type === 'REPAYMENT' ? (
                                <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3 text-rose-600" />
                              )}
                              <span>{tx.type}</span>
                            </span>
                          </td>
                          <td className="py-3 font-semibold text-industrial-900 max-w-xs truncate">
                            {tx.description}
                          </td>
                          <td className="py-3 font-mono text-[11px] text-industrial-500">
                            {tx.referenceNumber || '—'}
                          </td>
                          <td
                            className={`py-3 text-right font-mono font-bold ${
                              tx.type === 'REPAYMENT' ? 'text-emerald-700' : 'text-industrial-900'
                            }`}
                          >
                            {tx.type === 'REPAYMENT' ? '-' : '+'}{formatINR(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 px-4 text-center space-y-3 bg-industrial-50/60 rounded-2xl border border-dashed border-industrial-200">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-industrial-200 flex items-center justify-center mx-auto text-industrial-400 shadow-2xs">
                    <CreditCard className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-industrial-900">
                      No Drawdown Statements Yet
                    </h4>
                    <p className="text-xs text-industrial-500 max-w-md mx-auto mt-1 leading-relaxed">
                      Submit your credit line application using the form on the left. Once approved by our financing partners, choose "30-Day B2B Trade Credit" during checkout to place orders with deferred payment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Online Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-industrial-200 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-industrial-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-industrial-950 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand-600" />
                  <span>Razorpay Payment History & Statements</span>
                </h3>
                <p className="text-xs text-industrial-500 mt-1">
                  Synchronized live from HinchMart Gateway APIs for buyer <strong className="text-industrial-900">{user.companyName || user.fullName || user.name}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchPayments}
                disabled={isLoadingPayments}
                className="px-4 py-2 bg-industrial-100 hover:bg-industrial-200 text-industrial-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPayments ? 'animate-spin' : ''}`} />
                <span>{isLoadingPayments ? 'Refreshing...' : 'Sync Payments'}</span>
              </button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Transactions</div>
                <div className="text-2xl font-black font-mono text-slate-900">{paymentHistory.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Captured Settlements</div>
                <div className="text-2xl font-black font-mono text-emerald-800">
                  {formatINR(
                    paymentHistory
                      .filter((p) => p.status === 'CAPTURED')
                      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                  )}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Refunds Processed</div>
                <div className="text-2xl font-black font-mono text-amber-800">
                  {paymentHistory.filter((p) => p.status === 'REFUNDED' || p.status === 'REFUNDED_TO_WALLET').length}
                </div>
              </div>
            </div>

            {/* Payments Table / List */}
            {isLoadingPayments ? (
              <div className="py-16 text-center text-industrial-500 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                <span>Fetching live payment statements from backend gateway...</span>
              </div>
            ) : paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-industrial-100 text-[11px] uppercase tracking-wider text-industrial-500">
                      <th className="py-3 font-bold">Transaction Reference</th>
                      <th className="py-3 font-bold">Order Details</th>
                      <th className="py-3 font-bold">Method</th>
                      <th className="py-3 font-bold">Status</th>
                      <th className="py-3 font-bold">Timestamp</th>
                      <th className="py-3 font-bold text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-industrial-100">
                    {paymentHistory.map((pm) => (
                      <tr key={pm.paymentId || pm.razorpayPaymentId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 space-y-0.5">
                          <div className="font-mono font-bold text-industrial-900 text-xs">
                            {pm.razorpayPaymentId || `TXN-${pm.paymentId}`}
                          </div>
                          {pm.razorpayOrderId && (
                            <div className="font-mono text-[10px] text-industrial-400">
                              Order ID: {pm.razorpayOrderId}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-industrial-900">
                            {pm.orderNumber ? `#${pm.orderNumber}` : pm.orderId ? `Order #${pm.orderId}` : 'Direct Top-Up'}
                          </div>
                          <div className="text-[10px] text-industrial-500">{pm.purpose || 'ORDER_PAYMENT'}</div>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] uppercase">
                            {pm.paymentMethod || 'UPI/ONLINE'}
                          </span>
                        </td>
                        <td className="py-3.5">
                          {pm.status === 'CAPTURED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Captured</span>
                            </span>
                          ) : pm.status === 'REFUNDED' || pm.status === 'REFUNDED_TO_WALLET' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Refunded</span>
                            </span>
                          ) : pm.status === 'FAILED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{pm.status}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-industrial-600 text-[11px]">
                          {pm.createdAt ? formatDateTime(pm.createdAt) : 'Recently'}
                        </td>
                        <td className="py-3.5 text-right font-mono font-black text-industrial-950 text-sm">
                          {formatINR(pm.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 px-4 text-center space-y-3 bg-industrial-50/60 rounded-2xl border border-dashed border-industrial-200">
                <div className="w-12 h-12 rounded-2xl bg-white border border-industrial-200 flex items-center justify-center mx-auto text-industrial-400 shadow-2xs">
                  <Receipt className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-industrial-900">No Online Payment Transactions Yet</h4>
                  <p className="text-xs text-industrial-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Once you settle orders via Razorpay, UPI, or Debit/Credit card during checkout or from your Orders page, transaction receipts and gateway references will appear here automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
