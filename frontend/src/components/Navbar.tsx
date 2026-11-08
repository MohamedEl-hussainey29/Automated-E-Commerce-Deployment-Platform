import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Truck,
  ShieldCheck,
  MapPin,
  LogOut,
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
import { DeliveryModal } from './DeliveryModal';

interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'order' | 'promo' | 'system';
  link?: string;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Order Tracking Update 🌸',
    description: 'Your fresh floral arrangement order is being prepared by our florist hub.',
    time: '15m ago',
    read: false,
    type: 'order',
    link: '/orders',
  },
  {
    id: 'notif-2',
    title: 'Special Floral Offer',
    description: 'Enjoy 15% off on all luxury Tulip & Rose hand bouquets this weekend!',
    time: '2h ago',
    read: false,
    type: 'promo',
    link: '/catalog',
  },
  {
    id: 'notif-3',
    title: 'Freshness Guarantee Care Tip',
    description: 'Trim flower stems at a 45° angle and change vase water every 2 days.',
    time: '1d ago',
    read: true,
    type: 'system',
  },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    selectedAddress,
    userAddresses,
    openAddressModal,
    logout,
  } = useAuth();
  const { cart } = useCart();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const markAllNotifsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markNotifAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const activeAddr = selectedAddress || userAddresses.find((a) => a.isDefault) || userAddresses[0];
  const deliveryLabel = activeAddr
    ? `${activeAddr.addressLine} - ${activeAddr.area || activeAddr.cityName}`
    : isAuthenticated
    ? (userAddresses.length > 0
        ? `${userAddresses[0].addressLine} - ${userAddresses[0].area || userAddresses[0].cityName}`
        : 'Add delivery address')
    : 'Cairo, Egypt (Select location)';

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
                onClick={openAddressModal}
                className="hidden xl:flex items-center gap-2 text-sm text-[#35383C] hover:text-[#D21E6A] transition-colors cursor-pointer"
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
              {/* Notification Popover Button (Never navigates to /orders) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  title="Notifications"
                  className="relative p-1.5 text-[#0C1015] hover:text-[#D21E6A] transition-colors cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#D21E6A] text-[#F9F9F9] text-[10px] font-medium flex items-center justify-center">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[16px] shadow-2xl border border-[#CFCFCF] z-50 overflow-hidden animate-in fade-in duration-150">
                    <div className="px-4 py-3 bg-[#F9F9F9] border-b border-[#EBEBEB] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-[#0C1015]">Notifications</h3>
                        {unreadNotifCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#F9ECF0] text-[#D21E6A] text-[11px] font-medium">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadNotifCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotifsAsRead}
                            className="text-[11px] text-[#D21E6A] hover:underline cursor-pointer font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNotificationsOpen(false)}
                          className="p-1 text-[#535353] hover:text-[#0C1015] cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#F0F0F0]">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#535353]">
                          No notifications at the moment.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markNotifAsRead(notif.id);
                              if (notif.link) {
                                setNotificationsOpen(false);
                                navigate(notif.link);
                              }
                            }}
                            className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                              notif.read ? 'bg-white hover:bg-[#F9F9F9]' : 'bg-[#F9ECF0]/40 hover:bg-[#F9ECF0]/70'
                            }`}
                          >
                            <span className="w-8 h-8 rounded-full bg-[#F9ECF0] text-[#D21E6A] flex items-center justify-center shrink-0 mt-0.5">
                              {notif.type === 'order' ? (
                                <Truck className="w-4 h-4" />
                              ) : notif.type === 'promo' ? (
                                <Flower2 className="w-4 h-4" />
                              ) : (
                                <Bell className="w-4 h-4" />
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-semibold text-[#0C1015] truncate">
                                  {notif.title}
                                </p>
                                <span className="text-[10px] text-[#A6A6A6] shrink-0">
                                  {notif.time}
                                </span>
                              </div>
                              <p className="text-xs text-[#535353] line-clamp-2 mt-0.5">
                                {notif.description}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-[#D21E6A] shrink-0 mt-2" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
      <DeliveryModal />
    </>
  );
};
