// ============================================================================
// Unified API Response Envelope & Shared Models
// ============================================================================

export interface ApiError {
  message: string;
  field?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  status: boolean;
  code: number;
  message: string;
  data: T;
  pagination?: PaginationMeta | null;
  errors?: ApiError[] | null;
}

// ============================================================================
// Domain Enums
// ============================================================================

export type GenderEnum = 0 | 1; // 0 = Male, 1 = Female
export type NotificationStatusEnum = 0 | 1; // 0 = on, 1 = off
export type DeliveryStatusEnum = 0 | 1 | 2 | 3; // 0 = Pending, 1 = Review, 2 = Rejected, 3 = Approved

export type ProductSortOption =
  | 'PriceLowToHigh'
  | 'PriceHighToLow'
  | 'NewestFirst'
  | 'OldestFirst';

export type OrderStatus =
  | 'PLACED'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED'
  | 'AWAITING_DELIVERY_CONFIRMATION'
  | 'DELIVERED'
  | 'CANCELLED';

export type DriverStatusUpdate =
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED'
  | 'AWAITING_DELIVERY_CONFIRMATION';

export type PaymentMethod = 'COD' | 'CARD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export type CoverageAreaType = 'POLYGON' | 'RADIUS' | 'CITY_AREA_LIST';

// ============================================================================
// 1. IdentityService DTOs (/api/identity)
// ============================================================================

export interface AuthUserDto {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
  gender?: string;
  notificationStatus?: string;
}

export interface LoginResponseDto {
  user: AuthUserDto;
  token: string;
  refreshToken: string;
}

export interface AdminLoginResponseDto {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
  };
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

export interface RegisterCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: GenderEnum;
  password: string;
  confirmPassword: string;
  deviceId?: string | null;
  fcmToken?: string | null;
  notificationStatus?: NotificationStatusEnum;
}

export interface RegisterCustomerResponseDto {
  user: AuthUserDto;
  token: string;
}

export interface VerifyOtpResponseDto {
  otpToken: string;
  expiresInMinutes: number;
}

export interface SessionDto {
  id: string;
  deviceName: string | null;
  ipAddress: string | null;
  location: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  isCurrent: boolean;
}

export interface UserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: number;
  profilePictureUrl: string | null;
}

export interface VehicleTypeDto {
  id: string;
  name: string;
}

export interface VehicleInfoDto {
  vehicleId: string;
  vehicleTypeId: string;
  vehicleTypeName?: string;
  plateNumber: string;
  capacity?: number;
  licenseDocument: string;
}

export interface DriverApplicationSummaryDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  submittedAt: string;
  status: number | string;
}

export interface DriverApplicationDetailsDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  vehiclePlateNumber: string;
  vehicleType: string;
  vehicleCapacity: number;
  licenceImageUrl: string;
  nid: string;
  nidImageUrl: string;
  status: string;
  rejectReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}

// ============================================================================
// 2. CatalogService DTOs (/api/catalog)
// ============================================================================

export interface CategoryDto {
  id: string;
  name: string;
  iconUrl: string | null;
  displayOrder?: number;
  order?: number;
  isDeleted?: boolean;
  status?: string;
  createdAt: string;
  updatedAt: string;
  lastChangedBy?: string;
}

export interface OccasionDto {
  id: string;
  name: string;
  imageUrl: string | null;
  displayOrder?: number;
  order?: number;
  isActive?: boolean;
  status?: string;
  createdAt: string;
  updatedAt: string;
  lastChangedBy?: string;
}

export interface ProductListItemDto {
  id: string;
  name: string;
  price: number;
  discountPercentage: number | null;
  discountPrice: number | null;
  inStock: boolean;
  categoryId: string;
  categoryName: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface ProductDetailsDto {
  id: string;
  name: string;
  price: number;
  discountedPrice: number | null;
  discountPercent: number | null;
  inStock: boolean;
  images: string[];
  description: string;
  includes: string[];
  availabilityStatus: string;
  availableStock: number;
  categoryIds: string[];
  occasionIds: string[];
  catalogStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchProductItemDto {
  id: string;
  name: string;
  price: number;
  effectivePrice: number;
  discountedPrice: number | null;
  discountPercent: number | null;
  isAvailable: boolean;
  availableStock: number;
  primaryImageUrl: string | null;
  isArchived: boolean;
}

export interface HomeLayoutSectionDto {
  id: string;
  type: 'Banner' | 'CategoryRail' | 'ProductRail' | 'OccasionRail' | string;
  title: string | null;
  order: number;
  isEnabled: boolean;
  payload: {
    type?: string;
    imageUrl?: string;
    clickAction?: string;
    items?: any[];
    viewAllAction?: string | null;
  };
}

export interface AdminHomeSectionDto {
  id: string;
  type: string;
  title: string;
  order: number;
  enabled: boolean;
  viewAllDeeplink: string | null;
  bannerImageUrl: string | null;
  bannerDeeplink: string | null;
  productSelectionRule: string | null;
  categories: CategoryDto[];
  products: {
    id: string;
    name: string;
    price: number;
    discountedPrice: number;
    discountPercent: number | null;
    inStock: boolean;
    imageUrl: string | null;
  }[];
  occasions: OccasionDto[];
  updatedAt: string;
}

export interface CreateHomeSectionRequest {
  type: 'banner' | 'rail';
  title: string;
  order: number;
  enabled: boolean;
  viewAllDeeplink?: string | null;
  bannerImageUrl?: string | null;
  bannerDeeplink?: string | null;
  categoryIds?: string[];
  occasionIds?: string[];
  productSelectionRule?: 'MANUAL' | 'BEST_SELLERS' | 'NEW_ARRIVALS' | 'FEATURED' | 'ON_SALE' | null;
  productIds?: string[];
}

// ============================================================================
// 3. AddressCartService DTOs (/api/address-cart)
// ============================================================================

export interface AddressDto {
  id: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  governorateId: number;
  governorateName: string;
  cityId: number;
  cityName: string;
  area: string;
  label: string | null;
  lat: number;
  lng: number;
  isDefault: boolean;
  storeId: string | null;
  isServiceable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressDetailsDto extends AddressDto {
  storeName: string | null;
  storePhoneNumber: string | null;
  storeWhatsAppNumber: string | null;
  storeImageUrl: string | null;
  storeAddressLine: string | null;
  storeLat: number | null;
  storeLng: number | null;
}

export interface CreateOrUpdateAddressRequest {
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  governorateId: number;
  cityId: number;
  area: string;
  lat: number;
  lng: number;
  label?: string | null;
}

export interface CartItemDto {
  itemId: string;
  productId: string;
  productName: string;
  productImage: string | null;
  unitPrice: number;
  priceAtAdd: number;
  quantity: number;
  lineSubtotal: number;
  availableStock: number;
  isAvailable: boolean;
  priceChanged: boolean;
  stockChanged: boolean;
}

export interface CartDto {
  cartId: string;
  items: CartItemDto[];
  totalQuantity: number;
  lineCount: number;
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  hasChanges: boolean;
}

export interface CountryDto {
  id: number;
  nameAr: string;
  nameEn: string;
  code: string;
  phoneCode: string;
}

export interface GovernorateDto {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface CityDto {
  id: number;
  governorateId: number;
  nameAr: string;
  nameEn: string;
}

export interface ReverseGeocodeDto {
  addressLine: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
}

export interface ResolveStoreDto {
  storeId: string | null;
  isServiceable: boolean;
}

export interface StoreCoverageAreaDto {
  type: CoverageAreaType;
  polygon?: { lat: number; lng: number }[] | null;
  radius?: { centerLat: number; centerLng: number; radiusKm: number } | null;
  cityAreas?: { city: string; area: string }[] | null;
}

export interface StoreDto {
  id: string;
  name: string;
  phoneNumber: string | null;
  whatsAppNumber: string | null;
  imageUrl: string | null;
  location: {
    addressLine: string;
    lat: number;
    lng: number;
  };
  coverageArea: StoreCoverageAreaDto;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrUpdateStoreRequest {
  name: string;
  location: {
    addressLine: string;
    lat: number;
    lng: number;
  };
  coverageArea: StoreCoverageAreaDto;
  phoneNumber?: string | null;
  whatsAppNumber?: string | null;
  imageUrl?: string | null;
}

// ============================================================================
// 4. OrdersService & PaymentService DTOs (/api/orders & /api/payment)
// ============================================================================

export interface CheckoutDetailsDto {
  cartId: string;
  addressId: string | null;
  isServiceable: boolean;
  subtotal: number;
  deliveryFee: number;
  total: number;
  estimatedDeliveryAt: string | null;
  paymentMethods: {
    method: string;
    gateways: string[] | null;
  }[];
  isGift: boolean;
  giftRecipientName: string | null;
  giftRecipientPhone: string | null;
}

export interface EstimateDeliveryDto {
  addressId: string;
  isServiceable: boolean;
  deliveryFee: number;
  estimatedDeliveryAt: string;
}

export interface PlaceOrderRequest {
  cartId: string;
  addressId: string;
  isGift: boolean;
  giftRecipient?: {
    recipientName: string;
    recipientPhone: string;
  } | null;
  paymentMethod: PaymentMethod;
  paymentGateway?: string | null;
}

export interface PlaceOrderResponseDto {
  orderId: string;
  status: OrderStatus;
  gateway: string | null;
  sessionId: string | null;
  sessionUrl: string | null;
  successUrl: string | null;
  cancelUrl: string | null;
}

export interface OrderSummaryDto {
  id: string;
  orderNumber: string;
  createdAt: string;
  itemCount: number;
  firstItemThumbnailUrl: string | null;
  status: OrderStatus;
  total: number;
  paymentStatus: PaymentStatus;
}

export interface OrderItemDto {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
}

export interface OrderDetailsDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  items: OrderItemDto[];
  deliveryAddress: {
    city: string;
    area: string;
    addressLine: string;
    recipientName: string;
    recipientPhone: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  isGift: boolean;
  giftRecipientName: string | null;
  giftRecipientPhone: string | null;
  giftRecipientAddress: string | null;
  isLiveTrackingAvailable: boolean;
}

export interface OrderTrackingStageDto {
  status: OrderStatus;
  isCompleted: boolean;
  isCurrent: boolean;
  occurredAt: string | null;
}

export interface OrderTrackingDto {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  isTrackingActive: boolean;
  timeline: OrderTrackingStageDto[];
  driver: {
    driverId: string;
    name: string | null;
    phone: string | null;
    imageUrl: string | null;
    assignedAt: string | null;
  } | null;
  lastKnownLocation: {
    lat: number;
    lng: number;
    recordedAt: string;
    ageSeconds: number;
    isStale: boolean;
  } | null;
  destination: {
    lat: number | null;
    lng: number | null;
    recipientName: string;
    addressLine: string;
    city: string;
    area: string;
  } | null;
  storeLocation: {
    lat: number | null;
    lng: number | null;
  } | null;
}

export interface AvailableOrderDto {
  orderId: string;
  customerName: string;
  customerAddress: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface AssignedOrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusDisplay: string;
  placedAt: string;
  assignedAt: string;
  itemCount: number;
  total: number;
  isGift: boolean;
  destination: {
    recipientName: string;
    recipientPhone: string;
    addressLine: string;
    city: string;
    area: string;
    lat: number | null;
    lng: number | null;
  } | null;
}

export interface AssignedOrderDetailsDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusDisplay: string;
  assignmentStatus: string;
  placedAt: string;
  assignedAt: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentMethodDisplay: string;
  currency: string;
  paymentStatus: string;
  isGift: boolean;
  pickup: {
    storeId: string;
    name: string;
    phoneNumber: string | null;
    whatsAppNumber: string | null;
    imageUrl: string | null;
    addressLine: string;
    lat: number | null;
    lng: number | null;
  };
  user: {
    id: string;
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    area: string;
    lat: number | null;
    lng: number | null;
  };
  items: OrderItemDto[];
  destination: {
    recipientName: string;
    recipientPhone: string;
    addressLine: string;
    city: string;
    area: string;
    lat: number | null;
    lng: number | null;
  } | null;
}

