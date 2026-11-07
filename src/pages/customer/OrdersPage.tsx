import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Check,
  Phone,
  CreditCard,
  CheckCircle2,
  Flower2,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type {
  OrderSummaryDto,
  OrderDetailsDto,
  OrderTrackingDto,
} from '../../types/api';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [orderTab, setOrderTab] = useState<'active' | 'completed'>('active');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [orderDetails, setOrderDetails] = useState<OrderDetailsDto | null>(null);
  const [tracking, setTracking] = useState<OrderTrackingDto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      const res = await api.getMyOrders(1, 20);
      const list = res.data || [];
      setOrders(list);
      if (list.length > 0 && !selectedOrderId) {
        setSelectedOrderId(list[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders from /api/orders/');
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedOrderId) return;
    let mounted = true;
    const loadSelectedOrder = async () => {
      try {
        const [detailRes, trackRes] = await Promise.allSettled([
          api.getOrderDetails(selectedOrderId),
          api.getOrderTracking(selectedOrderId),
        ]);

        if (!mounted) return;

        if (detailRes.status === 'fulfilled' && detailRes.value.data) {
          setOrderDetails(detailRes.value.data);
        } else {
          setOrderDetails(null);
        }

        if (trackRes.status === 'fulfilled' && trackRes.value.data) {
          setTracking(trackRes.value.data);
        } else {
          setTracking(null);
        }
      } catch {
        // Handled per promise
      }
    };

    loadSelectedOrder();
    return () => {
      mounted = false;
    };
  }, [selectedOrderId]);

  const handleConfirmDelivery = async (orderId: string) => {
    setActionLoading(true);
    try {
      await api.confirmOrderDelivery(orderId);
      toast('Delivery Confirmed!', 'Thank you for confirming receipt of your bouquet');
      loadOrders();
      setSelectedOrderId(orderId);
    } catch (err: any) {
      toast('Could not confirm delivery', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryPayment = async (orderId: string) => {
    setActionLoading(true);
    try {
      const res = await api.retryOrderPayment(orderId);
      if (res.data?.sessionUrl) {
        window.open(res.data.sessionUrl, '_blank');
      }
      toast('Payment Retry Initiated', 'New Stripe checkout session created');
    } catch (err: any) {
      toast('Retry Payment Failed', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const isCompleted = ord.status === 'DELIVERED' || ord.status === 'CANCELLED';
    return orderTab === 'completed' ? isCompleted : !isCompleted;
  });

  // Progress bar percentage based on order status
  const getProgressPercent = (status?: string) => {
    switch (status) {
      case 'PLACED':
        return 25;
      case 'PREPARING':
        return 45;
      case 'PICKED_UP':
        return 65;
      case 'OUT_FOR_DELIVERY':
        return 80;
      case 'ARRIVED':
      case 'AWAITING_DELIVERY_CONFIRMATION':
        return 92;
      case 'DELIVERED':
        return 100;
      default:
        return 30;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#F9F9F9] min-h-screen">
      {/* Top Bar matching Figma node 83:3655 ("My orders") */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#0C1015] hover:bg-[#F9ECF0] transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[20px] font-medium text-[#0C1015]">My orders</h1>
      </div>

      {!isAuthenticated && !selectedOrderId ? (
        <div className="bg-[#F9F9F9] rounded-[10px] p-10 text-center border border-[#A6A6A6]/60 max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F9ECF0] flex items-center justify-center mx-auto">
            <img src="/figma/transaction-order.svg" alt="" className="w-7 h-7" />
          </div>
          <h2 className="text-[18px] font-medium text-[#0C1015]">
            Login to view your orders
          </h2>
          <p className="text-[13px] text-[#535353]">
            Sign in to view your active and completed flower deliveries.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
          >
            Login
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-[#F8D8D8] border border-[#CC1010]/30 rounded-[8px] p-3.5 flex items-center gap-3 text-[13px] text-[#CC1010]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Figma "Orders" frame (83:3655) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Active / Completed Tabs matching Figma node 83:3864 */}
              <div className="grid grid-cols-2">
                {(['active', 'completed'] as const).map((tabKey) => {
                  const isActive = orderTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setOrderTab(tabKey)}
                      className="flex flex-col items-center justify-end h-[42px] relative"
                    >
                      <span
                        className={`text-[16px] pb-2.5 capitalize transition-colors ${
                          isActive ? 'text-[#D21E6A] font-medium' : 'text-[#A6A6A6] font-normal'
                        }`}
                      >
                        {tabKey}
                      </span>
                      <span
                        className={`w-full h-[3px] rounded-t-[100px] transition-colors ${
                          isActive ? 'bg-[#D21E6A]' : 'bg-[#A6A6A6]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Orders Card List matching Figma node 83:3752 */}
              {filteredOrders.length === 0 ? (
                <div className="border-[0.5px] border-[#535353] rounded-[8px] p-8 text-center text-[14px] text-[#535353]">
                  No {orderTab} orders found.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((ord) => {
                    const isSelected = selectedOrderId === ord.id;
                    return (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrderId(ord.id)}
                        className={`border-[0.5px] rounded-[8px] p-[8px] flex gap-[16px] items-center cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#D21E6A] bg-[#F9ECF0]/30 shadow-sm'
                            : 'border-[#535353] bg-[#F9F9F9] hover:border-[#D21E6A]'
                        }`}
                      >
                        {/* Left #F9ECF0 Image Box (w-[127px] h-[109px]) */}
                        <div className="w-[127px] h-[109px] rounded-[4px] bg-[#F9ECF0] shrink-0 overflow-hidden flex items-center justify-center">
                          {ord.firstItemThumbnailUrl ? (
                            <img
                              src={ord.firstItemThumbnailUrl}
                              alt={ord.orderNumber}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Flower2 className="w-10 h-10 text-[#D21E6A]/40" />
                          )}
                        </div>

                        {/* Right Details matching Figma node 83:3757 */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 gap-2">
                          <div className="space-y-0.5">
                            <p className="text-[12px] font-normal text-[#0C1015] truncate">
                              {ord.orderNumber} ({ord.itemCount}{' '}
                              {ord.itemCount === 1 ? 'item' : 'items'})
                            </p>
                            <p className="text-[14px] font-medium text-[#0C1015]">
                              EGP {ord.total.toFixed(0)}
                            </p>
                            <p className="text-[12px] font-normal text-[#535353] truncate">
                              {ord.status === 'DELIVERED'
                                ? `Delivered on ${new Date(ord.createdAt).toLocaleDateString()}`
                                : `Order number# ${ord.orderNumber}`}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(ord.id);
                            }}
                            className="w-full h-[30px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[13px] font-medium flex items-center justify-center transition-colors"
                          >
                            {ord.status === 'DELIVERED' ? 'Reorder' : 'Track order'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Figma "Track order" frame (229:2402) */}
            <div className="lg:col-span-7">
              {!tracking && !orderDetails ? (
                <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-10 text-center text-[14px] text-[#535353]">
                  Select an order on the left to view live order tracking and details.
                </div>
              ) : (
                <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-5 sm:p-6 space-y-5">
                  {/* Top Stepper ("1 Address — 2 Payment — 3 Track order") matching Figma node 30:1158 */}
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-[24px] h-[24px] rounded-full bg-[#0CB359] text-[#F9F9F9] text-[12px] font-semibold flex items-center justify-center">
                        1
                      </span>
                      <span className="text-[13px] font-medium text-[#0CB359]">Address</span>
                    </div>
                    <div className="flex-1 h-[1px] bg-[#0CB359]" />
                    <div className="flex items-center gap-1.5">
                      <span className="w-[24px] h-[24px] rounded-full bg-[#0CB359] text-[#F9F9F9] text-[12px] font-semibold flex items-center justify-center">
                        2
                      </span>
                      <span className="text-[13px] font-medium text-[#0CB359]">Payment</span>
                    </div>
                    <div className="flex-1 h-[1px] bg-[#D21E6A]" />
                    <div className="flex items-center gap-1.5">
                      <span className="w-[24px] h-[24px] rounded-full bg-[#D21E6A] text-[#F9F9F9] text-[12px] font-semibold flex items-center justify-center">
                        3
                      </span>
                      <span className="text-[13px] font-medium text-[#D21E6A]">Track order</span>
                    </div>
                  </div>

                  {/* Green check circle + "Your order placed successfully!" matching Figma node 229:2405 */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-[32px] h-[32px] rounded-full bg-[#2F9033] flex items-center justify-center text-[#F9F9F9] shrink-0">
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h2 className="text-[16px] font-semibold text-[#0C1015]">
                          Your order placed successfully!
                        </h2>
                        <p className="text-[12px] text-[#535353]">
                          Order {tracking?.orderNumber || orderDetails?.orderNumber} •{' '}
                          <span className="text-[#D21E6A] font-medium">
                            {(tracking?.status || orderDetails?.status || 'PLACED').replace(
                              /_/g,
                              ' '
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {orderDetails?.paymentStatus !== 'PAID' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRetryPayment((tracking?.orderId || orderDetails?.id)!)
                          }
                          disabled={actionLoading}
                          className="px-3.5 h-[32px] rounded-[100px] border border-[#D21E6A] text-[#D21E6A] text-[12px] font-medium flex items-center gap-1.5 hover:bg-[#F9ECF0] transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Retry Payment</span>
                        </button>
                      )}

                      {(tracking?.status || orderDetails?.status) !== 'DELIVERED' &&
                        (tracking?.status || orderDetails?.status) !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleConfirmDelivery((tracking?.orderId || orderDetails?.id)!)
                            }
                            disabled={actionLoading}
                            className="px-4 h-[32px] rounded-[100px] bg-[#0CB359] hover:bg-[#2F9033] text-[#F9F9F9] text-[12px] font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Delivery</span>
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Progress Bar matching Figma node 229:2410 */}
                  <div className="space-y-2">
                    <div className="w-full h-[5px] bg-[#CFCFCF] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0CB359] rounded-full transition-all duration-500"
                        style={{
                          width: `${getProgressPercent(
                            tracking?.status || orderDetails?.status
                          )}%`,
                        }}
                      />
                    </div>

                    {/* Timeline pills */}
                    {tracking?.timeline && tracking.timeline.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tracking.timeline.map((stage, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-[100px] text-[11px] font-medium ${
                              stage.isCurrent
                                ? 'bg-[#D21E6A] text-[#F9F9F9]'
                                : stage.isCompleted
                                ? 'bg-[#0CB359]/15 text-[#2F9033]'
                                : 'bg-[#CFCFCF]/40 text-[#535353]'
                            }`}
                          >
                            {stage.status.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Courier Card with Call & WhatsApp icons */}
                  {tracking?.driver && (
                    <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] flex items-center justify-between">
                      <div>
                        <p className="text-[12px] text-[#535353]">Delivery hero</p>
                        <p className="text-[14px] font-medium text-[#0C1015]">
                          {tracking.driver.name || 'Flowery Courier'}
                        </p>
                        {tracking.driver.phone && (
                          <p className="text-[12px] text-[#535353]">{tracking.driver.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        {tracking.driver.phone && (
                          <>
                            <a
                              href={`tel:${tracking.driver.phone}`}
                              className="w-8 h-8 rounded-full bg-[#F9ECF0] flex items-center justify-center text-[#D21E6A]"
                              title="Call Courier"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                            <a
                              href={`https://wa.me/${tracking.driver.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-8 h-8 rounded-full bg-[#F9ECF0] flex items-center justify-center"
                              title="WhatsApp Courier"
                            >
                              <img src="/figma/whatsapp.svg" alt="WhatsApp" className="w-5 h-5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Address & Payment Cards matching Figma nodes 229:2412 & 229:2418 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] space-y-1.5">
                      <p className="text-[16px] font-medium text-[#0C1015]">
                        {tracking?.destination?.recipientName ||
                          orderDetails?.deliveryAddress?.recipientName ||
                          'Delivery Address'}
                      </p>
                      <div className="flex items-start gap-1.5 text-[13px] text-[#535353]">
                        <img
                          src="/figma/location-pin.svg"
                          alt=""
                          className="w-4 h-4 mt-0.5 shrink-0"
                        />
                        <span>
                          {tracking?.destination?.addressLine ||
                            orderDetails?.deliveryAddress?.addressLine ||
                            'Cairo, Egypt'}
                        </span>
                      </div>
                      {tracking?.lastKnownLocation && (
                        <p className="text-[11px] text-[#0CB359] flex items-center gap-1 pt-1">
                          <MapPin className="w-3 h-3" />
                          Live GPS: {tracking.lastKnownLocation.lat.toFixed(4)},{' '}
                          {tracking.lastKnownLocation.lng.toFixed(4)}
                        </p>
                      )}
                    </div>

                    <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] flex flex-col justify-between gap-2">
                      <p className="text-[16px] font-medium text-[#0C1015]">
                        EGY {(orderDetails?.total || 0).toFixed(0)}
                      </p>
                      <p className="text-[13px] text-[#535353]">
                        {orderDetails?.paymentMethod === 'COD'
                          ? 'Pay with cash'
                          : `${orderDetails?.paymentMethod || 'Card'} (${
                              orderDetails?.paymentStatus || 'PENDING'
                            })`}
                      </p>
                    </div>
                  </div>

                  {/* Items Card matching Figma node 229:2423 */}
                  {orderDetails && (
                    <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] space-y-3">
                      <p className="text-[16px] font-medium text-[#0C1015]">
                        {orderDetails.items.length}{' '}
                        {orderDetails.items.length === 1 ? 'Item' : 'Items'}
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {orderDetails.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 border-[0.5px] border-[#A6A6A6] rounded-[8px] p-2 min-w-[210px] bg-[#F9F9F9]"
                          >
                            <div className="w-[56px] h-[56px] rounded-[6px] bg-[#F9ECF0] overflow-hidden shrink-0 flex items-center justify-center">
                              {item.productImageUrl ? (
                                <img
                                  src={item.productImageUrl}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Flower2 className="w-6 h-6 text-[#D21E6A]/40" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[#0C1015] truncate">
                                {item.productName}
                              </p>
                              <p className="text-[12px] text-[#535353]">
                                Qty: {item.quantity} × EGP {item.unitPrice.toFixed(0)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial Summary matching Figma node 229:2432 */}
                  {orderDetails && (
                    <div className="pt-2 space-y-2.5 border-t border-[#7D7D7D]/30">
                      <div className="flex items-center justify-between text-[16px] text-[#535353]">
                        <span>Sub Total</span>
                        <span>EGP {orderDetails.subtotal.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[16px] text-[#535353]">
                        <span>Delivery Fee</span>
                        <span>EGP {orderDetails.deliveryFee.toFixed(0)}</span>
                      </div>
                      <div className="h-[1px] bg-[#7D7D7D]/30" />
                      <div className="flex items-center justify-between text-[18px] font-medium text-[#0C1015]">
                        <span>Total</span>
                        <span>EGP {orderDetails.total.toFixed(0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
