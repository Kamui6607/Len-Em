import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router";
import { RequireAuth } from "../components/auth/RequireAuth";
import { RequireRole } from "../components/auth/RequireRole";
import { StoreLayout } from "../app/components/layout/StoreLayout";
import { LoadingFallback } from "../app/components/LoadingFallback";

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
const Checkout = lazy(() =>
  import("../app/pages/Checkout").then((m) => ({ default: m.Checkout })),
);
const DIYFeedPage = lazy(() =>
  import("../app/pages/DIYFeedPage").then((m) => ({ default: m.DIYFeedPage })),
);
const DIYDetailPage = lazy(() =>
  import("../app/pages/DIYDetailPage").then((m) => ({ default: m.DIYDetailPage })),
);
const DIYCreatePage = lazy(() =>
  import("../app/pages/DIYCreatePage").then((m) => ({ default: m.DIYCreatePage })),
);
const Learn = lazy(() =>
  import("../app/pages/LearnPage").then((m) => ({ default: m.LearnPage })),
);
const CourseDetailPage = lazy(() =>
  import("../app/pages/CourseDetailPage").then((m) => ({
    default: m.CourseDetailPage,
  })),
);
const LessonPage = lazy(() =>
  import("../app/pages/LessonPage").then((m) => ({ default: m.LessonPage })),
);
const Profile = lazy(() =>
  import("../app/pages/Profile").then((m) => ({ default: m.Profile })),
);
const MembershipPage = lazy(() =>
  import("../app/pages/membership/MembershipPage").then((m) => ({
    default: m.MembershipPage,
  })),
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

const ForgotPasswordPage = lazy(() =>
  import("../pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
);

// ── NEW: Shop cart page (uses CartContext) ──
const ShopCart = lazy(() =>
  import("../app/pages/shop/Cart").then((m) => ({ default: m.ShopCart })),
);

// ── NEW: Checkout (route /order) ──
const ShopCheckout = lazy(() =>
  import("../app/pages/shop/Checkout").then((m) => ({ default: m.Checkout })),
);

// ── NEW: My Orders + Order Detail ──
const MyOrders = lazy(() =>
  import("../app/pages/shop/MyOrders").then((m) => ({ default: m.MyOrders })),
);

const OrderDetail = lazy(() =>
  import("../app/pages/shop/OrderDetail").then((m) => ({ default: m.OrderDetail })),
);

// ── NEW: Manage Orders (Admin/Staff) ──
const ManageOrders = lazy(() =>
  import("../app/pages/manage/Orders").then((m) => ({ default: m.ManageOrders })),
);

const KitDetail = lazy(() =>
  import("../app/pages/KitDetail").then((m) => ({ default: m.KitDetail })),
);

function StoreOutlet() {
  return (
    <StoreLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </StoreLayout>
  );
}

export function AppRouter() {
  return (
    <Routes>
      {/* ===== Landing Page — Len&Em entry point with StoreLayout ===== */}
      <Route element={<StoreOutlet />}>
        <Route index element={<Home />} />

        {/* ===== LEARN routes ===== */}
        <Route path="learn" element={<Learn />} />
        <Route
          path="learn/:courseId"
          element={<CourseDetailPage />}
        />
        <Route
          path="learn/:courseId/lesson/:lessonId"
          element={
            <RequireAuth>
              <LessonPage />
            </RequireAuth>
          }
        />

        {/* ===== SHOP routes ===== */}
        <Route path="shop" element={<Shop />} />
        <Route path="shop/product/:id" element={<ProductDetail />} />
        <Route path="kits/:id" element={<KitDetail />} />

        {/* ===== DIY routes ===== */}
        <Route path="diy" element={<DIYFeedPage />} />
        <Route
          path="diy/create"
          element={
            <RequireAuth>
              <DIYCreatePage />
            </RequireAuth>
          }
        />
        <Route path="diy/:postId" element={<DIYDetailPage />} />

        {/* ===== Customer routes ===== */}
        <Route
          path="cart"
          element={
            <RequireAuth>
              <ShopCart />
            </RequireAuth>
          }
        />
        <Route
          path="checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />
        {/* [NEW] Order / Checkout page (route /order) — replaces /checkout in future */}
        <Route
          path="order"
          element={
            <RequireAuth>
              <ShopCheckout />
            </RequireAuth>
          }
        />
        {/* [NEW] My Orders list */}
        <Route
          path="orders/my"
          element={
            <RequireAuth>
              <MyOrders />
            </RequireAuth>
          }
        />
        {/* [NEW] Order Detail */}
        <Route
          path="orders/my/:id"
          element={
            <RequireAuth>
              <OrderDetail />
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
          path="my-account/membership"
          element={
            <RequireAuth>
              <MembershipPage />
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

        {/* [DEPRECATED - v1] /home was the standalone v1 home route. */}
        <Route path="home" element={<Home />} />
        {/* [DEPRECATED - v1] /community is now /diy. */}
        <Route path="community" element={<Navigate to="/diy" replace />} />
        {/* [DEPRECATED - v1] /kits is now covered by /shop combo filters. */}
        <Route path="kits" element={<Navigate to="/shop?category=combo" replace />} />
        {/* [DEPRECATED - v1] /product/:id moved under /shop/product/:id. */}
        <Route path="product/:id" element={<Navigate to="/shop" replace />} />
      </Route>

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
        path="auth/register"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <RegisterPage />
          </Suspense>
        }
      />

      <Route
        path="auth/forgot-password"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <ForgotPasswordPage />
          </Suspense>
        }
      />

      {/* ===== Creator dashboard ===== */}
      <Route
        path="creator/*"
        element={
          <RequireRole allowedRoles={["creator"]}>
            <Suspense fallback={<LoadingFallback fullPage />}>
              <Profile />
            </Suspense>
          </RequireRole>
        }
      />

      {/* ===== Admin dashboard (Admin = full CRUD, Staff = read-only via component logic) ===== */}
      <Route
        path="admin/*"
        element={
          <RequireRole allowedRoles={["admin", "staff"]}>
            <Suspense fallback={<LoadingFallback fullPage />}>
              <AdminPage />
            </Suspense>
          </RequireRole>
        }
      />

      {/* ===== Staff dashboard ===== */}
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

      {/* ===== Manage routes (Admin & Staff) ===== */}
      <Route
        path="manage/orders"
        element={
          <RequireRole allowedRoles={["admin", "staff"]}>
            <Suspense fallback={<LoadingFallback fullPage />}>
              <ManageOrders />
            </Suspense>
          </RequireRole>
        }
      />

      {/* ===== Catch-all ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}