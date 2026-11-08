import React, { useEffect, useState } from 'react';
import {
  Flower2,
  Store,
  Truck,
  Package,
  LayoutGrid,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  RefreshCw,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import type {
  CategoryDto,
  OccasionDto,
  ProductListItemDto,
  StoreDto,
  CoverageAreaType,
  DriverApplicationSummaryDto,
  DriverApplicationDetailsDto,
  VehicleTypeDto,
  OrderStatus,
  OrderDetailsDto,
} from '../../types/api';

type AdminTab = 'catalog' | 'stores' | 'drivers' | 'orders' | 'home-layout';

export const AdminDashboardPage: React.FC = () => {
  const { toast } = useToast();

  const [tab, setTab] = useState<AdminTab>('catalog');
  const [loading, setLoading] = useState(true);

  // Catalog State
  const [products, setProducts] = useState<ProductListItemDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [occasions, setOccasions] = useState<OccasionDto[]>([]);

  // Create Product Form
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('450');
  const [prodDiscount, setProdDiscount] = useState('10');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodOccasionId, setProdOccasionId] = useState('');
  const [prodIncludes, setProdIncludes] = useState('15 Pink Rose Bouquet, White Wrap');
  const [prodStockQty, setProdStockQty] = useState('25');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);

  // Create Category / Occasion Forms
  const [newCatName, setNewCatName] = useState('');
  const [newCatOrder, setNewCatOrder] = useState('8');
  const [newOccName, setNewOccName] = useState('');
  const [newOccOrder, setNewOccOrder] = useState('8');

  // Home Section Form
  const [secType, setSecType] = useState<'banner' | 'rail'>('rail');
  const [secTitle, setSecTitle] = useState('Best seller');
  const [secOrder, setSecOrder] = useState('5');
  const [secRule, setSecRule] = useState<
    'MANUAL' | 'BEST_SELLERS' | 'NEW_ARRIVALS' | 'FEATURED' | 'ON_SALE'
  >('BEST_SELLERS');
  const [secBannerUrl, setSecBannerUrl] = useState('');

  // Stores State
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('01001122334');
  const [storeLat, setStoreLat] = useState('30.0561');
  const [storeLng, setStoreLng] = useState('31.3452');
  const [coverageType, setCoverageType] = useState<CoverageAreaType>('RADIUS');
  const [radiusKm, setRadiusKm] = useState('30');
  const [cityName, setCityName] = useState('Cairo');
  const [areaName, setAreaName] = useState('Zamalek');

  // Drivers & Vehicles State
  const [driverApps, setDriverApps] = useState<DriverApplicationSummaryDto[]>([]);
  const [selectedDriverApp, setSelectedDriverApp] =
    useState<DriverApplicationDetailsDto | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeDto[]>([]);
  const [newVehicleTypeName, setNewVehicleTypeName] = useState('');

  // Orders Admin Override State
  const [adminOrderId, setAdminOrderId] = useState('');
  const [inspectedOrder, setInspectedOrder] = useState<OrderDetailsDto | null>(null);
  const [adminOrderStatus, setAdminOrderStatus] = useState<OrderStatus>('PREPARING');
  const [adminOrderNote, setAdminOrderNote] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, occRes, storeRes, appRes, vtRes] = await Promise.allSettled([
        api.getProducts({ page: 1, pageSize: 50 }),
        api.getCategories(1, 50),
        api.getOccasions(1, 50),
        api.adminGetStores(1, 50),
        api.adminGetDriverApplications(1, 50),
        api.getVehicleTypes(),
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value.data) {
        setProducts(prodRes.value.data);
      }
      if (catRes.status === 'fulfilled' && catRes.value.data) {
        setCategories(catRes.value.data);
        if (catRes.value.data.length > 0) {
          setProdCategoryId((prev) => prev || catRes.value.data[0].id);
        }
      }
      if (occRes.status === 'fulfilled' && occRes.value.data) {
        setOccasions(occRes.value.data);
        if (occRes.value.data.length > 0) {
          setProdOccasionId((prev) => prev || occRes.value.data[0].id);
        }
      }
      if (storeRes.status === 'fulfilled' && storeRes.value.data) {
        setStores(storeRes.value.data);
      }
      if (appRes.status === 'fulfilled' && appRes.value.data) {
        setDriverApps(appRes.value.data);
      }
      if (vtRes.status === 'fulfilled' && vtRes.value.data) {
        setVehicleTypes(vtRes.value.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // ---------- Catalog Handlers ----------
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stores[0]?.id) {
      toast('Store Required', 'Create or load at least one store before creating a product', 'error');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('Name', prodName);
      fd.append('Description', prodDesc);
      fd.append('Price', prodPrice);
      if (prodDiscount) fd.append('DiscountPercent', prodDiscount);
      fd.append('CategoryIds', prodCategoryId);
      if (prodOccasionId) fd.append('OccasionIds', prodOccasionId);
      prodIncludes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((inc) => fd.append('Includes', inc));
      if (prodImageFile) fd.append('Images', prodImageFile);

      const storeStockJson = JSON.stringify([
        {
          StoreId: stores[0].id,
          Quantity: Number(prodStockQty) || 20,
        },
      ]);
      fd.append('StoreStock', storeStockJson);

      const res = await api.adminCreateProduct(fd);
      toast('Product Created!', `${res.data?.name || prodName} added to Flowery catalog`);
      setProdName('');
      setProdDesc('');
      await loadAdminData();
    } catch (err: any) {
      toast('Create Product Failed', err.message, 'error');
    }
  };

  const handleArchiveProduct = async (productId: string) => {
    try {
      await api.adminArchiveProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast('Product Archived', 'Removed from active catalog');
    } catch (err: any) {
      toast('Archive Product Failed', err.message, 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('Name', newCatName);
      fd.append('Order', newCatOrder);
      const res = await api.adminCreateCategory(fd);
      if (res.data) setCategories((prev) => [...prev, res.data]);
      setNewCatName('');
      toast('Category Created', 'Added new category');
    } catch (err: any) {
      toast('Create Category Failed', err.message, 'error');
    }
  };

  const handleArchiveCategory = async (categoryId: string) => {
    try {
      await api.adminArchiveCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      toast('Category Archived', 'Removed category');
    } catch (err: any) {
      toast('Archive Category Failed', err.message, 'error');
    }
  };

  const handleCreateOccasion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('Name', newOccName);
      fd.append('Order', newOccOrder);
      const res = await api.adminCreateOccasion(fd);
      if (res.data) setOccasions((prev) => [...prev, res.data]);
      setNewOccName('');
      toast('Occasion Created', 'Added new occasion');
    } catch (err: any) {
      toast('Create Occasion Failed', err.message, 'error');
    }
  };

  const handleArchiveOccasion = async (occasionId: string) => {
    try {
      await api.adminArchiveOccasion(occasionId);
      setOccasions((prev) => prev.filter((o) => o.id !== occasionId));
      toast('Occasion Archived', 'Removed occasion');
    } catch (err: any) {
      toast('Archive Occasion Failed', err.message, 'error');
    }
  };

  // ---------- Home Layout Handlers ----------
  const handleCreateHomeSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminCreateHomeSection({
        type: secType,
        title: secTitle,
        order: Number(secOrder),
        enabled: true,
        productSelectionRule: secType === 'rail' ? secRule : null,
        bannerImageUrl: secType === 'banner' ? secBannerUrl || null : null,
        categoryIds: categories[0] ? [categories[0].id] : [],
        productIds: products.slice(0, 3).map((p) => p.id),
      });
      toast('Home Section Created!', 'Updated Flowery Home layout');
    } catch (err: any) {
      toast('Create Home Section Failed', err.message, 'error');
    }
  };

  // ---------- Store Coverage Handlers ----------
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(storeLat);
    const lng = parseFloat(storeLng);
    const payload = {
      name: storeName,
      phoneNumber: storePhone,
      whatsAppNumber: storePhone,
      location: {
        addressLine: storeAddress,
        lat,
        lng,
      },
      coverageArea: {
        type: coverageType,
        radius:
          coverageType === 'RADIUS'
            ? { centerLat: lat, centerLng: lng, radiusKm: parseFloat(radiusKm) }
            : null,
        cityAreas:
          coverageType === 'CITY_AREA_LIST' ? [{ city: cityName, area: areaName }] : null,
        polygon:
          coverageType === 'POLYGON'
            ? [
                { lat: lat - 0.05, lng: lng - 0.05 },
                { lat: lat + 0.05, lng: lng - 0.05 },
                { lat: lat + 0.05, lng: lng + 0.05 },
                { lat: lat - 0.05, lng: lng + 0.05 },
              ]
            : null,
      },
    };

    try {
      const res = await api.adminCreateStore(payload);
      if (res.data) setStores((prev) => [res.data, ...prev]);
      setStoreName('');
      setStoreAddress('');
      toast('Store Hub Created!', 'New Flowery store hub added');
    } catch (err: any) {
      toast('Create Store Failed', err.message, 'error');
    }
  };

  const handleDeactivateStore = async (storeId: string) => {
    try {
      await api.adminDeactivateStore(storeId);
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, status: 'INACTIVE' } : s))
      );
      toast('Store Deactivated', 'Store hub marked inactive');
    } catch (err: any) {
      toast('Deactivate Store Failed', err.message, 'error');
    }
  };

  // ---------- Driver & Vehicle Admin Handlers ----------
  const handleInspectDriverApp = async (applicationId: string) => {
    try {
      const res = await api.adminGetDriverApplicationDetails(applicationId);
      if (res.data) setSelectedDriverApp(res.data);
    } catch (err: any) {
      toast('Load Application Details Failed', err.message, 'error');
    }
  };

  const handleApproveDriver = async (applicationId: string) => {
    try {
      await api.adminApproveDriverApplication(applicationId);
      setDriverApps((prev) =>
        prev.map((d) => (d.id === applicationId ? { ...d, status: 3 } : d))
      );
      toast('Driver Approved!', 'Courier is now approved for deliveries');
    } catch (err: any) {
      toast('Approve Driver Failed', err.message, 'error');
    }
  };

  const handleRejectDriver = async (applicationId: string) => {
    const reason = rejectReason.trim() || 'Incomplete license documentation';
    try {
      await api.adminRejectDriverApplication(applicationId, reason);
      setDriverApps((prev) =>
        prev.map((d) => (d.id === applicationId ? { ...d, status: 2 } : d))
      );
      toast('Driver Rejected', 'Application marked rejected');
    } catch (err: any) {
      toast('Reject Driver Failed', err.message, 'error');
    }
  };

  const handleCreateVehicleType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.adminCreateVehicleType(newVehicleTypeName);
      if (res.data) {
        setVehicleTypes((prev) => [...prev, { id: res.data.id, name: res.data.name }]);
      }
      setNewVehicleTypeName('');
      toast('Vehicle Type Created!', 'New courier vehicle type added');
    } catch (err: any) {
      toast('Create Vehicle Type Failed', err.message, 'error');
    }
  };

  // ---------- Admin Order Status Override ----------
  const handleLookupOrder = async () => {
    if (!adminOrderId.trim()) return;
    try {
      const res = await api.getOrderDetails(adminOrderId.trim());
      if (res.data) {
        setInspectedOrder(res.data);
        setAdminOrderStatus(res.data.status);
        toast('Order Loaded', `Loaded ${res.data.orderNumber} (${res.data.status})`);
      }
    } catch (err: any) {
      setInspectedOrder(null);
      toast('Order Lookup Failed', err.message, 'error');
    }
  };

  const handleAdminUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminUpdateOrderStatus(
        adminOrderId.trim(),
        adminOrderStatus,
        adminOrderNote || undefined
      );
      toast(
        'Order Status Overridden!',
        `Order ${adminOrderId.slice(0, 8)}... set to ${adminOrderStatus}`
      );
      setAdminOrderNote('');
      if (inspectedOrder) {
        setInspectedOrder({ ...inspectedOrder, status: adminOrderStatus });
      }
    } catch (err: any) {
      toast('Admin Order Status Update Failed', err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#F9F9F9] min-h-screen">
      {/* Header Banner in Flowery style */}
      <div className="bg-[#F9ECF0] rounded-[10px] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-[#D21E6A]/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <img src="/figma/logo-flower.svg" alt="Flowery" className="w-5 h-5" />
            <span className="font-flowery text-[22px] text-[#D21E6A] leading-none">
              Flowery Admin
            </span>
          </div>
          <h1 className="text-[20px] font-semibold text-[#0C1015]">
            Catalog, Stores, Drivers &amp; Orders Management
          </h1>
          <p className="text-[13px] text-[#535353]">
            Manage bouquets, store coverage hubs, courier applications, and order fulfillment.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          className="self-start lg:self-auto flex items-center gap-2 px-5 h-[40px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[13px] font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync All Data</span>
        </button>
      </div>

      {/* Navigation Tabs matching Figma underline tabs */}
      <div className="flex items-center gap-6 overflow-x-auto border-b border-[#CFCFCF]">
        {[
          { id: 'catalog', label: 'Catalog & Products', icon: Flower2 },
          { id: 'stores', label: 'Flowery Stores', icon: Store },
          { id: 'drivers', label: 'Driver Applications', icon: Truck },
          { id: 'orders', label: 'Order Status', icon: Package },
          { id: 'home-layout', label: 'Home Layout', icon: LayoutGrid },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as AdminTab)}
              className="flex flex-col items-center justify-end pt-2 shrink-0"
            >
              <div
                className={`flex items-center gap-2 pb-2.5 text-[15px] transition-colors ${
                  active ? 'text-[#D21E6A] font-medium' : 'text-[#535353] font-normal'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              <span
                className={`w-full h-[3px] rounded-t-[100px] ${
                  active ? 'bg-[#D21E6A]' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* TAB 1: CATALOG, PRODUCTS, CATEGORIES & OCCASIONS */}
      {tab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Product Form */}
          <div className="lg:col-span-5 space-y-6">
            <form
              onSubmit={handleCreateProduct}
              className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-5"
            >
              <h2 className="text-[18px] font-medium text-[#0C1015]">
                Add New Bouquet Product
              </h2>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Product name
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Pink roses bouquet"
                  className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Describe the bouquet..."
                  className="w-full p-3.5 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px] text-[#0C1015] focus:outline-none focus:border-[#D21E6A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="relative">
                  <label className="absolute -top-2.5 left-2.5 bg-[#F9F9F9] px-1 text-[11px] text-[#535353]">
                    Price (EGP)
                  </label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full h-[48px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px] text-[#0C1015]"
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-2.5 bg-[#F9F9F9] px-1 text-[11px] text-[#535353]">
                    Discount %
                  </label>
                  <input
                    type="number"
                    value={prodDiscount}
                    onChange={(e) => setProdDiscount(e.target.value)}
                    className="w-full h-[48px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px] text-[#0C1015]"
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-2.5 bg-[#F9F9F9] px-1 text-[11px] text-[#535353]">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={prodStockQty}
                    onChange={(e) => setProdStockQty(e.target.value)}
                    className="w-full h-[48px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px] text-[#0C1015]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Category
                  </label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px] text-[#0C1015]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Occasion
                  </label>
                  <select
                    value={prodOccasionId}
                    onChange={(e) => setProdOccasionId(e.target.value)}
                    className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px] text-[#0C1015]"
                  >
                    {occasions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Bouquet include (comma-separated)
                </label>
                <input
                  type="text"
                  value={prodIncludes}
                  onChange={(e) => setProdIncludes(e.target.value)}
                  className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px] text-[#0C1015]"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Product image
                </label>
                <label className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] flex items-center justify-between cursor-pointer">
                  <span className="text-[13px] text-[#A6A6A6] truncate">
                    {prodImageFile ? prodImageFile.name : 'Upload product photo'}
                  </span>
                  <Upload className="w-4 h-4 text-[#535353]" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProdImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[15px] font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Product</span>
              </button>
            </form>

            {/* Quick Create Category & Occasion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <form
                onSubmit={handleCreateCategory}
                className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-4 space-y-3"
              >
                <h3 className="text-[15px] font-medium text-[#0C1015]">New Category</h3>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category Name"
                  className="w-full h-[42px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                />
                <input
                  type="number"
                  required
                  value={newCatOrder}
                  onChange={(e) => setNewCatOrder(e.target.value)}
                  placeholder="Order"
                  className="w-full h-[42px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                />
                <button
                  type="submit"
                  className="w-full h-[38px] rounded-[100px] bg-[#D21E6A] text-[#F9F9F9] text-[13px] font-medium"
                >
                  Add Category
                </button>
              </form>

              <form
                onSubmit={handleCreateOccasion}
                className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-4 space-y-3"
              >
                <h3 className="text-[15px] font-medium text-[#0C1015]">New Occasion</h3>
                <input
                  type="text"
                  required
                  value={newOccName}
                  onChange={(e) => setNewOccName(e.target.value)}
                  placeholder="Occasion Name"
                  className="w-full h-[42px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                />
                <input
                  type="number"
                  required
                  value={newOccOrder}
                  onChange={(e) => setNewOccOrder(e.target.value)}
                  placeholder="Order"
                  className="w-full h-[42px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                />
                <button
                  type="submit"
                  className="w-full h-[38px] rounded-[100px] bg-[#D21E6A] text-[#F9F9F9] text-[13px] font-medium"
                >
                  Add Occasion
                </button>
              </form>
            </div>
          </div>

          {/* Right: Active Catalog Products, Categories & Occasions List */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-4">
              <h3 className="text-[18px] font-medium text-[#0C1015]">
                Catalog Products ({products.length})
              </h3>
              {products.length === 0 ? (
                <p className="text-[13px] text-[#535353] py-6 text-center">
                  No products found in catalog.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="border-[0.5px] border-[#535353] rounded-[8px] p-2.5 flex items-center justify-between gap-4 bg-[#F9F9F9]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[6px] bg-[#F9ECF0] overflow-hidden flex items-center justify-center shrink-0">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Flower2 className="w-5 h-5 text-[#D21E6A]" />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#0C1015]">{prod.name}</p>
                          <p className="text-[12px] text-[#535353]">
                            {prod.categoryName} • <strong>EGP {prod.price}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleArchiveProduct(prod.id)}
                        className="p-2 rounded-full hover:bg-[#F8D8D8] text-[#CC1010]"
                        title="Archive product"
                      >
                        <img src="/figma/delete.svg" alt="Delete" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-3">
              <h3 className="text-[16px] font-medium text-[#0C1015]">
                Categories ({categories.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="px-3.5 py-1.5 rounded-[100px] bg-[#F9ECF0] flex items-center gap-2 text-[13px] font-medium text-[#0C1015]"
                  >
                    <span>{cat.name}</span>
                    <button
                      onClick={() => handleArchiveCategory(cat.id)}
                      className="text-[#535353] hover:text-[#CC1010]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-3">
              <h3 className="text-[16px] font-medium text-[#0C1015]">
                Occasions ({occasions.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {occasions.map((occ) => (
                  <div
                    key={occ.id}
                    className="px-3.5 py-1.5 rounded-[100px] bg-[#F9ECF0] flex items-center gap-2 text-[13px] font-medium text-[#0C1015]"
                  >
                    <span>{occ.name}</span>
                    <button
                      onClick={() => handleArchiveOccasion(occ.id)}
                      className="text-[#535353] hover:text-[#CC1010]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORES & GEOSPATIAL COVERAGE */}
      {tab === 'stores' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <form
              onSubmit={handleCreateStore}
              className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-5"
            >
              <h2 className="text-[18px] font-medium text-[#0C1015]">
                Add Flowery Store Hub
              </h2>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Store name
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Flowery store Cairo"
                  className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="20th st, Sheikh Zayed"
                    className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={storeLat}
                    onChange={(e) => setStoreLat(e.target.value)}
                    className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={storeLng}
                    onChange={(e) => setStoreLng(e.target.value)}
                    className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Coverage type
                </label>
                <select
                  value={coverageType}
                  onChange={(e) => setCoverageType(e.target.value as CoverageAreaType)}
                  className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                >
                  <option value="RADIUS">RADIUS (Circular km range)</option>
                  <option value="CITY_AREA_LIST">CITY_AREA_LIST (Named districts)</option>
                  <option value="POLYGON">POLYGON (Bounding GPS vertices)</option>
                </select>
              </div>

              {coverageType === 'RADIUS' && (
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
                  />
                </div>
              )}

              {coverageType === 'CITY_AREA_LIST' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                    />
                  </div>
                  <div className="relative">
                    <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                      Area
                    </label>
                    <input
                      type="text"
                      required
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[13px]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[15px] font-medium transition-colors"
              >
                Create Store
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-[18px] font-medium text-[#0C1015]">
              Flowery Stores ({stores.length})
            </h2>
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-[44px] h-[44px] rounded-full bg-[#D21E6A] flex flex-col items-center justify-center shrink-0">
                    <img src="/figma/logo-flower-white.svg" alt="" className="w-4 h-4" />
                    <span className="font-flowery text-[8px] text-[#F9F9F9] leading-none mt-0.5">
                      Flowery
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-medium text-[#0C1015]">{store.name}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          store.status === 'ACTIVE'
                            ? 'bg-[#0CB359]/15 text-[#2F9033]'
                            : 'bg-[#F8D8D8] text-[#CC1010]'
                        }`}
                      >
                        {store.status}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#535353]">{store.location.addressLine}</p>
                  </div>
                </div>

                {store.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleDeactivateStore(store.id)}
                    className="px-4 h-[34px] rounded-[100px] border border-[#CC1010] text-[#CC1010] text-[12px] font-medium hover:bg-[#F8D8D8]"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DRIVER APPLICATIONS & VEHICLE TYPES */}
      {tab === 'drivers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-[18px] font-medium text-[#0C1015]">
              Driver Applications ({driverApps.length})
            </h2>
            {driverApps.length === 0 ? (
              <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-8 text-center text-[13px] text-[#535353]">
                No pending driver applications.
              </div>
            ) : (
              driverApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[16px] font-medium text-[#0C1015]">{app.name}</p>
                      <p className="text-[13px] text-[#535353]">
                        {app.email} • {app.phone} • Vehicle: <strong>{app.vehicleType}</strong>
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#F9ECF0] text-[#D21E6A] text-[12px] font-medium">
                      {app.status === 3 ? 'APPROVED' : app.status === 2 ? 'REJECTED' : 'PENDING'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      onClick={() => handleInspectDriverApp(app.id)}
                      className="px-4 h-[34px] rounded-[100px] border border-[#535353] text-[#535353] text-[12px] font-medium"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => handleApproveDriver(app.id)}
                      className="px-4 h-[34px] rounded-[100px] bg-[#0CB359] text-[#F9F9F9] text-[12px] font-medium flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectDriver(app.id)}
                      className="px-4 h-[34px] rounded-[100px] bg-[#CC1010] text-[#F9F9F9] text-[12px] font-medium flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}

            {selectedDriverApp && (
              <div className="bg-[#F9ECF0] rounded-[10px] p-5 space-y-1.5 text-[13px] text-[#0C1015]">
                <p className="font-semibold text-[#D21E6A]">Driver Application Details</p>
                <p>
                  <strong>Name:</strong> {selectedDriverApp.name} ({selectedDriverApp.gender})
                </p>
                <p>
                  <strong>Plate &amp; Capacity:</strong> {selectedDriverApp.vehiclePlateNumber} (
                  {selectedDriverApp.vehicleCapacity} bouquets)
                </p>
                <p>
                  <strong>National ID:</strong> {selectedDriverApp.nid}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <form
              onSubmit={handleCreateVehicleType}
              className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-4"
            >
              <h3 className="text-[18px] font-medium text-[#0C1015]">Create Vehicle Type</h3>
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Vehicle type name
                </label>
                <input
                  type="text"
                  required
                  value={newVehicleTypeName}
                  onChange={(e) => setNewVehicleTypeName(e.target.value)}
                  placeholder="e.g. Motorbike / Van"
                  className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-[44px] rounded-[100px] bg-[#D21E6A] text-[#F9F9F9] text-[14px] font-medium"
              >
                Create Vehicle Type
              </button>

              <div className="pt-2 space-y-1.5">
                {vehicleTypes.map((vt) => (
                  <div
                    key={vt.id}
                    className="p-2.5 rounded-[8px] bg-[#F9ECF0]/60 text-[13px] font-medium text-[#0C1015]"
                  >
                    {vt.name}
                  </div>
                ))}
              </div>
            </form>

            <div className="bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 space-y-3">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Rejection reason
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason when rejecting driver..."
                  className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ORDER STATUS OVERRIDE */}
      {tab === 'orders' && (
        <div className="max-w-xl bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 sm:p-8 space-y-5">
          <h2 className="text-[18px] font-medium text-[#0C1015]">
            Update Order Status
          </h2>

          <form onSubmit={handleAdminUpdateOrderStatus} className="space-y-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Order ID
                </label>
                <input
                  type="text"
                  required
                  value={adminOrderId}
                  onChange={(e) => setAdminOrderId(e.target.value)}
                  placeholder="Enter Order GUID"
                  className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
                />
              </div>
              <button
                type="button"
                onClick={handleLookupOrder}
                className="px-5 h-[52px] rounded-[8px] bg-[#F9ECF0] text-[#D21E6A] text-[13px] font-medium flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Inspect</span>
              </button>
            </div>

            {inspectedOrder && (
              <div className="p-4 rounded-[8px] bg-[#F9ECF0] text-[13px] space-y-1">
                <p className="font-semibold text-[#0C1015]">
                  {inspectedOrder.orderNumber} — {inspectedOrder.status}
                </p>
                <p className="text-[#535353]">
                  EGP {inspectedOrder.total} ({inspectedOrder.paymentMethod})
                </p>
              </div>
            )}

            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Order status
              </label>
              <select
                value={adminOrderStatus}
                onChange={(e) => setAdminOrderStatus(e.target.value as OrderStatus)}
                className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
              >
                {[
                  'PLACED',
                  'PREPARING',
                  'PICKED_UP',
                  'OUT_FOR_DELIVERY',
                  'ARRIVED',
                  'AWAITING_DELIVERY_CONFIRMATION',
                  'DELIVERED',
                  'CANCELLED',
                ].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Note
              </label>
              <input
                type="text"
                value={adminOrderNote}
                onChange={(e) => setAdminOrderNote(e.target.value)}
                placeholder="Reason for status change..."
                className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[15px] font-medium transition-colors"
            >
              Update Status
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: HOME LAYOUT SECTIONS */}
      {tab === 'home-layout' && (
        <div className="max-w-xl bg-[#F9F9F9] shadow-[0px_0px_2px_rgba(83,83,83,0.25)] rounded-[10px] p-6 sm:p-8 space-y-5">
          <h2 className="text-[18px] font-medium text-[#0C1015]">
            Configure Home Section
          </h2>

          <form onSubmit={handleCreateHomeSection} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Section type
                </label>
                <select
                  value={secType}
                  onChange={(e) => setSecType(e.target.value as 'banner' | 'rail')}
                  className="w-full h-[52px] px-3 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
                >
                  <option value="rail">Rail (Best seller / Occasion)</option>
                  <option value="banner">Promo Banner</option>
                </select>
              </div>
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Order
                </label>
                <input
                  type="number"
                  required
                  value={secOrder}
                  onChange={(e) => setSecOrder(e.target.value)}
                  className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
                />
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                Section title
              </label>
              <input
                type="text"
                required
                value={secTitle}
                onChange={(e) => setSecTitle(e.target.value)}
                className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
              />
            </div>

            {secType === 'banner' && (
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Banner image URL
                </label>
                <input
                  type="url"
                  required
                  value={secBannerUrl}
                  onChange={(e) => setSecBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
                />
              </div>
            )}

            {secType === 'rail' && (
              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-[#F9F9F9] px-1 text-[12px] text-[#535353]">
                  Selection rule
                </label>
                <select
                  value={secRule}
                  onChange={(e) => setSecRule(e.target.value as any)}
                  className="w-full h-[52px] px-4 rounded-[4px] border border-[#535353] bg-[#F9F9F9] text-[14px]"
                >
                  <option value="BEST_SELLERS">BEST_SELLERS</option>
                  <option value="NEW_ARRIVALS">NEW_ARRIVALS</option>
                  <option value="FEATURED">FEATURED</option>
                  <option value="ON_SALE">ON_SALE</option>
                  <option value="MANUAL">MANUAL</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[15px] font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Publish Home Section</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
