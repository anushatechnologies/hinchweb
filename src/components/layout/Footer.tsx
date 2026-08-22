import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  FileText,
  PhoneCall,
  Mail,
  MapPin,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-industrial-950 text-industrial-300 font-sans border-t border-industrial-800">
      {/* 1. Value Proposition Pillars */}
      <div className="border-b border-industrial-800 bg-industrial-900/60 py-10 px-4 sm:px-8 lg:px-12">
        <div className="max-w-[1720px] w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-industrial-900/80 border border-industrial-800/80">
            <div className="p-3 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% GST & MTC Verified</h4>
              <p className="text-xs text-industrial-400 mt-1">
                Direct primary mill test certificates & authentic GST e-invoices for 100% Input Tax Credit (ITC).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-industrial-900/80 border border-industrial-800/80">
            <div className="p-3 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Direct Site Transit Fleet</h4>
              <p className="text-xs text-industrial-400 mt-1">
                Heavy vehicle transit (trailers, 10-wheelers) with live weighbridge slips & E-Way Bill tracking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-industrial-900/80 border border-industrial-800/80">
            <div className="p-3 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Enterprise PayLater (45 Days)</h4>
              <p className="text-xs text-industrial-400 mt-1">
                Revolving credit lines up to ₹50 Lakhs for contractors, SMEs, and infrastructure developers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-industrial-900/80 border border-industrial-800/80">
            <div className="p-3 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Wholesale RFQ Bidding</h4>
              <p className="text-xs text-industrial-400 mt-1">
                Broadcast custom BOQs & bulk cutting schedules to 500+ authorized manufacturers simultaneously.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Links */}
      <div className="max-w-[1720px] w-full mx-auto py-12 px-4 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-xs">
        {/* Company Info */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="inline-block bg-white p-2.5 rounded-2xl shadow-md group hover:opacity-95 transition-opacity">
            <img
              src="/logo.png"
              alt="HINCHMART — Everything for Every Construction"
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </Link>
          
          <p className="text-industrial-300 leading-relaxed pr-4 text-xs">
            India's trusted B2B marketplace for construction materials, industrial supplies, tools, and equipment with fast delivery and GST billing.
          </p>

          {/* Customer Support Desk Callout */}
          <div className="bg-industrial-900/90 border border-industrial-800 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-sm max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-industrial-400 font-medium">Customer Support Desk</div>
              <a href="tel:+918388899999" className="text-sm font-black text-white hover:text-brand-400 transition-colors font-mono tracking-wide">
                +91 8388899999
              </a>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-industrial-400 text-[11px]">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>Sirisampadha Arcade 1, 5th Floor, Gachibowli, Khajaguda, Hyderabad – 500008, Telangana, India</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <a href="mailto:hinchmart@gmail.com" className="hover:text-white transition-colors">
                hinchmart@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h4 className="text-white font-bold uppercase tracking-wider text-xs">Primary Materials</h4>
          <ul className="space-y-2 text-industrial-400">
            <li><Link to="/catalog?category=TMT+Steel+%26+Rebars" className="hover:text-white transition-colors">TMT Rebars (Fe550D / Fe500D)</Link></li>
            <li><Link to="/catalog?category=Cement+%26+Aggregates" className="hover:text-white transition-colors">OPC 53 / PPC Cement Bags</Link></li>
            <li><Link to="/catalog?category=Industrial+Electrical" className="hover:text-white transition-colors">Armoured XLPE Copper Cables</Link></li>
            <li><Link to="/catalog?category=Pipes+%26+Plumbing" className="hover:text-white transition-colors">HDPE & CPVC Industrial Pipes</Link></li>
            <li><Link to="/catalog?category=Solar+%26+Renewable+Energy" className="hover:text-white transition-colors">Mono PERC Solar PV Panels</Link></li>
            <li><Link to="/catalog?category=Heavy+Power+Tools" className="hover:text-white transition-colors">Demolition Hammers & Cutters</Link></li>
          </ul>
        </div>

        {/* B2B Solutions */}
        <div className="space-y-3">
          <h4 className="text-white font-bold uppercase tracking-wider text-xs">Enterprise Solutions</h4>
          <ul className="space-y-2 text-industrial-400">
            <li><Link to="/rfq" className="hover:text-white transition-colors">Broadcast Bulk RFQ</Link></li>
            <li><Link to="/account" className="hover:text-white transition-colors">Apply for 45-Day PayLater</Link></li>
            <li><Link to="/orders" className="hover:text-white transition-colors">Live Consignment Tracking</Link></li>
            <li><Link to="/invoices" className="hover:text-white transition-colors">GST Tax Invoice Portal</Link></li>
            <li><Link to="/catalog?deals=true" className="hover:text-white transition-colors">Wholesale Tier Deals</Link></li>
            <li><Link to="/account" className="hover:text-white transition-colors">Multi-Project Site Address Book</Link></li>
          </ul>
        </div>

        {/* Regional Hubs & Compliance */}
        <div className="space-y-3">
          <h4 className="text-white font-bold uppercase tracking-wider text-xs">Regional Stock Depots</h4>
          <ul className="space-y-2 text-industrial-400">
            <li>Hyderabad: Sanathnagar & Cherlapally Hubs</li>
            <li>Bengaluru: Peenya & Electronic City Yards</li>
            <li>Mumbai-MMR: Bhiwandi Mega Freight Terminal</li>
            <li>Delhi-NCR: Okhla & Manesar Industrial Corridor</li>
            <li>Chennai: Sriperumbudur Logistics Park</li>
            <li>Ahmedabad: Sanand Steel & Cement Depot</li>
          </ul>
        </div>
      </div>

      {/* 3. Bottom Legal & Copyright Bar */}
      <div className="border-t border-industrial-800 py-6 px-4 sm:px-8 lg:px-12 text-xs text-industrial-400 bg-industrial-950">
        <div className="max-w-[1720px] w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-industrial-400 text-center md:text-left">
            © {new Date().getFullYear()} HinchMart. All Rights Reserved.
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-industrial-400 text-center md:text-right">
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-industrial-700">•</span>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
