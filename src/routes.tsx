import type { RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { SellersPage } from './pages/admin/SellersPage';
import { UsersPage } from './pages/admin/UsersPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { AccountPage } from './pages/buyer/AccountPage';
import { CartPage } from './pages/buyer/CartPage';
import { CategoryPage } from './pages/buyer/CategoryPage';
import { CheckoutPage } from './pages/buyer/CheckoutPage';
import { HomePage } from './pages/buyer/HomePage';
import { NotificationsPage } from './pages/buyer/NotificationsPage';
import { OrderDetailPage } from './pages/buyer/OrderDetailPage';
import { OrdersPage } from './pages/buyer/OrdersPage';
import { ProductPage } from './pages/buyer/ProductPage';
import { SearchPage } from './pages/buyer/SearchPage';
import { SellApplyPage } from './pages/buyer/SellApplyPage';
import { StorefrontPage } from './pages/buyer/StorefrontPage';
import { WishlistPage } from './pages/buyer/WishlistPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DashboardPage } from './pages/seller/DashboardPage';
import { InventoryPage } from './pages/seller/InventoryPage';
import { ProductEditPage } from './pages/seller/ProductEditPage';
import { ProductsPage } from './pages/seller/ProductsPage';
import { SellerLayout } from './pages/seller/SellerLayout';
import { SellerOrderDetailPage } from './pages/seller/SellerOrderDetailPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'c/:slug', element: <CategoryPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'p/:id/:slug?', element: <ProductPage /> },
      { path: 'products/:id', element: <ProductPage /> },
      { path: 's/:slug', element: <StorefrontPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'sell', element: <SellApplyPage /> },
      { path: 'wishlist', element: <RequireAuth><WishlistPage /></RequireAuth> },
      { path: 'cart', element: <RequireAuth><CartPage /></RequireAuth> },
      { path: 'checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
      { path: 'orders', element: <RequireAuth><OrdersPage /></RequireAuth> },
      { path: 'orders/:id', element: <RequireAuth><OrderDetailPage /></RequireAuth> },
      { path: 'notifications', element: <RequireAuth><NotificationsPage /></RequireAuth> },
      { path: 'account', element: <RequireAuth><AccountPage /></RequireAuth> },
      {
        path: 'seller',
        element: <RequireAuth role="seller"><SellerLayout /></RequireAuth>,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'products/new', element: <ProductEditPage /> },
          { path: 'products/:id', element: <ProductEditPage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'orders', element: <SellerOrdersPage /> },
          { path: 'orders/:orderId', element: <SellerOrderDetailPage /> },
        ],
      },
      {
        path: 'admin',
        element: <RequireAuth role="admin"><AdminLayout /></RequireAuth>,
        children: [
          { path: 'users', element: <UsersPage /> },
          { path: 'sellers', element: <SellersPage /> },
          { path: 'audit-log', element: <AuditLogPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
