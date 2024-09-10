import type { components } from './schema';

type S = components['schemas'];

export type Me = S['Me'];
export type AuthResponse = S['AuthResponse'];
export type Image = S['Image'];
export type SellerSummary = S['SellerSummary'];
export type ShippingAddress = S['ShippingAddress'];
export type CategoryNode = S['CategoryNode'];
export type CategoryRef = S['CategoryRef'];
export type CategoryDetail = S['CategoryDetail'];
export type ProductCard = S['ProductCard'];
export type ProductSearchResponse = S['ProductSearchResponse'];
export type ProductDetail = S['ProductDetail'];
export type HomeResponse = S['HomeResponse'];
export type OrderList = S['OrderList'];
export type CheckoutQuote = S['CheckoutQuote'];
export type Notification = S['Notification'];
export type Review = S['Review'];
export type ReviewList = S['ReviewList'];
export type Storefront = S['Storefront'];
export type SellerProfile = S['SellerProfile'];
export type SellerProduct = S['SellerProduct'];
export type InventoryRow = S['InventoryRow'];
export type InventoryAdjustment = S['InventoryAdjustment'];
export type SellerOrderSummary = S['SellerOrderSummary'];
export type SellerOrderDetail = S['SellerOrderDetail'];
export type SellerDashboard = S['SellerDashboard'];
export type SellerPayouts = S['SellerPayouts'];
export type AdminUser = S['AdminUser'];
export type AdminSeller = S['AdminSeller'];
export type ModerationReview = S['ModerationReview'];
export type ReportOverview = S['ReportOverview'];
export type AuditEntry = S['AuditEntry'];
export type PageMeta = S['PageMeta'];

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
