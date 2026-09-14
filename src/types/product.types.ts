export interface CreateProductInput {
  name: string;
  sku: string;
  description?: string;
  price: number;
  category: string;
  reorderLevel?: number;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  category?: string;
  reorderLevel?: number;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  stock?: "low" | "out";
  sort?: "price_asc" | "price_desc" | "stock_asc";
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  category: string;
  reorderLevel: number;
  stock?: number;
  createdAt: Date;
  updatedAt: Date;
}
