import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { kycApi } from '../api/kycApi';
import { uploadApi } from '../api/uploadApi';
import type { KYCDocument, KYCDocumentType } from '../types';
import {
  ShieldCheck,
  Plus,
  Trash2,
  FileCheck,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, addresses, addAddress, deleteAddress, updateUser } = useAuthStore();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'kyc'>('profile');
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

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

  // KYC Upload Form
  const [docType, setDocType] = useState<KYCDocumentType>('GST_CERTIFICATE');
  const [docTitle, setDocTitle] = useState('GST Registration Certificate');
  const [docNumber, setDocNumber] = useState(user.gstin || '');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    kycApi.getDocuments(user.id).then(setDocuments).catch(console.error);
  }, [user.id]);

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
        addressType: 'Site / Project',
        isDefaultDelivery: false,
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
            {(user.companyName || 'H').charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{user.companyName || 'Apex Infra Projects Pvt Ltd'}</h1>
              {user.isGstVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GST Verified Enterprise</span>
                </span>
              )}
            </div>

            <div className="text-xs text-industrial-400 flex flex-wrap items-center gap-3">
              <span>Primary Representative: <strong className="text-white">{user.fullName || user.name}</strong></span>
              <span>•</span>
              <span className="font-mono">GSTIN: <strong className="text-brand-400">{user.gstin}</strong></span>
              <span>•</span>
              <span>Type: {user.businessType}</span>
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
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
              >
                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
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
                  <span className="font-bold text-industrial-900">{user.companyName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-50">
                  <span className="text-industrial-500">GSTIN Identification:</span>
                  <span className="font-mono font-bold text-brand-700">{user.gstin}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-50">
                  <span className="text-industrial-500">Permanent Account No (PAN):</span>
                  <span className="font-mono font-bold text-industrial-900">{user.pan}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-50">
                  <span className="text-industrial-500">Business Constitution:</span>
                  <span className="font-semibold text-industrial-900">{user.businessType}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-industrial-50">
                  <span className="text-industrial-500">Industry / Domain:</span>
                  <span className="font-semibold text-industrial-900">{user.industry}</span>
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
              <h4 className="font-bold text-sm text-industrial-900">Add Project Site Address</h4>
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
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Remove address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-industrial-700 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  {addr.landmark ? ` (Landmark: ${addr.landmark})` : ''}
                  <br />
                  <strong className="text-industrial-900">{addr.city}, {addr.state} � {addr.pincode}</strong>
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
    </div>
  );
};
