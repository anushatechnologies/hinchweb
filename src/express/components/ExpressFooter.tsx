import React from 'react';
import { Link } from 'react-router-dom';

export const ExpressFooter: React.FC = () => {
  const hyderabadSeoLinks = [
    'Courier Services In HITEC City',
    'Bike Parcel Delivery In Hyderabad',
    'Bike Parcel Delivery In Gachibowli',
    'Courier Services In Secunderabad',
    'Bike Parcel Delivery In Madhapur',
    'Mini Truck Booking In Jeedimetla',
    'Courier Services In Balanagar',
    'Courier Services In Uppal',
    'Bike Parcel Delivery In Kukatpally',
    'Bike Parcel Delivery In Kondapur',
    'Courier Services In Cherlapally',
    'Bike Courier Services',
    'Mini Truck Booking',
    '3 Wheeler Courier Services',
    'Tata Ace Booking In Hyderabad',
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Top Location Link Cloud (Screenshot 5) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 font-medium">
          {hyderabadSeoLinks.map((link, idx) => (
            <Link
              key={idx}
              to="/#booking-console"
              className="hover:text-[#d9232d] transition-colors"
            >
              {link}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Black Footer (Screenshot 5) */}
      <div className="bg-[#0a0d14] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            {/* Left: Brand & Statement */}
            <div className="space-y-3 max-w-md">
              <div className="flex items-center">
                <span className="text-2xl font-black tracking-tighter text-white font-outfit">
                  hinch
                </span>
                <span className="text-2xl font-black tracking-tight text-[#d9232d] font-outfit italic ml-0.5">
                  EXpress
                </span>
                <div className="flex items-center gap-0.5 ml-1.5 self-end mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d9232d]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d9232d]" />
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Hyderabad's fastest-growing integrated logistics network. From express bike delivery to mini truck freight, we power businesses at every scale.
              </p>

              <div className="text-xs font-bold text-[#d9232d] italic">
                Logistics that move at the speed of trust
              </div>
            </div>

            {/* Right: Resources Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                RESOURCES
              </h4>
              <ul className="space-y-2 text-xs text-gray-400 font-medium">
                <li>
                  <Link to="/help" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/track" className="hover:text-white transition-colors">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-white transition-colors">
                    Rate Card & Fleet
                  </Link>
                </li>
                <li>
                  <Link to="/driver" className="hover:text-white transition-colors">
                    Become a Driver Partner
                  </Link>
                </li>
                <li>
                  <Link to="/business" className="hover:text-white transition-colors">
                    Enterprise & Credit Accounts
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              © 2026 Hinch Express. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/help" className="hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/help" className="hover:text-gray-300 transition-colors">
                Terms of Service
              </Link>
              <Link to="/business" className="hover:text-gray-300 transition-colors">
                GST ITC Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
