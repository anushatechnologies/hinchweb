import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { formatINR } from '../utils/formatters';
import type { Address } from '../types';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, addresses, addAddress, deleteAddress } = useAuthStore();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'credit' | 'addresses'>('profile');
  const [isAddingSite, setIsAddingSite] = useState(false);

  // Address form
  const [newType, setNewType] = useState<Address['addressType']>('Site / Project');
  const [newCompany, setNewCompany] = useState(user.companyName);
  const [newGstin, setNewGstin] = useState(user.gstin);
  const [newContact, setNewContact] = useState(user.name);
  const [newPhone, setNewPhone] = useState(user.phone);
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('Hyderabad');
  const [newState, setNewState] = useState('Telangana');
  const [newPincode, setNewPincode] = useState('500081');

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine1.trim() || !newPincode.trim()) {
      showToast('error', 'Please enter valid address details', 'Incomplete Form');
      return;
    }

    try {
      await addAddress({
        contactName: newContact,
        mobile: newPhone,
        companyName: newCompany,
        gstin: newGstin,
        addressLine1: newLine1,
        city: newCity,
        state: newState,
        pincode: newPincode,
        addressType: newType,
        isDefaultDelivery: false,
        isDefaultBilling: false,
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

  const creditUtilized = user.creditLimit - user.creditAvailable;
  const utilizedPercent = Math.round((creditUtilized / user.creditLimit) * 100);

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 1. Header & Enterprise Profile Summary */}
      <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 rounded-3xl p-6 sm:p-8 text-white border border-industrial-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-600/30 shrink-0">
            {user.companyName.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{user.companyName}</h1>
              {user.isGstVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GST Verified Enterprise</span>
                </span>
              )}
            </div>

            <div className="text-xs text-industrial-400 flex flex-wrap items-center gap-3">
              <span>Primary Representative: <strong className="text-white">{user.name}</strong></span>
              <span>•</span>
              <span className="font-mono">GSTIN: <strong className="text-brand-400">{user.gstin}</strong></span>
              <span>•</span>
              <span>Type: {user.businessType}</span>
            </div>
          </div>
        </div>

        {/* Quick Credit Line Snapshot */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs space-y-1.5 shrink-0 min-w-64">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>Enterprise PayLater Line</span>
            <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-white">{user.creditDays} Days Credit</span>
          </div>
          <div className="text-lg font-black text-white font-mono">
            {formatINR(user.creditAvailable)}{' '}
            <span className="text-xs font-normal text-industrial-300">available</span>
          </div>
          <div className="w-full bg-industrial-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${100 - utilizedPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 border-b border-industrial-200 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'profile', label: 'Company KYC & Profile' },
          { id: 'credit', label: 'Revolving Credit Line Dashboard' },
          { id: 'addresses', label: `Project Sites & Address Book (${addresses.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-colors shrink-0 ${
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
            <h3 className="font-bold text-sm text-industrial-950 border-b border-industrial-100 pb-2">
              Registered Business Entity
            </h3>

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
          </div>

          {/* Authorized Officer */}
          <div className="bg-white p-6 rounded-3xl border border-industrial-200 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-industrial-950 border-b border-industrial-100 pb-2">
              Authorized Procurement Officer
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-industrial-50">
                <span className="text-industrial-500">Full Name:</span>
                <span className="font-bold text-industrial-900">{user.name}</span>
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
                  Approved Tier-1 Buyer
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'credit' && (
        <div className="bg-white rounded-3xl border border-industrial-200 p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-industrial-200">
            <div>
              <h3 className="text-lg font-bold text-industrial-950">
                HinchMart Enterprise PayLater Line
              </h3>
              <p className="text-xs text-industrial-500">
                Interest-free revolving procurement credit with automated monthly reconciliation.
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Credit Active & Healthy</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-industrial-50 border border-industrial-200">
              <span className="text-xs text-industrial-500 block">Total Approved Limit</span>
              <span className="text-2xl font-black text-industrial-950 font-mono">
                {formatINR(user.creditLimit)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-800 block">Available For Immediate Orders</span>
              <span className="text-2xl font-black text-emerald-950 font-mono">
                {formatINR(user.creditAvailable)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs text-amber-800 block">Utilized In Transit / Unbilled</span>
              <span className="text-2xl font-black text-amber-950 font-mono">
                {formatINR(creditUtilized)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-industrial-900 text-white space-y-2 text-xs">
            <div className="font-bold flex items-center gap-2 text-brand-400">
              <Sparkles className="w-4 h-4" />
              <span>Credit Benefits & Terms</span>
            </div>
            <p className="text-industrial-300 leading-relaxed text-[11px]">
              Orders placed on PayLater automatically generate 45-day payment schedules. Consignments are dispatched with full Mill Test Certificates and E-Way Bills directly to your site.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-industrial-950">Multi-Site Project Directory</h3>
              <p className="text-xs text-industrial-500">
                Manage construction site gates, factory stockyards, and corporate offices for freight routing.
              </p>
            </div>
            <button
              onClick={() => setIsAddingSite(!isAddingSite)}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingSite ? 'Close Form' : 'Add New Project Site'}</span>
            </button>
          </div>

          {/* Add Site Form */}
          {isAddingSite && (
            <form onSubmit={handleSaveAddress} className="bg-white p-6 rounded-3xl border-2 border-brand-200 shadow-card space-y-4 text-xs">
              <h4 className="font-bold text-sm text-industrial-950">New Construction Site / Warehouse</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">Address Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  >
                    <option value="Site / Project">Site / Project Construction</option>
                    <option value="Warehouse / Factory">Warehouse / Factory Depot</option>
                    <option value="Office / Commercial">Commercial Office</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">Project / Company Name</label>
                  <input
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">GSTIN (Optional for Site)</label>
                  <input
                    type="text"
                    value={newGstin}
                    onChange={(e) => setNewGstin(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-industrial-700">Site Address Line (Gate No, Plot, Area)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 4 Industrial Corridor, Near NH-44 Toll Plaza"
                  value={newLine1}
                  onChange={(e) => setNewLine1(e.target.value)}
                  className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">State</label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">Site Contact Person</label>
                  <input
                    type="text"
                    required
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-industrial-700">Site Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSite(false)}
                  className="px-4 py-2 rounded-xl border border-industrial-300 text-industrial-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold shadow-md shadow-brand-600/20"
                >
                  Save Project Site
                </button>
              </div>
            </form>
          )}

          {/* List of Sites */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white p-5 rounded-2xl border border-industrial-200 shadow-card space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-industrial-100 text-industrial-800 px-2 py-0.5 rounded">
                      {addr.addressType}
                    </span>
                    {addresses.length > 1 && (
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-industrial-400 hover:text-rose-600 p-1 transition-colors"
                        title="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="font-bold text-xs text-industrial-950">{addr.companyName}</div>
                  <div className="text-xs text-industrial-600 leading-relaxed">
                    {addr.addressLine1}, {addr.city}, {addr.state} - <strong className="font-mono text-industrial-900">{addr.pincode}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-industrial-100 text-[11px] text-industrial-500 space-y-0.5">
                  <div>Site Contact: <strong className="text-industrial-800">{addr.contactName}</strong></div>
                  <div>Mobile: {addr.mobile}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
