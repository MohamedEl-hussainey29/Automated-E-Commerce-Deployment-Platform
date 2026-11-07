import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  LogOut,
  Plus,
  Trash2,
  Check,
  Compass,
  Laptop,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type {
  UserProfileDto,
  AddressDto,
  GovernorateDto,
  CityDto,
  CountryDto,
  SessionDto,
} from '../../types/api';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'addresses' | 'security'>(
    'overview'
  );
  const [loading, setLoading] = useState(true);

  // Profile State
  const [profile, setProfile] = useState<UserProfileDto>({
    id: user?.id || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phone || '',
    gender: 0,
    profilePictureUrl: null,
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Addresses & Locations State
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [countries, setCountries] = useState<CountryDto[]>([]);
  const [governorates, setGovernorates] = useState<GovernorateDto[]>([]);
  const [cities, setCities] = useState<CityDto[]>([]);

  // New / Edit Address Form
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [governorateId, setGovernorateId] = useState<number>(0);
  const [cityId, setCityId] = useState<number>(0);
  const [area, setArea] = useState('');
  const [label, setLabel] = useState('Home');
  const [lat, setLat] = useState('30.0561');
  const [lng, setLng] = useState('31.3452');
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Security & Sessions State
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const loadAccountData = async () => {
    setLoading(true);
    try {
      const [profRes, addrRes, countryRes, govRes, sessRes] = await Promise.allSettled([
        api.getMyProfile(),
        api.getAddresses(),
        api.getCountries(),
        api.getGovernorates(),
        api.getActiveSessions(),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.data) {
        const p = profRes.value.data;
        setProfile(p);
        setRecipientName((prev) => prev || `${p.firstName} ${p.lastName}`.trim());
        setRecipientPhone((prev) => prev || p.phoneNumber);
      }

      if (addrRes.status === 'fulfilled' && addrRes.value.data) {
        setAddresses(addrRes.value.data);
      }

      if (countryRes.status === 'fulfilled' && countryRes.value.data) {
        setCountries(countryRes.value.data);
      }

      if (govRes.status === 'fulfilled' && govRes.value.data) {
        setGovernorates(govRes.value.data);
        if (govRes.value.data.length > 0 && !governorateId) {
          setGovernorateId(govRes.value.data[0].id);
        }
      }

      if (sessRes.status === 'fulfilled' && sessRes.value.data) {
        setSessions(sessRes.value.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  useEffect(() => {
    if (!governorateId) {
      setCities([]);
      return;
    }
    api
      .getCities(governorateId)
      .then((res) => {
        const list = res.data || [];
        setCities(list);
        if (list.length > 0) {
          setCityId(list[0].id);
        }
      })
      .catch((err: any) => {
        setCities([]);
        toast(
          'Failed to Load Cities',
          err.message || 'Could not load cities for governorate',
          'error'
        );
      });
  }, [governorateId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('FirstName', profile.firstName);
      fd.append('LastName', profile.lastName);
      fd.append('PhoneNumber', profile.phoneNumber);
      fd.append('Gender', String(profile.gender));
      if (profileFile) {
        fd.append('ProfilePicture', profileFile);
      }
      const res = await api.updateProfile(fd);
      if (res.data) setProfile(res.data);
      toast('Profile Updated', 'Your profile changes have been saved');
    } catch (err: any) {
      toast('Profile Update Failed', err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleReverseGeocode = async () => {
    setGeocodingLoading(true);
    try {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const res = await api.reverseGeocode(parsedLat, parsedLng);
      if (res.data) {
        setAddressLine(res.data.addressLine);
        setArea(res.data.area);
        toast('Location Resolved', `${res.data.addressLine} (${res.data.area}, ${res.data.city})`);
      }
    } catch (err: any) {
      toast(
        'Reverse Geocode Failed',
        err.message || 'Could not resolve coordinates from backend',
        'error'
      );
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      recipientName,
      recipientPhone,
      addressLine,
      governorateId,
      cityId,
      area,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      label: label || 'Home',
    };

    try {
      if (editingAddressId) {
        const res = await api.updateAddress(editingAddressId, payload);
        if (res.data) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingAddressId ? res.data : a))
          );
        }
        toast('Address Updated', 'Saved your delivery address');
      } else {
        const res = await api.createAddress(payload);
        if (res.data) {
          setAddresses((prev) => [res.data, ...prev]);
        }
        toast('Address Added', 'Your new delivery address is saved');
      }
      setEditingAddressId(null);
      setAddressLine('');
      setArea('');
    } catch (err: any) {
      toast('Address Save Failed', err.message, 'error');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.setDefaultAddress(id);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
      toast('Default Address Updated', 'Set as your primary delivery address');
    } catch (err: any) {
      toast('Failed to Set Default Address', err.message, 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast('Address Deleted', 'Removed from your saved addresses');
    } catch (err: any) {
      toast('Delete Address Failed', err.message, 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.changePassword(currentPassword, newPassword, confirmNewPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast('Password Changed', 'Your password has been updated');
    } catch (err: any) {
      toast('Password Update Failed', err.message, 'error');
    }
  };

  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    try {
      await api.updateDeviceNotifications('web-browser-01', next);
      await api.updateFcmToken('web-browser-01', 'web-fcm-token-updated');
      setNotificationsEnabled(next);
      toast('Notification Preference Saved', `Notifications ${next ? 'Enabled' : 'Disabled'}`);
    } catch (err: any) {
      toast('Notification Update Failed', err.message, 'error');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast('Session Revoked', 'Device session terminated');
    } catch (err: any) {
      toast('Revoke Session Failed', err.message, 'error');
    }
  };

  const displayName =
    `${profile.firstName} ${profile.lastName}`.trim() || user?.name || 'Flowery Customer';
  const avatarUrl =
    profile.profilePictureUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=F9ECF0&color=D21E6A&size=160`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-[#F9F9F9] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Figma "Profile" frame (32:1558) */}
        <div className="lg:col-span-5 bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-6">
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <img src="/figma/logo-flower.svg" alt="Flowery" className="w-5 h-5" />
              <span className="font-flowery text-[20px] text-[#D21E6A] leading-none">
                Flowery
              </span>
            </div>
            <button
              type="button"
              onClick={loadAccountData}
              className="p-2 rounded-full hover:bg-[#F9ECF0] text-[#535353]"
              title="Refresh Profile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Centered Avatar + Name + Edit Pen + Email matching Figma node 32:1562 */}
          <div className="flex flex-col items-center text-center space-y-2 pt-2">
            <div className="w-[81px] h-[81px] rounded-full overflow-hidden border border-[#F9ECF0] bg-[#F9ECF0]">
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-[18px] font-medium text-[#0C1015]">{displayName}</h2>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="p-1 rounded hover:bg-[#F9ECF0]"
                title="Edit profile"
              >
                <img src="/figma/pen-edit.svg" alt="Edit" className="w-[18px] h-[18px]" />
              </button>
            </div>
            <p className="text-[16px] font-medium text-[#535353]">
              {profile.email || user?.email}
            </p>
          </div>

          {/* Profile Menu Rows matching Figma node 32:1563 */}
          <div className="space-y-1 pt-2">
            {/* My orders */}
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="w-full flex items-center justify-between py-3 px-2 rounded-[8px] hover:bg-[#F9ECF0]/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <img src="/figma/transaction-order.svg" alt="" className="w-4 h-4" />
                <span className="text-[16px] text-[#0C1015]">My orders</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#535353]" />
            </button>

            {/* Saved address */}
            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between py-3 px-2 rounded-[8px] transition-colors ${
                activeTab === 'addresses' ? 'bg-[#F9ECF0]' : 'hover:bg-[#F9ECF0]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <img src="/figma/location-pin.svg" alt="" className="w-4 h-4" />
                <span className="text-[16px] text-[#0C1015]">Saved address</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#535353]" />
            </button>

            {/* Edit Profile */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between py-3 px-2 rounded-[8px] transition-colors ${
                activeTab === 'profile' ? 'bg-[#F9ECF0]' : 'hover:bg-[#F9ECF0]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <img src="/figma/pen-edit.svg" alt="" className="w-4 h-4" />
                <span className="text-[16px] text-[#0C1015]">Edit profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#535353]" />
            </button>

            <div className="h-[1px] bg-[#7D7D7D]/25 my-2" />

            {/* Notification Switch */}
            <div className="flex items-center justify-between py-2.5 px-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationsEnabled}
                  onClick={handleToggleNotifications}
                  className={`w-[42px] h-[24px] rounded-full transition-colors p-0.5 flex items-center ${
                    notificationsEnabled ? 'bg-[#D21E6A] justify-end' : 'bg-[#A6A6A6] justify-start'
                  }`}
                >
                  <span className="w-[20px] h-[20px] rounded-full bg-[#F9F9F9] shadow" />
                </button>
                <span className="text-[16px] text-[#0C1015]">Notification</span>
              </div>
            </div>

            <div className="h-[1px] bg-[#7D7D7D]/25 my-2" />

            {/* Language */}
            <div className="flex items-center justify-between py-2.5 px-2">
              <span className="text-[16px] text-[#0C1015]">Language</span>
              <span className="text-[14px] text-[#D21E6A] font-medium">English</span>
            </div>

            {/* Security & Password */}
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between py-3 px-2 rounded-[8px] transition-colors ${
                activeTab === 'security' ? 'bg-[#F9ECF0]' : 'hover:bg-[#F9ECF0]/50'
              }`}
            >
              <span className="text-[16px] text-[#0C1015]">Change password & sessions</span>
              <ChevronRight className="w-4 h-4 text-[#535353]" />
            </button>

            {/* About us */}
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="w-full flex items-center justify-between py-3 px-2 rounded-[8px] hover:bg-[#F9ECF0]/50"
            >
              <span className="text-[16px] text-[#0C1015]">About us</span>
              <ChevronRight className="w-4 h-4 text-[#535353]" />
            </button>

            {/* Terms & conditions */}
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="w-full flex items-center justify-between py-3 px-2 rounded-[8px] hover:bg-[#F9ECF0]/50"
            >
              <span className="text-[16px] text-[#0C1015]">Terms & conditions</span>
              <ChevronRight className="w-4 h-4 text-[#535353]" />
            </button>

            <div className="h-[1px] bg-[#7D7D7D]/25 my-2" />

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/auth');
              }}
              className="w-full flex items-center justify-between py-3 px-2 rounded-[8px] hover:bg-[#F8D8D8]/40 text-[#0C1015]"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-[#535353]" />
                <span className="text-[16px]">Logout</span>
              </div>
              <LogOut className="w-4 h-4 text-[#535353]" />
            </button>
          </div>

          <p className="text-center text-[11px] text-[#535353] pt-4">v 6.3.0 - (446)</p>
        </div>

        {/* RIGHT COLUMN: Active Detail View (Edit Profile / Saved Address / Security) */}
        <div className="lg:col-span-7">
          {/* VIEW 1: EDIT PROFILE matching Figma node 76:7994 */}
          {(activeTab === 'profile' || activeTab === 'overview') && (
            <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#0C1015] hover:bg-[#F9ECF0]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-[20px] font-medium text-[#0C1015]">Edit profile</h2>
              </div>

              {/* Avatar with #F9ECF0 camera badge matching Figma node 76:8638 */}
              <div className="flex justify-center">
                <label className="relative w-[81px] h-[81px] cursor-pointer group">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover border border-[#F9ECF0]"
                  />
                  <span className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-[6px] bg-[#F9ECF0] flex items-center justify-center text-[#0C1015] shadow-sm">
                    <Camera className="w-4 h-4" />
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
              {profileFile && (
                <p className="text-center text-[12px] text-[#D21E6A]">
                  Selected photo: {profileFile.name}
                </p>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* 2-col First name & Last name matching Figma node 76:8028 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      First name
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                    />
                  </div>

                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      Last name
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#535353]"
                  />
                </div>

                {/* Phone number */}
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    required
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                    className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>

                {/* Password field with "Change" button matching Figma node 76:8639 */}
                <div className="relative flex items-center">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Password
                  </label>
                  <input
                    type="password"
                    value="••••••••"
                    readOnly
                    className="w-full h-[56px] px-4 pr-20 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015]"
                  />
                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className="absolute right-4 text-[14px] font-semibold text-[#D21E6A] hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* Gender radio buttons matching Figma node 76:8579 */}
                <div className="flex items-center gap-8 pt-1">
                  <span className="text-[18px] font-medium text-[#535353]">Gender</span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={profile.gender === 1}
                        onChange={() => setProfile({ ...profile, gender: 1 })}
                        className="accent-[#D21E6A] w-4 h-4"
                      />
                      <span className="text-[16px] text-[#0C1015]">Female</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={profile.gender === 0}
                        onChange={() => setProfile({ ...profile, gender: 0 })}
                        className="accent-[#D21E6A] w-4 h-4"
                      />
                      <span className="text-[16px] text-[#0C1015]">Male</span>
                    </label>
                  </div>
                </div>

                {/* Update button matching Figma node 76:8027 */}
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
                >
                  {savingProfile ? 'Updating...' : 'Update'}
                </button>
              </form>
            </div>
          )}

          {/* VIEW 2: SAVED ADDRESSES & ADD ADDRESS matching Figma nodes 83:3303 & 83:3449 */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              {/* Saved Addresses List */}
              <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#0C1015] hover:bg-[#F9ECF0]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-[20px] font-medium text-[#0C1015]">Saved address</h2>
                  </div>
                  {countries[0] && (
                    <span className="text-[12px] text-[#535353]">
                      {countries[0].nameEn} ({countries[0].phoneCode})
                    </span>
                  )}
                </div>

                {addresses.length === 0 ? (
                  <p className="text-[14px] text-[#535353] text-center py-6">
                    No saved delivery addresses yet. Add your address below.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-[16px] flex items-center justify-between gap-4 border border-[#A6A6A6]/30"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <img src="/figma/location-pin.svg" alt="" className="w-4 h-4" />
                            <span className="text-[16px] font-medium text-[#0C1015]">
                              {addr.label || addr.cityName || 'Cairo'}
                            </span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 rounded-full bg-[#F9ECF0] text-[#D21E6A] text-[11px] font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#535353]">{addr.addressLine}</p>
                          <p className="text-[12px] text-[#535353]">
                            {addr.recipientName} • {addr.recipientPhone}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="p-2 rounded-full hover:bg-[#F9ECF0] text-[#0CB359]"
                              title="Set Default"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddressId(addr.id);
                              setRecipientName(addr.recipientName);
                              setRecipientPhone(addr.recipientPhone);
                              setAddressLine(addr.addressLine);
                              setGovernorateId(addr.governorateId);
                              setCityId(addr.cityId);
                              setArea(addr.area);
                              setLabel(addr.label || 'Home');
                              setLat(String(addr.lat));
                              setLng(String(addr.lng));
                            }}
                            className="p-2 rounded-full hover:bg-[#F9ECF0]"
                            title="Edit address"
                          >
                            <img src="/figma/pen-edit.svg" alt="Edit" className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-2 rounded-full hover:bg-[#F8D8D8]"
                            title="Delete address"
                          >
                            <Trash2 className="w-4 h-4 text-[#CC1010]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add / Edit Address Form matching Figma node 83:3449 */}
              <form
                onSubmit={handleSaveAddress}
                className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-5"
              >
                <h3 className="text-[18px] font-medium text-[#0C1015]">
                  {editingAddressId ? 'Edit address' : 'Add new address'}
                </h3>

                {/* GPS Reverse Geocode Box */}
                <div className="p-3.5 rounded-[8px] bg-[#F9ECF0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#D21E6A] flex items-center gap-1.5">
                      <Compass className="w-4 h-4" />
                      Pin Location Coordinates
                    </span>
                    <button
                      type="button"
                      onClick={handleReverseGeocode}
                      disabled={geocodingLoading}
                      className="px-3 py-1 rounded-[100px] bg-[#D21E6A] text-[#F9F9F9] text-[12px] font-medium"
                    >
                      {geocodingLoading ? 'Resolving...' : 'Auto-fill from GPS'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.0001"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="Latitude"
                      className="h-[40px] px-3 rounded-[4px] border border-[#A6A6A6] bg-[#F9F9F9] text-[13px]"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="Longitude"
                      className="h-[40px] px-3 rounded-[4px] border border-[#A6A6A6] bg-[#F9F9F9] text-[13px]"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Enter the address"
                    className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      required
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="Enter the phone number"
                      className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                    />
                  </div>

                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      Recipient name
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Enter recipient name"
                      className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      Governorate
                    </label>
                    <select
                      value={governorateId}
                      onChange={(e) => setGovernorateId(Number(e.target.value))}
                      className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                    >
                      {governorates.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      City
                    </label>
                    <select
                      value={cityId}
                      onChange={(e) => setCityId(Number(e.target.value))}
                      className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                    >
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      Area
                    </label>
                    <input
                      type="text"
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Nasr City / Maadi"
                      className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                    />
                  </div>

                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      Label
                    </label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Home, Work..."
                      className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingAddressId ? 'Save address' : 'Add new address'}</span>
                </button>
              </form>
            </div>
          )}

          {/* VIEW 3: RESET PASSWORD & SESSIONS matching Figma node 76:8931 */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <form
                onSubmit={handleChangePassword}
                className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 sm:p-8 space-y-5"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#0C1015] hover:bg-[#F9ECF0]"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-[20px] font-medium text-[#0C1015]">Reset password</h2>
                </div>

                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Current password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>

                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>

                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full h-[56px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium transition-colors"
                >
                  Update
                </button>
              </form>

              {/* Active Device Sessions */}
              <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-[#D21E6A]" />
                  <h3 className="text-[18px] font-medium text-[#0C1015]">
                    Active Device Sessions
                  </h3>
                </div>

                {sessions.length === 0 ? (
                  <p className="text-[13px] text-[#535353] text-center py-4">
                    No active device sessions returned from backend.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-[8px] border border-[#A6A6A6]/40 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-medium text-[#0C1015]">
                              {s.deviceName || 'Web Session'}
                            </p>
                            {s.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-[#0CB359]/15 text-[#2F9033] text-[11px] font-medium">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[#535353]">
                            IP: {s.ipAddress || 'N/A'} • {s.location || 'N/A'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(s.id)}
                          className="px-3.5 py-1.5 rounded-[100px] bg-[#F8D8D8] text-[#CC1010] text-[12px] font-medium"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
