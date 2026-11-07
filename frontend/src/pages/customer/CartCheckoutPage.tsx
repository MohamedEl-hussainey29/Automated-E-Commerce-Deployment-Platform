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

export const CartCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, refreshCart, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
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

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshCart();
    api
      .getAddresses()
      .then((res) => {
        const list = res.data || [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddressId(def.id);
      })
      .catch(() => setAddresses([]));
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || items.length === 0) return;
    if (!selectedAddressId) {
      toast('Select an Address', 'Please add or choose a delivery address first', 'error');
      return;
    }
    if (isGift && (!giftRecipientName.trim() || !giftRecipientPhone.trim())) {
      toast('Gift Recipient Required', 'Please enter the recipient name and phone number', 'error');
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
        toast(
          'Stripe Checkout Created!',
          'Order placed with PaymentService session URL ready'
        );
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-[16px] p-8 border-[0.5px] border-[#A6A6A6] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F9ECF0] flex items-center justify-center mx-auto">
            <img src="/figma/logo-flower.svg" alt="" className="w-8 h-8" />
          </div>
          <h2 className="text-[20px] font-medium text-[#0C1015]">Login to View Your Cart</h2>
          <p className="text-xs text-[#535353]">
            Please login or sign up to manage your flower basket and complete checkout.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
          >
            Login
          </Link>
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
    <div className="bg-[#F9F9F9] min-h-screen pb-20">
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
                'Address'
              ) : (
                'Payment'
              )}
            </h1>
          </div>

          {/* Step Quick Switcher */}
          {items.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCheckoutStep('cart')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
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
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
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
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
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
          <span className="text-[16px] font-medium text-[#535353]">Deliver to</span>
          <span className="text-[16px] font-medium text-[#0C1015] truncate max-w-[260px]">
            {selectedAddressObj
              ? `${selectedAddressObj.addressLine} - ${selectedAddressObj.area}`
              : '2XVP+XC - Sheikh Zayed.....'}
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
                <div className="w-[40px] h-[40px] rounded-full border border-[#535353] text-[#535353] flex items-center justify-center text-[18px] font-medium">
                  3
                </div>
                <span className="text-[12px] text-[#535353]">Track order</span>
              </Link>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-[10px] p-14 text-center border-[0.5px] border-[#A6A6A6] space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F9ECF0] flex items-center justify-center mx-auto">
              <img src="/figma/cat-tulip.svg" alt="" className="w-8 h-8" />
            </div>
            <h2 className="text-[18px] font-medium text-[#0C1015]">Your Cart is Empty</h2>
            <p className="text-xs text-[#535353] max-w-sm mx-auto">
              Browse our categories and occasions to add fresh flowers to your cart.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center px-8 h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
            >
              Explore Categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items ("All cards" node 29:747) & Address Selection ("all address" node 230:3283) */}
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
                    {/* Left image box: bg-[#f9ecf0] h-[101px] w-[96px] rounded-[8px] */}
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

                    {/* Right Card details (node 29:658) */}
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

                        {/* Figma - 1 + controls (node 29:655) */}
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

              {/* Figma "Gift info" section (node 81:2904: Switch + Name & Phone floating-label text fields) */}
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
                    {/* Floating-label Outlined Input: Name (node 81:2970) */}
                    <div className="relative border border-[#535353] focus-within:border-[#D21E6A] rounded-[4px] h-[56px] px-4 flex items-center bg-[#F9F9F9]">
                      <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                        Name
                      </label>
                      <input
                        type="text"
                        required={isGift}
                        value={giftRecipientName}
                        onChange={(e) => setGiftRecipientName(e.target.value)}
                        placeholder="Enter the name"
                        className="w-full bg-transparent text-[14px] text-[#0C1015] placeholder-[#A6A6A6] focus:outline-none"
                      />
                    </div>

                    {/* Floating-label Outlined Input: Phone number (node 81:2979) */}
                    <div className="relative border border-[#535353] focus-within:border-[#D21E6A] rounded-[4px] h-[56px] px-4 flex items-center bg-[#F9F9F9]">
                      <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                        Phone number
                      </label>
                      <input
                        type="tel"
                        required={isGift}
                        value={giftRecipientPhone}
                        onChange={(e) => setGiftRecipientPhone(e.target.value)}
                        placeholder="Enter the phone number"
                        className="w-full bg-transparent text-[14px] text-[#0C1015] placeholder-[#A6A6A6] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Figma "Deliver to" / "all address" section (node 30:1012 & 230:3283) */}
              <div className="space-y-4 pt-2">
                <h2 className="text-[18px] font-medium text-[#0C1015]">Deliver to</h2>

                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const selected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] flex items-center justify-between cursor-pointer border border-transparent hover:border-[#D21E6A]/40 transition-all"
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
                  })}

                  {/* Figma "New address" button (node 230:3284) */}
                  <Link
                    to="/profile"
                    className="border border-[#A6A6A6] hover:border-[#D21E6A] rounded-[20px] h-[36px] w-full flex items-center justify-center gap-1.5 text-[#D21E6A] text-[14px] font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add new</span>
                  </Link>
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

            {/* Right Column: Figma "Payment" (node 238:2787), "Total price" (node 30:1215) & "Main Btn" (node 31:1228) */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handlePlaceOrder}
                className="bg-white rounded-[12px] p-6 shadow-[0px_0px_2px_rgba(83,83,83,0.25)] space-y-6 sticky top-24"
              >
                {/* Figma Payment method cards (node 238:2787) */}
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

                {/* Figma Total price breakdown (node 29:960 / 30:1215) */}
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

                {/* Figma Main Btn (node 30:731 Checkout / node 31:1228 Place order: bg-[#d21e6a] h-[50px] rounded-[20px]) */}
                <button
                  type="submit"
                  disabled={placingOrder || !selectedAddressId}
                  className="w-full h-[50px] rounded-[20px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[18px] font-medium flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {placingOrder
                    ? 'Placing order...'
                    : checkoutStep === 'cart'
                    ? 'Checkout'
                    : 'Place order'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
