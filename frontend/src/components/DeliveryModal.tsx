import React, { useState } from 'react';
import {
  MapPin,
  X,
  Check,
  Plus,
  Home,
  Briefcase,
  Phone,
  User,
  Sparkles,
  Loader2,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import type { AddressDto } from '../types/api';

export const DeliveryModal: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isCustomer,
    selectedStoreId,
    selectedAddress,
    userAddresses,
    refreshAddresses,
    selectAddress,
    isAddressModalOpen,
    closeAddressModal,
    setSession,
  } = useAuth();
  const { toast } = useToast();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [loggingInDemo, setLoggingInDemo] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // New address form fields
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [recipientPhone, setRecipientPhone] = useState(
    user?.phone?.replace(/^(\+?20)/, '') || '01012345678'
  );
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('Sheikh Zayed');
  const [governorateId, setGovernorateId] = useState(1); // 1 = Cairo / Giza
  const [cityId, setCityId] = useState(1);
  const [label, setLabel] = useState('Home');

  if (!isAddressModalOpen) return null;

  const handleSelect = async (addr: AddressDto | null) => {
    if (addr) {
      setResolvingId(addr.id);
    }
    try {
      await selectAddress(addr);
      if (addr) {
        toast('Delivery Address Selected', `Delivering to ${addr.addressLine} (${addr.area || addr.cityName})`);
      } else {
        toast('Default Location', 'Browsing flowers available across Cairo');
      }
      closeAddressModal();
    } catch (err: any) {
      toast('Location Error', err.message || 'Could not select address', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = recipientPhone.replace(/^(\+?20)/, '').replace(/[\s-]/g, '');
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      toast(
        'Invalid Mobile',
        'Please enter a valid 11-digit Egyptian phone number without +20 (e.g. 01012345678)',
        'error'
      );
      return;
    }
    if (!addressLine.trim()) {
      toast('Address Required', 'Please enter your street address and building number', 'error');
      return;
    }

    setSavingAddress(true);
    try {
      const res = await api.createAddress({
        recipientName: recipientName.trim() || user?.name || 'Customer',
        recipientPhone: cleanPhone,
        addressLine: addressLine.trim(),
        governorateId: Number(governorateId) || 1,
        cityId: Number(cityId) || 1,
        area: area.trim() || 'Sheikh Zayed',
        lat: 30.0561,
        lng: 31.3452,
        label: label || 'Home',
      });

      if (res.data) {
        const newAddr = res.data;
        await refreshAddresses();
        await selectAddress(newAddr);
        toast('Address Saved', `Delivering to ${newAddr.addressLine}`);
        setIsAddingNew(false);
        setAddressLine('');
        closeAddressModal();
      }
    } catch (err: any) {
      toast('Could not save address', err.message || 'Server error', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDemoCustomerLogin = async () => {
    setLoggingInDemo(true);
    try {
      const res = await api.login('customer@flora.com', 'Password123!');
      if (res.data?.user && res.data?.token) {
        setSession(res.data.user, res.data.token, res.data.refreshToken);
        toast('Logged In', 'Demo Customer signed in successfully');
        await refreshAddresses();
      }
    } catch (err: any) {
      toast('Login Failed', err.message || 'Could not log in as demo customer', 'error');
    } finally {
      setLoggingInDemo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0C1015]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#F9F9F9] rounded-[20px] max-w-lg w-full p-6 shadow-2xl border border-[#CFCFCF] space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F9ECF0] text-[#D21E6A] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0C1015]">Delivery Location</h3>
              <p className="text-xs text-[#535353]">Select where you want your flowers delivered</p>
            </div>
          </div>
          <button
            onClick={closeAddressModal}
            className="p-1.5 rounded-lg text-[#535353] hover:text-[#0C1015] hover:bg-[#E5E5E5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address List View */}
        {!isAddingNew ? (
          <div className="space-y-4">
            {/* General Cairo Option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center justify-between p-4 rounded-[12px] bg-white shadow-[0px_0px_2px_rgba(83,83,83,0.25)] text-left transition-all border ${
                !selectedAddress && !selectedStoreId
                  ? 'border-[#D21E6A] ring-1 ring-[#D21E6A]'
                  : 'border-transparent hover:border-[#D21E6A]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border border-[#D21E6A] flex items-center justify-center shrink-0">
                  {!selectedAddress && !selectedStoreId && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D21E6A]" />
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-[#D21E6A]" />
                    <p className="text-sm font-semibold text-[#0C1015]">Cairo & Giza (All Stores)</p>
                  </div>
                  <p className="text-xs text-[#535353] mt-0.5">Explore full catalog from all partner florists</p>
                </div>
              </div>
              {!selectedAddress && !selectedStoreId && (
                <Check className="w-4 h-4 text-[#D21E6A] shrink-0" />
              )}
            </button>

            {/* Saved User Addresses */}
            {userAddresses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#535353] uppercase tracking-wider">
                    Your Saved Addresses
                  </p>
                  <span className="text-[11px] text-[#A6A6A6]">{userAddresses.length} saved</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {userAddresses.map((addr) => {
                    const isSelected = selectedAddress?.id === addr.id;
                    const isResolving = resolvingId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        onClick={() => handleSelect(addr)}
                        disabled={isResolving}
                        className={`w-full p-3.5 rounded-[12px] bg-white shadow-[0px_0px_2px_rgba(83,83,83,0.2)] text-left flex items-center justify-between transition-all border ${
                          isSelected
                            ? 'border-[#D21E6A] ring-1 ring-[#D21E6A] bg-[#F9ECF0]/30'
                            : 'border-transparent hover:border-[#D21E6A]/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full border border-[#D21E6A] flex items-center justify-center shrink-0 mt-0.5">
                            {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-[#D21E6A]" />}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {addr.label?.toLowerCase() === 'work' ? (
                                <Briefcase className="w-3.5 h-3.5 text-[#535353]" />
                              ) : (
                                <Home className="w-3.5 h-3.5 text-[#535353]" />
                              )}
                              <span className="text-sm font-semibold text-[#0C1015]">
                                {addr.label || addr.recipientName}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F9ECF0] text-[#D21E6A] font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#0C1015] mt-1 font-medium">
                              {addr.addressLine}
                            </p>
                            <p className="text-[11px] text-[#535353]">
                              {addr.area ? `${addr.area}, ` : ''}{addr.cityName || addr.governorateName} &bull; {addr.recipientPhone}
                            </p>
                          </div>
                        </div>
                        {isResolving ? (
                          <Loader2 className="w-4 h-4 text-[#D21E6A] animate-spin shrink-0" />
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-[#D21E6A] shrink-0" />
                        ) : (
                          <span className="text-xs font-medium text-[#D21E6A] hover:underline shrink-0">
                            Select
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If Authenticated: Button to Add New Address */}
            {isAuthenticated && isCustomer ? (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full py-3 px-4 rounded-[12px] border-2 border-dashed border-[#D21E6A] text-[#D21E6A] hover:bg-[#F9ECF0]/50 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Delivery Address</span>
              </button>
            ) : (
              /* Non-authenticated banner */
              <div className="p-4 rounded-[12px] bg-[#F9ECF0] border border-[#D21E6A]/20 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D21E6A]" />
                  <p className="text-xs font-semibold text-[#0C1015]">
                    Sign in to manage and save delivery addresses
                  </p>
                </div>
                <p className="text-[11px] text-[#535353]">
                  Save your home and office locations for fast checkout and real-time florist dispatch.
                </p>
                <button
                  type="button"
                  onClick={handleDemoCustomerLogin}
                  disabled={loggingInDemo}
                  className="w-full py-2 px-3 rounded-[8px] bg-[#D21E6A] hover:bg-[#AF1958] text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {loggingInDemo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Quick Demo Customer Login</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Inline New Address Form */
          <form onSubmit={handleCreateAddress} className="space-y-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#0C1015] uppercase tracking-wider">
                New Delivery Address
              </p>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-[#535353] hover:text-[#0C1015]"
              >
                Back to list
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#535353] mb-1">
                  Recipient Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#A6A6A6] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ahmed Hassan"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-[8px] border border-[#CFCFCF] bg-white focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#535353] mb-1">
                  Phone (Egyptian Mobile)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#A6A6A6] absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-[8px] border border-[#CFCFCF] bg-white focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#535353] mb-1">
                Street Address & Building
              </label>
              <input
                type="text"
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Building 14, El-Bostan St, Apt 4"
                className="w-full px-3 py-2 text-xs rounded-[8px] border border-[#CFCFCF] bg-white focus:outline-none focus:border-[#D21E6A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#535353] mb-1">Area / District</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Sheikh Zayed / Dokki"
                  className="w-full px-3 py-2 text-xs rounded-[8px] border border-[#CFCFCF] bg-white focus:outline-none focus:border-[#D21E6A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#535353] mb-1">City / Region</label>
                <select
                  value={cityId}
                  onChange={(e) => {
                    const cId = Number(e.target.value);
                    setCityId(cId);
                    setGovernorateId(cId === 2 ? 2 : 1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-[8px] border border-[#CFCFCF] bg-white focus:outline-none focus:border-[#D21E6A]"
                >
                  <option value={1}>Giza (Sheikh Zayed / 6th Oct)</option>
                  <option value={2}>Cairo (Maadi / Nasr City / New Cairo)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#535353] mb-1">Address Label</label>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLabel(l)}
                    className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium border transition-colors ${
                      label === l
                        ? 'border-[#D21E6A] bg-[#F9ECF0] text-[#D21E6A]'
                        : 'border-[#CFCFCF] bg-white text-[#535353] hover:bg-[#F9F9F9]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="flex-1 py-2 rounded-[8px] border border-[#CFCFCF] text-[#535353] hover:bg-[#E5E5E5] text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAddress}
                className="flex-1 py-2 rounded-[8px] bg-[#D21E6A] hover:bg-[#AF1958] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {savingAddress ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save & Deliver Here</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
