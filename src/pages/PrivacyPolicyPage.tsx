import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Globe, Calendar, ArrowLeft } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
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
          <span className="font-semibold text-industrial-800">Privacy Policy</span>
        </div>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-industrial-950 via-slate-900 to-industrial-950 rounded-3xl p-8 text-white border border-industrial-800 shadow-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-industrial-400 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              Effective Date: August 22, 2026
            </span>
            <span>•</span>
            <span>Last Updated: August 22, 2026</span>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-industrial-200 shadow-subtle space-y-8 text-xs sm:text-sm text-industrial-800 leading-relaxed font-sans">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              1. Introduction
            </h2>
            <p>
              Welcome to <strong>HinchMart</strong> (“HinchMart,” “we,” “our,” or “us”).
            </p>
            <p>
              We respect your privacy and are committed to protecting the personal information you provide when you visit our website, contact us, submit an inquiry, use our services, or otherwise interact with HinchMart.
            </p>
            <p>
              This Privacy Policy explains what information we collect, why we collect it, how we use and protect it, and the choices available to you.
            </p>
            <p className="font-semibold text-industrial-900">
              By using our website or services, you acknowledge this Privacy Policy.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              2. Company Information
            </h2>
            <p className="font-bold text-industrial-900">HinchMart</p>
            
            <div className="pt-2 max-w-md">
              <div className="p-4 rounded-2xl bg-industrial-50 border border-industrial-200 space-y-2">
                <div className="font-bold text-xs uppercase text-brand-700 tracking-wider">Registered Office</div>
                <div className="text-xs text-industrial-700 space-y-1">
                  <p className="font-semibold text-industrial-900">Sirisampadha Arcade 1, 5th Floor,</p>
                  <p>Gachibowli, Khajaguda,</p>
                  <p>Hyderabad – 500008,</p>
                  <p>Telangana, India</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs">
              <Globe className="w-4 h-4 text-brand-600" />
              <span>Official Website: </span>
              <a
                href="https://www.hinchmart.com/"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-brand-600 hover:text-brand-700 underline"
              >
                https://www.hinchmart.com/
              </a>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              3. Information We May Collect
            </h2>
            <p>Depending on how you interact with us, we may collect information such as:</p>
            
            <div className="space-y-3 pl-2">
              <div>
                <h3 className="font-bold text-industrial-900 text-sm mb-1.5">Personal Information</h3>
                <ul className="list-disc pl-5 space-y-1 text-industrial-600 text-xs">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Business or company name</li>
                  <li>Job title or designation</li>
                  <li>Billing or business address</li>
                  <li>Country, state, city, and postal code</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-industrial-900 text-sm mb-1.5">Business Information</h3>
                <p className="text-xs text-industrial-600 mb-1">For business inquiries or services, we may collect:</p>
                <ul className="list-disc pl-5 space-y-1 text-industrial-600 text-xs">
                  <li>Company name and contact details</li>
                  <li>Business requirements and specifications</li>
                  <li>Product or service requirements</li>
                  <li>Quotations, RFQs, and inquiry information</li>
                  <li>Transaction and order records</li>
                  <li>Tax or business registration information (e.g. GSTIN, PAN, CIN) where necessary</li>
                  <li>Documents voluntarily provided for business verification or service delivery</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-industrial-900 text-sm mb-1.5">Technical Information</h3>
                <p className="text-xs text-industrial-600 mb-1">When you use our website, certain technical information may be collected automatically, including:</p>
                <ul className="list-disc pl-5 space-y-1 text-industrial-600 text-xs">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device type and operating system</li>
                  <li>Pages visited and referral source</li>
                  <li>Approximate geographic location</li>
                  <li>Date and time of access & website interaction metrics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              4. How We Use Your Information
            </h2>
            <p>We may use information collected through our website and services to:</p>
            <ul className="list-disc pl-5 space-y-1 text-industrial-600 text-xs">
              <li>Provide our products, procurement marketplace, and logistics services</li>
              <li>Respond to inquiries and communicate with customers and business partners</li>
              <li>Prepare quotations, BOQ evaluations, or proposals</li>
              <li>Process business transactions, purchase orders, and tax invoices</li>
              <li>Provide dedicated customer support and manage business relationships</li>
              <li>Improve our website performance and user experience</li>
              <li>Maintain website security and detect and prevent fraud or misuse</li>
              <li>Maintain business and transaction records in compliance with Indian GST & international regulations</li>
              <li>Comply with applicable legal and regulatory requirements</li>
              <li>Send service-related communications and permitted marketing updates</li>
            </ul>
            <p className="text-xs text-industrial-600 italic">
              We do not use personal information for purposes that are materially different from those described here without providing appropriate notice or obtaining consent where required.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              5. Legal Basis for Processing
            </h2>
            <p>Where applicable law requires a legal basis for processing personal information, we may process information based on:</p>
            <ul className="list-disc pl-5 space-y-1 text-industrial-600 text-xs">
              <li>Your consent</li>
              <li>Performance of a contract</li>
              <li>Steps requested before entering into a contract</li>
              <li>Compliance with legal obligations</li>
              <li>Our legitimate business interests</li>
              <li>Protection against fraud, security threats, or misuse</li>
            </ul>
            <p className="text-xs text-industrial-600">
              You may withdraw consent where processing is based on consent, subject to applicable legal requirements.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              6. Cookies and Similar Technologies
            </h2>
            <p>Our website may use cookies and similar technologies to:</p>
            <ul className="list-disc pl-5 space-y-1 text-industrial-600 text-xs">
              <li>Keep the website functioning properly and remember user preferences</li>
              <li>Understand website usage and improve platform responsiveness</li>
              <li>Measure traffic and engagement, and provide analytics and security protection</li>
            </ul>
            <p className="text-xs text-industrial-600">
              Where required by applicable law, we will request consent before placing non-essential cookies. You can also manage cookies through your browser settings.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              7. Analytics and Third-Party Services
            </h2>
            <p>We may use third-party service providers for hosting, cloud infrastructure, analytics, customer support, and payment processing. These providers process information on our behalf only as necessary to provide their services under strict confidentiality agreements.</p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              8. Payments
            </h2>
            <p>If payment functionality is offered, payment information is securely processed by authorized third-party payment gateways (e.g. Razorpay, UPI, NetBanking). HinchMart may receive transaction confirmation details such as payment status, transaction ID, amount, and billing info. We do not directly store complete credit or debit card credentials.</p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              9. How We Share Information
            </h2>
            <p>We may share information with authorized employees, technology providers, professional advisers, and government authorities when required by law. <strong>We do not sell personal information for monetary consideration.</strong></p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              10. International Data Transfers
            </h2>
            <p>Because HinchMart operates across the United States and India and may use international service providers, personal information may be processed or stored outside the country where it was originally collected, in compliance with applicable cross-border data protection standards.</p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              11. Data Security
            </h2>
            <p>We implement robust administrative, technical, and physical safeguards designed to protect your information against unauthorized access, loss, alteration, or disclosure.</p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              12. Data Retention
            </h2>
            <p>We retain personal information only for as long as reasonably necessary to fulfill the purposes for which it was collected, resolve disputes, and comply with tax, statutory, and accounting rules.</p>
          </section>

          {/* Section 13 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              13. Your Privacy Rights
            </h2>
            <p>Depending on your jurisdiction, you have rights to access, correct, delete, or restrict the processing of your personal information, or withdraw consent. Contact our privacy desk to exercise these rights.</p>
          </section>

          {/* Section 14 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              14. Marketing Communications
            </h2>
            <p>You can opt out of marketing emails anytime via the unsubscribe link or by contacting us directly.</p>
          </section>

          {/* Section 15 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              15. Children's Privacy
            </h2>
            <p>Our business procurement services are not intended for children under 18 years of age.</p>
          </section>

          {/* Section 16 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              16. Third-Party Links
            </h2>
            <p>Our website may contain links to third-party portals with their own privacy policies.</p>
          </section>

          {/* Section 17 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              17. Business Transfers
            </h2>
            <p>In the event of a merger, acquisition, or restructuring, user information may be transferred as part of the business assets.</p>
          </section>

          {/* Section 18 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              18. Changes to This Privacy Policy
            </h2>
            <p>We may update this policy periodically. Revisions will be reflected with an updated "Last Updated" date.</p>
          </section>

          {/* Section 19 */}
          <section className="space-y-4 pt-2">
            <h2 className="text-lg font-black text-industrial-950 border-b border-industrial-200 pb-2">
              19. Contact Us
            </h2>
            <p>For questions, requests, or concerns regarding this Privacy Policy or the handling of personal information, contact:</p>
            
            <div className="p-5 rounded-2xl bg-industrial-900 text-white space-y-3">
              <div className="font-black text-base text-brand-400">HinchMart</div>
              
              <div className="text-xs text-industrial-300 space-y-2 max-w-md">
                <div className="font-bold text-white mb-1">Registered Corporate Office</div>
                <p>Sirisampadha Arcade 1, 5th Floor,</p>
                <p>Gachibowli, Khajaguda,</p>
                <p>Hyderabad – 500008, Telangana, India</p>
                <p className="pt-1 text-white">
                  Email:{' '}
                  <a href="mailto:hinchmart@gmail.com" className="text-brand-400 font-bold hover:underline">
                    hinchmart@gmail.com
                  </a>
                </p>
                <p className="text-white">
                  Website:{' '}
                  <a
                    href="https://www.hinchmart.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-400 font-bold hover:underline"
                  >
                    https://www.hinchmart.com/
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
