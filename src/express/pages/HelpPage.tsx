import React from 'react';
import { Phone, Mail, MessageSquare } from 'lucide-react';

export const HelpPage: React.FC = () => {
  const faqs = [
    {
      q: 'How fast will a mini truck or Tata Ace reach my pickup location?',
      a: 'Our average vehicle placement time is 12 to 15 minutes across major industrial and commercial zones. Real-time telemetry automatically dispatches the closest active driver.',
    },
    {
      q: 'Are my goods insured during carriage?',
      a: 'Yes, every commercial booking made through Hinch Express is backed by our comprehensive ?10 Lakh transit insurance cover covering transit loss and accidental damage.',
    },
    {
      q: 'Can I get loading and unloading helpers with the vehicle?',
      a: 'Yes! While booking, you can choose 1 or 2 helpers depending on the cargo weight. Helpers assist with loading at pickup and unloading at the delivery site.',
    },
    {
      q: 'How do I claim GST Input Tax Credit (ITC) on my booking?',
      a: 'Simply check the "Include GST" option on the booking console and provide your 15-digit GSTIN. An automated GST-compliant tax invoice will be sent to your email instantly upon delivery completion.',
    },
    {
      q: 'What are the payment options available?',
      a: 'You can pay online via UPI, NetBanking, Credit/Debit Cards, Cash on Pickup, or through approved 30-day Post-Paid Corporate Credit Lines.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-20">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
          Support & FAQ
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-outfit text-slate-950">
          How Can We Help You Today?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Find instant answers to common logistics questions or speak directly with our 24x7 central dispatch room.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto font-bold">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900">24x7 Dispatch Hotline</h3>
          <p className="text-xs font-bold text-orange-600">1800-446-2439 (Toll Free)</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900">Email Support Desk</h3>
          <p className="text-xs font-bold text-blue-600">express-support@hinchmart.com</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900">WhatsApp Live Dispatch</h3>
          <p className="text-xs font-bold text-emerald-600">+91 98490 12345</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card space-y-6">
        <h2 className="text-xl font-black text-slate-950 font-outfit">Frequently Asked Questions</h2>
        <div className="divide-y divide-slate-100 space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="pt-4 first:pt-0 space-y-1.5">
              <h3 className="font-extrabold text-sm text-slate-900">{faq.q}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
