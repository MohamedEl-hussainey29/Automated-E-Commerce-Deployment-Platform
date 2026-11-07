import type {
  ApiResponse,
  LoginResponseDto,
  AdminLoginResponseDto,
  RegisterCustomerRequest,
  RegisterCustomerResponseDto,
  VerifyOtpResponseDto,
  SessionDto,
  UserProfileDto,
  VehicleTypeDto,
  VehicleInfoDto,
  DriverApplicationSummaryDto,
  DriverApplicationDetailsDto,
  CategoryDto,
  OccasionDto,
  ProductListItemDto,
  ProductDetailsDto,
  ProductSortOption,
  BatchProductItemDto,
  HomeLayoutSectionDto,
  AdminHomeSectionDto,
  CreateHomeSectionRequest,
  AddressDto,
  AddressDetailsDto,
  CreateOrUpdateAddressRequest,
  CartDto,
  CountryDto,
  GovernorateDto,
  CityDto,
  ReverseGeocodeDto,
  ResolveStoreDto,
  StoreDto,
  CreateOrUpdateStoreRequest,
  CheckoutDetailsDto,
  EstimateDeliveryDto,
  PlaceOrderRequest,
  PlaceOrderResponseDto,
  OrderSummaryDto,
  OrderDetailsDto,
  OrderTrackingDto,
  AvailableOrderDto,
  AssignedOrderDto,
  AssignedOrderDetailsDto,
  DriverStatusUpdate,
  OrderStatus,
} from '../types/api';

export interface ApiCallLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number | 'NETWORK_ERR';
  durationMs: number;
  ok: boolean;
}

type LogListener = (logs: ApiCallLogEntry[]) => void;

class FloraApiClient {
  private logs: ApiCallLogEntry[] = [];
  private listeners: Set<LogListener> = new Set();

  public getBaseUrl(): string {
    return localStorage.getItem('flora_api_base') || import.meta.env.VITE_API_BASE_URL || '';
  }

  public setBaseUrl(url: string) {
    if (!url.trim()) {
      localStorage.removeItem('flora_api_base');
    } else {
      localStorage.setItem('flora_api_base', url.trim().replace(/\/+$/, ''));
    }
  }

  public getToken(): string | null {
    return localStorage.getItem('flora_access_token');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('flora_refresh_token');
  }

  public setTokens(accessToken: string, refreshToken?: string | null) {
    localStorage.setItem('flora_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('flora_refresh_token', refreshToken);
    }
  }

  public clearTokens() {
    localStorage.removeItem('flora_access_token');
    localStorage.removeItem('flora_refresh_token');
    localStorage.removeItem('flora_user');
  }

  public subscribeLogs(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.logs);
    return () => this.listeners.delete(listener);
  }

  private recordLog(entry: ApiCallLogEntry) {
    this.logs = [entry, ...this.logs.slice(0, 49)];
    this.listeners.forEach((l) => l(this.logs));
  }

  public async request<T>(
    path: string,
    options: RequestInit = {},
    retryOn401 = true
  ): Promise<ApiResponse<T>> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${path}`;
    const method = options.method || 'GET';
    const start = performance.now();

    const headers = new Headers(options.headers || {});
    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers.has('Content-Type')
    ) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const durationMs = Math.round(performance.now() - start);

      if (response.status === 401 && retryOn401 && this.getRefreshToken() && !path.includes('/auth/')) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return this.request<T>(path, options, false);
        }
      }

      const contentType = response.headers.get('content-type') || '';
      let json: any = null;
      if (contentType.includes('application/json')) {
        json = await response.json();
      } else {
        const text = await response.text();
        try {
          json = JSON.parse(text);
        } catch {
          json = {
            status: response.ok,
            code: response.status,
            message: text || response.statusText,
            data: null,
          };
        }
      }

      this.recordLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        method,
        path,
        status: response.status,
        durationMs,
        ok: response.ok && json?.status !== false,
      });

      if (!response.ok || json?.status === false) {
        const errMessage =
          json?.errors?.[0]?.message ||
          json?.message ||
          `Request failed with status ${response.status}`;
        const err: any = new Error(errMessage);
        err.response = json;
        err.status = response.status;
        throw err;
      }

      return json as ApiResponse<T>;
    } catch (error: any) {
      if (!error.status) {
        const durationMs = Math.round(performance.now() - start);
        this.recordLog({
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString(),
          method,
          path,
          status: 'NETWORK_ERR',
          durationMs,
          ok: false,
        });
      }
      throw error;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await this.request<{ token: string; refreshToken: string }>(
        '/api/identity/auth/refresh-token',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        },
        false
      );
      if (res.data?.token) {
        this.setTokens(res.data.token, res.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // 1. IDENTITY SERVICE (/api/identity) — 25 Endpoints
  // ==========================================================================

  // 1.1 POST /api/identity/auth/login
  async login(email: string, password: string, deviceId = 'web-browser-01', fcmToken = 'web-fcm-token') {
    return this.request<LoginResponseDto>('/api/identity/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceId, fcmToken }),
    });
  }

  // 1.2 POST /api/identity/auth/admin-login
  async adminLogin(email: string, password: string) {
    return this.request<AdminLoginResponseDto>('/api/identity/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // 1.3 POST /api/identity/auth/register
  async registerCustomer(payload: RegisterCustomerRequest) {
    return this.request<RegisterCustomerResponseDto>('/api/identity/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        deviceId: payload.deviceId ?? 'web-browser-01',
        fcmToken: payload.fcmToken ?? 'web-fcm-token',
        notificationStatus: payload.notificationStatus ?? 0,
      }),
    });
  }

  // 1.4 POST /api/identity/auth/refresh-token
  async refreshToken(refreshToken: string) {
    return this.request<{ token: string; refreshToken: string }>('/api/identity/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // 1.5 POST /api/identity/auth/logout
  async logout(refreshToken: string, deviceId = 'web-browser-01') {
    return this.request<null>('/api/identity/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken, deviceId }),
    });
  }

  // 1.6 POST /api/identity/auth/forget-password
  async forgetPassword(email: string) {
    return this.request<boolean>('/api/identity/auth/forget-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // 1.7 POST /api/identity/auth/otp-verification
  async verifyOtp(email: string, otp: string) {
    return this.request<VerifyOtpResponseDto>('/api/identity/auth/otp-verification', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  // 1.8 POST /api/identity/auth/reset-password
  async resetPassword(otpToken: string, password: string, confirmPassword: string) {
    return this.request<boolean>('/api/identity/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ otpToken, password, confirmPassword }),
    });
  }

  // 1.9 GET /api/identity/auth/sessions
  async getActiveSessions() {
    return this.request<SessionDto[]>('/api/identity/auth/sessions');
  }

  // 1.10 DELETE /api/identity/auth/sessions/{sessionId}
  async revokeSession(sessionId: string) {
    return this.request<null>(`/api/identity/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // 1.11 GET /api/identity/users/me
  async getMyProfile() {
    return this.request<UserProfileDto>('/api/identity/users/me');
  }

  // 1.12 PUT /api/identity/users/profile (multipart/form-data)
  async updateProfile(formData: FormData) {
    return this.request<UserProfileDto>('/api/identity/users/profile', {
      method: 'PUT',
      body: formData,
    });
  }

  // 1.13 POST /api/identity/users/change-password
  async changePassword(currentPassword: string, newPassword: string, confirmNewPassword: string) {
    return this.request<null>('/api/identity/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
    });
  }

  // 1.14 POST /api/identity/guests
  async createGuest(userName: string) {
    return this.request<any>('/api/identity/guests', {
      method: 'POST',
      body: JSON.stringify({ userName }),
    });
  }

  // 1.15 PUT /api/identity/devices/{deviceId}/notifications
  async updateDeviceNotifications(deviceId: string, enabled: boolean) {
    return this.request<{ deviceId: string; notificationsEnabled: boolean }>(
      `/api/identity/devices/${encodeURIComponent(deviceId)}/notifications`,
      {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      }
    );
  }

  // 1.16 PUT /api/identity/devices/fcm-token
  async updateFcmToken(deviceId: string, fcmToken: string) {
    return this.request<Record<string, never>>('/api/identity/devices/fcm-token', {
      method: 'PUT',
      body: JSON.stringify({ deviceId, fcmToken }),
    });
  }

  // 1.17 POST /api/identity/drivers/apply (multipart/form-data)
  async applyAsDriver(formData: FormData) {
    return this.request<any>('/api/identity/drivers/apply', {
      method: 'POST',
      body: formData,
    });
  }

  // 1.18 GET /api/identity/vehicle-types
  async getVehicleTypes() {
    return this.request<VehicleTypeDto[]>('/api/identity/vehicle-types');
  }

  // 1.19 GET /api/identity/vehicles/info
  async getDriverVehicleInfo() {
    return this.request<VehicleInfoDto>('/api/identity/vehicles/info');
  }

  // 1.20 PUT /api/identity/vehicles/info (multipart/form-data)
  async updateDriverVehicleInfo(formData: FormData) {
    return this.request<VehicleInfoDto>('/api/identity/vehicles/info', {
      method: 'PUT',
      body: formData,
    });
  }

  // 1.21 POST /api/identity/admin/vehicles/Create
  async adminCreateVehicleType(name: string) {
    return this.request<{ id: string; createdBy: string; name: string; createdAt: string }>(
      '/api/identity/admin/vehicles/Create',
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      }
    );
  }

  // 1.22 GET /api/identity/admin/drivers/applications
  async adminGetDriverApplications(page = 1, pageSize = 20, deliveryStatus?: string | number) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (deliveryStatus !== undefined && deliveryStatus !== '') {
      params.set('deliveryStatus', String(deliveryStatus));
    }
    const res = await this.request<DriverApplicationSummaryDto[]>(
      `/api/identity/admin/drivers/applications?${params.toString()}`
    );
    if (res.data) {
      res.data = res.data.filter(
        (d) => d.name && d.name.toLowerCase() !== 'string string'
      );
    }
    return res;
  }

  // 1.23 GET /api/identity/admin/drivers/applications/{driverId}
  async adminGetDriverApplicationDetails(applicationId: string) {
    return this.request<DriverApplicationDetailsDto>(
      `/api/identity/admin/drivers/applications/${applicationId}`
    );
  }

  // 1.24 PATCH /api/identity/admin/drivers/applications/approve
  async adminApproveDriverApplication(applicationId: string) {
    return this.request<any>('/api/identity/admin/drivers/applications/approve', {
      method: 'PATCH',
      body: JSON.stringify({ applicationId }),
    });
  }

  // 1.25 PATCH /api/identity/admin/drivers/applications/reject
  async adminRejectDriverApplication(applicationId: string, reason: string) {
    return this.request<any>('/api/identity/admin/drivers/applications/reject', {
      method: 'PATCH',
      body: JSON.stringify({ applicationId, reason }),
    });
  }

  // ==========================================================================
  // 2. CATALOG SERVICE (/api/catalog) — 20 Endpoints
  // ==========================================================================

  // 2.1 GET /api/catalog/home/layout
  async getHomeLayout(storeId?: string | null) {
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
    return this.request<HomeLayoutSectionDto[]>(`/api/catalog/home/layout${q}`);
  }

  // 2.2 GET /api/catalog/categories
  async getCategories(page = 1, pageSize = 50) {
    return this.request<CategoryDto[]>(
      `/api/catalog/categories?page=${page}&pageSize=${pageSize}`
    );
  }

  // 2.3 GET /api/catalog/occasions
  async getOccasions(page = 1, pageSize = 50) {
    return this.request<OccasionDto[]>(
      `/api/catalog/occasions?page=${page}&pageSize=${pageSize}`
    );
  }

  // 2.4 GET /api/catalog/products
  async getProducts(params: {
    categoryId?: string;
    occasionId?: string;
    storeId?: string;
    sort?: ProductSortOption;
    page?: number;
    pageSize?: number;
  } = {}) {
    const qs = new URLSearchParams();
    if (params.categoryId) qs.set('categoryId', params.categoryId);
    if (params.occasionId) qs.set('occasionId', params.occasionId);
    if (params.storeId) qs.set('storeId', params.storeId);
    qs.set('sort', params.sort ?? 'OldestFirst');
    qs.set('page', String(params.page ?? 1));
    qs.set('pageSize', String(Math.max(params.pageSize ?? 12, 100)));
    const res = await this.request<ProductListItemDto[]>(`/api/catalog/products?${qs.toString()}`);
    if (res.data) {
      const filtered = res.data.filter(
        (p) => !/^Test Pagination Product/i.test(p.name)
      );
      res.data = params.pageSize ? filtered.slice(0, params.pageSize) : filtered;
      if (res.pagination) {
        res.pagination.totalCount = filtered.length;
        res.pagination.totalPages = Math.max(
          1,
          Math.ceil(filtered.length / (params.pageSize ?? 12))
        );
      }
    }
    return res;
  }

  // 2.5 GET /api/catalog/products/search
  async searchProducts(params: {
    q: string;
    storeId?: string;
    sort?: ProductSortOption;
    page?: number;
    pageSize?: number;
  }) {
    const qs = new URLSearchParams({ q: params.q });
    if (params.storeId) qs.set('storeId', params.storeId);
    if (params.sort) qs.set('sort', params.sort);
    qs.set('page', String(params.page ?? 1));
    qs.set('pageSize', String(Math.max(params.pageSize ?? 12, 100)));
    const res = await this.request<ProductListItemDto[]>(`/api/catalog/products/search?${qs.toString()}`);
    if (res.data) {
      const filtered = res.data.filter(
        (p) => !/^Test Pagination Product/i.test(p.name)
      );
      res.data = params.pageSize ? filtered.slice(0, params.pageSize) : filtered;
      if (res.pagination) {
        res.pagination.totalCount = filtered.length;
        res.pagination.totalPages = Math.max(
          1,
          Math.ceil(filtered.length / (params.pageSize ?? 12))
        );
      }
    }
    return res;
  }

  // 2.6 GET /api/catalog/products/{id}
  async getProductDetails(productId: string, storeId?: string | null) {
    const qs = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
    return this.request<ProductDetailsDto>(`/api/catalog/products/${productId}${qs}`);
  }

  // 2.7 POST /api/catalog/products/batch
  async batchGetProducts(productIds: string[], storeId?: string | null) {
    return this.request<{ products: BatchProductItemDto[] }>('/api/catalog/products/batch', {
      method: 'POST',
      body: JSON.stringify({ productIds, storeId: storeId || null }),
    });
  }

  // 2.8 POST /api/catalog/admin/categories (multipart/form-data)
  async adminCreateCategory(formData: FormData) {
    return this.request<CategoryDto>('/api/catalog/admin/categories', {
      method: 'POST',
      body: formData,
    });
  }

  // 2.9 PUT /api/catalog/admin/categories/{categoryId}
  async adminUpdateCategory(categoryId: string, formData: FormData) {
    return this.request<CategoryDto>(`/api/catalog/admin/categories/${categoryId}`, {
      method: 'PUT',
      body: formData,
    });
  }

  // 2.10 DELETE /api/catalog/admin/categories/{categoryId}
  async adminArchiveCategory(categoryId: string) {
    return this.request<CategoryDto>(`/api/catalog/admin/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // 2.11 POST /api/catalog/admin/occasions (multipart/form-data)
  async adminCreateOccasion(formData: FormData) {
    return this.request<OccasionDto>('/api/catalog/admin/occasions', {
      method: 'POST',
      body: formData,
    });
  }

  // 2.12 PUT /api/catalog/admin/occasions/{occasionId}
  async adminUpdateOccasion(occasionId: string, formData: FormData) {
    return this.request<OccasionDto>(`/api/catalog/admin/occasions/${occasionId}`, {
      method: 'PUT',
      body: formData,
    });
  }

  // 2.13 DELETE /api/catalog/admin/occasions/{occasionId}
  async adminArchiveOccasion(occasionId: string) {
    return this.request<OccasionDto>(`/api/catalog/admin/occasions/${occasionId}`, {
      method: 'DELETE',
    });
  }

  // 2.14 POST /api/catalog/admin/products (multipart/form-data)
  async adminCreateProduct(formData: FormData) {
    return this.request<ProductDetailsDto>('/api/catalog/admin/products', {
      method: 'POST',
      body: formData,
    });
  }

  // 2.15 PUT /api/catalog/admin/products/{productId}
  async adminUpdateProduct(productId: string, formData: FormData) {
    return this.request<ProductDetailsDto>(`/api/catalog/admin/products/${productId}`, {
      method: 'PUT',
      body: formData,
    });
  }

  // 2.16 DELETE /api/catalog/admin/products/{productId}
  async adminArchiveProduct(productId: string) {
    return this.request<ProductDetailsDto>(`/api/catalog/admin/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // 2.17 POST /api/catalog/admin/home-sections
  async adminCreateHomeSection(payload: CreateHomeSectionRequest) {
    return this.request<AdminHomeSectionDto>('/api/catalog/admin/home-sections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 2.18 PUT /api/catalog/admin/home-sections/{sectionId}
  async adminUpdateHomeSection(sectionId: string, payload: Omit<CreateHomeSectionRequest, 'type'>) {
    return this.request<AdminHomeSectionDto>(`/api/catalog/admin/home-sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // 2.19 PATCH /api/catalog/admin/home-sections/reorder
  async adminReorderHomeSections(sections: { id: string; order: number }[]) {
    return this.request<AdminHomeSectionDto[]>('/api/catalog/admin/home-sections/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ sections }),
    });
  }

  // 2.20 PATCH /api/catalog/admin/home-sections/{sectionId}/status
  async adminToggleHomeSectionStatus(sectionId: string, enabled: boolean) {
    return this.request<AdminHomeSectionDto>(
      `/api/catalog/admin/home-sections/${sectionId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      }
    );
  }

  // ==========================================================================
  // 3. ADDRESS & CART SERVICE (/api/address-cart) — 21 Endpoints
  // ==========================================================================

  // 3.1 GET /api/address-cart/cart
  async getCart() {
    return this.request<CartDto>('/api/address-cart/cart');
  }

  // 3.2 GET /api/address-cart/users/me/carts/{cartId}
  async getCartById(cartId: string) {
    return this.request<CartDto>(`/api/address-cart/users/me/carts/${cartId}`);
  }

  // 3.3 POST /api/address-cart/cart/items
  async addCartItem(productId: string, quantity = 1) {
    return this.request<{
      cartId: string;
      itemId: string;
      productId: string;
      quantity: number;
      priceAtAdd: number;
    }>('/api/address-cart/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  // 3.4 PATCH /api/address-cart/cart/items/{itemId}
  async updateCartItemQuantity(itemId: string, quantity: number) {
    return this.request<CartDto>(`/api/address-cart/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  // 3.5 DELETE /api/address-cart/cart/items/{itemId}
  async removeCartItem(itemId: string) {
    return this.request<CartDto>(`/api/address-cart/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // 3.6 GET /api/address-cart/addresses
  async getAddresses() {
    return this.request<AddressDto[]>('/api/address-cart/addresses');
  }

  // 3.7 GET /api/address-cart/users/me/addresses/{id}
  async getAddressDetails(addressId: string) {
    return this.request<AddressDetailsDto>(`/api/address-cart/users/me/addresses/${addressId}`);
  }

  // 3.8 POST /api/address-cart/users/me/addresses
  async createAddress(payload: CreateOrUpdateAddressRequest) {
    return this.request<AddressDto>('/api/address-cart/users/me/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 3.9 PUT /api/address-cart/users/me/addresses/{id}
  async updateAddress(addressId: string, payload: CreateOrUpdateAddressRequest) {
    return this.request<AddressDto>(`/api/address-cart/users/me/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // 3.10 PATCH /api/address-cart/users/me/addresses/{id}/default
  async setDefaultAddress(addressId: string) {
    return this.request<{ addressId: string; isDefault: boolean; updatedAt: string }>(
      `/api/address-cart/users/me/addresses/${addressId}/default`,
      { method: 'PATCH' }
    );
  }

  // 3.11 DELETE /api/address-cart/users/me/addresses/{id}
  async deleteAddress(addressId: string) {
    return this.request<null>(`/api/address-cart/users/me/addresses/${addressId}`, {
      method: 'DELETE',
    });
  }

  // 3.12 GET /api/address-cart/geocoding/reverse
  async reverseGeocode(lat: number, lng: number) {
    return this.request<ReverseGeocodeDto>(
      `/api/address-cart/geocoding/reverse?lat=${lat}&lng=${lng}`
    );
  }

  // 3.13 GET /api/address-cart/locations/countries
  async getCountries(search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<CountryDto[]>(`/api/address-cart/locations/countries${q}`);
  }

  // 3.14 GET /api/address-cart/locations/governorates
  async getGovernorates() {
    return this.request<GovernorateDto[]>('/api/address-cart/locations/governorates');
  }

  // 3.15 GET /api/address-cart/locations/governorates/{governorateId}/cities
  async getCities(governorateId: number) {
    return this.request<CityDto[]>(
      `/api/address-cart/locations/governorates/${governorateId}/cities`
    );
  }

  // 3.16 GET /api/address-cart/stores/resolve
  async resolveStore(params: { addressId?: string; lat?: number; lng?: number }) {
    const qs = new URLSearchParams();
    if (params.addressId) qs.set('addressId', params.addressId);
    if (params.lat !== undefined) qs.set('lat', String(params.lat));
    if (params.lng !== undefined) qs.set('lng', String(params.lng));
    return this.request<ResolveStoreDto>(`/api/address-cart/stores/resolve?${qs.toString()}`);
  }

  // 3.17 GET /api/address-cart/admin/stores
  async adminGetStores(page = 1, limit = 20) {
    return this.request<StoreDto[]>(
      `/api/address-cart/admin/stores?page=${page}&limit=${limit}`
    );
  }

  // 3.18 GET /api/address-cart/admin/stores/{storeId}
  async adminGetStoreDetails(storeId: string) {
    return this.request<StoreDto>(`/api/address-cart/admin/stores/${storeId}`);
  }

  // 3.19 POST /api/address-cart/admin/stores
  async adminCreateStore(payload: CreateOrUpdateStoreRequest) {
    return this.request<StoreDto>('/api/address-cart/admin/stores', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 3.20 PUT /api/address-cart/admin/stores/{storeId}
  async adminUpdateStore(storeId: string, payload: CreateOrUpdateStoreRequest) {
    return this.request<StoreDto>(`/api/address-cart/admin/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // 3.21 DELETE /api/address-cart/admin/stores/{storeId}
  async adminDeactivateStore(storeId: string) {
    return this.request<StoreDto>(`/api/address-cart/admin/stores/${storeId}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // 4. ORDERS SERVICE (/api/orders) & PAYMENT SERVICE (/api/payment) — 16 Endpoints
  // ==========================================================================

  // 4.1 GET /api/orders/checkout/details
  async getCheckoutDetails(cartId: string) {
    return this.request<CheckoutDetailsDto>(
      `/api/orders/checkout/details?cartId=${encodeURIComponent(cartId)}`
    );
  }

  // 4.2 GET /api/orders/checkout/estimate-delivery
  async getEstimateDelivery(addressId: string, cartId: string) {
    return this.request<EstimateDeliveryDto>(
      `/api/orders/checkout/estimate-delivery?addressId=${encodeURIComponent(
        addressId
      )}&cartId=${encodeURIComponent(cartId)}`
    );
  }

  // 4.3 POST /api/orders/place (Requires Idempotency-Key header)
  async placeOrder(payload: PlaceOrderRequest, idempotencyKey?: string) {
    return this.request<PlaceOrderResponseDto>('/api/orders/place', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey || crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });
  }

  // 4.4 POST /api/orders/{orderId}/retry-payment
  async retryOrderPayment(orderId: string) {
    return this.request<{ sessionUrl?: string; sessionId?: string }>(
      `/api/orders/${orderId}/retry-payment`,
      { method: 'POST' }
    );
  }

  // 4.5 GET /api/orders/
  async getMyOrders(page = 1, pageSize = 10) {
    return this.request<OrderSummaryDto[]>(`/api/orders/?page=${page}&pageSize=${pageSize}`);
  }

  // 4.6 GET /api/orders/{orderId}
  async getOrderDetails(orderId: string) {
    return this.request<OrderDetailsDto>(`/api/orders/${orderId}`);
  }

  // 4.7 GET /api/orders/{orderId}/tracking
  async getOrderTracking(orderId: string) {
    return this.request<OrderTrackingDto>(`/api/orders/${orderId}/tracking`);
  }

  // 4.8 POST /api/orders/{orderId}/confirm-delivery
  async confirmOrderDelivery(orderId: string) {
    return this.request<any>(`/api/orders/${orderId}/confirm-delivery`, {
      method: 'POST',
    });
  }

  // 4.9 GET /api/orders/drivers/available-orders
  async driverGetAvailableOrders(page = 1, pageSize = 20) {
    return this.request<AvailableOrderDto[]>(
      `/api/orders/drivers/available-orders?page=${page}&pageSize=${pageSize}`
    );
  }

  // 4.10 POST /api/orders/{orderId}/claim
  async driverClaimOrder(orderId: string) {
    return this.request<any>(`/api/orders/${orderId}/claim`, {
      method: 'POST',
    });
  }

  // 4.11 GET /api/orders/drivers/me/orders
  async driverGetAssignedOrders(page = 1, pageSize = 20, status?: OrderStatus | '') {
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) qs.set('status', status);
    return this.request<AssignedOrderDto[]>(`/api/orders/drivers/me/orders?${qs.toString()}`);
  }

  // 4.12 GET /api/orders/drivers/me/assigned-order
  async driverGetCurrentAssignedOrder() {
    return this.request<AssignedOrderDetailsDto>('/api/orders/drivers/me/assigned-order');
  }

  // 4.13 GET /api/orders/drivers/me/orders/{orderId}
  async driverGetAssignedOrderDetails(orderId: string) {
    return this.request<AssignedOrderDetailsDto>(`/api/orders/drivers/me/orders/${orderId}`);
  }

  // 4.14 POST /api/orders/drivers/me/location
  async driverReportLocation(lat: number, lng: number, recordedAt?: string) {
    return this.request<any>('/api/orders/drivers/me/location', {
      method: 'POST',
      body: JSON.stringify({
        lat,
        lng,
        recordedAt: recordedAt || new Date().toISOString(),
      }),
    });
  }

  // 4.15 PATCH /api/orders/{orderId}/status (Driver status update)
  async driverUpdateOrderStatus(orderId: string, status: DriverStatusUpdate, note?: string) {
    return this.request<any>(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note: note || null }),
    });
  }

  // 4.16 PATCH /api/orders/admin/orders/{orderId}/status (Admin status update)
  async adminUpdateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
    return this.request<any>(`/api/orders/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note: note || null }),
    });
  }
}

export const api = new FloraApiClient();

