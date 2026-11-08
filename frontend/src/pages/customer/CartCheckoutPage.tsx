import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  Minus,
  Plus,
  Truck,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  MapPin,
  X,
  ShoppingBag,
} from 'lucide-react';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type {
  AddressDto,
  CheckoutDetailsDto,
  EstimateDeliveryDto,
  PaymentMethod,
} from '../../types/api';

const DEFAULT_GOVERNORATES = [
  { id: 1, nameEn: 'Cairo', nameAr: 'القاهرة' },
  { id: 2, nameEn: 'Giza', nameAr: 'الجيزة' },
  { id: 3, nameEn: 'Alexandria', nameAr: 'الإسكندرية' },
];

const DEFAULT_CITIES: Record<number, { id: number; nameEn: string }[]> = {
  1: [
    { id: 1, nameEn: 'Nasr City' },
    { id: 2, nameEn: 'New Cairo' },
    { id: 3, nameEn: 'Maadi' },
    { id: 4, nameEn: 'Heliopolis' },
    { id: 5, nameEn: 'Zamalek' },
  ],
  2: [
    { id: 6, nameEn: 'Dokki' },
    { id: 7, nameEn: 'Mohandessin' },
    { id: 8, nameEn: 'Sheikh Zayed' },
    { id: 9, nameEn: '6th of October' },
  ],
  3: [
    { id: 10, nameEn: 'Sidi Gaber' },
    { id: 11, nameEn: 'Smouha' },
  ],
};

export const CartCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, refreshCart, updateQuantity, removeItem } = useCart();
  const { user, isAuthenticated, setSession } = useAuth();
  const { toast } = useToast();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment'>('cart');
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetailsDto | null>(null);
  const [deliveryEstimate, setDeliveryEstimate] = useState<EstimateDeliveryDto | null>(null);

  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftRecipientPhone, setGiftRecipientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [stripeSessionUrl, setStripeSessionUrl] = useState<string | null>(null);

  // Inline Add Delivery Address Modal State
  const [addAddressModalOpen, setAddAddressModalOpen] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newGovernorateId, setNewGovernorateId] = useState<number>(1);
  const [newCityId, setNewCityId] = useState<number>(1);
  const [newArea, setNewArea] = useState('Nasr City');
  const [newLabel, setNewLabel] = useState('Home');
  const [savingAddress, setSavingAddress] = useState(false);

  const loadAddresses = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getAddresses();
      const list: AddressDto[] = res.data || [];
      setAddresses(list);
      const def = list.find((a: AddressDto) => a.isDefault) || list[0];
      if (def && !selectedAddressId) setSelectedAddressId(def.id);
    } catch {
      setAddresses([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
      loadAddresses();
    }
  }, [isAuthenticated, refreshCart]);

  useEffect(() => {
    if (!cart?.cartId || cart.items.length === 0) return;
    api
      .getCheckoutDetails(cart.cartId)
      .then((res) => {
        if (res.data) setCheckoutDetails(res.data);
      })
      .catch(() => setCheckoutDetails(null));
  }, [cart?.cartId, cart?.items.length]);

  useEffect(() => {
    if (!cart?.cartId || !selectedAddressId || cart.items.length === 0) return;
    api
      .getEstimateDelivery(selectedAddressId, cart.cartId)
      .then((res) => {
        if (res.data) setDeliveryEstimate(res.data);
      })
      .catch(() => setDeliveryEstimate(null));
  }, [cart?.cartId, selectedAddressId, cart?.items.length]);

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const deliveryFee =
    deliveryEstimate?.deliveryFee ?? checkoutDetails?.deliveryFee ?? (cart?.deliveryFee || 0);
  const total = subtotal + deliveryFee;

  const selectedAddressObj = addresses.find((a) => a.id === selectedAddressId);

  const handleQuickCustomerLogin = async () => {
    try {
      const reg = await api.registerCustomer({
        firstName: 'Test',
        lastName: 'Customer',
        email: `customer_${Date.now()}@floweapp.com`,
        phone: '01012345678',
        gender: 1,
        password: 'Password@123!',
        confirmPassword: 'Password@123!',
      });
      if (reg.data) {
        setSession(reg.data.user, reg.data.token);
        toast('Logged in as Customer', 'Ready to complete checkout!');
      }
    } catch {
      navigate('/auth?redirect=/cart');
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast('Authentication Required', 'Please sign in to save addresses', 'info');
      navigate('/auth?redirect=/cart');
      return;
    }

    const cleanPhone = newRecipientPhone.replace(/[\s\-\+]/g, '');
    const normalizedPhone = cleanPhone.startsWith('20') ? cleanPhone.slice(2) : cleanPhone;
    if (!/^01[0125][0-9]{8}$/.test(normalizedPhone)) {
      toast(
        'Invalid Mobile',
        'Please enter a valid 11-digit Egyptian phone number without +20 (e.g. 01012345678)',
        'error'
      );
      return;
    }
    if (!newAddressLine.trim()) {
      toast('Address Required', 'Please enter your street / building info', 'error');
      return;
    }

    setSavingAddress(true);
    try {
      const res = await api.createAddress({
        recipientName: newRecipientName.trim() || user?.name || 'Customer',
        recipientPhone: normalizedPhone,
        addressLine: newAddressLine.trim(),
        governorateId: Number(newGovernorateId) || 1,
        cityId: Number(newCityId) || 1,
        area: newArea.trim() || 'Nasr City',
        lat: 30.0561,
        lng: 31.3452,
        label: newLabel || 'Home',
      });
      if (res.data) {
        const added = res.data;
        setAddresses((prev: AddressDto[]) => [added, ...prev.filter((a: AddressDto) => a.id !== added.id)]);
        setSelectedAddressId(added.id);
        setAddAddressModalOpen(false);
        setNewAddressLine('');
        toast('Address Saved', 'Delivery address selected for your order');
      }
    } catch (err: any) {
      toast('Address Notice', err.message || 'Could not save address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cart || items.length === 0) return;
    if (!selectedAddressId) {
      toast('Select an Address', 'Please add or choose a delivery address first', 'error');
      setCheckoutStep('address');
      setAddAddressModalOpen(true);
      return;
    }
    if (isGift && (!giftRecipientName.trim() || !giftRecipientPhone.trim())) {
      toast('Gift Recipient Required', 'Please enter the recipient name and phone number', 'error');
      setCheckoutStep('address');
      return;
    }

    setPlacingOrder(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await api.placeOrder(
        {
          cartId: cart.cartId,
          addressId: selectedAddressId,
          isGift,
          giftRecipient: isGift
            ? {
                recipientName: giftRecipientName.trim(),
                recipientPhone: giftRecipientPhone.trim(),
              }
            : null,
          paymentMethod,
          paymentGateway: paymentMethod === 'CARD' ? 'Stripe' : null,
        },
        idempotencyKey
      );

      await refreshCart();
      if (res.data?.sessionUrl) {
        setStripeSessionUrl(res.data.sessionUrl);
        toast('Stripe Checkout Created!', 'Order placed with PaymentService session URL ready');
      } else {
        toast('Your order placed successfully!', `Order ID: ${res.data?.orderId}`);
        navigate('/orders');
      }
    } catch (err: any) {
      toast('Order Placement Failed', err.message, 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleMainButtonClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutStep === 'cart') {
      if (!isAuthenticated) {
        navigate('/auth?redirect=/cart');
        return;
      }
      setCheckoutStep('address');
      if (addresses.length === 0) {
        setAddAddressModalOpen(true);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (checkoutStep === 'address') {
      if (!selectedAddressId) {
        toast('Address Required', 'Please select or add a delivery address to continue', 'error');
        setAddAddressModalOpen(true);
        return;
      }
      setCheckoutStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    handlePlaceOrder(e);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-[16px] p-8 border-[0.5px] border-[#A6A6A6] space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#F9ECF0] flex items-center justify-center mx-auto text-[#D21E6A]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-[20px] font-semibold text-[#0C1015]">Login to View Your Cart</h2>
          <p className="text-xs text-[#535353] leading-relaxed">
            Please login or sign up to manage your flower basket and complete checkout.
          </p>
          <div className="space-y-3 pt-2">
            <Link
              to="/auth?redirect=/cart"
              className="inline-flex items-center justify-center w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
            >
              Login / Register
            </Link>
            <button
              type="button"
              onClick={handleQuickCustomerLogin}
              className="w-full h-[46px] rounded-[100px] border border-[#D21E6A] text-[#D21E6A] hover:bg-[#F9ECF0] text-sm font-medium transition-colors cursor-pointer"
            >
              Quick Demo Customer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stripeSessionUrl) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-[16px] p-8 border-[0.5px] border-[#A6A6A6] text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#2F9033] text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-[18px] font-medium text-[#0C1015]">
            Your order placed successfully!
          </h2>
          <p className="text-xs text-[#535353] leading-relaxed">
            PaymentService (<code className="text-[#D21E6A]">/api/payment</code>) generated a Stripe Checkout session for your credit card payment.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <a
              href={stripeSessionUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] font-medium text-[16px] flex items-center justify-center gap-2"
            >
              <span>Complete Credit Card Payment</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => navigate('/orders')}
              className="w-full h-[48px] rounded-[100px] border border-[#535353] text-[#535353] font-medium text-[16px]"
            >
              Track order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F9F9] min-h-screen pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Figma Top Header ("Shipping details&back" node 81:2899 / 30:989 / 30:1061) */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (checkoutStep === 'payment') setCheckoutStep('address');
                else if (checkoutStep === 'address') setCheckoutStep('cart');
                else navigate(-1);
              }}
              className="p-1 text-[#0C1015] hover:text-[#D21E6A] cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[20px] font-medium text-[#0C1015]">
              {checkoutStep === 'cart' ? (
                <>
                  <span>Cart </span>
                  <span className="text-[#535353]">({items.length} items)</span>
                </>
              ) : checkoutStep === 'address' ? (
                'Shipping Address'
              ) : (
                'Payment Method'
              )}
            </h1>
          </div>

          {/* Step Quick Switcher */}
          {items.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCheckoutStep('cart')}
                className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  checkoutStep === 'cart'
                    ? 'bg-[#F9ECF0] text-[#D21E6A]'
                    : 'text-[#535353] hover:text-[#0C1015]'
                }`}
              >
                Cart
              </button>
              <button
                type="button"
                onClick={() => setCheckoutStep('address')}
                className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  checkoutStep === 'address'
                    ? 'bg-[#F9ECF0] text-[#D21E6A]'
                    : 'text-[#535353] hover:text-[#0C1015]'
                }`}
              >
                1. Address
              </button>
              <button
                type="button"
                onClick={() => setCheckoutStep('payment')}
                className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  checkoutStep === 'payment'
                    ? 'bg-[#F9ECF0] text-[#D21E6A]'
                    : 'text-[#535353] hover:text-[#0C1015]'
                }`}
              >
                2. Payment
              </button>
            </div>
          )}
        </div>

        {/* Figma "Deliver to" row on Cart screen (node 30:711) */}
        <div className="flex items-center gap-2 py-1">
          <img src="/figma/location-pin.svg" alt="Location" className="w-5 h-5 shrink-0" />
          <span className="text-[16px] font-medium text-[#535353]">Deliver to:</span>
          <span className="text-[16px] font-medium text-[#0C1015] truncate max-w-[320px]">
            {selectedAddressObj
              ? `${selectedAddressObj.addressLine} - ${selectedAddressObj.area || selectedAddressObj.cityName}`
              : 'Add or select a delivery address'}
          </span>
          <ChevronDown className="w-5 h-5 text-[#0C1015] shrink-0" />
        </div>

        {/* Figma Checkout Progress Bar (node 30:1011: 1 Address — 2 Payment — 3 Track order) */}
        {items.length > 0 && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Step 1: Address */}
              <button
                type="button"
                onClick={() => setCheckoutStep('address')}
                className="flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div
                  className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[18px] font-medium transition-colors ${
                    checkoutStep === 'address' || checkoutStep === 'cart'
                      ? 'bg-[#D21E6A] text-[#F9F9F9]'
                      : 'border border-[#535353] text-[#535353]'
                  }`}
                >
                  1
                </div>
                <span className="text-[12px] text-[#535353]">Address</span>
              </button>

              <div className="w-10 sm:w-16 h-[1px] bg-[#535353] -mt-5" />

              {/* Step 2: Payment */}
              <button
                type="button"
                onClick={() => setCheckoutStep('payment')}
                className="flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div
                  className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[18px] font-medium transition-colors ${
                    checkoutStep === 'payment'
                      ? 'bg-[#D21E6A] text-[#F9F9F9]'
                      : 'border border-[#535353] text-[#535353]'
                  }`}
                >
                  2
                </div>
                <span className="text-[12px] text-[#535353]">Payment</span>
              </button>

              <div className="w-10 sm:w-16 h-[1px] bg-[#535353] -mt-5" />

              {/* Step 3: Track order */}
              <Link to="/orders" className="flex flex-col items-center gap-1.5">
                <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[18px] font-medium border border-[#535353] text-[#535353]">
                  3
                </div>
                <span className="text-[12px] text-[#535353]">Track order</span>
              </Link>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-[16px] p-12 border-[0.5px] border-[#A6A6A6] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F9ECF0] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 text-[#D21E6A]" />
            </div>
            <h2 className="text-[20px] font-medium text-[#0C1015]">Your cart is empty</h2>
            <p className="text-xs text-[#535353] max-w-sm mx-auto">
              Discover our freshly cut flower bouquets, luxury vases, and gift arrangements.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center h-[44px] px-6 rounded-[20px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-sm font-medium transition-colors"
            >
              Explore Flowers
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items, Gift, and Addresses */}
            <div className="lg:col-span-7 space-y-6">
              {cart?.hasChanges && (
                <div className="p-3.5 rounded-[8px] bg-[#F9ECF0] border border-[#D21E6A]/30 flex items-center gap-2.5 text-xs text-[#0C1015]">
                  <AlertTriangle className="w-4 h-4 text-[#D21E6A] shrink-0" />
                  <span>
                    Price or stock availability changed for one or more items since they were added.
                  </span>
                </div>
              )}

              {/* Figma Cart Item Cards (node 29:659) */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.itemId}
                    className="border-[#535353] border-[0.5px] rounded-[8px] p-[8px] bg-[#F9F9F9] flex items-center gap-[12px]"
                  >
                    <Link
                      to={`/products/${item.productId}`}
                      className="bg-[#F9ECF0] h-[101px] w-[96px] rounded-[8px] px-[12px] py-[8px] flex items-center justify-center shrink-0 overflow-hidden"
                    >
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <img src="/figma/cat-tulip.svg" alt="" className="w-10 h-10 opacity-70" />
                      )}
                    </Link>

                    <div className="flex-1 flex flex-col justify-between min-h-[84px]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/products/${item.productId}`}
                            className="text-[16px] font-medium text-[#0C1015] hover:text-[#D21E6A] line-clamp-1"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-[13px] font-normal text-[#535353]">
                            Fresh Flower Bouquet
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.itemId)}
                          title="Remove item"
                          className="p-1 hover:opacity-75 transition-opacity shrink-0 cursor-pointer"
                        >
                          <img src="/figma/delete.svg" alt="Remove" className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[14px] font-semibold text-[#0C1015]">
                          EGP {item.lineSubtotal.toFixed(0)}
                        </p>

                        <div className="flex items-center gap-[8px]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#0C1015] hover:text-[#D21E6A] cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-[14px] font-semibold text-[#0C1015] min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#0C1015] hover:text-[#D21E6A] cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Figma "Gift info" section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isGift}
                    onClick={() => setIsGift((v) => !v)}
                    className={`w-[44px] h-[24px] rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                      isGift ? 'bg-[#D21E6A] justify-end' : 'bg-[#A6A6A6] justify-start'
                    }`}
                  >
                    <span className="w-[18px] h-[18px] rounded-full bg-[#F9F9F9] shadow-xs" />
                  </button>
                  <span className="text-[18px] font-medium text-[#0C1015]">It is a gift</span>
                </div>

                {isGift && (
                  <div className="space-y-5 pt-1">
                    <div className="relative border border-[#535353] focus-within:border-[#D21E6A] rounded-[4px] h-[56px] px-4 flex items-center bg-[#F9F9F9]">
                      <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        required={isGift}
                        value={giftRecipientName}
                        onChange={(e) => setGiftRecipientName(e.target.value)}
                        placeholder="Enter the recipient name"
                        className="w-full bg-transparent text-[14px] text-[#0C1015] placeholder-[#A6A6A6] focus:outline-none"
                      />
                    </div>

                    <div className="relative border border-[#535353] focus-within:border-[#D21E6A] rounded-[4px] h-[56px] px-4 flex items-center bg-[#F9F9F9]">
                      <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                        Recipient Phone (Egyptian Mobile)
                      </label>
                      <input
                        type="tel"
                        required={isGift}
                        value={giftRecipientPhone}
                        onChange={(e) => setGiftRecipientPhone(e.target.value)}
                        placeholder="e.g. 01012345678"
                        className="w-full bg-transparent text-[14px] text-[#0C1015] placeholder-[#A6A6A6] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Figma "Deliver to" / "all address" section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-medium text-[#0C1015]">Deliver to</h2>
                  <button
                    type="button"
                    onClick={() => setAddAddressModalOpen(true)}
                    className="text-xs text-[#D21E6A] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {addresses.length === 0 ? (
                    <div className="bg-[#F9F9F9] border border-dashed border-[#A6A6A6] rounded-[10px] p-6 text-center space-y-2">
                      <p className="text-xs text-[#535353]">
                        No saved delivery address found for your account.
                      </p>
                      <button
                        type="button"
                        onClick={() => setAddAddressModalOpen(true)}
                        className="px-4 py-2 rounded-[100px] bg-[#D21E6A] text-[#F9F9F9] text-xs font-medium cursor-pointer"
                      >
                        Add Delivery Address
                      </button>
                    </div>
                  ) : (
                    addresses.map((addr) => {
                      const selected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] flex items-center justify-between cursor-pointer border transition-all ${
                            selected ? 'border-[#D21E6A] bg-[#F9ECF0]/30' : 'border-transparent hover:border-[#D21E6A]/40'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-[8px]">
                              <span className="w-[20px] h-[20px] rounded-full border border-[#D21E6A] flex items-center justify-center shrink-0">
                                {selected && (
                                  <span className="w-[12px] h-[12px] rounded-full bg-[#D21E6A]" />
                                )}
                              </span>
                              <span className="text-[16px] font-medium text-[#0C1015]">
                                {addr.label || 'Home'}
                              </span>
                            </div>
                            <p className="text-[13px] font-normal text-[#535353] pl-7">
                              {addr.addressLine} - {addr.area}, {addr.cityName}
                            </p>
                          </div>

                          <Link
                            to="/profile"
                            onClick={(e) => e.stopPropagation()}
                            title="Edit address"
                            className="p-1 text-[#535353] hover:text-[#D21E6A]"
                          >
                            <img src="/figma/pen-edit.svg" alt="Edit" className="w-5 h-5" />
                          </Link>
                        </div>
                      );
                    })
                  )}

                  {/* Inline Add Address Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setAddAddressModalOpen(true)}
                    className="border border-[#A6A6A6] hover:border-[#D21E6A] rounded-[20px] h-[36px] w-full flex items-center justify-center gap-1.5 text-[#D21E6A] text-[14px] font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add new</span>
                  </button>
                </div>

                {deliveryEstimate && (
                  <div className="p-3 rounded-[10px] bg-[#F9ECF0]/70 flex items-center justify-between text-xs text-[#0C1015]">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#D21E6A]" />
                      <span>
                        Estimated delivery:{' '}
                        <strong>
                          {new Date(deliveryEstimate.estimatedDeliveryAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </span>
                    </div>
                    <span className="font-medium">
                      Delivery Fee: EGP {deliveryEstimate.deliveryFee.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Payment, Summary & Checkout Action Button */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleMainButtonClick}
                className="bg-white rounded-[12px] p-6 shadow-[0px_0px_2px_rgba(83,83,83,0.25)] space-y-6 sticky top-24"
              >
                {/* Figma Payment method cards */}
                <div className="space-y-3">
                  <h2 className="text-[18px] font-medium text-[#0C1015]">Payment method</h2>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className="w-full bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-[16px] font-normal text-[#0C1015]">
                        Cash on delivery
                      </span>
                      <span className="w-[20px] h-[20px] rounded-full border border-[#D21E6A] flex items-center justify-center">
                        {paymentMethod === 'COD' && (
                          <span className="w-[12px] h-[12px] rounded-full bg-[#D21E6A]" />
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className="w-full bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-[16px] font-normal text-[#0C1015]">Credit card</span>
                      <span className="w-[20px] h-[20px] rounded-full border border-[#D21E6A] flex items-center justify-center">
                        {paymentMethod === 'CARD' && (
                          <span className="w-[12px] h-[12px] rounded-full bg-[#D21E6A]" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Total price breakdown */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-2 text-[16px] font-normal text-[#535353]">
                    <div className="flex items-center justify-between">
                      <span>Sub Total</span>
                      <span>EGP {subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Delivery Fee</span>
                      <span>EGP {deliveryFee.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-[#CFCFCF]" />

                  <div className="flex items-center justify-between text-[18px] font-medium text-[#0C1015]">
                    <span>Total</span>
                    <span>EGP {total.toFixed(0)}</span>
                  </div>
                </div>

                {/* Primary Action Button — Always visible and active for current step */}
                <button
                  type="submit"
                  disabled={placingOrder || (checkoutStep === 'payment' && !selectedAddressId)}
                  className="w-full h-[50px] rounded-[20px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[18px] font-medium flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {placingOrder
                    ? 'Placing order...'
                    : checkoutStep === 'cart'
                    ? 'Checkout'
                    : checkoutStep === 'address'
                    ? 'Continue to Payment'
                    : 'Place order'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Figma Mobile Sticky Bottom Bar (node 30:731) — Guarantees checkout button is ALWAYS visible on phones/tablets */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#CFCFCF] px-4 py-3 shadow-[0px_-4px_16px_rgba(0,0,0,0.08)] z-40 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-[#535353] block font-normal">Total Price</span>
            <span className="text-[18px] font-bold text-[#0C1015]">EGP {total.toFixed(0)}</span>
          </div>
          <button
            type="button"
            onClick={handleMainButtonClick}
            disabled={placingOrder || (checkoutStep === 'payment' && !selectedAddressId)}
            className="flex-1 max-w-[220px] h-[48px] rounded-[20px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            {placingOrder
              ? 'Placing...'
              : checkoutStep === 'cart'
              ? 'Checkout'
              : checkoutStep === 'address'
              ? 'Continue'
              : 'Place order'}
          </button>
        </div>
      )}

      {/* Inline Add Address Modal */}
      {addAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0C1015]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F9F9F9] rounded-[20px] max-w-md w-full p-6 shadow-2xl border border-[#CFCFCF] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#CFCFCF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F9ECF0] text-[#D21E6A] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-[#0C1015]">Add Delivery Address</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddAddressModalOpen(false)}
                className="p-1 text-[#535353] hover:text-[#0C1015]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAddress} className="space-y-4">
              <div className="relative">
                <label className="text-[12px] font-medium text-[#535353] block mb-1">
                  Street Address & Building
                </label>
                <input
                  type="text"
                  required
                  value={newAddressLine}
                  onChange={(e) => setNewAddressLine(e.target.value)}
                  placeholder="e.g. 10 Abbas El Akkad St, Apt 4"
                  className="w-full h-[46px] px-3.5 rounded-[8px] border border-[#535353] bg-white text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-[#535353] block mb-1">
                    Governorate
                  </label>
                  <select
                    value={newGovernorateId}
                    onChange={(e) => {
                      const gid = Number(e.target.value);
                      setNewGovernorateId(gid);
                      const defaultCity = DEFAULT_CITIES[gid]?.[0]?.id || 1;
                      setNewCityId(defaultCity);
                    }}
                    className="w-full h-[46px] px-3 rounded-[8px] border border-[#535353] bg-white text-[13px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  >
                    {DEFAULT_GOVERNORATES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#535353] block mb-1">
                    City / Zone
                  </label>
                  <select
                    value={newCityId}
                    onChange={(e) => setNewCityId(Number(e.target.value))}
                    className="w-full h-[46px] px-3 rounded-[8px] border border-[#535353] bg-white text-[13px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  >
                    {(DEFAULT_CITIES[newGovernorateId] || DEFAULT_CITIES[1]).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-[#535353] block mb-1">
                    Area / District
                  </label>
                  <input
                    type="text"
                    required
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="e.g. Nasr City"
                    className="w-full h-[46px] px-3 rounded-[8px] border border-[#535353] bg-white text-[13px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#535353] block mb-1">
                    Label
                  </label>
                  <select
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full h-[46px] px-3 rounded-[8px] border border-[#535353] bg-white text-[13px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-[#535353] block mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    placeholder="e.g. Ahmed"
                    className="w-full h-[46px] px-3 rounded-[8px] border border-[#535353] bg-white text-[13px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#535353] block mb-1">
                    Recipient Mobile
                  </label>
                  <input
                    type="tel"
                    required
                    value={newRecipientPhone}
                    onChange={(e) => setNewRecipientPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full h-[46px] px-3 rounded-[8px] border border-[#535353] bg-white text-[13px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] font-medium text-sm flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingAddress ? 'Saving Address...' : 'Save & Deliver Here'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
