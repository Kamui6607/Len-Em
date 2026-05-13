import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router";
import { ProtectedRoute } from "../app/components/ProtectedRoute";
import { RoleProtectedRoute } from "../app/components/RoleProtectedRoute";
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

interface AppRouterProps {
  cartItems: CartItem[];
  authPanelOpen: boolean;
  onAddToCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  cartCount: number;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
}

function StoreOutlet({
  authPanelOpen,
  cartCount,
  onOpenSignIn,
  onOpenSignUp,
}: {
  authPanelOpen: boolean;
  cartCount: number;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
}) {
  return (
    <StoreLayout
      cartCount={cartCount}
      authPanelOpen={authPanelOpen}
      onOpenSignIn={onOpenSignIn}
      onOpenSignUp={onOpenSignUp}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </StoreLayout>
  );
}

export function AppRouter({
  cartItems,
  authPanelOpen,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  cartCount,
  onOpenSignIn,
  onOpenSignUp,
}: AppRouterProps) {
  return (
    <Routes>
      {/* ===== Home — standalone, no Navigation/Footer ===== */}
      <Route
        index
        element={
          <Suspense fallback={<LoadingFallback fullPage />}>
            <Home onSignIn={onOpenSignIn} />
          </Suspense>
        }
      />
      <Route
        path="home"
        element={
          <Suspense fallback={<LoadingFallback fullPage />}>
            <Home onSignIn={onOpenSignIn} />
          </Suspense>
        }
      />

      {/* ===== Store routes (with Navigation + Footer) ===== */}
      <Route
        element={
          <StoreOutlet
            authPanelOpen={authPanelOpen}
            cartCount={cartCount}
            onOpenSignIn={onOpenSignIn}
            onOpenSignUp={onOpenSignUp}
          />
        }
      >
        <Route path="community" element={<Community />} />
        <Route path="learn" element={<Learn />} />

        <Route
          path="shop"
          element={
            <ProtectedRoute>
              <Shop />
            </ProtectedRoute>
          }
        />
        <Route
          path="kits"
          element={
            <ProtectedRoute>
              <Kits />
            </ProtectedRoute>
          }
        />
        <Route
          path="product/:id"
          element={
            <ProtectedRoute>
              <ProductDetail onAddToCart={onAddToCart} />
            </ProtectedRoute>
          }
        />
        <Route
          path="cart"
          element={
            <ProtectedRoute>
              <Cart
                cartItems={cartItems}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout cartItems={cartItems} onClearCart={onClearCart} />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="purchased"
          element={
            <ProtectedRoute>
              <Purchased />
            </ProtectedRoute>
          }
        />
        <Route
          path="love"
          element={
            <ProtectedRoute>
              <Love />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ===== Admin dashboard (no store navbar/footer) ===== */}
      <Route
        path="admin/*"
        element={
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<LoadingFallback fullPage />}>
              <AdminPage />
            </Suspense>
          </RoleProtectedRoute>
        }
      />

      {/* ===== Staff dashboard (no store navbar/footer) ===== */}
      <Route
        path="staff"
        element={
          <RoleProtectedRoute allowedRoles={["staff"]}>
            <Suspense fallback={<LoadingFallback fullPage />}>
              <StaffPage />
            </Suspense>
          </RoleProtectedRoute>
        }
      />

      {/* ===== Catch-all ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
