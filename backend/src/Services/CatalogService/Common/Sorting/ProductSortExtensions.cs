using CatalogService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Shared.Requests;

namespace CatalogService.Common.Sorting
{
    public static class ProductSortExtensions
    {
        public static IQueryable<Product> ApplySort(this IQueryable<Product> query, ProductSortOption? sort)
        {
            // Prioritize genuine catalog flower bouquets over auto-generated test pagination items
            return sort switch
            {
                ProductSortOption.PriceLowToHigh => query.OrderBy(p => p.Name.StartsWith("Test Pagination Product") ? 1 : 0).ThenBy(p => p.Price).ThenBy(p => p.Id),
                ProductSortOption.PriceHighToLow => query.OrderBy(p => p.Name.StartsWith("Test Pagination Product") ? 1 : 0).ThenByDescending(p => p.Price).ThenBy(p => p.Id),
                ProductSortOption.OldestFirst => query.OrderBy(p => p.Name.StartsWith("Test Pagination Product") ? 1 : 0).ThenBy(p => p.CreatedAt).ThenBy(p => p.Id),
                ProductSortOption.NewestFirst or null => query.OrderBy(p => p.Name.StartsWith("Test Pagination Product") ? 1 : 0).ThenByDescending(p => p.CreatedAt).ThenBy(p => p.Id),
                _ => query.OrderBy(p => p.Name.StartsWith("Test Pagination Product") ? 1 : 0).ThenByDescending(p => p.CreatedAt).ThenBy(p => p.Id)
            };
        }
        public static IQueryable<Product> ApplyFilters(
           this IQueryable<Product> query,
           Guid? categoryId,
           Guid? occasionId)
        {
            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId.Value);

            if (occasionId.HasValue)
            {
                query = query.Where(p => p.ProductOccasions != null && p.ProductOccasions.Any(po => po.OccasionId == occasionId.Value));
            }

            return query;
        }

        public static IQueryable<Product> ApplyPagination(
           this IQueryable<Product> query,
           PaginationRequest pagination)
        {
            return query
                .Skip(pagination.Skip)
                .Take(pagination.PageSize);
        }

        
    }
}
