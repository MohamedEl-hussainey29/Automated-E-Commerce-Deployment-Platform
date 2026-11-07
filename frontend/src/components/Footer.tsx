import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, User } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FFFFFF] text-[#535353] border-t border-[#CFCFCF] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F9ECF0] flex items-center justify-center">
                <img src="/figma/logo-flower.svg" alt="Flowery" className="w-4 h-4" />
              </div>
              <span className="font-flowery text-[26px] text-[#D21E6A] leading-none">
                Flowery
              </span>
            </Link>
            <p className="text-xs text-[#535353] leading-relaxed">
              Fresh hand-tied bouquets, vases, luxury boxes, gifts, cards, and jewellery delivered across Sheikh Zayed, Cairo & Giza.
            </p>
            <p className="text-[11px] text-[#7D7D7D]">v 6.3.0 - (446)</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#0C1015] mb-3">E-commerce App</h4>
            <ul className="space-y-2 text-xs text-[#535353]">
              <li>
                <Link to="/" className="hover:text-[#D21E6A] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-[#D21E6A] transition-colors">
                  Categories & Best Sellers
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-[#D21E6A] transition-colors">
                  Cart & Shipping Details
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#D21E6A] transition-colors">
                  My Orders & Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#0C1015] mb-3">Portals & Account</h4>
            <ul className="space-y-2 text-xs text-[#535353]">
              <li>
                <Link to="/auth" className="hover:text-[#D21E6A] transition-colors flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D21E6A]" />
                  <span>Login / Sign up</span>
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-[#D21E6A] transition-colors">
                  Profile & Saved Addresses
                </Link>
              </li>
              <li>
                <Link to="/driver" className="hover:text-[#D21E6A] transition-colors flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#D21E6A]" />
                  <span>Flowery Rider App</span>
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#D21E6A] transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0CB359]" />
                  <span>Admin Studio</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#0C1015] mb-3">Backend Microservices</h4>
            <div className="p-3 rounded-[10px] bg-[#F9ECF0]/60 border border-[#D21E6A]/20 space-y-1.5 text-xs">
              <p className="font-medium text-[#0C1015]">Flowery .NET 8 YARP Gateway (:5000)</p>
              <p className="text-[11px] text-[#535353]">
                Identity • Catalog • Address/Cart • Orders • Payment
              </p>
              <p className="text-[11px] text-[#535353] pt-1">
                Seeded Admin: <code className="text-[#D21E6A]">admin@floweapp.com</code>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#CFCFCF] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7D7D7D] gap-2">
          <p>© {new Date().getFullYear()} Flowery App. All rights reserved.</p>
          <p>Terms & conditions • About us • English</p>
        </div>
      </div>
    </footer>
  );
};
