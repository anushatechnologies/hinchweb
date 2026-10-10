import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { categoryApi } from '../../api/categoryApi';
import type { Category } from '../../types';

interface CategoryRibbonProps {
  activeSlug?: string;
  activeName?: string;
}

// Clean cutout image resolver for transparent category icons (Moglix style)
export function getCategoryCutoutIcon(cat: { name?: string; slug?: string; imageUrl?: string }): string {
  if (cat.imageUrl && cat.imageUrl.trim() !== '') {
    return cat.imageUrl;
  }

  const name = (cat.name || cat.slug || '').toLowerCase();
  if (name.includes('elect') || name.includes('appliance') || name.includes('wire') || name.includes('switch')) {
    return 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png';
  }
  if (name.includes('civil') || name.includes('construct') || name.includes('steel') || name.includes('cement') || name.includes('rebar')) {
    return 'https://cdn-icons-png.flaticon.com/512/2821/2821915.png';
  }
  if (name.includes('tool') || name.includes('machin') || name.includes('hardware')) {
    return 'https://cdn-icons-png.flaticon.com/512/3076/3076935.png';
  }
  if (name.includes('furnitur') || name.includes('office') || name.includes('chair') || name.includes('desk') || name.includes('wood')) {
    return 'https://cdn-icons-png.flaticon.com/512/2965/2965300.png';
  }
  if (name.includes('safety') || name.includes('ppe') || name.includes('helmet') || name.includes('shoe')) {
    return 'https://cdn-icons-png.flaticon.com/512/3061/3061614.png';
  }
  if (name.includes('plumb') || name.includes('pipe') || name.includes('valve')) {
    return 'https://cdn-icons-png.flaticon.com/512/1039/1039328.png';
  }
  if (name.includes('exterior') || name.includes('facade') || name.includes('roof') || name.includes('paint')) {
    return 'https://cdn-icons-png.flaticon.com/512/3176/3176396.png';
  }
  if (name.includes('interior') || name.includes('decor') || name.includes('light') || name.includes('glass')) {
    return 'https://cdn-icons-png.flaticon.com/512/2590/2590505.png';
  }
  if (name.includes('medical') || name.includes('lab')) {
    return 'https://cdn-icons-png.flaticon.com/512/2869/2869684.png';
  }
  if (name.includes('agri') || name.includes('garden')) {
    return 'https://cdn-icons-png.flaticon.com/512/3043/3043888.png';
  }
  if (name.includes('packag') || name.includes('handl')) {
    return 'https://cdn-icons-png.flaticon.com/512/2897/2897818.png';
  }
  if (name.includes('auto')) {
    return 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png';
  }
  return 'https://cdn-icons-png.flaticon.com/512/2821/2821915.png';
}

export const CategoryRibbon: React.FC<CategoryRibbonProps> = ({ activeSlug, activeName }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    categoryApi
      .getCategories({ active: true, includeSubcategories: true })
      .then((data) => {
        setCategories(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const isFastDeliveryActive = location.pathname === '/catalog' && location.search.includes('fastDelivery=true');
  const isDealsActive = location.pathname === '/catalog' && location.search.includes('deals=true');

  const isCategoryActive = (cat: Category) => {
    if (isFastDeliveryActive || isDealsActive) return false;
    if (!activeSlug && !activeName) {
      // Check if location pathname is /category/:slug or search includes category
      const pathSlug = location.pathname.startsWith('/category/') ? location.pathname.replace('/category/', '') : '';
      if (pathSlug) {
        const catSlug = (cat.slug || cat.name).toLowerCase().replace(/\s+/g, '-');
        return catSlug === decodeURIComponent(pathSlug).toLowerCase().replace(/\s+/g, '-');
      }
      return false;
    }
    const catSlug = (cat.slug || cat.name).toLowerCase().replace(/\s+/g, '-');
    const targetSlug = (activeSlug || '').toLowerCase().replace(/\s+/g, '-');
    const targetName = (activeName || '').toLowerCase();
    return catSlug === targetSlug || cat.name.toLowerCase() === targetName;
  };

  return (
    <nav aria-label="Categories Ribbon" className="bg-white border-b border-gray-200 shadow-xs sticky top-16 z-30">
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-end justify-start xl:justify-between gap-3 sm:gap-6 md:gap-8 overflow-x-auto no-scrollbar">
          {/* 1. 24 hrs Delivery (Left item with NEW badge and clock icon) */}
          <Link
            to="/catalog?fastDelivery=true"
            className="flex flex-col items-center justify-between shrink-0 group min-w-[76px] sm:min-w-[88px] text-center pt-2 pb-2.5 relative transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="relative w-11 h-11 flex items-center justify-center">
              {/* NEW Badge */}
              <span className="absolute -top-1 -right-1 bg-[#f59e0b] text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-2xs leading-tight z-10">
                NEW
              </span>
              {/* Clock 24h Icon */}
              <svg className="w-10 h-10 drop-shadow-2xs group-hover:scale-105 transition-transform" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="19" stroke="#1f2937" strokeWidth="2.5" strokeDasharray="3 3"/>
                <path d="M12 24C12 17.3726 17.3726 12 24 12" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
                <path d="M12 8V12H16" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="24" y="27" textAnchor="middle" fill="#dc2626" fontSize="12" fontWeight="900" fontFamily="sans-serif">24</text>
                <text x="24" y="35" textAnchor="middle" fill="#1f2937" fontSize="7" fontWeight="800" fontFamily="sans-serif">HOURS</text>
              </svg>
            </div>
            <span className={`text-[11px] sm:text-[12px] group-hover:text-[#dc2626] transition-colors leading-tight text-center mt-1.5 font-bold ${
              isFastDeliveryActive ? 'text-[#dc2626]' : 'text-industrial-900'
            }`}>
              24 hrs<br />Delivery
            </span>

            {isFastDeliveryActive && (
              <div className="absolute -bottom-0 left-0 right-0 h-[3px] bg-[#dc2626] rounded-t-full shadow-2xs" />
            )}
          </Link>

          {/* 2. Dynamic Categories from Backend (Clean Transparent Cutout Style) */}
          {isLoading || categories.length === 0 ? (
            // Shimmer skeletons
            [...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-between shrink-0 min-w-[76px] sm:min-w-[88px] text-center pt-2 pb-2.5 animate-pulse"
              >
                <div className="w-11 h-11 rounded-full bg-industrial-100" />
                <div className="h-2.5 bg-industrial-100 rounded w-14 mt-2" />
              </div>
            ))
          ) : (
            categories.map((cat) => {
              const active = isCategoryActive(cat);
              const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
              const iconUrl = getCategoryCutoutIcon(cat);

              return (
                <Link
                  key={cat.id}
                  to={`/category/${encodeURIComponent(slug)}`}
                  className="flex flex-col items-center justify-between shrink-0 group min-w-[76px] sm:min-w-[88px] text-center pt-2 pb-2.5 relative transition-transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <img
                      src={iconUrl}
                      alt={cat.name}
                      className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-xs group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <span
                    className={`text-[11px] sm:text-[12px] group-hover:text-[#dc2626] transition-colors leading-tight text-center mt-1.5 line-clamp-2 max-w-[85px] ${
                      active ? 'text-[#dc2626] font-black' : 'text-industrial-900 font-semibold'
                    }`}
                  >
                    {cat.name}
                  </span>

                  {/* Red Bottom Active Underline Indicator */}
                  {active && (
                    <div className="absolute -bottom-0 left-0 right-0 h-[3px] bg-[#dc2626] rounded-t-full shadow-2xs" />
                  )}
                </Link>
              );
            })
          )}

          {/* 3. Hinch Express (Opens Standalone Logistics Website in NEW TAB) */}
          <a
            href={import.meta.env.VITE_HINCH_EXPRESS_URL || 'http://localhost:5176'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-between shrink-0 group min-w-[76px] sm:min-w-[88px] text-center pt-2 pb-2.5 relative transition-transform hover:-translate-y-0.5 cursor-pointer"
            title="Open Hinch Express Logistics in New Tab"
          >
            <div className="relative w-11 h-11 flex items-center justify-center">
              <span className="absolute -top-1 -right-1 bg-[#f59e0b] text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-2xs leading-tight z-10">
                NEW
              </span>
              {/* Express X Vector Icon */}
              <svg className="w-9 h-9 drop-shadow-2xs group-hover:scale-105 transition-transform" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 9L31 31M31 9L9 31" stroke="#dc2626" strokeWidth="4.5" strokeLinecap="round"/>
                <circle cx="20" cy="20" r="3.5" fill="#f59e0b"/>
                <circle cx="20" cy="33" r="2" fill="#dc2626"/>
                <circle cx="27" cy="33" r="2" fill="#dc2626"/>
                <circle cx="13" cy="33" r="2" fill="#dc2626"/>
              </svg>
            </div>
            <span className="text-[11px] sm:text-[12px] group-hover:text-[#dc2626] transition-colors leading-tight text-center mt-1.5 font-bold text-industrial-900">
              Hinch<br />Express
            </span>
          </a>
        </div>
      </div>
    </nav>
  );
};
