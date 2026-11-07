import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Minus,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import type { ProductDetailsDto, BatchProductItemDto } from '../../types/api';

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedStoreId } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetailsDto | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedBatch, setRelatedBatch] = useState<BatchProductItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getProductDetails(id, selectedStoreId);
        if (mounted && res.data) {
          setProduct(res.data);
          setSelectedImageIdx(0);
        }

        const listRes = await api.getProducts({
          storeId: selectedStoreId || undefined,
          page: 1,
          pageSize: 5,
        });
        const otherIds = (listRes.data || [])
          .filter((p) => p.id !== id)
          .slice(0, 4)
          .map((p) => p.id);

        if (otherIds.length > 0) {
          const batchRes = await api.batchGetProducts(otherIds, selectedStoreId);
          if (mounted && batchRes.data?.products) {
            setRelatedBatch(batchRes.data.products);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Could not load product details from backend.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      mounted = false;
    };
  }, [id, selectedStoreId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-[420px] rounded-[16px] bg-[#F9ECF0] animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0C1015] hover:text-[#D21E6A]"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div className="bg-[#F9ECF0] border border-[#D21E6A]/30 rounded-[10px] p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#D21E6A] shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-sm text-[#0C1015]">Failed to Load Product</h2>
            <p className="text-xs text-[#535353] mt-1">{error || 'Product not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasDiscount =
    product.discountedPrice != null && product.discountedPrice < product.price;
  const effectivePrice = hasDiscount ? product.discountedPrice! : product.price;
  const images = product.images && product.images.length > 0 ? product.images : [''];
  const currentImage = images[selectedImageIdx] || images[0] || '';
  const includesList =
    product.includes && product.includes.length > 0
      ? product.includes
      : ['Pink roses: 15', 'White wrap'];

  return (
    <div className="bg-[#F9F9F9] min-h-screen pb-16">
      <div className="max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 sm:pt-6 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Figma "Image & indicator" (node 21:2978: bg-[#f9ecf0] h-[400px] relative) */}
          <div className="lg:col-span-6">
            <div className="relative bg-[#F9ECF0] h-[380px] sm:h-[440px] sm:rounded-[16px] overflow-hidden flex items-center justify-center p-6">
              <button
                onClick={() => navigate(-1)}
                title="Back"
                className="absolute left-[16px] top-[16px] w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#0C1015] shadow-xs transition-colors z-10 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="max-h-[330px] sm:max-h-[370px] w-auto object-contain"
                />
              ) : (
                <img
                  src="/figma/cat-tulip.svg"
                  alt={product.name}
                  className="w-24 h-24 opacity-60"
                />
              )}

              {/* Figma Indicator Dots (node 21:2987) */}
              <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 flex items-center gap-2">
                {(images.length > 1 ? images : [1, 2, 3]).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (idx < images.length) setSelectedImageIdx(idx);
                    }}
                    className={`w-[10px] h-[10px] rounded-full transition-colors ${
                      idx === selectedImageIdx ? 'bg-[#D21E6A]' : 'bg-[#A6A6A6]/70'
                    }`}
                  />
                ))}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 mt-3 px-4 sm:px-0 overflow-x-auto">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-16 rounded-[8px] bg-[#F9ECF0] p-1.5 border overflow-hidden shrink-0 ${
                      selectedImageIdx === idx ? 'border-[#D21E6A]' : 'border-[#CFCFCF]'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Figma Product Info (nodes 21:2990, 21:2991, 21:2999, 21:2998, 84:4011) */}
          <div className="lg:col-span-6 px-4 sm:px-0 space-y-6">
            {/* Price & Status Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2.5">
                  <p className="text-[20px] sm:text-[24px] font-bold text-[#0C1015]">
                    EGP {effectivePrice.toLocaleString()}
                  </p>
                  {hasDiscount && (
                    <span className="text-[14px] text-[#535353] line-through">
                      EGP {product.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-normal text-[#535353]">
                  All prices include tax
                </p>
              </div>

              <p className="text-[16px] font-medium text-[#0C1015] shrink-0">
                <span>Status: </span>
                <span
                  className={`text-[14px] font-normal ${
                    product.inStock ? 'text-[#0C1015]' : 'text-[#CC1010]'
                  }`}
                >
                  {product.inStock ? 'In stock' : 'Out of stock'}
                </span>
              </p>
            </div>

            {/* Product Title (node 21:2982) */}
            <h1 className="text-[16px] sm:text-[18px] font-medium text-[#0C1015]">
              {product.name}
            </h1>

            {/* Description (node 21:2999) */}
            <div className="space-y-2">
              <h2 className="text-[16px] font-medium text-[#0C1015]">Description</h2>
              <p className="text-[14px] font-normal text-[#0C1015] leading-relaxed">
                {product.description ||
                  'Freshly hand-arranged premium stems wrapped with care and accompanied by a personalized greeting card.'}
              </p>
            </div>

            {/* Bouquet include (node 21:2998) */}
            <div className="space-y-2">
              <h2 className="text-[16px] font-medium text-[#0C1015]">Bouquet include</h2>
              <div className="space-y-1 text-[14px] font-normal text-[#0C1015]">
                {includesList.map((inc, idx) => (
                  <p key={idx}>{inc}</p>
                ))}
              </div>
            </div>

            {/* Quantity & Add to cart Button (node 84:4011) */}
            <div className="pt-2 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-medium text-[#535353]">Quantity:</span>
                <div className="flex items-center gap-3 border border-[#A6A6A6] rounded-full px-3 py-1 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-6 h-6 flex items-center justify-center text-[#0C1015] hover:text-[#D21E6A]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[14px] font-semibold text-[#0C1015] w-5 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-6 h-6 flex items-center justify-center text-[#0C1015] hover:text-[#D21E6A]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => addToCart(product.id, quantity)}
                disabled={!product.inStock}
                className={`w-full h-[48px] rounded-[100px] text-[16px] font-medium flex items-center justify-center gap-2 transition-colors ${
                  product.inStock
                    ? 'bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] cursor-pointer'
                    : 'bg-[#CFCFCF] text-[#535353] cursor-not-allowed'
                }`}
              >
                <span>{product.inStock ? 'Add to cart' : 'Out of stock'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Related Products (Batch Endpoint POST /api/catalog/products/batch) */}
        {relatedBatch.length > 0 && (
          <div className="px-4 sm:px-0 pt-6 border-t border-[#CFCFCF] space-y-4">
            <h2 className="text-[18px] font-medium text-[#0C1015]">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedBatch.map((item) => (
                <div
                  key={item.id}
                  className="border-[#A6A6A6] border-[0.5px] rounded-[8px] p-[8px] bg-white flex flex-col gap-[8px]"
                >
                  <Link
                    to={`/products/${item.id}`}
                    className="bg-[#F9ECF0] h-[131px] w-full flex items-center justify-center p-[8px] rounded-[4px] overflow-hidden"
                  >
                    {item.primaryImageUrl ? (
                      <img
                        src={item.primaryImageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <img src="/figma/cat-tulip.svg" alt="" className="w-10 h-10 opacity-60" />
                    )}
                  </Link>
                  <div className="flex flex-col gap-1 px-1">
                    <Link
                      to={`/products/${item.id}`}
                      className="text-[12px] font-normal text-[#0C1015] line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[14px] font-medium text-[#0C1015]">
                      EGP {(item.discountedPrice ?? item.price).toFixed(0)}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(item.id, 1)}
                    disabled={!item.isAvailable}
                    className="mt-auto h-[30px] w-full rounded-[100px] bg-[#D21E6A] hover:bg-[#AF1958] text-[#F9F9F9] text-[13px] font-medium flex items-center justify-center gap-1.5"
                  >
                    <img src="/figma/cart-btn-icon.svg" alt="" className="w-4 h-4" />
                    <span>Add to cart</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
