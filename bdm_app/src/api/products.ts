import { api } from "./client";
import type {
  ApiEnvelope,
  Banner,
  Category,
  CategoryGroup,
  Company,
  GenericName,
  Paginated,
  Product,
  ProductDetailResponse,
} from "@/types/api";

/** The product list endpoint wraps the array at results.data (paginated +
 *  enveloped). This unwraps either shape defensively. */
function unwrapProducts(payload: Paginated<Product>): Product[] {
  const results = payload.results;
  if (Array.isArray(results)) return results;
  if (results && Array.isArray(results.data)) return results.data;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export interface ProductQuery {
  page?: number;
  page_size?: number;
  search?: string;
  category?: number;
}

/** GET /products/products/ — active product list (paginated). */
export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const { data } = await api.get<Paginated<Product>>("/products/products/", {
    params: { page_size: 20, ...query },
  });
  return unwrapProducts(data);
}

/** GET /products/products/search/?q= — product search (backend expects `q`). */
export async function searchProducts(term: string): Promise<Product[]> {
  const { data } = await api.get<Paginated<Product>>("/products/products/search/", {
    params: { q: term },
  });
  return unwrapProducts(data);
}

/** GET /products/products/<id>/ — detail + suggested products. */
export async function getProduct(id: number): Promise<ProductDetailResponse> {
  const { data } = await api.get<ProductDetailResponse>(`/products/products/${id}/`);
  return data;
}

/** GET /products/products/category/ — products grouped by category (one call). */
export async function getCategoryWiseProducts(): Promise<CategoryGroup[]> {
  const { data } = await api.get<ApiEnvelope<CategoryGroup[]>>("/products/products/category/");
  return data.data ?? [];
}

/** GET /products/categories/ */
export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<ApiEnvelope<Category[]>>("/products/categories/");
  return data.data ?? [];
}

/** GET /products/companies/ */
export async function getCompanies(): Promise<Company[]> {
  const { data } = await api.get<ApiEnvelope<Company[]>>("/products/companies/");
  return data.data ?? [];
}

/** GET /products/generic_name/ */
export async function getGenerics(): Promise<GenericName[]> {
  const { data } = await api.get<ApiEnvelope<GenericName[]>>("/products/generic_name/");
  return data.data ?? [];
}

/** GET /products/search/by_companies/?company_names=a,b — products for the
 *  selected companies. */
export async function searchByCompanies(names: string[]): Promise<Product[]> {
  if (names.length === 0) return [];
  const { data } = await api.get<Paginated<Product>>("/products/search/by_companies/", {
    params: { company_names: names.join(","), page_size: 100 },
  });
  return unwrapProducts(data);
}

/** GET /products/search/by_generic_name/?generic_names=a,b — products for the
 *  selected generics. */
export async function searchByGenerics(names: string[]): Promise<Product[]> {
  if (names.length === 0) return [];
  const { data } = await api.get<Paginated<Product>>("/products/search/by_generic_name/", {
    params: { generic_names: names.join(","), page_size: 100 },
  });
  return unwrapProducts(data);
}

/** GET /products/banners/ — promo carousel images. */
export async function getBanners(): Promise<Banner[]> {
  const { data } = await api.get<ApiEnvelope<Banner[]> | Banner[]>("/products/banners/");
  if (Array.isArray(data)) return data;
  return data.data ?? [];
}
