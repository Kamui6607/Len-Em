import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router";
import { AnimatedBackground } from "../shared/components/motion/AnimatedBackground";
import { RequireAuth } from "../shared/components/auth/RequireAuth";
import { RequireRole } from "../shared/components/auth/RequireRole";
import { StoreLayout } from "../shared/components/layout/StoreLayout";
import { LoadingFallback } from "../shared/components/LoadingFallback";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";

// Lazy-loaded pages
const Home = lazy(() =>
  import("../app/pages/Home").then((m) => ({ default: m.Home })),
);
const AboutUs = lazy(() =>
  import("../app/pages/AboutUs").then((m) => ({ default: m.AboutUs })),
);
const Shop = lazy(() =>
  import("../app/pages/Shop").then((m) => ({ default: m.Shop })),
);
const ProductDetail = lazy(() =>
  import("../app/pages/ProductDetail").then((m) => ({
    default: m.ProductDetail,
  })),
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
const SupportDIYCreatePage = lazy(() =>
  import("../app/pages/supportDIY/SupportDIYCreatePage").then((m) => ({ default: m.SupportDIYCreatePage })),
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
  import("../app/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("../app/pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);

const ForgotPasswordPage = lazy(() =>
  import("../app/pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
);

const ResetPasswordPage = lazy(() =>
  import("../app/pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
);

// ── NEW: Shop cart page (uses CartContext) ──
const ShopCart = lazy(() =>
  import("../app/pages/shop/CartPage").then((m) => ({ default: m.CartPage })),
);

// ── NEW: Checkout (route /order) ──
const ShopCheckout = lazy(() =>
  import("../app/pages/shop/Checkout").then((m) => ({ default: m.Checkout })),
);

// ── NEW: Order Success (route /order/success) ──
const OrderSuccess = lazy(() =>
  import("../app/pages/shop/OrderSuccess").then((m) => ({ default: m.OrderSuccess })),
);

// ── NEW: Order Detail ──
const OrderDetail = lazy(() =>
  import("../app/pages/shop/OrderDetail").then((m) => ({ default: m.OrderDetail })),
);

// ── NEW: Addresses Management (route /addresses) ──
const Addresses = lazy(() =>
  import("../app/pages/Addresses").then((m) => ({ default: m.Addresses })),
);

// ── NEW: Manage Orders (Admin/Staff) ──
const ManageOrders = lazy(() =>
  import("../app/pages/manage/Orders").then((m) => ({ default: m.ManageOrders })),
);

const KitDetail = lazy(() =>
  import("../app/pages/KitDetail").then((m) => ({ default: m.KitDetail })),
);
const KitsPage = lazy(() =>
  import("../app/pages/KitsPage").then((m) => ({ default: m.KitsPage })),
);
const MyReportsPage = lazy(() =>
  import("../app/pages/MyReportsPage").then((m) => ({ default: m.MyReportsPage })),
);
const NotificationsPage = lazy(() =>
  import("../app/pages/Notifications").then((m) => ({ default: m.NotificationsPage })),
);
const MessagesPage = lazy(() =>
  import("../app/pages/Messages").then((m) => ({ default: m.Messages })),
);
const ChatBotPage = lazy(() =>
  import("../app/pages/ChatBot").then((m) => ({ default: m.ChatBot })),
);

function StoreOutlet() {
  return (
    <StoreLayout>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </StoreLayout>
  );
}

export function AppRouter() {
  return (
    <>
      {/* Global background — applies to all pages, theme-aware */}
      <AnimatedBackground />
      <Routes>
      {/* ===== Landing Page — Len&Em entry point with StoreLayout ===== */}
      <Route element={<StoreOutlet />}>
        <Route index element={<Home />} />
        <Route path="about" element={<AboutUs />} />

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
        <Route path="kits" element={<KitsPage />} />
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
          <Route
            path="support-diy/new"
            element={
              <RequireAuth>
                <SupportDIYCreatePage />
              </RequireAuth>
            }
          />

        {/* ===== Customer routes ===== */}
        <Route
          path="cart"
          element={
            <RequireAuth>
              <ShopCart />
            </RequireAuth>
          }
        />
        {/* [REDIRECT] Legacy /checkout → /order */}
        <Route
          path="checkout"
          element={
            <RequireAuth>
              <Navigate to="/order" replace />
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
        {/* [NEW] Order Success (route /order/success) */}
        <Route
          path="order/success"
          element={
            <RequireAuth>
              <OrderSuccess />
            </RequireAuth>
          }
        />
        {/* [NEW] My Orders list — redirects to /purchased */}
        <Route
          path="orders/my"
          element={
            <RequireAuth>
              <Navigate to="/purchased" replace />
            </RequireAuth>
          }
        />
        {/* [NEW] Order Detail — moved under /purchased/:id */}
        <Route
          path="orders/my/:id"
          element={
            <RequireAuth>
              <OrderDetail />
            </RequireAuth>
          }
        />
        <Route
          path="purchased/:id"
          element={
            <RequireAuth>
              <OrderDetail />
            </RequireAuth>
          }
        />
        {/* [NEW] My Reports */}
        <Route
          path="orders/reports"
          element={
            <RequireAuth>
              <MyReportsPage />
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
        {/* [NEW] Addresses Management */}
        <Route
          path="addresses"
          element={
            <RequireAuth>
              <Addresses />
            </RequireAuth>
          }
        />
        <Route
          path="notifications"
          element={
            <RequireAuth>
              <NotificationsPage />
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
        <Route
          path="messages"
          element={
            <RequireAuth>
              <MessagesPage />
            </RequireAuth>
          }
        />
        <Route
          path="chatbot"
          element={
            <RequireAuth>
              <ChatBotPage />
            </RequireAuth>
          }
        />

        {/* [DEPRECATED - v1] /home was the standalone v1 home route. */}
        <Route path="home" element={<Home />} />
        {/* [DEPRECATED - v1] /community is now /diy. */}
        <Route path="community" element={<Navigate to="/diy" replace />} />
        {/* [DEPRECATED - v1] /product/:id moved under /shop/product/:id. */}
        <Route path="product/:id" element={<Navigate to="/shop" replace />} />
      </Route>

      {/* ===== Auth routes ===== */}
      <Route
        path="auth/login"
        element={
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <LoginPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="auth/register"
        element={
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <RegisterPage />
            </Suspense>
          </ErrorBoundary>
        }
      />

      {/* Redirect from /reset-password (backend link format) to /auth/reset-password */}
      <Route
        path="reset-password"
        element={
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ResetPasswordPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="auth/forgot-password"
        element={
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ForgotPasswordPage />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path="auth/reset-password"
        element={
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ResetPasswordPage />
            </Suspense>
          </ErrorBoundary>
        }
      />

      {/* ===== Creator dashboard ===== */}
      <Route
        path="creator/*"
        element={
          <RequireRole allowedRoles={["creator"]}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback fullPage />}>
                <Profile />
              </Suspense>
            </ErrorBoundary>
          </RequireRole>
        }
      />

      {/* ===== Admin dashboard (Admin only — Staff dùng StaffPage riêng) ===== */}
      <Route
        path="admin/*"
        element={
          <RequireRole allowedRoles={["admin"]}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback fullPage />}>
                <AdminPage />
              </Suspense>
            </ErrorBoundary>
          </RequireRole>
        }
      />

      {/* ===== Staff dashboard (Staff xử lý Pending Orders, xem Users, xử lý Reports) ===== */}
      <Route
        path="staff"
        element={
          <RequireRole allowedRoles={["staff", "admin"]}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback fullPage />}>
                <StaffPage />
              </Suspense>
            </ErrorBoundary>
          </RequireRole>
        }
      />
      <Route
        path="staff/orders"
        element={
          <RequireRole allowedRoles={["staff", "admin"]}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback fullPage />}>
                <StaffPage />
              </Suspense>
            </ErrorBoundary>
          </RequireRole>
        }
      />
      <Route
        path="staff/users"
        element={
          <RequireRole allowedRoles={["staff", "admin"]}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback fullPage />}>
                <StaffPage />
              </Suspense>
            </ErrorBoundary>
          </RequireRole>
        }
      />
      <Route
        path="staff/reports"
        element={
          <RequireRole allowedRoles={["staff", "admin"]}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback fullPage />}>
                <StaffPage />
              </Suspense>
            </ErrorBoundary>
          </RequireRole>
        }
      />
      {/* Staff không dùng AdminPage nữa — DIY quản lý chỉ dành cho Admin */}
      <Route
        path="staff/diy"
        element={
          <RequireRole allowedRoles={["staff", "admin"]}>
            <Navigate to="/admin/diy-posts" replace />
          </RequireRole>
        }
      />

      {/* ===== Manage routes (Admin & Staff) ===== */}
      <Route
        path="manage/orders"
        element={
          <RequireRole allowedRoles={["admin", "staff"]}>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback fullPage />}>
                <ManageOrders />
              </Suspense>
            </ErrorBoundary>
          </RequireRole>
        }
      />

      {/* ===== Catch-all ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}