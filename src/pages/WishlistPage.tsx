import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, PackageCheck, AlertCircle } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAuthModalStore } from '../store/useAuthModalStore';
import { formatINR } from '../utils/formatters';

export const WishlistPage: React.FC = () => {
  const { items, isLoading, fetchWishlist, removeItem } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const { showToast } = useToastStore();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useAuthModalStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleAddToCart = async (item: any) => {
    try {
      await addToCart(
        {
          id: String(item.productId),
          title: item.title,
          price: item.price,
          mrp: item.mrp || item.price,
          images: item.imageUrl ? [item.imageUrl] : [],
          brand: item.brand || 'Generic',
          category: item.category || 'General',
          moq: 1,
          unit: (item.unit as any) || 'PIECE',
          gstRate: 18,
          inStock: item.inStock ?? true,
          seller: { id: 'seller_1', name: 'Verified Industrial Partner', isVerified: true, verified: true, rating: 4.8, city: 'Hyderabad', state: 'Telangana', successfulOrders: 10, gstinMasked: '36AA***' },
          specifications: [],
          description: '',
          hsnCode: '',
          rating: 4.8,
          reviewCount: 0,
        } as any,
        1
      );
      showToast('success', 'Item moved to cart successfully');
    } catch {
      showToast('error', 'Failed to add item to cart');
    }
  };

  const handleRemove = async (productId: string | number) => {
    const ok = await removeItem(productId);
    if (ok) {
      showToast('info', 'Item removed from wishlist');
    } else {
      showToast('error', 'Failed to remove item');
    }
  };

  if (!isAuthenticated && !localStorage.getItem('hinchmart_auth_token')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm border border-industrial-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-5">
            <Heart className="w-8 h-8 fill-rose-500/20" />
          </div>
          <h2 className="text-2xl font-black text-industrial-900 tracking-tight mb-2">
            Sign In to View Your Wishlist
          </h2>
          <p className="text-industrial-500 text-sm mb-6 leading-relaxed">
            Save items for later, track price drops on bulk industrial supplies, and quickly order your recurring bills of materials.
          </p>
          <button
            onClick={() => openAuthModal()}
            className="w-full sm:w-auto px-8 py-3 bg-[#d9232d] hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Login to Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-industrial-500">
            <Link to="/" className="hover:text-industrial-800 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-industrial-800 font-bold">Wishlist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-industrial-900 flex items-center gap-3">
            <span>My Saved Wishlist</span>
            <span className="text-xs font-extrabold px-3 py-1 bg-industrial-100 text-industrial-700 rounded-full border border-industrial-200">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </h1>
        </div>

        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-industrial-700 bg-white border border-industrial-200 hover:border-industrial-300 hover:bg-industrial-50 transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Sourcing
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-industrial-200 animate-pulse space-y-4">
              <div className="h-44 bg-industrial-100 rounded-xl" />
              <div className="h-4 bg-industrial-100 rounded w-2/3" />
              <div className="h-6 bg-industrial-100 rounded w-1/2" />
              <div className="h-10 bg-industrial-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm border border-industrial-200">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Heart className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-industrial-900 mb-2">Your Wishlist is Empty</h3>
          <p className="text-industrial-500 text-xs sm:text-sm mb-6 leading-relaxed">
            You haven't saved any products yet. Browse through our industrial catalog to save materials, equipment, and tools for quick one-click orders.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#d9232d] hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all"
          >
            Explore B2B Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const hasDiscount = item.mrp && item.mrp > item.price;
            const discountPct = hasDiscount
              ? Math.round(((item.mrp! - item.price) / item.mrp!) * 100)
              : 0;

            return (
              <div
                key={String(item.productId)}
                className="bg-white rounded-2xl border border-industrial-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group relative"
              >
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-50 text-industrial-400 hover:text-rose-600 shadow-sm border border-industrial-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove from wishlist"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Product Thumbnail */}
                <Link
                  to={`/product/${item.productId}`}
                  className="block relative bg-industrial-50 p-4 aspect-square flex items-center justify-center overflow-hidden border-b border-industrial-100"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-16 h-16 text-industrial-300 flex items-center justify-center">
                      <PackageCheck className="w-12 h-12 stroke-[1.5]" />
                    </div>
                  )}

                  {discountPct > 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-md shadow-xs">
                      {discountPct}% OFF
                    </span>
                  )}
                </Link>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {item.brand && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-industrial-500 block mb-1">
                        {item.brand}
                      </span>
                    )}
                    <Link
                      to={`/product/${item.productId}`}
                      className="font-bold text-xs sm:text-sm text-industrial-900 hover:text-[#d9232d] transition-colors line-clamp-2"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                  </div>

                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-black text-industrial-900">
                        {formatINR(item.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-industrial-400 line-through">
                          {formatINR(item.mrp!)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-industrial-500 font-semibold block">
                      + GST (Tax Invoice Included)
                    </span>
                  </div>

                  {/* Stock status & Action */}
                  <div className="pt-2 border-t border-industrial-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                      {item.inStock !== false ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ready for dispatch
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Backorder available
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-industrial-900 hover:bg-[#d9232d] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
