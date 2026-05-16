import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router";
import { RequireAuth } from "../components/auth/RequireAuth";
import { RequireRole } from "../components/auth/RequireRole";
import { StoreLayout } from "../app/components/layout/StoreLayout";
import { LoadingFallback } from "../app/components/LoadingFallback";
import type { CartItem } from "../app/App";

// Lazy-loaded pages
const Home = lazy(() =>
  import("../app/pages/Home").then((m) => ({ default: m.Home })),
);
const Shop = lazy(() =>
  import("../app/pages/Shop").then((m) => ({ default: m.Shop })),
);
const ProductDetail = lazy(() =>
  import("../app/pages/ProductDetail").then((m) => ({
    default: m.ProductDetail,
  })),
);
const Cart = lazy(() =>
  import("../app/pages/Cart").then((m) => ({ default: m.Cart })),
);
const Checkout = lazy(() =>
  import("../app/pages/Checkout").then((m) => ({ default: m.Checkout })),
);
const Community = lazy(() =>
  import("../app/pages/Community").then((m) => ({ default: m.Community })),
);
const Learn = lazy(() =>
  import("../app/pages/Learn").then((m) => ({ default: m.Learn })),
);
const Kits = lazy(() =>
  import("../app/pages/Kits").then((m) => ({ default: m.Kits })),
);
const Profile = lazy(() =>
  import("../app/pages/Profile").then((m) => ({ default: m.Profile })),
);
const Purchased = lazy(() =>
  import("../app/pages/Purchased").then((m) => ({ default: m.Purchased })),
);
const Love = lazy(() =>
  import("../app/pages/Love").then((m) => ({ default: m.Love })),
);
const AdminPage = lazy(() =>
  import("../app/pages/admin/AdminPage").then((m) => ({
    default: m.AdminPage,
  })),
);
const StaffPage = lazy(() =>
  import("../app/pages/staff/StaffPage").then((m) => ({
    default: m.StaffPage,
  })),
);
const LoginPage = lazy(() =>
  import("../pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("../pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);

interface AppRouterProps {
  cartItems: CartItem[];
  onAddToCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  cartCount: number;
}

function StoreOutlet({
  cartCount,
}: {
  cartCount: number;
}) {
  return (
    <StoreLayout cartCount={cartCount}>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </StoreLayout>
  );
}

export function AppRouter({
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  cartCount,
}: AppRouterProps) {
  return (
    <Routes>
      {/* ===== Home — standalone, no Navigation/Footer ===== */}
      <Route
        index
        element={
          <Suspense fallback={<LoadingFallback fullPage />}>
            <Home />
          </Suspense>
        }
      />
      <Route
        path="home"
        element={
          <Suspense fallback={<LoadingFallback fullPage />}>
            <Home />
          </Suspense>
        }
      />

      {/* ===== Auth routes ===== */}
      <Route
        path="auth/login"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <LoginPage />
          </Suspense>
        }
      />

      <Route
        path="/auth/register"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <RegisterPage />
          </Suspense>
        }
      />

      {/* ===== Store routes (with Navigation + Footer) ===== */}
      <Route
        element={
          <StoreOutlet cartCount={cartCount} />
        }
      >
        <Route path="community" element={<Community />} />
        <Route path="learn" element={<Learn />} />

        <Route
          path="shop"
          element={
            <RequireAuth>
              <Shop />
            </RequireAuth>
          }
        />
        <Route
          path="kits"
          element={
            <RequireAuth>
              <Kits />
            </RequireAuth>
          }
        />
        <Route
          path="product/:id"
          element={
            <RequireAuth>
              <ProductDetail onAddToCart={onAddToCart} />
            </RequireAuth>
          }
        />
        <Route
          path="cart"
          element={
            <RequireAuth>
              <Cart
                cartItems={cartItems}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            </RequireAuth>
          }
        />
        <Route
          path="checkout"
          element={
            <RequireAuth>
              <Checkout cartItems={cartItems} onClearCart={onClearCart} />
            </RequireAuth>
          }
        />
        <Route
          path="profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="purchased"
          element={
            <RequireAuth>
              <Purchased />
            </RequireAuth>
          }
        />
        <Route
          path="love"
          element={
            <RequireAuth>
              <Love />
            </RequireAuth>
          }
        />
      </Route>

      {/* ===== Admin dashboard (no store navbar/footer) ===== */}
      <Route
        path="admin/*"
        element={
          <RequireRole allowedRoles={["admin"]}>
            <Suspense fallback={<LoadingFallback fullPage />}>
              <AdminPage />
            </Suspense>
          </RequireRole>
        }
      />

      {/* ===== Staff dashboard (no store navbar/footer) ===== */}
      <Route
        path="staff"
        element={
          <RequireRole allowedRoles={["staff"]}>
            <Suspense fallback={<LoadingFallback fullPage />}>
              <StaffPage />
            </Suspense>
          </RequireRole>
        }
      />

      {/* ===== Catch-all ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
