import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { reviewApi } from '../api/reviewApi';
import type { Product, ProductReview } from '../types';
import { BulkPricingTable } from '../components/product/BulkPricingTable';
import { SellerCard } from '../components/product/SellerCard';
import { ProductCard } from '../components/product/ProductCard';
import { ProductDetailSkeleton } from '../components/common/SkeletonLoaders';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useLocationStore } from '../store/useLocationStore';
import { useRFQModalStore } from '../store/useRFQModalStore';
import { useToastStore } from '../store/useToastStore';
import { formatINR } from '../utils/formatters';
import { calculateBulkPrice, calculateGst } from '../utils/tax';
import {
  Star,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  FileText,
  Award,
  ChevronRight,
  Percent,
  Heart,
  MessageSquareQuote,
  CheckCircle2,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { city, pincode, openPincodeModal } = useLocationStore();
  const { openRFQModal } = useRFQModalStore();
  const { showToast } = useToastStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Wishlist state
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleToggleWishlist = async () => {
    if (!product) return;
    const added = await toggleWishlist(product);
    showToast(
      'success',
      added
        ? `Added "${product.title}" to your wishlist.`
        : `Removed "${product.title}" from wishlist.`,
      'Wishlist'
    );
  };

  useEffect(() => {
    const idOrSlug = id || slug;
    if (!idOrSlug) return;
    setIsLoading(true);

    // Try by ID first; if the param looks like a slug (non-numeric), use getProductBySlug
    const isSlug = slug !== undefined || (id !== undefined && isNaN(Number(id)));
    const loadProduct = isSlug
      ? productApi.getProductBySlug(idOrSlug)
      : productApi.getProductById(idOrSlug).catch(() => productApi.getProductBySlug(idOrSlug));

    loadProduct
      .then((prod) => {
        if (!prod) throw new Error('Not found');
        setProduct(prod);
        setSelectedImage(prod.images[0]);
        setQuantity(1);
        setIsLoading(false);

        // Fetch similar
        productApi.getProducts({ category: prod.category }).then((res) => {
          setSimilarProducts(res.products.filter((p) => p.id !== prod.id).slice(0, 4));
        });
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });

    // Fetch verified buyer reviews
    setIsLoadingReviews(true);
    reviewApi
      .getProductReviews(idOrSlug)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch((err) => console.warn('Could not load reviews:', err))
      .finally(() => setIsLoadingReviews(false));
  }, [id, slug]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-industrial-900">Product Not Found</h2>
        <p className="text-xs text-industrial-500">The requested material item could not be located.</p>
        <Link
          to="/catalog"
          className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  const pricing = calculateBulkPrice(product, quantity);
  const tax = calculateGst(pricing.total, product.gstRate, false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addItem(product, quantity);
      showToast('success', `Added ${quantity} ${product.unit} of ${product.title} to cart.`, 'Added to Cart');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await addItem(product, quantity);
    navigate('/checkout');
  };

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-12">
      {/* 1. Dynamic 4-Tier Breadcrumb (Flow 5) */}
      <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-industrial-500 font-medium">
        <Link to="/" className="hover:text-brand-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-industrial-300 shrink-0" />
        {product.category && (
          <>
            <Link
              to={`/category/${encodeURIComponent((product.categoryName || product.category).toLowerCase().replace(/\s+/g, '-'))}`}
              className="hover:text-brand-600 transition-colors"
            >
              {product.categoryName || product.category}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-industrial-300 shrink-0" />
          </>
        )}
        {product.subcategory && (
          <>
            <Link
              to={`/catalog?subcategoryId=${product.subcategoryId || ''}&category=${encodeURIComponent(product.categoryName || product.category || '')}`}
              className="hover:text-brand-600 transition-colors"
            >
              {product.subcategoryName || product.subcategory}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-industrial-300 shrink-0" />
          </>
        )}
        {product.brand && (
          <>
            <Link
              to={`/catalog?brand=${encodeURIComponent(product.brandName || product.brand)}`}
              className="hover:text-brand-600 transition-colors font-semibold text-industrial-700"
            >
              {product.brandName || product.brand}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-industrial-300 shrink-0" />
          </>
        )}
        <span className="font-bold text-industrial-900 truncate max-w-xs">{product.title}</span>
      </nav>

      {/* 2. Main Product Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-white border border-industrial-200 shadow-card relative group">
            <img
              src={selectedImage || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {product.isBulkDeal && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-extrabold px-3 py-1 rounded-lg uppercase shadow-md">
                Bulk Wholesale Tier
              </span>
            )}
            <button
              type="button"
              onClick={handleToggleWishlist}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-industrial-600 hover:text-rose-600 shadow-md border border-industrial-200 flex items-center justify-center transition-all cursor-pointer"
              title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 transition-transform active:scale-125 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img
                      ? 'border-brand-600 ring-2 ring-brand-600/20'
                      : 'border-industrial-200 hover:border-industrial-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Mill Test Certificate (MTC) Guarantee */}
          <div className="p-4 rounded-2xl bg-industrial-900 text-white border border-industrial-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-brand-400 font-bold">
              <Award className="w-4 h-4" />
              <span>Manufacturer Mill Test Certificate (MTC)</span>
            </div>
            <p className="text-industrial-300 text-[11px] leading-relaxed">
              Every dispatched heat batch is accompanied by manufacturer physical & chemical test reports conforming to IS 1786 standards.
            </p>
          </div>
        </div>

        {/* Right Details & Bulk Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-brand-50 text-brand-700 font-bold text-xs">
                {product.brand}
              </span>
              <span className="font-mono text-xs text-industrial-500">HSN: {product.hsnCode}</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200 ml-auto">
                GST {product.gstRate}%
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-industrial-950 leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-industrial-600 pt-1">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md font-bold border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{product.rating}</span>
              </div>
              <span>{product.ratingCount} Verified B2B Orders</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Stockyard in {product.seller.city}
              </span>
            </div>
          </div>

          {/* Pricing Highlight Box */}
          <div className="p-5 rounded-2xl bg-white border-2 border-brand-200 shadow-subtle space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-3xl font-black text-industrial-950">
                  {formatINR(pricing.unitPrice)}
                </span>
                <span className="text-sm font-semibold text-industrial-500 ml-1.5">
                  / {product.unit} (Excl. GST)
                </span>
              </div>
              {pricing.savings > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  <Percent className="w-3.5 h-3.5" />
                  {pricing.discountPercent}% Bulk Tier Discount Applied
                </span>
              )}
            </div>

            {/* Quantity Stepper with MOQ Info */}
            <div className="p-3 bg-industrial-50 rounded-xl border border-industrial-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-industrial-800">
                  Specify Order Quantity (MOQ: {product.moq} {product.unit}s)
                </span>
                <span className="text-industrial-500 font-mono">
                  Base Price: {formatINR(product.price)}/{product.unit}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-industrial-300 rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center text-industrial-700 hover:bg-industrial-100 rounded-lg disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setQuantity(isNaN(v) || v < 1 ? 1 : v);
                    }}
                    className="w-20 text-center font-mono font-black text-sm text-industrial-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-semibold text-industrial-500 pr-2">{product.unit}s</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center text-industrial-700 hover:bg-industrial-100 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs space-y-0.5">
                  <div className="text-industrial-600">
                    Taxable Subtotal: <strong className="text-industrial-900">{formatINR(pricing.total)}</strong>
                  </div>
                  <div className="text-industrial-500 text-[11px]">
                    Est. Total (Incl. {product.gstRate}% GST):{' '}
                    <strong className="text-industrial-950 font-mono">{formatINR(tax.grandTotal)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding}
                className="flex-1 py-3 px-4 bg-industrial-900 hover:bg-industrial-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-colors active:scale-98 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-brand-400" />
                <span>Add to Procurement Cart</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Instant B2B Checkout</span>
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`py-3 px-4 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isWishlisted
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                    : 'bg-white border-industrial-300 text-industrial-700 hover:bg-industrial-50'
                }`}
                title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="sm:inline">{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => openRFQModal(product)}
              className="w-full py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Need Custom Batch / Specific Cutting Schedule? Request RFQ</span>
            </button>
          </div>

          {/* Delivery & Pincode Lead-Time */}
          <div className="p-4 rounded-2xl bg-industrial-50 border border-industrial-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl text-brand-600 border border-industrial-200 shadow-2xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-industrial-900">
                  Site Delivery to: {city} ({pincode})
                </div>
                <div className="text-industrial-500 text-[11px]">
                  Estimated Transit: <strong className="text-emerald-700">{product.deliveryDays} Working Days</strong> via Regional Freight Depot
                </div>
              </div>
            </div>
            <button
              onClick={openPincodeModal}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 underline"
            >
              Change Location
            </button>
          </div>

          {/* Bulk Tier Table */}
          <BulkPricingTable
            product={product}
            currentQuantity={quantity}
            onSelectTierQuantity={(qty) => setQuantity(qty)}
          />
        </div>
      </div>

      {/* 3. Detailed Specifications & Seller Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Specifications (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-industrial-200 shadow-subtle space-y-6">
          <div>
            <h3 className="text-lg font-bold text-industrial-950">Technical Specifications</h3>
            <p className="text-xs text-industrial-500 mt-0.5">
              Verified standard compliant material parameters
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {product.specifications.map((spec, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-industrial-50 border border-industrial-200/70 text-xs"
              >
                <span className="text-industrial-500 font-medium">{spec.name}</span>
                <span className="font-bold text-industrial-900 text-right">{spec.value}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-industrial-100 space-y-2">
            <h4 className="font-bold text-xs text-industrial-900">Product Description</h4>
            <p className="text-xs text-industrial-600 leading-relaxed">{product.description}</p>
          </div>
        </div>

        {/* Seller Info Card (4 cols) */}
        <div className="lg:col-span-4">
          <SellerCard seller={product.seller} productTitle={product.title} />
        </div>
      </div>

      {/* 3.5 Verified Buyer Reviews & Material Quality Ratings */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-industrial-200 shadow-subtle space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-industrial-100 pb-5">
          <div>
            <h3 className="text-xl font-black text-industrial-950 flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-brand-600" />
              <span>Verified Buyer Ratings & Material Quality</span>
            </h3>
            <p className="text-xs text-industrial-500 mt-1">
              Feedback submitted exclusively by verified industrial contractors and enterprise procurement teams post-delivery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/orders"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors"
            >
              Rate Delivered Order
            </Link>
          </div>
        </div>

        {/* Rating Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-industrial-50 border border-industrial-200">
          <div className="text-center md:text-left flex flex-col justify-center space-y-1">
            <div className="text-4xl sm:text-5xl font-black text-industrial-900 flex items-center justify-center md:justify-start gap-2">
              <span>{product.rating || '4.8'}</span>
              <span className="text-sm font-bold text-industrial-400">/ 5.0</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(product.rating || 5)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-industrial-200 text-industrial-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-industrial-500 font-semibold">
              Based on {Math.max(product.ratingCount || 0, reviews.length)} verified procurement orders
            </span>
          </div>

          <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
            {[5, 4, 3, 2, 1].map((stars) => {
              const countForStar = reviews.filter((r) => Math.round(r.rating) === stars).length;
              const total = reviews.length || 1;
              const percentage = reviews.length ? Math.round((countForStar / total) * 100) : stars === 5 ? 85 : stars === 4 ? 12 : 3;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold text-industrial-600 shrink-0">{stars} Stars</span>
                  <div className="flex-1 h-2 rounded-full bg-industrial-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-industrial-400 font-mono text-[11px] shrink-0">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List */}
        {isLoadingReviews ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-industrial-100 animate-pulse space-y-3">
                <div className="h-4 bg-industrial-100 rounded w-1/4" />
                <div className="h-4 bg-industrial-100 rounded w-3/4" />
                <div className="h-12 bg-industrial-100 rounded" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 px-4 bg-industrial-50/50 rounded-2xl border border-dashed border-industrial-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-industrial-800">
              Verified Mill Test Certified Quality
            </h4>
            <p className="text-xs text-industrial-500 max-w-md mx-auto leading-relaxed">
              No individual buyer notes submitted yet for this product code. All orders dispatched under this specification undergo strict IS/ISO batch inspections.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-industrial-100">
            {reviews.map((rev, idx) => (
              <div key={rev.id || rev.reviewId || idx} className="py-5 space-y-2.5 first:pt-2 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-industrial-900">
                      {rev.customerName || 'Verified Procurement Buyer'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Purchase
                    </span>
                  </div>
                  <span className="text-[11px] text-industrial-400">
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-industrial-200 text-industrial-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-black text-industrial-800 ml-1.5">{rev.title}</span>
                </div>

                <p className="text-xs sm:text-sm text-industrial-600 leading-relaxed">
                  {rev.comment}
                </p>

                {rev.imageUrls && rev.imageUrls.length > 0 && (
                  <div className="flex gap-2 pt-1 overflow-x-auto">
                    {rev.imageUrls.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Buyer inspection"
                        className="w-16 h-16 rounded-xl object-cover border border-industrial-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Similar Materials */}
      {similarProducts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-industrial-950">
              Related Materials & Cross-Category Supplies
            </h3>
            <Link
              to={`/catalog?category=${encodeURIComponent(product.categoryName || product.category || '')}`}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View More in {product.categoryName || product.category}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
