import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/customer/HomePage';
import { CatalogPage } from './pages/customer/CatalogPage';
import { ProductDetailsPage } from './pages/customer/ProductDetailsPage';
import { CartCheckoutPage } from './pages/customer/CartCheckoutPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { AuthPage } from './pages/auth/AuthPage';
import { DriverPortalPage } from './pages/driver/DriverPortalPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-[#F9F9F9] text-[#0C1015] pb-16 lg:pb-0">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/products/:id" element={<ProductDetailsPage />} />
                  <Route path="/cart" element={<CartCheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/driver" element={<DriverPortalPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                </Routes>
              </main>
            </div>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
