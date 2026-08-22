import React from 'react';
import type { Seller } from '../../types';
import { useChatStore } from '../../store/useChatStore';
import {
  Building2,
  ShieldCheck,
  Star,
  MessageSquare,
  MapPin,
  CheckCircle,
} from 'lucide-react';

interface SellerCardProps {
  seller: Seller;
  productTitle?: string;
}

export const SellerCard: React.FC<SellerCardProps> = ({ seller, productTitle }) => {
  const { openChatWithSeller } = useChatStore();

  const handleStartChat = () => {
    openChatWithSeller(
      seller,
      'Product Inquiry',
      productTitle ? `Inquiry regarding: ${productTitle}` : `Direct Inquiry to ${seller.name}`
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-industrial-200 p-5 shadow-subtle space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-xl bg-industrial-100 border border-industrial-200 flex items-center justify-center text-industrial-700 font-bold text-lg shrink-0">
            <Building2 className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-industrial-950">{seller.name}</h4>
              {seller.isVerified && (
                <span title="GSTIN & Yard Verified">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-industrial-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-industrial-400" />
              <span>{seller.city}, {seller.state}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{seller.rating}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-industrial-100 text-xs">
        <div className="bg-industrial-50 p-2 rounded-xl border border-industrial-200/70">
          <span className="text-[10px] text-industrial-500 block">Fulfilled Orders</span>
          <span className="font-bold text-industrial-900">{seller.successfulOrders}+ Deliveries</span>
        </div>
        <div className="bg-industrial-50 p-2 rounded-xl border border-industrial-200/70">
          <span className="text-[10px] text-industrial-500 block">Verified GSTIN</span>
          <span className="font-mono font-bold text-industrial-900">{seller.gstinMasked}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Authorized distributor with direct factory warranty & Mill Test Certificates.</span>
      </div>

      <button
        type="button"
        onClick={handleStartChat}
        className="w-full py-2.5 px-4 bg-industrial-900 hover:bg-industrial-800 text-white rounded-xl font-bold text-xs shadow-md shadow-industrial-950/10 flex items-center justify-center gap-2 transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-brand-400" />
        <span>Chat with Supplier Desk</span>
      </button>
    </div>
  );
};
