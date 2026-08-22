import React, { useState, useEffect } from 'react';
import { useRFQModalStore } from '../../store/useRFQModalStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useToastStore } from '../../store/useToastStore';
import { rfqApi } from '../../api/rfqApi';
import { categoryApi } from '../../api/categoryApi';
import { CATEGORIES } from '../../api/mockData';
import type { ProductUnit, Category } from '../../types';
import {
  X,
  FileText,
  Send,
  Upload,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UNITS: ProductUnit[] = [
  'Ton',
  'Kg',
  'Bag',
  'Piece',
  'Meter',
  'Foot',
  'Roll',
  'Box',
  'Pack',
  'Bundle',
  'Litre',
];

export const RFQModal: React.FC = () => {
  const { isOpen, prefilledProduct, closeRFQModal } = useRFQModalStore();
  const { pincode, city } = useLocationStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brandPreference, setBrandPreference] = useState('');
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState<ProductUnit>('Ton');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [specifications, setSpecifications] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    categoryApi.getCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (prefilledProduct) {
      setProductName(prefilledProduct.title);
      setCategory(prefilledProduct.category);
      setBrandPreference(prefilledProduct.brand);
      setUnit(prefilledProduct.unit);
      setQuantity(prefilledProduct.moq * 2);
      setTargetPrice(prefilledProduct.price.toString());
      setSpecifications(
        `Required Grade / Standard as per ${prefilledProduct.title}. Brand: ${prefilledProduct.brand}.`
      );
    } else {
      setProductName('');
      setCategory(categories[0]?.name || CATEGORIES[0].name);
      setBrandPreference('Any Verified Primary Brand');
      setUnit('Ton');
      setQuantity(50);
      setTargetPrice('');
      setSpecifications('');
    }

    setDeliveryLocation(`${city}`);
    setDeliveryPincode(pincode);

    // Default required by 7 days ahead
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setRequiredByDate(futureDate.toISOString().split('T')[0]);
    setIsSuccess(false);
  }, [prefilledProduct, isOpen, pincode, city, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || quantity <= 0) {
      showToast('error', 'Please provide a valid product requirement and quantity.', 'Missing Details');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await rfqApi.createRFQ({
        productName: productName.trim(),
        category,
        brandPreference: brandPreference.trim() || 'Any Verified Brand',
        quantity: Number(quantity),
        unit,
        deliveryLocation: deliveryLocation.trim() || 'Site Depot',
        deliveryPincode: deliveryPincode.trim() || '500081',
        requiredByDate,
        targetPrice: targetPrice || undefined,
        specifications: specifications.trim() || 'Standard industrial specifications required.',
        attachmentName: attachmentName || undefined,
        notes: 'Priority construction procurement request.',
      });

      setIsSuccess(true);
      setIsSubmitting(false);
      showToast(
        'success',
        `RFQ #${created.rfqNumber} broadcasted to 12 verified manufacturers. 2 competitive quotes received!`,
        'RFQ Broadcasted'
      );
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      showToast('error', 'Failed to submit RFQ. Please try again.', 'Error');
    }
  };

  const handleGoToQuotes = () => {
    closeRFQModal();
    navigate(`/rfq`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-industrial-200 animate-in zoom-in-95 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-industrial-900 via-industrial-800 to-industrial-900 text-white p-6 relative">
          <button
            onClick={closeRFQModal}
            className="absolute top-4 right-4 text-industrial-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Request For Quotation (RFQ)</h3>
                <span className="text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-full">
                  INSTANT BROADCAST
                </span>
              </div>
              <p className="text-xs text-industrial-300">
                Get competitive quotes directly from verified primary mills & manufacturers
              </p>
            </div>
          </div>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-industrial-950">
                RFQ Successfully Broadcasted!
              </h4>
              <p className="text-sm text-industrial-600 max-w-md mx-auto">
                Your requirement for <strong className="text-industrial-900">{quantity} {unit} of {productName}</strong> has been shared with authorized suppliers in your zone.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-800 text-xs font-semibold border border-brand-200 mt-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                2 Instant Supplier Quotations Ready for Review
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={closeRFQModal}
                className="px-5 py-2.5 rounded-xl border border-industrial-300 text-industrial-700 hover:bg-industrial-50 text-sm font-semibold transition-all"
              >
                Close
              </button>
              <button
                onClick={handleGoToQuotes}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-600/25 flex items-center gap-2 transition-all"
              >
                Compare Quotes & Accept Order
              </button>
            </div>
          </div>
        ) : (
          /* RFQ Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Title */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Material / Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Tiscon Fe550D TMT Steel Rebars (12mm & 16mm)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-medium text-industrial-900 placeholder:text-industrial-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-medium text-industrial-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  {(categories.length > 0 ? categories : (CATEGORIES as any[])).map((c: any) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Preference */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Brand Preference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata Tiscon, Jindal, UltraTech, Polycab"
                  value={brandPreference}
                  onChange={(e) => setBrandPreference(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-medium text-industrial-900 placeholder:text-industrial-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Required Quantity *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="flex-1 px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-bold text-industrial-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as ProductUnit)}
                    className="w-28 px-3 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-semibold text-industrial-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Price */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Target Price per {unit} (Optional ₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 51800"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-medium text-industrial-900 placeholder:text-industrial-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Delivery Destination & Pincode */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Delivery Site Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Site Name / City (e.g. Hyderabad Project Site)"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-medium text-industrial-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Site Pincode *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={deliveryPincode}
                  onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-mono font-semibold text-industrial-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Required Date */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Material Required By (Delivery Deadline) *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-medium text-industrial-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <Calendar className="w-4 h-4 text-industrial-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Specifications / BOQ */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Detailed Specifications / Quality Standards / BOQ Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify BIS standards, test certificates required (MTC), cutting schedule, payment terms, or batch size..."
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-medium text-industrial-900 placeholder:text-industrial-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* BOQ / Drawing Attachment */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Attach BOQ / Technical Drawing (PDF/Excel)
                </label>
                <div className="border-2 border-dashed border-industrial-300 hover:border-brand-500 rounded-xl p-3 text-center bg-industrial-50/50 cursor-pointer transition-colors">
                  <input
                    type="file"
                    id="rfq-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachmentName(e.target.files[0].name);
                      }
                    }}
                  />
                  <label htmlFor="rfq-upload" className="cursor-pointer flex items-center justify-center gap-2 text-xs text-industrial-600">
                    <Upload className="w-4 h-4 text-brand-600" />
                    <span>
                      {attachmentName ? (
                        <strong className="text-emerald-700 font-semibold">{attachmentName}</strong>
                      ) : (
                        'Click to upload BOQ Excel or drawing (Max 25MB)'
                      )}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* B2B Assurance Note */}
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                <strong>HinchMart B2B Guarantee:</strong> 100% verified suppliers with valid GSTIN and Mill Test Certificates (MTC).
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeRFQModal}
                className="px-5 py-2.5 rounded-xl border border-industrial-300 text-industrial-700 hover:bg-industrial-50 text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-brand-600/25 flex items-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>Broadcasting RFQ...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Broadcast RFQ Now
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
