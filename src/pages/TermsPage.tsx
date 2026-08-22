import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-industrial-50 min-h-screen py-10 px-4 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-industrial-500">
          <Link to="/" className="hover:text-industrial-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-industrial-800">Terms & Conditions</span>
        </div>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 rounded-3xl p-8 text-white border border-industrial-800 shadow-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold uppercase tracking-wide">
            <FileText className="w-4 h-4" />
            <span>Platform Terms of Use</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Terms & Conditions
          </h1>
          <p className="text-xs text-industrial-400">
            Last Updated: August 22, 2026 • Governing B2B Industrial & Construction Procurement
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-industrial-200 shadow-subtle space-y-8 text-xs sm:text-sm text-industrial-800 leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the <strong>HinchMart</strong> procurement platform (operated by <strong>HinchMart Technologies Pvt Ltd</strong>), you agree to be bound by these Terms & Conditions, our Privacy Policy, and applicable Indian & international commercial trade laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              2. Commercial B2B Eligibility & Account Verification
            </h2>
            <p>
              HinchMart is an enterprise B2B procurement marketplace designed for contractors, builders, industrial manufacturers, infrastructure developers, and corporate enterprises. Users must provide valid business details (such as GSTIN, PAN, Company Registration) for tax invoicing and credit line evaluation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              3. Pricing, GST Invoicing & Input Tax Credit (ITC)
            </h2>
            <p>
              All wholesale material rates (e.g. TMT Steel, Cement, Electrical Cables, Heavy Machinery) are quoted with transparent applicable GST rates (18%, 28%, etc.). Authentic GST tax e-invoices with valid IRN and QR codes are issued upon consignment dispatch for 100% compliant Input Tax Credit (ITC) claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              4. Logistics, Transit Fleet & Site Delivery
            </h2>
            <p>
              Dispatches are carried out via verified heavy vehicle freight transit. Unloading at site and weighbridge slips are coordinated in accordance with purchase order terms and E-Way Bill documentation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              5. Enterprise PayLater & Credit Facilities
            </h2>
            <p>
              Credit lines (up to 45 days) are extended subject to KYC verification, credit underwriting, and timely settlement according to sanctioned revolving credit agreements.
            </p>
          </section>

          <section className="space-y-4 pt-2">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              6. Contact Information
            </h2>
            <div className="p-5 rounded-2xl bg-industrial-50 border border-industrial-200 space-y-2 text-xs">
              <p className="font-bold text-industrial-950">HinchMart Platform Desk</p>
              <p>Sirisampadha Arcade 1, 5th Floor, Gachibowli, Khajaguda, Hyderabad – 500008, Telangana, India</p>
              <p>Website: <a href="https://www.hinchmart.com/" target="_blank" rel="noreferrer" className="text-brand-600 font-bold hover:underline">https://www.hinchmart.com/</a></p>
              <p>Email: <a href="mailto:hinchmart@gmail.com" className="text-brand-600 font-bold hover:underline">hinchmart@gmail.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
