import React, { useState } from 'react';
import { X, Star, Upload, CheckCircle2, AlertCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import { reviewApi } from '../../api/reviewApi';
import { useToastStore } from '../../store/useToastStore';
import type { OrderItem, Order } from '../../types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  item: OrderItem;
  onSuccess?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: '1 Star - Poor quality / Non-compliant',
  2: '2 Stars - Fair / Specification deviations',
  3: '3 Stars - Average / Standard quality',
  4: '4 Stars - Good quality / Fast dispatch',
  5: '5 Stars - Exceptional steel / Material quality',
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  item,
  onSuccess,
}) => {
  const { showToast } = useToastStore();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const rawItemId = item.orderItemId || (item.id && !isNaN(Number(item.id)) ? Number(item.id) : 45);

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setErrorMessage('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }
    setImageUrls((prev) => [...prev, trimmed]);
    setImageUrlInput('');
    setErrorMessage('');
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!rating || rating < 1 || rating > 5) {
      setErrorMessage('Please select a star rating between 1 and 5.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Review title is required.');
      return;
    }

    if (!comment.trim()) {
      setErrorMessage('Review comment/experience is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewApi.submitReview(
        {
          orderItemId: Number(rawItemId),
          rating,
          title: title.trim(),
          comment: comment.trim(),
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        },
        undefined,
        {
          productId: item.productId,
          productTitle: item.title || item.productTitle || item.productName,
          orderId: order.id || order.orderNumber,
        }
      );

      showToast(
        'success',
        `Your verified review for "${item.title || item.productTitle || 'material'}" has been published.`,
        'Review Submitted'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-industrial-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl border border-industrial-200 shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-industrial-200 bg-industrial-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-industrial-950">Write Product Review</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Purchase
              </span>
            </div>
            <p className="text-xs text-industrial-600 mt-0.5">
              PO #{order.orderNumber}  Item #{rawItemId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-industrial-400 hover:text-industrial-700 hover:bg-industrial-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Target Product Info */}
          <div className="p-3.5 bg-brand-50/50 border border-brand-200/60 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-bold shrink-0">
              <Star className="w-5 h-5 fill-brand-600 text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-industrial-900 truncate">
                {item.title || item.productTitle || item.productName || 'Industrial Material'}
              </h4>
              <p className="text-[11px] text-industrial-600 truncate">
                Qty Delivered: {item.quantity} {item.unit}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Rating Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-industrial-800">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-industrial-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-industrial-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-semibold text-industrial-600">
                {RATING_LABELS[hoverRating || rating]}
              </span>
            </div>
          </div>

          {/* Review Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-industrial-800">
              Headline / Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exceptional steel quality / On-time site delivery"
              className="w-full px-3.5 py-2.5 bg-white border border-industrial-300 rounded-xl text-xs font-medium text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm"
            />
          </div>

          {/* Review Comment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-industrial-800">
              Detailed Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details on material grade, packaging, physical test inspection, foundation column performance, or mill test certificate verification..."
              className="w-full px-3.5 py-2.5 bg-white border border-industrial-300 rounded-xl text-xs font-medium text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm resize-none"
            />
          </div>

          {/* Site Inspection Photos (imageUrls) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-industrial-800">
              Site Material Photos <span className="text-industrial-400 font-normal">(Optional URLs)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                placeholder="https://storage.hinchmart.com/reviews/site_photo.jpg"
                className="flex-1 px-3 py-2 bg-white border border-industrial-300 rounded-xl text-xs text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-2 bg-industrial-100 hover:bg-industrial-200 text-industrial-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* List of Attached Images */}
            {imageUrls.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-industrial-50 border border-industrial-200 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <ImageIcon className="w-4 h-4 text-brand-600 shrink-0" />
                      <span className="truncate text-industrial-700 font-mono text-[11px]">{url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-industrial-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-industrial-600 hover:bg-industrial-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Verified Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
