import React, { useEffect, useState } from 'react';
import {
  Truck,
  Navigation,
  FileCheck2,
  Car,
  RefreshCw,
  Upload,
  Gift,
  Send,
  Phone,
  Flower2,
  ChevronLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type {
  AvailableOrderDto,
  AssignedOrderDto,
  AssignedOrderDetailsDto,
  DriverStatusUpdate,
  OrderStatus,
  VehicleTypeDto,
  VehicleInfoDto,
} from '../../types/api';

export const DriverPortalPage: React.FC = () => {
  const { toast } = useToast();

  const [tab, setTab] = useState<'dispatch' | 'vehicle' | 'apply'>('dispatch');
  const [loading, setLoading] = useState(true);
  const [onlineForDelivery, setOnlineForDelivery] = useState(true);

  // Dispatch & Orders State
  const [availableOrders, setAvailableOrders] = useState<AvailableOrderDto[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<AssignedOrderDto[]>([]);
  const [activeOrder, setActiveOrder] = useState<AssignedOrderDetailsDto | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');

  // Live Location Ping State
  const [gpsLat, setGpsLat] = useState('30.0725');
  const [gpsLng, setGpsLng] = useState('31.3365');
  const [pingingLocation, setPingingLocation] = useState(false);

  // Vehicle Info State
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeDto[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfoDto>({
    vehicleId: '',
    vehicleTypeId: '',
    vehicleTypeName: '',
    plateNumber: '',
    capacity: 20,
    licenseDocument: '',
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  // Driver Application Form State (POST /api/identity/drivers/apply)
  const [appFirstName, setAppFirstName] = useState('');
  const [appLastName, setAppLastName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appGender, setAppGender] = useState('Male');
  const [appPlate, setAppPlate] = useState('');
  const [appVehicleTypeId, setAppVehicleTypeId] = useState('');
  const [appCapacity, setAppCapacity] = useState('20');
  const [appNid, setAppNid] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [appConfirmPassword, setAppConfirmPassword] = useState('');
  const [appLicenseImg, setAppLicenseImg] = useState<File | null>(null);
  const [appNidImg, setAppNidImg] = useState<File | null>(null);
  const [submittingApp, setSubmittingApp] = useState(false);

  const loadDriverDispatch = async () => {
    setLoading(true);
    try {
      const [availRes, currRes, listRes, vtRes] = await Promise.allSettled([
        api.driverGetAvailableOrders(1, 20),
        api.driverGetCurrentAssignedOrder(),
        api.driverGetAssignedOrders(1, 20, statusFilter),
        api.getVehicleTypes(),
      ]);

      if (availRes.status === 'fulfilled' && availRes.value.data) {
        setAvailableOrders(availRes.value.data);
      } else {
        setAvailableOrders([]);
      }

      if (currRes.status === 'fulfilled' && currRes.value.data) {
        setActiveOrder(currRes.value.data);
      } else {
        setActiveOrder(null);
      }

      if (listRes.status === 'fulfilled' && listRes.value.data) {
        setAssignedOrders(listRes.value.data);
      } else {
        setAssignedOrders([]);
      }

      if (vtRes.status === 'fulfilled' && vtRes.value.data) {
        setVehicleTypes(vtRes.value.data);
        if (vtRes.value.data.length > 0) {
          setAppVehicleTypeId((prev) => prev || vtRes.value.data[0].id);
          setVehicleInfo((prev) => ({
            ...prev,
            vehicleTypeId: prev.vehicleTypeId || vtRes.value.data[0].id,
          }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverDispatch();
    api
      .getDriverVehicleInfo()
      .then((res) => {
        if (res.data) setVehicleInfo(res.data);
      })
      .catch(() => {});
  }, [statusFilter]);

  const handleClaimOrder = async (orderId: string) => {
    try {
      await api.driverClaimOrder(orderId);
      toast('Order Accepted!', 'Assigned to you for delivery');
      await loadDriverDispatch();
    } catch (err: any) {
      toast('Claim Failed', err.message, 'error');
    }
  };

  const handleDriverStatusUpdate = async (nextStatus: DriverStatusUpdate) => {
    if (!activeOrder) return;
    try {
      await api.driverUpdateOrderStatus(activeOrder.id, nextStatus, statusNote || undefined);
      setStatusNote('');
      toast('Order Status Updated!', `Transitioned to ${nextStatus.replace(/_/g, ' ')}`);
      await loadDriverDispatch();
    } catch (err: any) {
      toast('Status Update Failed', err.message, 'error');
    }
  };

  const handlePingLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setPingingLocation(true);
    try {
      await api.driverReportLocation(parseFloat(gpsLat), parseFloat(gpsLng));
      toast('Live GPS Broadcast Sent!', `Reported (${gpsLat}, ${gpsLng})`);
    } catch (err: any) {
      toast('Location Broadcast Failed', err.message, 'error');
    } finally {
      setPingingLocation(false);
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('VehicleTypeId', vehicleInfo.vehicleTypeId);
      fd.append('PlateNumber', vehicleInfo.plateNumber);
      if (licenseFile) {
        fd.append('LicenseDocument', licenseFile);
      }
      const res = await api.updateDriverVehicleInfo(fd);
      if (res.data) setVehicleInfo({ ...vehicleInfo, ...res.data });
      toast('Vehicle Info Updated', 'Saved your vehicle details');
    } catch (err: any) {
      toast('Vehicle Update Failed', err.message, 'error');
    }
  };

  const handleApplyDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = appPhone.replace(/^(\+?20)/, '').replace(/[\s-]/g, '');
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      toast(
        'Invalid Mobile Number',
        'Please enter a valid 11-digit Egyptian phone number without +20 (e.g. 01012345678)',
        'error'
      );
      return;
    }

    setSubmittingApp(true);
    try {
      const fd = new FormData();
      fd.append('FirstName', appFirstName);
      fd.append('LastName', appLastName);
      fd.append('Email', appEmail);
      fd.append('Phone', cleanPhone);
      fd.append('Gender', appGender);
      fd.append('VehiclePlateNumber', appPlate);
      fd.append('VehicleTypeId', appVehicleTypeId);
      fd.append('VehicleCapacity', appCapacity);
      fd.append('Nid', appNid);
      fd.append('Password', appPassword);
      fd.append('ConfirmPassword', appConfirmPassword);
      fd.append('FcmToken', 'driver-web-fcm-token');
      if (appLicenseImg) fd.append('LicenceImage', appLicenseImg);
      if (appNidImg) fd.append('NidImage', appNidImg);

      await api.applyAsDriver(fd);
      toast('Driver Application Submitted!', 'Thank you for providing your application');
    } catch (err: any) {
      toast('Application Failed', err.message, 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  // Helper for primary action CTA label matching Figma node 311:6583
  const getNextStageAction = (
    currentStatus?: string
  ): { status: DriverStatusUpdate; label: string } => {
    switch (currentStatus) {
      case 'PLACED':
      case 'PREPARING':
        return { status: 'PICKED_UP', label: 'Arrived at Pickup point' };
      case 'PICKED_UP':
        return { status: 'OUT_FOR_DELIVERY', label: 'Start deliver' };
      case 'OUT_FOR_DELIVERY':
        return { status: 'ARRIVED', label: 'Arrived at user' };
      default:
        return { status: 'AWAITING_DELIVERY_CONFIRMATION', label: 'Delivered' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#F9F9F9] min-h-screen">
      {/* Top Bar matching Figma Tracking app Home (311:1256) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <img src="/figma/logo-flower.svg" alt="Flowery" className="w-5 h-5" />
            <span className="font-flowery text-[22px] text-[#D21E6A] leading-none">
              Flowery
            </span>
          </div>
          <div className="h-5 w-[1px] bg-[#CFCFCF]" />
          {/* Ready for delivery switch matching Figma node 311:1458 */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={onlineForDelivery}
              onClick={() => setOnlineForDelivery(!onlineForDelivery)}
              className={`w-[42px] h-[24px] rounded-full transition-colors p-0.5 flex items-center ${
                onlineForDelivery ? 'bg-[#D21E6A] justify-end' : 'bg-[#A6A6A6] justify-start'
              }`}
            >
              <span className="w-[20px] h-[20px] rounded-full bg-[#F9F9F9] shadow" />
            </button>
            <span className="text-[16px] font-medium text-[#0C1015]">Ready for delivery</span>
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'dispatch', label: 'Home / Orders', icon: Truck },
            { id: 'vehicle', label: 'Vehicle Info', icon: Car },
            { id: 'apply', label: 'Apply as Driver', icon: FileCheck2 },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as any)}
                className={`flex items-center gap-2 px-4 h-[36px] rounded-[100px] text-[13px] font-medium transition-all ${
                  active
                    ? 'bg-[#D21E6A] text-[#F9F9F9]'
                    : 'bg-[#F9ECF0] text-[#0C1015] hover:bg-[#D21E6A]/15'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={loadDriverDispatch}
            disabled={loading}
            className="w-[36px] h-[36px] rounded-full bg-[#F9ECF0] text-[#D21E6A] flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TAB 1: DISPATCH (Figma frames 311:1256 "Home" & 311:6528 "Order details 1") */}
      {tab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 6 COLS: Figma Driver "Home" (311:1256) — Available Order Cards */}
          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-[18px] font-medium text-[#0C1015]">
              Available Orders ({availableOrders.length})
            </h2>

            {availableOrders.length === 0 ? (
              <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-8 text-center text-[14px] text-[#535353]">
                No available flower orders waiting for pickup right now.
              </div>
            ) : (
              availableOrders.map((avail) => (
                /* Order card matching Figma node 311:1259 */
                <div
                  key={avail.orderId}
                  className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-[#0C1015]">Flower order</span>
                    <span className="text-[12px] font-medium text-[#D21E6A]">
                      {avail.status}
                    </span>
                  </div>

                  {/* Pickup address sub-card with circular #D21E6A Flowery store icon matching Figma node 311:1264 */}
                  <div className="space-y-1">
                    <span className="text-[12px] text-[#535353]">Pickup address</span>
                    <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[12px] flex items-center gap-3">
                      <div className="w-[44px] h-[44px] rounded-full bg-[#D21E6A] flex flex-col items-center justify-center shrink-0">
                        <img
                          src="/figma/logo-flower-white.svg"
                          alt=""
                          className="w-4 h-4"
                        />
                        <span className="font-flowery text-[8px] text-[#F9F9F9] leading-none mt-0.5">
                          Flowery
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-normal text-[#535353] truncate">
                          {avail.storeName || 'Flowery store'}
                        </p>
                        <div className="flex items-center gap-1 text-[13px] text-[#0C1015] mt-0.5">
                          <img src="/figma/location-pin.svg" alt="" className="w-4 h-4 shrink-0" />
                          <span className="truncate">Flowery Regional Hub, Cairo</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User address sub-card matching Figma node 311:1286 */}
                  <div className="space-y-1">
                    <span className="text-[12px] text-[#535353]">User address</span>
                    <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[12px] flex items-center gap-3">
                      <div className="w-[44px] h-[44px] rounded-full bg-[#F9ECF0] text-[#D21E6A] font-semibold text-[15px] flex items-center justify-center shrink-0">
                        {(avail.customerName || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-normal text-[#535353] truncate">
                          {avail.customerName}
                        </p>
                        <div className="flex items-center gap-1 text-[13px] text-[#0C1015] mt-0.5">
                          <img src="/figma/location-pin.svg" alt="" className="w-4 h-4 shrink-0" />
                          <span className="truncate">{avail.customerAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Price + Reject/Accept Buttons matching Figma node 311:1303 */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[14px] font-semibold text-[#0C1015]">
                      EGP {avail.totalAmount}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleClaimOrder(avail.orderId)}
                        className="px-6 h-[36px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[14px] font-medium transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Assigned Orders History */}
            <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-medium text-[#0C1015]">My Assigned Orders</h3>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-[32px] px-2.5 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[12px] text-[#0C1015]"
                >
                  <option value="">All Statuses</option>
                  <option value="PICKED_UP">PICKED_UP</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="ARRIVED">ARRIVED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              {assignedOrders.length === 0 ? (
                <p className="text-[13px] text-[#535353] py-4 text-center">
                  No assigned orders found.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {assignedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-[8px] border-[0.5px] border-[#535353] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-[#0C1015]">
                          {ord.orderNumber}
                        </p>
                        <p className="text-[12px] text-[#535353]">
                          {ord.destination?.recipientName} • {ord.destination?.area}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[12px] font-medium text-[#0CB359]">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[13px] font-semibold text-[#0C1015]">
                          EGP {ord.total}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 6 COLS: Figma "Order details 1" (311:6528) + GPS Transmitter */}
          <div className="lg:col-span-6 space-y-5">
            {activeOrder ? (
              <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-5 sm:p-6 space-y-5">
                {/* Header "Order details" */}
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5 text-[#0C1015]" />
                  <h2 className="text-[20px] font-medium text-[#0C1015]">Order details</h2>
                </div>

                {/* Progress Step Bars matching Figma node 311:6585 */}
                <div className="grid grid-cols-5 gap-2">
                  {[0, 1, 2, 3, 4].map((stepIdx) => {
                    const activeSteps =
                      activeOrder.status === 'PICKED_UP'
                        ? 2
                        : activeOrder.status === 'OUT_FOR_DELIVERY'
                        ? 3
                        : activeOrder.status === 'ARRIVED'
                        ? 4
                        : activeOrder.status === 'AWAITING_DELIVERY_CONFIRMATION' ||
                          activeOrder.status === 'DELIVERED'
                        ? 5
                        : 1;
                    return (
                      <div
                        key={stepIdx}
                        className={`h-[4px] rounded-[30px] ${
                          stepIdx < activeSteps ? 'bg-[#0CB359]' : 'bg-[#CFCFCF]'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* #F9ECF0 Banner matching Figma node 311:6536 */}
                <div className="bg-[#F9ECF0] rounded-[10px] p-[16px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] font-medium text-[#0CB359]">
                      Status : {activeOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[16px] font-semibold text-[#0C1015]">
                    Order ID : # {activeOrder.orderNumber}
                  </p>
                  <p className="text-[14px] text-[#535353]">
                    {new Date().toLocaleString()}
                  </p>
                </div>

                {/* Pickup address matching Figma node 311:6545 */}
                <div className="space-y-1.5">
                  <h3 className="text-[16px] font-medium text-[#0C1015]">Pickup address</h3>
                  <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[14px] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-[44px] h-[44px] rounded-full bg-[#D21E6A] flex flex-col items-center justify-center shrink-0">
                        <img src="/figma/logo-flower-white.svg" alt="" className="w-4 h-4" />
                        <span className="font-flowery text-[8px] text-[#F9F9F9] leading-none mt-0.5">
                          Flowery
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] text-[#535353] truncate">
                          {activeOrder.pickup.name}
                        </p>
                        <div className="flex items-center gap-1 text-[13px] text-[#0C1015] mt-0.5">
                          <img src="/figma/location-pin.svg" alt="" className="w-4 h-4 shrink-0" />
                          <span className="truncate">{activeOrder.pickup.addressLine}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${activeOrder.pickup.phoneNumber}`}
                        className="w-8 h-8 rounded-full bg-[#F9ECF0] flex items-center justify-center text-[#D21E6A]"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/${(activeOrder.pickup.phoneNumber || '').replace(
                          /\D/g,
                          ''
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#F9ECF0] flex items-center justify-center"
                      >
                        <img src="/figma/whatsapp.svg" alt="WhatsApp" className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* User address matching Figma node 311:6547 */}
                <div className="space-y-1.5">
                  <h3 className="text-[16px] font-medium text-[#0C1015]">User address</h3>
                  <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[14px] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-[44px] h-[44px] rounded-full bg-[#F9ECF0] text-[#D21E6A] font-semibold flex items-center justify-center shrink-0">
                        {(activeOrder.destination?.recipientName || activeOrder.user.name || 'U')
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] text-[#535353] truncate">
                          {activeOrder.destination?.recipientName || activeOrder.user.name}
                        </p>
                        <div className="flex items-center gap-1 text-[13px] text-[#0C1015] mt-0.5">
                          <img src="/figma/location-pin.svg" alt="" className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {activeOrder.destination?.addressLine || activeOrder.user.addressLine}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${
                          activeOrder.destination?.recipientPhone || activeOrder.user.phone
                        }`}
                        className="w-8 h-8 rounded-full bg-[#F9ECF0] flex items-center justify-center text-[#D21E6A]"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/${(
                          activeOrder.destination?.recipientPhone ||
                          activeOrder.user.phone ||
                          ''
                        ).replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-[#F9ECF0] flex items-center justify-center"
                      >
                        <img src="/figma/whatsapp.svg" alt="WhatsApp" className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>

                {activeOrder.isGift && (
                  <div className="p-3 rounded-[8px] bg-[#F9ECF0] flex items-center gap-2 text-[13px] text-[#D21E6A]">
                    <Gift className="w-4 h-4 shrink-0" />
                    <span>
                      Surprise Gift Order — Deliver directly to{' '}
                      {activeOrder.destination?.recipientName}
                    </span>
                  </div>
                )}

                {/* Order details items matching Figma node 311:6549 */}
                {activeOrder.items && activeOrder.items.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[16px] font-medium text-[#0C1015]">Order details</h3>
                    {activeOrder.items.map((item, i) => (
                      <div
                        key={i}
                        className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-[46px] h-[46px] rounded-full bg-[#F9ECF0] overflow-hidden flex items-center justify-center shrink-0">
                            {item.productImageUrl ? (
                              <img
                                src={item.productImageUrl}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Flower2 className="w-5 h-5 text-[#D21E6A]" />
                            )}
                          </div>
                          <div>
                            <p className="text-[13px] text-[#535353]">{item.productName}</p>
                            <p className="text-[13px] font-medium text-[#0C1015]">
                              EGP {item.unitPrice}
                            </p>
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold text-[#D21E6A]">
                          X{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total & Payment method cards matching Figma nodes 311:6575 & 311:6579 */}
                <div className="space-y-2.5">
                  <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-4 flex items-center justify-between">
                    <span className="text-[14px] font-medium text-[#0C1015]">Total</span>
                    <span className="text-[14px] font-medium text-[#535353]">
                      EGP {activeOrder.total}
                    </span>
                  </div>
                  <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-4 flex items-center justify-between">
                    <span className="text-[14px] font-medium text-[#0C1015]">Payment method</span>
                    <span className="text-[14px] font-medium text-[#535353]">
                      {activeOrder.paymentMethod || 'Cash on delivery'}
                    </span>
                  </div>
                </div>

                {/* Stage Progression Controls */}
                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Add optional delivery note..."
                    className="w-full h-[44px] px-3.5 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px] text-[#0C1015]"
                  />

                  {/* Primary Full-Width Pink Action Button matching Figma node 311:6583 */}
                  <button
                    type="button"
                    onClick={() =>
                      handleDriverStatusUpdate(getNextStageAction(activeOrder.status).status)
                    }
                    className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
                  >
                    {getNextStageAction(activeOrder.status).label}
                  </button>

                  {/* Quick Stage Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { status: 'PICKED_UP', label: 'Picked Up' },
                        { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
                        { status: 'ARRIVED', label: 'Arrived' },
                        { status: 'AWAITING_DELIVERY_CONFIRMATION', label: 'Delivered' },
                      ] as { status: DriverStatusUpdate; label: string }[]
                    ).map((btn) => (
                      <button
                        key={btn.status}
                        type="button"
                        onClick={() => handleDriverStatusUpdate(btn.status)}
                        className={`h-[32px] px-2 rounded-[100px] text-[11px] font-medium transition-colors ${
                          activeOrder.status === btn.status
                            ? 'bg-[#0CB359] text-[#F9F9F9]'
                            : 'bg-[#F9ECF0] text-[#0C1015] hover:bg-[#D21E6A] hover:text-[#F9F9F9]'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-8 text-center space-y-2">
                <p className="text-[16px] font-medium text-[#0C1015]">
                  No Active Order Selected
                </p>
                <p className="text-[13px] text-[#535353]">
                  Accept an order from the left list to start delivery and view order details.
                </p>
              </div>
            )}

            {/* Live GPS Location Broadcaster */}
            <form
              onSubmit={handlePingLocation}
              className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#F9ECF0] text-[#D21E6A] flex items-center justify-center">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-[#0C1015]">
                    Live GPS Location Transmitter
                  </h3>
                  <p className="text-[12px] text-[#535353]">
                    Broadcast real-time courier coordinates to customer map
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[11px] text-[#535353]">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={gpsLat}
                    onChange={(e) => setGpsLat(e.target.value)}
                    className="w-full h-[48px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px] text-[#0C1015]"
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[11px] text-[#535353]">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={gpsLng}
                    onChange={(e) => setGpsLng(e.target.value)}
                    className="w-full h-[48px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px] text-[#0C1015]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pingingLocation}
                className="w-full h-[44px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[14px] font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{pingingLocation ? 'Sending GPS...' : 'Update Live Location'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVER VEHICLE INFO */}
      {tab === 'vehicle' && (
        <div className="max-w-xl mx-auto bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('dispatch')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#0C1015] hover:bg-[#F9ECF0]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-[20px] font-medium text-[#0C1015]">Edit vehicle info</h2>
          </div>

          <form onSubmit={handleUpdateVehicle} className="space-y-5">
            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Vehicle type
              </label>
              <select
                value={vehicleInfo.vehicleTypeId}
                onChange={(e) =>
                  setVehicleInfo({ ...vehicleInfo, vehicleTypeId: e.target.value })
                }
                className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
              >
                {vehicleTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Vehicle number
              </label>
              <input
                type="text"
                required
                value={vehicleInfo.plateNumber}
                onChange={(e) =>
                  setVehicleInfo({ ...vehicleInfo, plateNumber: e.target.value })
                }
                className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
              />
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Vehicle license
              </label>
              <label className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] flex items-center justify-between cursor-pointer">
                <span className="text-[14px] text-[#A6A6A6] truncate">
                  {licenseFile ? licenseFile.name : 'Upload license photo'}
                </span>
                <Upload className="w-5 h-5 text-[#535353]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
            >
              Update
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: APPLY AS DRIVER matching Figma node 204:2971 */}
      {tab === 'apply' && (
        <div className="max-w-xl mx-auto bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('dispatch')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#0C1015] hover:bg-[#F9ECF0]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-[20px] font-medium text-[#0C1015]">Apply</h2>
            </div>
            <p className="text-[16px] font-medium text-[#0C1015] pt-1">Welcome!!</p>
            <p className="text-[12px] text-[#535353]">
              You want to be a delivery man? Join our team
            </p>
          </div>

          <form onSubmit={handleApplyDriver} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  First legal name
                </label>
                <input
                  type="text"
                  required
                  value={appFirstName}
                  onChange={(e) => setAppFirstName(e.target.value)}
                  placeholder="Enter first legal name"
                  className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Second legal name
                </label>
                <input
                  type="text"
                  required
                  value={appLastName}
                  onChange={(e) => setAppLastName(e.target.value)}
                  placeholder="Enter second legal name"
                  className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Vehicle type
                </label>
                <select
                  value={appVehicleTypeId}
                  onChange={(e) => setAppVehicleTypeId(e.target.value)}
                  className="w-full h-[56px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                >
                  {vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Vehicle number
                </label>
                <input
                  type="text"
                  required
                  value={appPlate}
                  onChange={(e) => setAppPlate(e.target.value)}
                  placeholder="Enter vehicle number"
                  className="w-full h-[56px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Capacity
                </label>
                <input
                  type="number"
                  required
                  value={appCapacity}
                  onChange={(e) => setAppCapacity(e.target.value)}
                  className="w-full h-[56px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                />
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Vehicle license
              </label>
              <label className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] flex items-center justify-between cursor-pointer">
                <span className="text-[14px] text-[#A6A6A6] truncate">
                  {appLicenseImg ? appLicenseImg.name : 'Upload license photo'}
                </span>
                <Upload className="w-5 h-5 text-[#535353]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAppLicenseImg(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={appEmail}
                  onChange={(e) => setAppEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Phone number
                </label>
                <input
                  type="tel"
                  required
                  value={appPhone}
                  onChange={(e) => setAppPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                />
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                ID number
              </label>
              <input
                type="text"
                required
                value={appNid}
                onChange={(e) => setAppNid(e.target.value)}
                placeholder="Enter national ID number"
                className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
              />
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                ID image
              </label>
              <label className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] flex items-center justify-between cursor-pointer">
                <span className="text-[14px] text-[#A6A6A6] truncate">
                  {appNidImg ? appNidImg.name : 'Upload ID image'}
                </span>
                <Upload className="w-5 h-5 text-[#535353]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAppNidImg(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={appConfirmPassword}
                  onChange={(e) => setAppConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                />
              </div>
            </div>

            {/* Gender radio buttons matching Figma node 204:2978 */}
            <div className="flex items-center gap-8">
              <span className="text-[18px] font-medium text-[#535353]">Gender</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="drv-gender"
                    checked={appGender === 'Female'}
                    onChange={() => setAppGender('Female')}
                    className="accent-[#D21E6A] w-4 h-4"
                  />
                  <span className="text-[16px] text-[#0C1015]">Female</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="drv-gender"
                    checked={appGender === 'Male'}
                    onChange={() => setAppGender('Male')}
                    className="accent-[#D21E6A] w-4 h-4"
                  />
                  <span className="text-[16px] text-[#0C1015]">Male</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingApp}
              className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
            >
              {submittingApp ? 'Submitting...' : 'Continue'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
