import React from 'react';

export const ProductCardSkeleton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between shadow-2xs animate-pulse ${compact ? 'w-56 sm:w-60 shrink-0' : 'w-full'}`}>
      <div className="space-y-3">
        {/* Top Badge Placeholder */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded-md w-20" />
          <div className="h-4 bg-gray-200 rounded-md w-14" />
        </div>

        {/* Product Image Placeholder */}
        <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gray-200/80" />
        </div>

        {/* Title & Brand Placeholder */}
        <div className="space-y-2 pt-1">
          <div className="h-3.5 bg-gray-200 rounded-md w-full" />
          <div className="h-3.5 bg-gray-200 rounded-md w-3/4" />
          <div className="h-3 bg-gray-200 rounded-md w-24" />
        </div>
      </div>

      {/* Price & CTA Button Placeholder */}
      <div className="pt-4 border-t border-gray-100 space-y-3 mt-2">
        <div className="flex items-baseline gap-2">
          <div className="h-5 bg-gray-200 rounded-md w-24" />
          <div className="h-3.5 bg-gray-200 rounded-md w-16" />
        </div>
        <div className="h-9 bg-gray-200 rounded-xl w-full" />
      </div>
    </div>
  );
};

export const BrandCircleSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center shrink-0 text-center space-y-2 animate-pulse min-w-[90px]">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center p-3 shadow-xs">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
      </div>
      <div className="space-y-1 w-16 flex flex-col items-center">
        <div className="h-3 bg-gray-200 rounded w-14" />
        <div className="h-2 bg-gray-200 rounded w-10" />
      </div>
    </div>
  );
};

export const SubcategoryPageSkeleton: React.FC<{ categoryName?: string }> = () => {
  return (
    <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 animate-pulse">
      {/* 1. Breadcrumbs Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3.5 bg-gray-200 rounded w-12" />
        <span className="text-gray-300">/</span>
        <div className="h-3.5 bg-gray-200 rounded w-20" />
        <span className="text-gray-300">/</span>
        <div className="h-3.5 bg-gray-300 rounded w-28" />
      </div>

      {/* 2. Hero Header Card Skeleton */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 bg-gray-200 rounded-lg w-52 sm:w-64" />
            <div className="h-7 bg-gray-200 rounded-full w-24" />
          </div>
          <div className="h-9 bg-amber-100/70 border border-amber-200 rounded-full w-72 sm:w-80" />
        </div>
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
      {/* 4. Bestsellers Carousel Skeleton (Blue tint) */}
      <div className="bg-blue-50/70 rounded-3xl p-5 sm:p-6 border border-blue-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-gray-300 rounded-full" />
            <div className="h-6 bg-gray-200 rounded w-32" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200" />
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden py-1">
          {[...Array(5)].map((_, i) => (
            <ProductCardSkeleton key={i} compact />
          ))}
        </div>
      </div>

      {/* 5. Hot New Releases Carousel Skeleton (Yellow tint) */}
      <div className="bg-amber-50/70 rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-gray-300 rounded-full" />
            <div className="h-6 bg-gray-200 rounded w-40" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200" />
            <div className="w-8 h-8 rounded-full bg-white border border-gray-200" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden py-1">
          {[...Array(5)].map((_, i) => (
            <ProductCardSkeleton key={i} compact />
          ))}
        </div>
      </div>

      {/* 6. Sidebar & Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Skeleton */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div className="h-5 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-10" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-3.5 bg-gray-200 rounded w-28" />
                  <div className="h-3 bg-gray-200 rounded w-8" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-8 bg-gray-100 rounded-xl w-full" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-3.5 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-6" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Products Grid Skeleton */}
        <div className="lg:col-span-9 space-y-5">
          <div className="h-12 bg-white rounded-2xl border border-gray-200 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CategoryPageSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3.5 bg-gray-200 rounded w-16" />
        <span className="text-gray-300">/</span>
        <div className="h-3.5 bg-gray-300 rounded w-32" />
      </div>


      {/* Shop by Categories Grid Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <div className="h-3.5 bg-gray-200 rounded w-32" />
            <div className="h-6 bg-gray-300 rounded w-48" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-36" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-3 space-y-3 flex flex-col items-center">
              <div className="w-full aspect-square bg-gray-100 rounded-xl" />
              <div className="h-3.5 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Subcategory Showcase Rows Skeleton */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div className="h-6 bg-gray-300 rounded w-48" />
            <div className="h-8 bg-gray-200 rounded-xl w-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, j) => (
              <ProductCardSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-12 animate-pulse">
      {/* Breadcrumbs Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-3.5 bg-gray-200 rounded w-14" />
        <span className="text-gray-300">/</span>
        <div className="h-3.5 bg-gray-200 rounded w-24" />
        <span className="text-gray-300">/</span>
        <div className="h-3.5 bg-gray-200 rounded w-32" />
        <span className="text-gray-300">/</span>
        <div className="h-3.5 bg-gray-300 rounded w-48" />
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-4/3 rounded-3xl bg-gray-200" />
          <div className="flex gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-20 h-20 rounded-xl bg-gray-200 shrink-0" />
            ))}
          </div>
          <div className="h-24 bg-gray-200 rounded-2xl" />
        </div>

        {/* Right Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-lg w-24" />
              <div className="h-6 bg-gray-200 rounded-lg w-32" />
            </div>
            <div className="h-8 bg-gray-300 rounded-xl w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>

          {/* Pricing Box Skeleton */}
          <div className="p-6 rounded-3xl bg-white border border-gray-200 space-y-4">
            <div className="flex items-baseline gap-3">
              <div className="h-8 bg-gray-300 rounded-lg w-36" />
              <div className="h-5 bg-gray-200 rounded w-24" />
            </div>
            <div className="h-32 bg-gray-100 rounded-2xl" />
            <div className="flex gap-4 pt-2">
              <div className="h-12 bg-gray-200 rounded-2xl flex-1" />
              <div className="h-12 bg-gray-300 rounded-2xl flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CatalogPageSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-6 animate-pulse">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div className="space-y-2">
          <div className="h-3.5 bg-gray-200 rounded w-32" />
          <div className="h-7 bg-gray-300 rounded w-56" />
        </div>
        <div className="h-9 bg-gray-200 rounded-xl w-44" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
          <div className="h-5 bg-gray-200 rounded w-24" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-full" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

