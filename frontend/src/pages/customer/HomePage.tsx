import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  AlertCircle,
  RefreshCw,
  MapPin,
  Flower2,
  Flower,
  Sparkles,
  Crown,
  Sun,
  Gift,
  Sprout,
  Gem,
  CreditCard,
  ShoppingCart,
  Heart,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import type {
  CategoryDto,
  OccasionDto,
  ProductListItemDto,
  HomeLayoutSectionDto,
} from '../../types/api';

const getCategoryReadyIcon = (name: string, index: number): LucideIcon => {
  const lower = name.toLowerCase();
  if (lower.includes('rose')) return Flower2;
  if (lower.includes('tulip')) return Flower;
  if (lower.includes('lil')) return Sparkles;
  if (lower.includes('orchid')) return Crown;
  if (lower.includes('sunflower')) return Sun;
  if (lower.includes('bouquet')) return Heart;
  if (lower.includes('plant') || lower.includes('vase')) return Sprout;
  if (lower.includes('gift') || lower.includes('box')) return Gift;
  if (lower.includes('card')) return CreditCard;
  if (lower.includes('jewel')) return Gem;

  const fallbackIcons: LucideIcon[] = [
    Flower2,
    Flower,
    Sparkles,
    Crown,
    Sun,
    Heart,
    Sprout,
    Gift,
  ];
  return fallbackIcons[index % fallbackIcons.length];
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    selectedStoreId,
    selectedAddress,
    userAddresses,
    openAddressModal,
  } = useAuth();
  const { addToCart } = useCart();

  const [homeSections, setHomeSections] = useState<HomeLayoutSectionDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [occasions, setOccasions] = useState<OccasionDto[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [layoutRes, catRes, occRes, prodRes] = await Promise.all([
        api.getHomeLayout(selectedStoreId),
        api.getCategories(1, 20),
        api.getOccasions(1, 20),
        api.getProducts({ storeId: selectedStoreId || undefined, page: 1, pageSize: 8 }),
      ]);

      setHomeSections(layoutRes.data || []);
      setCategories((catRes.data || []).filter((c) => !c.isDeleted));
      setOccasions((occRes.data || []).filter((o) => o.isActive !== false));
      setFeaturedProducts(prodRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [selectedStoreId]);

  const bannerSection = homeSections.find(
    (s) => s.type?.toLowerCase().includes('banner') && s.isEnabled !== false
  );

  const displayCategories =
    categories.length > 0
      ? categories
      : [
          { id: 'flowers', name: 'Flowers', sortOrder: 1 },
          { id: 'gift', name: 'Gift', sortOrder: 2 },
          { id: 'card', name: 'Card', sortOrder: 3 },
          { id: 'jewellery', name: 'Jewellery', sortOrder: 4 },
        ];

  const displayOccasions =
    occasions.length > 0
      ? occasions
      : [
          { id: 'wedding', name: 'Wedding', imageUrl: null },
          { id: 'birthday', name: 'Birthday', imageUrl: null },
          { id: 'graduation', name: 'Graduation', imageUrl: null },
          { id: 'anniversary', name: 'Anniversary', imageUrl: null },
        ];

  const activeAddr = selectedAddress || userAddresses.find((a) => a.isDefault) || userAddresses[0];
  const deliveryLabel = activeAddr
    ? `${activeAddr.addressLine} - ${activeAddr.area || activeAddr.cityName}`
    : isAuthenticated
    ? (userAddresses.length > 0
        ? `${userAddresses[0].addressLine} - ${userAddresses[0].area || userAddresses[0].cityName}`
        : 'Add your delivery address')
    : 'Cairo, Egypt (Select location)';

  return (
    <div className="bg-[#F9F9F9] min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-8">
        {/* Deliver to location bar */}
        <button
          onClick={openAddressModal}
          className="flex items-center gap-2 text-left group hover:opacity-80 transition-all cursor-pointer py-1"
          aria-label="Change delivery address"
        >
          <MapPin className="w-5 h-5 text-[#D21E6A] shrink-0 group-hover:scale-110 transition-transform" />
          <p className="text-[14px] font-medium text-[#35383C]">
            <span>Deliver to </span>
            <span className="text-[#0C1015] font-semibold underline decoration-[#D21E6A]/30 group-hover:decoration-[#D21E6A]">
              {deliveryLabel}
            </span>
          </p>
          <ChevronDown className="w-4 h-4 text-[#D21E6A] shrink-0 transition-transform group-hover:translate-y-0.5" />
        </button>

        {/* Optional Banner */}
        {bannerSection?.payload?.imageUrl && (
          <div className="rounded-[16px] overflow-hidden bg-[#F9ECF0] border border-[#CFCFCF]">
            <img
              src={bannerSection.payload.imageUrl}
              alt={bannerSection.title || 'Flowery Banner'}
              className="w-full max-h-64 object-cover"
            />
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="bg-[#F9ECF0] border border-[#D21E6A]/30 rounded-[10px] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#D21E6A] shrink-0" />
              <p className="text-xs text-[#0C1015]">{error}</p>
            </div>
            <button
              onClick={fetchHomeData}
              className="px-4 py-2 rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-xs font-medium flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Categories Section with Ready Icons */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-medium text-[#0C1015]">Categories</h2>
            <Link
              to="/catalog"
              className="text-[12px] font-medium text-[#D21E6A] underline hover:opacity-80"
            >
              View All
            </Link>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:overflow-visible">
            {displayCategories.map((cat, idx) => {
              const IconComponent = getCategoryReadyIcon(cat.name, idx);
              const isRealId = categories.length > 0;
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    navigate(isRealId ? `/catalog?categoryId=${cat.id}` : '/catalog')
                  }
                  className="flex flex-col items-center gap-2 shrink-0 w-[76px] sm:w-full group focus:outline-none cursor-pointer"
                >
                  <div className="bg-[#F9ECF0] group-hover:bg-[#F6D2E1] h-[64px] sm:h-[72px] w-full rounded-[20px] flex items-center justify-center transition-colors">
                    <IconComponent className="w-6 h-6 text-[#D21E6A]" />
                  </div>
                  <span className="text-[14px] font-normal text-[#0C1015] group-hover:text-[#D21E6A] transition-colors truncate max-w-full">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Best Seller Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-medium text-[#0C1015]">Best seller</h2>
            <Link
              to="/catalog"
              className="text-[12px] font-medium text-[#D21E6A] underline hover:opacity-80"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-[240px] rounded-[8px] border-[0.5px] border-[#A6A6A6] bg-white p-2 animate-pulse"
                >
                  <div className="bg-[#F9ECF0] h-[131px] w-full rounded-[4px]" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="bg-white rounded-[8px] border-[0.5px] border-[#A6A6A6] p-8 text-center text-xs text-[#535353]">
              No products available right now.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => {
                const hasDiscount =
                  product.discountPrice != null && product.discountPrice < product.price;
                const effectivePrice = hasDiscount ? product.discountPrice! : product.price;
                const discountPct =
                  product.discountPercentage ??
                  (hasDiscount
                    ? Math.round(((product.price - effectivePrice) / product.price) * 100)
                    : null);

                return (
                  <div
                    key={product.id}
                    className="border-[#A6A6A6] border-[0.5px] rounded-[8px] p-[8px] bg-white flex flex-col gap-[8px] hover:border-[#D21E6A] transition-colors"
                  >
                    <Link
                      to={`/products/${product.id}`}
                      className="bg-[#F9ECF0] h-[135px] sm:h-[165px] w-full flex items-center justify-center p-[8px] overflow-hidden rounded-[4px] group"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover rounded-[4px] group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <Flower2 className="w-12 h-12 text-[#D21E6A]/60" />
                      )}
                    </Link>

                    <div className="flex flex-col gap-[4px] items-start px-1">
                      <Link
                        to={`/products/${product.id}`}
                        className="text-[12px] sm:text-[13px] font-normal text-[#0C1015] hover:text-[#D21E6A] line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-medium text-[#0C1015]">
                          EGP {effectivePrice.toFixed(0)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[12px] font-normal text-[#535353] line-through">
                            {product.price.toFixed(0)}
                          </span>
                        )}
                        {discountPct != null && discountPct > 0 && (
                          <span className="text-[12px] font-normal text-[#0CB359]">
                            {discountPct}%
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product.id, 1)}
                      disabled={!product.inStock}
                      className={`mt-auto h-[32px] sm:h-[36px] w-full rounded-[100px] flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors ${
                        product.inStock
                          ? 'bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] cursor-pointer'
                          : 'bg-[#CFCFCF] text-[#535353] cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{product.inStock ? 'Add to cart' : 'Out of stock'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Occasion Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-medium text-[#0C1015]">Occasion</h2>
            <Link
              to="/catalog"
              className="text-[12px] font-medium text-[#D21E6A] underline hover:opacity-80"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayOccasions.slice(0, 4).map((occ, idx) => {
              const IconComponent = getCategoryReadyIcon(occ.name, idx);
              return (
                <button
                  key={occ.id}
                  onClick={() =>
                    navigate(`/catalog?occasionId=${occ.id}`)
                  }
                  className="flex flex-col items-start gap-[8px] text-left group focus:outline-none cursor-pointer"
                >
                  <div className="h-[151px] sm:h-[170px] w-full rounded-[8px] bg-[#F9ECF0] border-[0.5px] border-[#A6A6A6] group-hover:border-[#D21E6A] overflow-hidden flex items-center justify-center relative">
                    {'imageUrl' in occ && occ.imageUrl ? (
                      <img
                        src={occ.imageUrl}
                        alt={occ.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <IconComponent className="w-10 h-10 text-[#D21E6A]" />
                    )}
                  </div>
                  <p className="text-[14px] font-medium text-[#0C1015] group-hover:text-[#D21E6A] transition-colors">
                    {occ.name}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
