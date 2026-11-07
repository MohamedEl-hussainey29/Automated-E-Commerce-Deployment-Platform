import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Truck,
  ShieldCheck,
  MapPin,
  LogOut,
  Check,
  X,
  ChevronDown,
  Home as HomeIcon,
  LayoutGrid,
  Flower2,
  Search,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import type { AddressDto } from '../types/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isCustomer,
    selectedStoreId,
    setSelectedStoreId,
    logout,
  } = useAuth();
  const { cart } = useCart();
  const { toast } = useToast();

  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState<AddressDto[]>([]);
  const [resolvingStore, setResolvingStore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated && isCustomer) {
      api
        .getAddresses()
        .then((res) => setUserAddresses(res.data || []))
        .catch(() => setUserAddresses([]));
    }
  }, [storeModalOpen, isAuthenticated, isCustomer]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const handleResolveByAddress = async (addressId: string) => {
    setResolvingStore(true);
    try {
      const res = await api.resolveStore({ addressId });
      if (res.data?.isServiceable && res.data.storeId) {
        setSelectedStoreId(res.data.storeId);
        toast('Location Updated', 'Showing flowers available for your address');
        setStoreModalOpen(false);
      } else {
        toast('Address Outside Coverage', 'This address is not covered by an active store.', 'info');
      }
    } catch (err: any) {
      toast('Location Update Failed', err.message, 'error');
    } finally {
      setResolvingStore(false);
    }
  };

  const defaultAddr = userAddresses.find((a) => a.isDefault) || userAddresses[0];
  const deliveryLabel = defaultAddr
    ? `${defaultAddr.addressLine} - ${defaultAddr.area || defaultAddr.cityName}`
    : '2XVP+XC - Sheikh Zayed';

  return (
    <>
      {/* Top Bar: Only the App Mode Switch */}
      <div className="bg-[#0C1015] text-[#A6A6A6] text-xs border-b border-[#212121]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center sm:justify-start gap-1.5 overflow-x-auto">
          <span className="text-[#7D7D7D] font-medium mr-1 text-[11px] hidden sm:inline">
            APP MODE:
          </span>
          <Link
            to="/"
            className={`px-2.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1.5 text-[11px] ${
              !location.pathname.startsWith('/driver') && !location.pathname.startsWith('/admin')
                ? 'bg-[#D21E6A] text-[#F9F9F9]'
                : 'hover:bg-[#212121] text-[#A6A6A6]'
            }`}
          >
            <Flower2 className="w-3 h-3" />
            <span>E-commerce App</span>
          </Link>
          <Link
            to="/driver"
            className={`px-2.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1.5 text-[11px] ${
              location.pathname.startsWith('/driver')
                ? 'bg-[#D21E6A] text-[#F9F9F9]'
                : 'hover:bg-[#212121] text-[#A6A6A6]'
            }`}
          >
            <Truck className="w-3 h-3" />
            <span>Flowery Rider App</span>
          </Link>
          <Link
            to="/admin"
            className={`px-2.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1.5 text-[11px] ${
              location.pathname.startsWith('/admin')
                ? 'bg-[#D21E6A] text-[#F9F9F9]'
                : 'hover:bg-[#212121] text-[#A6A6A6]'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Admin Studio</span>
          </Link>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#F9F9F9] border-b border-[#CFCFCF]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-20 flex items-center justify-between gap-4">
            {/* Logo & Deliver to */}
            <div className="flex items-center gap-5">
              <Link to="/" className="flex items-center gap-1.5 shrink-0 group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F9ECF0] flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                  <Flower2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#D21E6A]" />
                </div>
                <span className="font-flowery text-[22px] sm:text-[26px] text-[#D21E6A] leading-none">
                  Flowery
                </span>
              </Link>

              <button
                onClick={() => setStoreModalOpen(true)}
                className="hidden xl:flex items-center gap-2 text-sm text-[#35383C] hover:text-[#D21E6A] transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#D21E6A] shrink-0" />
                <span className="font-medium text-[#35383C]">Deliver to</span>
                <span className="font-medium text-[#0C1015] truncate max-w-[200px]">
                  {deliveryLabel}
                </span>
                <ChevronDown className="w-4 h-4 text-[#D21E6A] shrink-0" />
              </button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-2">
              <div className="relative flex items-center border border-[#A6A6A6] rounded-[8px] bg-[#F9F9F9] focus-within:border-[#D21E6A] focus-within:bg-white h-9 sm:h-10 px-3 transition-colors">
                <Search className="w-4 h-4 text-[#A6A6A6] shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent text-sm font-medium text-[#0C1015] placeholder-[#A6A6A6] focus:outline-none"
                />
              </div>
            </form>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {[
                { to: '/', label: 'Home' },
                { to: '/catalog', label: 'Categories' },
                { to: '/orders', label: 'My Orders' },
                { to: '/profile', label: 'Profile' },
              ].map((item) => {
                const active =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative py-2 text-sm transition-colors ${
                      active
                        ? 'text-[#D21E6A] font-medium'
                        : 'text-[#7D7D7D] hover:text-[#0C1015] font-normal'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#D21E6A] rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/orders"
                title="Notifications"
                className="relative p-1.5 text-[#0C1015] hover:text-[#D21E6A] transition-colors"
              >
                <Bell className="w-5 h-5" />
                {(cart?.totalQuantity || 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#CC1010] text-[#F9F9F9] text-[10px] font-medium flex items-center justify-center">
                    {cart?.totalQuantity}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium transition-colors ${
                  location.pathname === '/cart'
                    ? 'border-[#D21E6A] bg-[#F9ECF0] text-[#D21E6A]'
                    : 'border-[#CFCFCF] bg-white hover:border-[#D21E6A] text-[#0C1015]'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#D21E6A]" />
                <span>Cart</span>
                {(cart?.totalQuantity || 0) > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-[#D21E6A] text-[#F9F9F9]">
                    {cart?.totalQuantity}
                  </span>
                )}
              </Link>

              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-[#CFCFCF] bg-white hover:border-[#D21E6A] transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#F9ECF0] text-[#D21E6A] flex items-center justify-center font-semibold text-xs">
                      {(user.name || user.firstName || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="hidden md:inline text-xs font-medium text-[#0C1015] truncate max-w-[100px]">
                      {user.firstName || user.name || 'Account'}
                    </span>
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      toast('Signed out', 'Your session has been closed');
                      navigate('/auth');
                    }}
                    title="Logout"
                    className="p-2 rounded-full border border-[#CFCFCF] bg-white text-[#535353] hover:text-[#D21E6A] hover:border-[#D21E6A] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-full bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-xs font-medium transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F9F9F9] border-t border-[#CFCFCF] h-[56px] px-6 flex items-center justify-between"
        aria-label="Mobile Navigation"
      >
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 ${
            location.pathname === '/' ? 'text-[#D21E6A]' : 'text-[#7D7D7D]'
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[12px] leading-none">Home</span>
        </Link>
        <Link
          to="/catalog"
          className={`flex flex-col items-center justify-center gap-1 ${
            location.pathname.startsWith('/catalog') || location.pathname.startsWith('/products')
              ? 'text-[#D21E6A]'
              : 'text-[#7D7D7D]'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[12px] leading-none">Categories</span>
        </Link>
        <Link
          to="/cart"
          className={`relative flex flex-col items-center justify-center gap-1 ${
            location.pathname.startsWith('/cart') ? 'text-[#D21E6A]' : 'text-[#7D7D7D]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {(cart?.totalQuantity || 0) > 0 && (
            <span className="absolute -top-1 right-0 w-4 h-4 rounded-full bg-[#D21E6A] text-[#F9F9F9] text-[10px] flex items-center justify-center">
              {cart?.totalQuantity}
            </span>
          )}
          <span className="text-[12px] leading-none">Cart</span>
        </Link>
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center gap-1 ${
            location.pathname.startsWith('/profile') || location.pathname.startsWith('/orders')
              ? 'text-[#D21E6A]'
              : 'text-[#7D7D7D]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[12px] leading-none">Profile</span>
        </Link>
      </nav>

      {/* Delivery Location Modal */}
      {storeModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0C1015]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F9F9F9] rounded-[16px] max-w-md w-full p-6 shadow-2xl border border-[#CFCFCF] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFCFCF]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#F9ECF0] text-[#D21E6A] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-medium text-[#0C1015]">Deliver to</h3>
              </div>
              <button
                onClick={() => setStoreModalOpen(false)}
                className="p-1.5 rounded-lg text-[#535353] hover:text-[#0C1015]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedStoreId(null);
                setStoreModalOpen(false);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-[10px] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] bg-[#F9F9F9] text-left transition-all border ${
                !selectedStoreId ? 'border-[#D21E6A]' : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border border-[#D21E6A] flex items-center justify-center">
                  {!selectedStoreId && <span className="w-3 h-3 rounded-full bg-[#D21E6A]" />}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#0C1015]">
                    2XVP+XC - Sheikh Zayed
                  </p>
                  <p className="text-xs text-[#535353]">All available bouquets</p>
                </div>
              </div>
              {!selectedStoreId && <Check className="w-4 h-4 text-[#D21E6A]" />}
            </button>

            {userAddresses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#535353]">Saved addresses</p>
                {userAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => handleResolveByAddress(addr.id)}
                    disabled={resolvingStore}
                    className="w-full p-3.5 rounded-[10px] bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] border border-transparent hover:border-[#D21E6A] text-left flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#0C1015]">
                        {addr.label || addr.recipientName}
                      </p>
                      <p className="text-xs text-[#535353]">
                        {addr.addressLine}, {addr.area}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#D21E6A]">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
