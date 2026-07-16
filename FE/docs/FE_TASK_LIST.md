# Frontend Task List - Yarn Shop

**Created At:** 2026-07-15  
**Last Updated:** 2026-07-15  
**Version:** 1.0.0

## 📋 Tổng hợp các chức năng FE

### 1. 🔐 Authentication (Xác thực)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] Login với email/password
- [x] Register tài khoản mới
- [x] Forgot password (gửi email reset)
- [x] Reset password với OTP
- [x] Change password (đổi mật khẩu)
- [x] Logout (đăng xuất)
- [x] Refresh token (tự động làm mới token)
- [x] Role-based access control (Admin, Staff, Creator, Customer)
- [x] Route protection (RequireAuth, RequireRole)

**API Services:**
- `POST /auth/login` - Đăng nhập
- `POST /auth/signup` - Đăng ký
- `POST /auth/register` - Đăng ký (Admin only)
- `POST /auth/refresh-token` - Làm mới token
- `GET /users/me` - Lấy thông tin user hiện tại
- `DELETE /auth/logout` - Đăng xuất
- `PATCH /auth/change-password` - Đổi mật khẩu
- `PATCH /auth/forgot-password` - Reset password
- `POST /mail/forgot-password` - Gửi email forgot password

---

### 2. 🛍️ Shop/E-commerce (Cửa hàng)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] Danh sách sản phẩm với filter & sort
  - Filter theo category (yarn, kit, combo, pattern, tool)
  - Filter theo color, material, weight, difficulty
  - Sort by: newest, price-asc, price-desc, rating
  - Search sản phẩm
  - Pagination
- [x] Chi tiết sản phẩm
  - Xem thông tin sản phẩm
  - Chọn màu sắc (variants)
  - Xem số lượng tồn kho
  - Thêm vào giỏ hàng
- [x] Kit Detail (Bộ sản phẩm)
  - Xem chi tiết kit/combo
- [x] Giỏ hàng (Cart)
  - Thêm/xóa sản phẩm
  - Cập nhật số lượng
  - Tính tổng tiền
- [x] Checkout (Thanh toán)
  - Chọn địa chỉ giao hàng
  - Chọn phương thức thanh toán
  - Tạo đơn hàng
  - Tích hợp thanh toán online (payUrl)
- [x] Order Success (Xác nhận đơn hàng)
- [x] Wishlist (Yêu thích)
  - Thêm/xóa sản phẩm yêu thích
- [x] Purchased (Sản phẩm đã mua)

**API Services:**
- `GET /products` - Danh sách sản phẩm (với filter, sort, pagination)
- `GET /products/:id` - Chi tiết sản phẩm
- `POST /products` - Tạo sản phẩm (Admin)
- `PUT /products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /products/:id` - Xóa sản phẩm (Admin)
- `PATCH /products/:id` - Khôi phục sản phẩm (Admin)

**Context/State:**
- CartContext - Quản lý giỏ hàng

---

### 3. 📦 Order Management (Quản lý đơn hàng)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete

#### Customer Features:
- [x] Tạo đơn hàng (Create Order)
- [x] Danh sách đơn hàng của tôi (My Orders)
  - Filter theo trạng thái
  - Pagination
- [x] Chi tiết đơn hàng (Order Detail)
  - Xem thông tin đơn hàng
  - Xem trạng thái đơn hàng
  - Xem thông tin thanh toán
- [x] Hủy đơn hàng (Cancel Order) - chỉ khi PENDING
- [x] Order Reports (Báo cáo đơn hàng)

#### Admin/Staff Features:
- [x] Quản lý tất cả đơn hàng (Manage Orders)
  - Xem danh sách đơn hàng
  - Filter theo status, paymentStatus
  - Search đơn hàng
  - Pagination
- [x] Cập nhật trạng thái đơn hàng (Update Order Status)
  - PENDING → PROCESSING → SHIPPED → DELIVERED
  - Có thể cancel

**API Services:**
- `POST /orders` - Tạo đơn hàng
- `GET /orders/my` - Lấy đơn hàng của customer
- `GET /orders/:orderId` - Chi tiết đơn hàng
- `POST /orders/:orderId/cancel` - Hủy đơn hàng
- `GET /orders` - Lấy tất cả đơn hàng (Admin/Staff)
- `PATCH /orders/:orderId/status` - Cập nhật trạng thái

**Order Status Constants:**
- PENDING
- PROCESSING
- SHIPPED
- DELIVERED
- CANCELLED

---

### 4. 🎨 DIY (Do It Yourself)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] DIY Feed (Danh sách bài viết DIY)
  - Xem tất cả bài viết
  - Pagination
- [x] Chi tiết bài viết DIY
  - Xem nội dung
  - Xem hình ảnh
  - Xem tác giả
- [x] Tạo bài viết DIY (Create DIY Post)
  - Upload hình ảnh
  - Nhập nội dung
  - Chọn category/tags
- [x] Chỉnh sửa bài viết DIY (Update)
- [x] Xóa bài viết DIY (Delete)

**API Services:**
- `GET /diy-posts` - Danh sách bài viết
- `GET /diy-posts/:id` - Chi tiết bài viết
- `POST /diy-posts` - Tạo bài viết (với images)
- `PUT /diy-posts/:id` - Cập nhật bài viết (với images)
- `DELETE /diy-posts/:id` - Xóa bài viết

---

### 5. 📚 Learn/Courses (Học tập)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] Danh sách khóa học (Learn Page)
- [x] Chi tiết khóa học (Course Detail)
  - Xem thông tin khóa học
  - Xem danh sách bài học
  - Xem curriculum
- [x] Bài học (Lesson)
  - Xem nội dung bài học
  - Video/Text content
  - Progress tracking
- [x] Khóa học đã mua (Purchased)
  - Danh sách khóa học đã mua
  - Tiến độ học tập

**API Services:**
- `GET /courses` - Danh sách khóa học
- `GET /courses/:id` - Chi tiết khóa học
- `GET /courses/:courseId/lessons` - Danh sách bài học
- `GET /courses/:courseId/lesson/:lessonId` - Chi tiết bài học

---

### 6. 👤 User Management (Quản lý người dùng)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] Profile (Hồ sơ cá nhân)
  - Xem thông tin cá nhân
  - Cập nhật thông tin
  - Upload avatar
- [x] Membership (Thành viên)
  - Xem rank/thành viên hiện tại
  - Xem benefits
  - Upgrade membership
- [x] Address Management (Quản lý địa chỉ)
- [x] Order History (Lịch sử đơn hàng)

**API Services:**
- `GET /users/me` - Lấy thông tin user
- `PATCH /users/me` - Cập nhật thông tin user
- `GET /users/me/addresses` - Danh sách địa chỉ
- `POST /users/me/addresses` - Thêm địa chỉ
- `PUT /users/me/addresses/:id` - Cập nhật địa chỉ
- `DELETE /users/me/addresses/:id` - Xóa địa chỉ

---

### 7. 📊 Reporting (Báo cáo)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] My Reports (Báo cáo của tôi)
  - Xem báo cáo đơn hàng
  - Thống kê mua hàng
- [x] Admin Reports (Báo cáo Admin)
  - Thống kê doanh thu
  - Thống kê đơn hàng
  - Thống kê sản phẩm
- [x] Staff Reports (Báo cáo Staff)
  - Báo cáo theo quyền hạn

**API Services:**
- `GET /reports/my` - Báo cáo của customer
- `GET /reports/orders` - Báo cáo đơn hàng (Admin/Staff)
- `GET /reports/revenue` - Báo cáo doanh thu (Admin)
- `GET /reports/products` - Báo cáo sản phẩm (Admin)

---

### 8. 🎛️ Admin Dashboard (Quản trị viên)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] Dashboard Overview
  - Thống kê tổng quan
  - Charts & Analytics
- [x] User Management
  - Danh sách users
  - Tạo user mới
  - Cập nhật user
  - Xóa user
- [x] Product Management
  - Danh sách sản phẩm
  - Tạo sản phẩm
  - Cập nhật sản phẩm
  - Xóa/khôi phục sản phẩm
- [x] Order Management
  - Xem tất cả đơn hàng
  - Cập nhật trạng thái
- [x] Course Management
  - Danh sách khóa học
  - Tạo khóa học
  - Cập nhật khóa học
  - Xóa khóa học
- [x] Lesson Management
  - Danh sách bài học
  - Tạo bài học
  - Cập nhật bài học
- [x] DIY Post Management
  - Duyệt bài viết DIY
  - Ẩn/hiện bài viết
- [x] Role & Permission Management
  - Quản lý roles
  - Quản lý permissions
  - Phân quyền

**Routes:**
- `/admin/*` - Admin dashboard (yêu cầu role: admin, staff)

---

### 9. 👨‍💼 Creator Dashboard (Người tạo nội dung)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] Creator Overview
  - Thống kê nội dung
- [x] Course Management
  - Tạo khóa học
  - Quản lý khóa học của mình
- [x] Lesson Management
  - Tạo bài học
  - Quản lý bài học
- [x] DIY Management
  - Tạo bài viết DIY
  - Quản lý bài viết
- [x] Product Management
  - Tạo sản phẩm
  - Quản lý sản phẩm

**Routes:**
- `/creator/*` - Creator dashboard (yêu cầu role: creator)

---

### 10. 👔 Staff Dashboard (Nhân viên)
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] Staff Overview
  - Thống kê công việc
- [x] Order Management
  - Xem đơn hàng
  - Cập nhật trạng thái
- [x] Reports
  - Xem báo cáo

**Routes:**
- `/staff` - Staff dashboard (yêu cầu role: staff)
- `/staff/diy` - Quản lý DIY
- `/staff/reports` - Báo cáo

---

### 11. 🏠 Landing Page & Navigation
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] Home Page
  - Hero Section
  - Shop Section
  - DIY Section
  - Learn Section
  - How It Works Section
  - Closing CTA
- [x] About Us Page
- [x] Navigation
  - Logo
  - Menu items
  - Cart icon với badge
  - User menu
  - Mobile responsive
- [x] Footer

---

### 12. 🎨 UI/UX Components
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] Loading Fallback (Skeleton loaders)
- [x] Animated Background
- [x] Theme Toggle (Dark/Light mode)
- [x] Responsive Design (Mobile-first)
- [x] Toast Notifications (Sonner)
- [x] Modals & Dialogs (Radix UI)
- [x] Dropdowns & Menus
- [x] Forms với React Hook Form + Yup validation
- [x] Search functionality
- [x] Pull to refresh (Mobile)
- [x] Swipe back (Mobile)
- [x] Keyboard avoidance (Mobile)

---

### 13. 🔧 Technical Features
**Created At:** 2026-07-15  
**Updated At:** 2026-07-15  
**Status:** ✅ Complete
- [x] State Management (Zustand)
  - Auth store
  - Learn store
  - Cart context
  - Report context
- [x] API Client (Axios)
  - Request/Response interceptors
  - Token management
  - Error handling
- [x] React Query (TanStack Query)
  - Data fetching
  - Caching
  - Optimistic updates
- [x] Routing (React Router v7)
  - Lazy loading
  - Route guards
  - Nested routes
- [x] Form Validation (React Hook Form + Yup)
- [x] Image Upload (FormData)
- [x] Price Formatting
- [x] Date Formatting (date-fns)
- [x] Debounced Search
- [x] Media Query Hooks

---

## 📊 Thống kê

### Tổng số Pages: 40+
- Public pages: 5
- Auth pages: 3
- Customer pages: 12
- Admin pages: 15+
- Creator pages: 6
- Staff pages: 3

### Tổng số API Services: 50+
- Auth: 9 endpoints
- Products: 7 endpoints
- Orders: 6 endpoints
- DIY: 5 endpoints
- Courses/Lessons: 4 endpoints
- Users: 6 endpoints
- Reports: 4 endpoints
- Admin/Management: 10+ endpoints

### Features Modules: 8
- Authentication
- Shop/E-commerce
- Order Management
- DIY
- Learn/Courses
- User Management
- Reporting
- Admin/Creator/Staff Dashboards

---

## 🎯 Priority Features (MVP)

### Must Have (P0):
1. ✅ Authentication (Login/Register)
2. ✅ Product listing & detail
3. ✅ Cart & Checkout
4. ✅ Order management (customer)
5. ✅ Order management (admin/staff)
6. ✅ User profile

### Should Have (P1):
1. ✅ DIY features
2. ✅ Learn/Courses
3. ✅ Membership
4. ✅ Reports
5. ✅ Search & Filter

### Nice to Have (P2):
1. ✅ Creator dashboard
2. ✅ Advanced analytics
3. ✅ Wishlist
4. ✅ Reviews/Ratings

---

## 🔗 Related Files

### Configuration:
- `package.json` - Dependencies
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration

### Core Files:
- `src/main.tsx` - Entry point
- `src/App.tsx` - Main app component
- `src/routes/AppRouter.tsx` - Route configuration

### Services:
- `src/services/auth.service.ts` - Auth API
- `src/features/orders/services/order.service.ts` - Order API
- `src/features/shop/services/product.service.ts` - Product API
- `src/features/diy/services/diy.service.ts` - DIY API
- `src/api/*.ts` - Additional API services

### State Management:
- `src/store/auth.store.ts` - Auth state
- `src/store/learn.store.ts` - Learn state
- `src/context/CartContext.tsx` - Cart context
- `src/context/ReportContext.tsx` - Report context

### Types:
- `src/types/*.types.ts` - TypeScript types
- `src/features/*/types/*.types.ts` - Feature-specific types

---

## 📝 Notes

- Project sử dụng React 18 + TypeScript + Vite
- UI Framework: Tailwind CSS + Radix UI
- State: Zustand + React Context
- Data Fetching: TanStack Query (React Query)
- Routing: React Router v7
- Form: React Hook Form + Yup
- Animation: Motion (Framer Motion)
- 3D: React Three Fiber (cho một số components)
- Charts: Recharts

---

## 📅 Timeline

### Phase 1: Core Features (2026-07-15)
- ✅ Authentication system
- ✅ User management
- ✅ Product management
- ✅ Cart & Checkout
- ✅ Order management

### Phase 2: Content Features (2026-07-15)
- ✅ DIY features
- ✅ Learn/Courses
- ✅ Membership system
- ✅ Reports & Analytics

### Phase 3: Admin & Management (2026-07-15)
- ✅ Admin dashboard
- ✅ Creator dashboard
- ✅ Staff dashboard
- ✅ Role & Permission management

### Phase 4: UI/UX & Polish (2026-07-15)
- ✅ Landing pages
- ✅ UI components
- ✅ Mobile optimization
- ✅ Animations & transitions

---

**Created At:** 2026-07-15  
**Last Updated:** 2026-07-15  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
