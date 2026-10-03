import React, { useState, useEffect } from 'react';
import { useRFQModalStore } from '../../store/useRFQModalStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useToastStore } from '../../store/useToastStore';
import { rfqApi } from '../../api/rfqApi';
import { categoryApi } from '../../api/categoryApi';
import { uploadApi } from '../../api/uploadApi';
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
  'CUBIC_METER',
];

export const RFQModal: React.FC = () => {
  const { isOpen, prefilledProduct, closeRFQModal } = useRFQModalStore();
  const { pincode, city } = useLocationStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Structural Steel & TMT');
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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    categoryApi
      .getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats);
          if (!prefilledProduct) {
            setCategory(cats[0].name);
          }
        }
      })
      .catch(console.error);
  }, [prefilledProduct]);

  useEffect(() => {
    if (prefilledProduct) {
      setProductName(prefilledProduct.title || '');
      setCategory(prefilledProduct.categoryName || prefilledProduct.category || '');
      setBrandPreference(prefilledProduct.brandName || prefilledProduct.brand || 'Any Verified Primary Brand');
      setUnit(prefilledProduct.unit || 'Piece');
      setQuantity((prefilledProduct.moq || 1) * 2);
      setTargetPrice(prefilledProduct.price ? prefilledProduct.price.toString() : '');
      setSpecifications(
        `Required Grade / Standard as per ${prefilledProduct.title}. Brand: ${prefilledProduct.brandName || prefilledProduct.brand || 'Primary'}.`
      );
    } else {
      setProductName('');
      if (categories.length > 0) setCategory(categories[0].name);
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
      let uploadedAttachmentUrl: string | undefined;
      if (attachmentFile) {
        try {
          const uploadRes = await uploadApi.uploadFile(attachmentFile, 'rfq');
          uploadedAttachmentUrl = uploadRes.url || uploadRes.fileUrl;
        } catch (uploadErr) {
          console.warn('Attachment upload failed, proceeding with RFQ:', uploadErr);
        }
      }

      const created = await rfqApi.createRFQ({
        title: productName.trim(),
        productName: productName.trim(),
        productMaterial: productName.trim(),
        category,
        brandPreference: brandPreference.trim() || 'Any Verified Brand',
        quantity: Number(quantity),
        unit,
        deliveryLocation: `${deliveryLocation.trim() || 'Site Depot'}, ${deliveryPincode.trim() || '500081'}`,
        requiredByDate,
        targetBudget: targetPrice ? Number(targetPrice) : undefined,
        targetPrice: targetPrice ? Number(targetPrice) : undefined,
        specifications: specifications.trim() || 'Standard BIS industrial grade material with MTC.',
        attachmentName: attachmentName || undefined,
        attachmentUrl: uploadedAttachmentUrl,
        mtcRequired: true,
        paymentTerms: '30 Days Net Credit',
        siteAccess: 'Heavy Vehicle Access Available',
      });

      setIsSuccess(true);
      setIsSubmitting(false);
      showToast(
        'success',
        `RFQ #${created.rfqNumber} broadcasted to verified manufacturers.`,
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
            className="absolute top-4 right-4 text-industrial-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
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
                <span>Verified Mill Test Certificates (MTC) Guaranteed</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={handleGoToQuotes}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 transition-all cursor-pointer"
              >
                View My RFQ Status & Quotes
              </button>
              <button
                onClick={closeRFQModal}
                className="px-6 py-3 bg-industrial-100 hover:bg-industrial-200 text-industrial-800 font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                Done
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
                  {categories.map((c) => (
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
                    className="w-32 px-3 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-semibold text-industrial-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
                  Target Price per {unit} (Optional ?)
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
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Required By Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-medium text-industrial-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <Calendar className="w-4 h-4 text-industrial-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Specifications / BOQ notes */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Detailed Material Specifications & BOQ Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Mention standard conformity (e.g. IS 1786:2008), grade requirements, test certificate needs, cutting tolerances..."
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-industrial-50 border border-industrial-300 rounded-xl text-sm font-medium text-industrial-900 placeholder:text-industrial-400 focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                />
              </div>

              {/* BOQ / Drawing Attachment */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-industrial-700">
                  Attach Project BOQ / Bar Bending Schedule (Optional)
                </label>
                <div className="border-2 border-dashed border-industrial-300 rounded-xl p-4 text-center hover:border-brand-500 transition-colors bg-industrial-50/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-5 h-5 text-industrial-400" />
                  <div className="text-xs font-semibold text-industrial-700">
                    {attachmentName ? (
                      <span className="text-brand-600 font-bold">{attachmentName}</span>
                    ) : (
                      'Click to upload BOQ spreadsheet or drawing (.pdf, .xlsx, .dwg)'
                    )}
                  </div>
                  <span className="text-[10px] text-industrial-400">Max size: 25MB</span>
                  <input
                    type="file"
                    className="hidden"
                    id="boq-upload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachmentFile(e.target.files[0]);
                        setAttachmentName(e.target.files[0].name);
                      }
                    }}
                  />
                  <label
                    htmlFor="boq-upload"
                    className="mt-1 px-3 py-1 bg-white border border-industrial-300 rounded-lg text-xs font-semibold text-industrial-700 hover:bg-industrial-100 cursor-pointer"
                  >
                    Select File
                  </label>
                </div>
              </div>
            </div>

            {/* Guaranteed Badges */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Genuine MTC Test Certificate & GST Tax Invoices</span>
              </div>
              <span className="font-bold">Verified Manufacturers</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-industrial-100">
              <button
                type="button"
                onClick={closeRFQModal}
                className="px-5 py-2.5 text-xs font-bold text-industrial-600 hover:text-industrial-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/25 flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Broadcasting RFQ...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Broadcast RFQ Now</span>
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
