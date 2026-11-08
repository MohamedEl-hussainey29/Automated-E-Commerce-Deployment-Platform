import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import type {
  CategoryDto,
  OccasionDto,
  ProductListItemDto,
  ProductSortOption,
  PaginationMeta,
} from '../../types/api';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedStoreId } = useAuth();
  const { addToCart } = useCart();

  const initialCategory = searchParams.get('categoryId') || '';
  const initialOccasion = searchParams.get('occasionId') || '';
  const initialQuery = searchParams.get('q') || '';
  const initialSort = (searchParams.get('sort') as ProductSortOption) || 'NewestFirst';

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [occasions, setOccasions] = useState<OccasionDto[]>([]);
  const [products, setProducts] = useState<ProductListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [categoryId, setCategoryId] = useState(initialCategory);
  const [occasionId, setOccasionId] = useState(initialOccasion);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sort, setSort] = useState<ProductSortOption>(initialSort);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('categoryId') || '';
    const occ = searchParams.get('occasionId') || '';
    const q = searchParams.get('q') || '';
    setCategoryId(cat);
    setOccasionId(occ);
    setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    api
      .getCategories(1, 50)
      .then((res) => {
        setCategories((res.data || []).filter((c) => !c.isDeleted));
      })
      .catch(() => {});
    api
      .getOccasions(1, 50)
      .then((res) => {
        setOccasions((res.data || []).filter((o) => o.isActive !== false));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        if (searchQuery.trim().length > 0) {
          const res = await api.searchProducts({
            q: searchQuery.trim(),
            storeId: selectedStoreId || undefined,
            sort,
            page,
            pageSize: 12,
          });
          if (mounted) {
            setProducts(res.data || []);
            setPagination(res.pagination || null);
          }
        } else {
          const res = await api.getProducts({
            categoryId: categoryId || undefined,
            occasionId: occasionId || undefined,
            storeId: selectedStoreId || undefined,
            sort,
            page,
            pageSize: 12,
          });
          if (mounted) {
            setProducts(res.data || []);
            setPagination(res.pagination || null);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setProducts([]);
          setPagination(null);
          setError(err.message || 'Failed to load products from /api/catalog/products');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, [categoryId, occasionId, searchQuery, sort, page, selectedStoreId]);

  const clearFilters = () => {
    setCategoryId('');
    setOccasionId('');
    setSearchQuery('');
    setSort('NewestFirst');
    setPage(1);
    setSearchParams({});
  };

  // Fallback occasions matching Flowery mobile design
  const fallbackOccasions: OccasionDto[] = [
    { id: 'wedding', name: 'Wedding', imageUrl: null, isActive: true, createdAt: '', updatedAt: '' },
    { id: 'birthday', name: 'Birthday', imageUrl: null, isActive: true, createdAt: '', updatedAt: '' },
    { id: 'anniversary', name: 'Anniversary', imageUrl: null, isActive: true, createdAt: '', updatedAt: '' },
    { id: 'congratulations', name: 'Congratulations', imageUrl: null, isActive: true, createdAt: '', updatedAt: '' },
    { id: 'love-romance', name: 'Love & Romance', imageUrl: null, isActive: true, createdAt: '', updatedAt: '' },
  ];

  const displayOccasions = occasions.length > 0 ? occasions : fallbackOccasions;

  // Fallback tabs matching Figma node 19:2212 if backend has no categories yet
  const categoryTabs =
    categories.length > 0
      ? categories
      : [
          { id: 'hand-bouquet', name: 'Hand Bouquet', sortOrder: 1 },
          { id: 'vases', name: 'Vases', sortOrder: 2 },
          { id: 'boxes', name: 'Boxes', sortOrder: 3 },
          { id: 'jewellery', name: 'Jewellery', sortOrder: 4 },
          { id: 'gift', name: 'Gift', sortOrder: 5 },
          { id: 'cards', name: 'Cards', sortOrder: 6 },
        ];

  return (
    <div className="bg-[#F9F9F9] min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Figma "filter&search" bar (node 32:1538) */}
        <div className="flex items-center gap-3">
          <div className="border border-[#A6A6A6] focus-within:border-[#D21E6A] bg-[#F9F9F9] focus-within:bg-white rounded-[8px] h-[48px] px-[16px] flex items-center gap-2 flex-1 transition-colors">
            <img src="/figma/search.svg" alt="" className="w-6 h-6 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search"
              className="w-full bg-transparent text-[14px] font-medium text-[#0C1015] placeholder-[#A6A6A6] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#A6A6A6] hover:text-[#0C1015]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterDrawerOpen(true)}
            title="Sort & Filter"
            className="border border-[#A6A6A6] hover:border-[#D21E6A] bg-[#F9F9F9] rounded-[8px] h-[48px] w-[64px] flex items-center justify-center shrink-0 transition-colors"
          >
            <img src="/figma/sort.svg" alt="Sort" className="w-6 h-6" />
          </button>
        </div>

        {/* Figma "All categories" horizontal underline tabs (node 19:2212) */}
        <div className="flex items-center gap-[24px] overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => {
              setCategoryId('');
              setPage(1);
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('categoryId');
                return next;
              });
            }}
            className="relative h-[40px] flex items-center justify-center shrink-0 px-1 cursor-pointer"
          >
            <span
              className={`text-[16px] font-normal whitespace-nowrap ${
                categoryId === '' ? 'text-[#D21E6A]' : 'text-[#A6A6A6] hover:text-[#535353]'
              }`}
            >
              All
            </span>
            <span
              className={`absolute bottom-0 left-[2px] right-[2px] h-[3px] rounded-t-[100px] ${
                categoryId === '' ? 'bg-[#D21E6A]' : 'bg-[#A6A6A6]'
              }`}
            />
          </button>

          {categoryTabs.map((cat) => {
            const active = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  const newCatId = active ? '' : cat.id;
                  setCategoryId(newCatId);
                  setPage(1);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (newCatId) next.set('categoryId', newCatId);
                    else next.delete('categoryId');
                    return next;
                  });
                }}
                className="relative h-[40px] flex items-center justify-center shrink-0 px-1 cursor-pointer"
              >
                <span
                  className={`text-[16px] font-normal whitespace-nowrap ${
                    active ? 'text-[#D21E6A]' : 'text-[#A6A6A6] hover:text-[#535353]'
                  }`}
                >
                  {cat.name}
                </span>
                <span
                  className={`absolute bottom-0 left-[2px] right-[2px] h-[3px] rounded-t-[100px] ${
                    active ? 'bg-[#D21E6A]' : 'bg-[#A6A6A6]'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Occasion Sub-filter Pills (matching Figma Occasion screen 20:2788) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-medium text-[#535353] mr-1 shrink-0">Occasion:</span>
          <button
            type="button"
            onClick={() => {
              setOccasionId('');
              setPage(1);
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('occasionId');
                return next;
              });
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              occasionId === ''
                ? 'bg-[#D21E6A] text-[#F9F9F9] shadow-xs'
                : 'bg-[#F9ECF0] text-[#535353] hover:text-[#D21E6A]'
            }`}
          >
            All Occasions
          </button>
          {displayOccasions.map((occ) => {
            const active = occasionId === occ.id;
            return (
              <button
                key={occ.id}
                type="button"
                onClick={() => {
                  const newOccId = active ? '' : occ.id;
                  setOccasionId(newOccId);
                  setPage(1);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (newOccId) next.set('occasionId', newOccId);
                    else next.delete('occasionId');
                    return next;
                  });
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#D21E6A] text-[#F9F9F9] shadow-xs'
                    : 'bg-[#F9ECF0] text-[#535353] hover:text-[#D21E6A]'
                }`}
              >
                {occ.name}
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-[#F9ECF0] border border-[#D21E6A]/30 rounded-[8px] p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D21E6A] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#0C1015]">Catalog Notice</p>
              <p className="text-xs text-[#535353] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Figma Product Grid ("All categories" node 19:2236 with "Flower card" node 76:7422) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-[235px] rounded-[8px] border-[0.5px] border-[#A6A6A6] bg-white p-2 animate-pulse"
              >
                <div className="bg-[#F9ECF0] h-[131px] w-full rounded-[4px]" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-[8px] border-[0.5px] border-[#A6A6A6] p-12 text-center space-y-3">
            <img
              src="/figma/cat-tulip.svg"
              alt="No flowers"
              className="w-10 h-10 mx-auto opacity-60"
            />
            <h3 className="text-base font-medium text-[#0C1015]">No Matching Flowers Found</h3>
            <p className="text-xs text-[#535353] max-w-sm mx-auto">
              Try clearing your filters or searching for another bouquet.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2 rounded-[100px] bg-[#D21E6A] text-[#F9F9F9] text-xs font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
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
                  {/* Figma Image Box (node 76:7255: bg-[#f9ecf0] h-[131px] p-[8px]) */}
                  <Link
                    to={`/products/${product.id}`}
                    className="bg-[#F9ECF0] h-[135px] sm:h-[165px] w-full flex items-center justify-center p-[8px] overflow-hidden rounded-[4px] group"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <img
                        src="/figma/cat-tulip.svg"
                        alt={product.name}
                        className="w-12 h-12 opacity-60"
                      />
                    )}
                  </Link>

                  {/* Figma Card details (node 76:7230) */}
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

                  {/* Figma Add to cart button (node 76:7249: bg-[#d21e6a] h-[30px] rounded-[100px]) */}
                  <button
                    onClick={() => addToCart(product.id, 1)}
                    disabled={!product.inStock}
                    className={`mt-auto h-[32px] sm:h-[36px] w-full rounded-[100px] flex items-center justify-center gap-2 text-[13px] font-medium transition-colors ${
                      product.inStock
                        ? 'bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] cursor-pointer'
                        : 'bg-[#CFCFCF] text-[#535353] cursor-not-allowed'
                    }`}
                  >
                    <img src="/figma/cart-btn-icon.svg" alt="" className="w-[16px] h-[16px]" />
                    <span>{product.inStock ? 'Add to cart' : 'Out of stock'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-[8px] border border-[#A6A6A6] bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 text-[#0C1015]" />
            </button>
            <span className="text-xs font-medium text-[#535353]">
              Page <strong className="text-[#0C1015]">{pagination.page}</strong> of{' '}
              {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-[8px] border border-[#A6A6A6] bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 text-[#0C1015]" />
            </button>
          </div>
        )}
      </div>

      {/* Figma Extended FAB "Filter" button (node 32:1458) */}
      <div className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="bg-[#D21E6A] hover:bg-[#AF1958] h-[38px] px-5 rounded-[16px] shadow-[0px_4px_8px_0px_rgba(73,73,73,0.2)] flex items-center justify-center gap-2.5 text-[#F9F9F9] text-[14px] font-medium cursor-pointer transition-transform hover:scale-105"
        >
          <img src="/figma/tune-filter.svg" alt="" className="w-5 h-5" />
          <span>Filter</span>
        </button>
      </div>

      {/* Figma Categories Filter Bottom Sheet / Modal (node 7077:4534) */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-[#0C1015]/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#F9F9F9] w-full max-w-md rounded-t-[28px] sm:rounded-[20px] p-6 space-y-5 shadow-2xl border border-[#CFCFCF]">
            <div className="w-10 h-1 bg-[#535353] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#D21E6A]">Sort by</h3>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="p-1 text-[#535353] hover:text-[#0C1015]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(
                [
                  { value: 'PriceAsc', label: 'Lowest Price' },
                  { value: 'PriceDesc', label: 'Highest Price' },
                  { value: 'NewestFirst', label: 'New' },
                  { value: 'OldestFirst', label: 'Old' },
                ] as { value: ProductSortOption; label: string }[]
              ).map((option) => {
                const active = sort === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSort(option.value);
                      setPage(1);
                    }}
                    className="w-full h-[52px] px-4 rounded-[10px] bg-white shadow-[0px_0px_4px_rgba(83,83,83,0.18)] flex items-center justify-between text-left"
                  >
                    <span className="text-[14px] font-normal text-[#0C1015]">{option.label}</span>
                    <span className="w-5 h-5 rounded-full border border-[#D21E6A] flex items-center justify-center">
                      {active && <span className="w-3 h-3 rounded-full bg-[#D21E6A]" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  setFilterDrawerOpen(false);
                }}
                className="px-5 h-[48px] rounded-[100px] border border-[#535353] text-[#535353] text-sm font-medium"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-1 h-[48px] rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[16px] font-medium flex items-center justify-center gap-2"
              >
                <img src="/figma/tune-filter.svg" alt="" className="w-5 h-5" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
