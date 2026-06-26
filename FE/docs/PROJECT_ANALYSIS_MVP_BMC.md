# 🧶 Len&Em — Phân Tích Dự Án Toàn Diện

> **Dự án:** Len&Em (Len & Em) — Nền tảng học & mua nguyên liệu đan móc
> **Ngày phân tích:** 25/06/2026
> **Công nghệ:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand

---

## 📋 MỤC LỤC

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Phân Tích Kiến Trúc](#2-phân-tích-kiến-trúc)
3. [Module Chức Năng Chi Tiết](#3-module-chức-năng-chi-tiết)
4. [MVP (Minimum Viable Product)](#4-mvp-minimum-viable-product)
5. [Business Model Canvas](#5-business-model-canvas)
6. [Đề Xuất Phát Triển](#6-đề-xuất-phát-triển)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Giới thiệu

Len&Em là một **nền tảng closed-loop** (vòng khép kín) dành cho cộng đồng đan móc, nơi người dùng có thể:

1. **📚 Học** — Xem video bài học từ cơ bản đến nâng cao
2. **🛒 Mua** — Mua nguyên liệu/vật tư được gắn trực tiếp vào bài học
3. **🧶 Sáng tạo** — Đăng dự án DIY của bản thân và chia sẻ với cộng đồng

### 1.2 Cốt lõi giá trị

> *"A cozy closed-loop platform where beginners, creators, and idol fans learn, buy the right materials, and share handmade pieces."*

**3-step loop:** Watch → Add tagged materials → Post your DIY

### 1.3 Đối tượng người dùng

| Nhóm | Vai trò | Đặc điểm |
|------|---------|----------|
| 👤 Guest | Khách | Xem video miễn phí, duyệt shop, xem DIY |
| 👤 User | Người dùng đã đăng ký | Mua hàng, học premium, đăng bài DIY, tích điểm |
| ⭐ Creator | Người sáng tạo nội dung | Tạo khóa học, bài học, quản lý sản phẩm |
| 🛠️ Staff | Nhân viên | Quản lý đơn hàng, xác nhận thanh toán |
| 🛡️ Admin | Quản trị viên | Quản lý toàn bộ hệ thống |

---

## 2. PHÂN TÍCH KIẾN TRÚC

### 2.1 Stack Công Nghệ

| Layer | Công nghệ | Mục đích |
|-------|-----------|----------|
| **Core** | React 18 + TypeScript | UI framework type-safe |
| **Build** | Vite 6 | Dev server & bundler cực nhanh |
| **Styling** | Tailwind CSS 4 | Utility-first CSS, theme tùy chỉnh |
| **Routing** | React Router v7 | Client-side routing |
| **State Management** | Zustand 5 | State management nhẹ cho auth, membership, learn |
| **Server State** | TanStack Query 5 | Quản lý cache & gọi API |
| **HTTP** | Axios | HTTP client với interceptor |
| **Form** | React Hook Form 7 | Form validation |
| **Animation** | Motion (Framer Motion) | Animation |
| **UI Library** | Radix UI + shadcn/ui | Component system có sẵn |
| **Chart** | Recharts | Biểu đồ admin dashboard |
| **Notification** | Sonner | Toast notifications |

### 2.2 Cấu Trúc Thư Mục

```
src/
├── main.tsx                          # Entry point
├── app/
│   ├── App.tsx                       # Root component (providers + cart state)
│   ├── components/                   # Shared UI components
│   │   ├── ui/                       # shadcn/ui components (50+)
│   │   ├── shared/                   # SearchBar, FilterSidebar, ColorFilter...
│   │   └── membership/               # MembershipCard, RankBadge, CoinUsage...
│   ├── pages/                        # Page components
│   │   ├── admin/                    # Admin dashboard pages
│   │   ├── creator/                  # Creator dashboard pages
│   │   ├── membership/               # Membership management page
│   │   └── staff/                    # Staff management page
│   ├── context/                      # React contexts (Admin, Favorites, Theme)
│   └── data/                         # Mock data (products, community posts)
├── features/                         # Feature-based modules
│   ├── shop/                         # Shop (product service)
│   ├── learn/                        # Learn (courses, lessons, types, mock data)
│   ├── diy/                          # DIY (types, mock data)
│   ├── membership/                   # Membership (types, store, mock data)
│   └── creator/                      # Creator (mock data)
├── routes/                           # AppRouter với lazy loading
├── store/                            # Zustand stores (auth, learn)
├── services/                         # API services (auth)
├── hooks/                            # Custom hooks (useAuth, useMediaQuery...)
├── lib/                              # Utilities (axiosClient, formatPrice...)
├── types/                            # Global types (auth)
└── styles/                           # CSS files (globals, theme, tailwind)
```

### 2.3 Data Flow

```
User Action → Component → Zustand Store / React Query → Service (Axios) → Backend API
                                                              ↕
                                                         Mock Data (fallback)
```

---

## 3. MODULE CHỨC NĂNG CHI TIẾT

### 3.1 🏠 HOME — Landing Page

**Mục đích:** Giới thiệu platform, dẫn dắt người dùng vào 3 module chính

**Nội dung:**
- Hero section với tagline "Learn to knit, live creatively"
- 3 module buttons: LEARN, SHOP, DIY (scroll to section)
- Section LEARN: 3 skill levels, testimonials, CTA
- Section SHOP: Product combos (Beginner/Pro/Promax), 4 product cards
- Section DIY: Creator gallery, "Buy combo" CTA
- CTA section: "Your next handmade project starts here"

**Pages liên quan:** Home.tsx — 523 dòng code với animation, responsive

---

### 3.2 📚 LEARN — Nền tảng Học Tập

**Mô tả:** Hệ thống khóa học đan móc có cấu trúc

**Premium Courses (6 khóa):**

| Khóa học | Level | Bài học | Giá | Điểm thưởng |
|----------|-------|:-------:|:---:|:----------:|
| Khăn Quàng Cơ Bản | Beginner | 4 | Miễn phí | 200 |
| Mũ Bunny Idol | Beginner | 3 | Miễn phí | 200 |
| Mũ Bucket Pastel | Intermediate | 4 | 59.000₫ | 300 |
| Áo Croptop Daisy | Intermediate | 3 | 59.000₫ | 300 |
| Túi Tote Cá Tính | Advanced | 4 | 79.000₫ | 400 |
| Cardigan Cloud Puff | Advanced | 5 | 99.000₫ | 500 |

**Free Videos (6 video kỹ thuật):**
- Magic Knot (6 phút), Đọc Chart (8 phút), Magic Ring (5 phút)
- 5 Mũi Cơ Bản (12 phút), Đổi Màu (7 phút), Đo Size Mũ (4 phút)

**Tính năng đặc biệt:**
- ✅ **Linked Products:** Nguyên liệu được gắn trực tiếp vào video tại timestamp cụ thể
- ✅ **One-tap add to cart:** Thêm nguyên liệu vào giỏ từ bài học
- ✅ **Point reward:** Nhận điểm membership khi hoàn thành khóa học

**Pages:** LearnPage, CourseDetailPage, LessonPage

---

### 3.3 🛒 SHOP — Cửa hàng

**Mô tả:** Cửa hàng nguyên liệu đan móc, dụng cụ và combo

**Danh mục sản phẩm:**
- **Yarn (Len):** 10 sản phẩm, mỗi sản phẩm có 2-4 variants (màu sắc)
  - Giá: 119.000₫ → 349.000₫
  - Chất liệu: Cotton, Merino, Acrylic, Alpaca Silk, Bamboo...
- **Tools (Dụng cụ):** 6 sản phẩm
  - Kim móc tre/nhôm/ergonomic, đánh dấu mũi, kéo, kim may
  - Giá: 49.000₫ → 329.000₫
- **Kits (Combo):** 4 sản phẩm (chăn, thú bông, nơ tóc, combo khởi nghiệp)
  - Giá: 229.000₫ → 599.000₫

**Material Combos (8 combo):**
- Combo gắn với skill level: Beginner → Intermediate → Advanced
- Giá: 168.000₫ → 696.000₫
- Mỗi combo liên kết với khóa học và bài DIY

**Tính năng:**
- 🔍 Tìm kiếm sản phẩm
- 🎨 Filter: màu sắc, chất liệu, trọng lượng, độ khó (dynamic từ data)
- 🔄 Sort: popularity, price, rating
- 🛒 Giỏ hàng (Zustand state tại App.tsx)
- 💳 Checkout với Coin usage

**Pages:** Shop, ProductDetail, Cart, Checkout

---

### 3.4 🧶 DIY — Cộng đồng Sáng tạo

**Mô tả:** Nền tảng chia sẻ dự án handmade của cộng đồng

**10 bài đăng demo:**
- 4 bài từ Idol (verified creators): Cardigan Cloud, Bunny Hat, Phone Charm, Khăn Cotton
- 6 bài từ Creator: Strawberry Case, Tote Sage, Daisy Top, Scrunchie, Chăn Ca-rô, Túi Mini Nơ

**Cấu trúc mỗi bài đăng:**
```
DIY Post
├── Creator info (name, avatar, isIdol)
├── Title & Description
├── Images (1-2)
├── Linked Combo
│   ├── Items (productId, name, price, quantity)
│   └── Total Price
├── Like/Save count
└── Tags
```

**Tính năng:**
- 📱 Feed bài đăng
- 🔍 Filter theo tag
- 🛒 1-tap "Buy combo" → thêm toàn bộ nguyên liệu vào giỏ
- ✏️ Tạo bài đăng DIY mới (yêu cầu đăng nhập)

**Pages:** DIYFeedPage, DIYDetailPage, DIYCreatePage

---

### 3.5 💎 MEMBERSHIP — Khách hàng thân thiết

**Mô tả:** Hệ thống loyalty với điểm, hạng và coin ảo

**4 Hạng thành viên:**

| Rank | Điểm yêu cầu | Coin Reward | Quyền lợi chính |
|------|:----------:|:----------:|-----------------|
| ⭐ Member | 0 | 3% | Coin 3%, Voucher sinh nhật 50K |
| 🥈 Silver | 1.000 | 4% | Coin 4%, Voucher 100K, Ưu tiên workshop |
| 🥇 Gold | 3.000 | 5% | Coin 5%, Voucher 200K, Flash Sale sớm 2h |
| 💎 Diamond | 8.000 | 6% | Coin 6%, Voucher 500K, Workshop free, Flash Sale sớm 4h |

**Coin Virtual Currency:**
- Tỷ lệ: 1 Coin = 1₫
- Hạn sử dụng: 6 tháng
- Giới hạn dùng: 20% giá trị đơn hàng
- Điều kiện: Đơn từ 100.000₫ trở lên

**Cách nhận điểm:**
- Mua hàng: 1.000₫ = 1 point
- Đăng video DIY: +500 điểm
- Đăng ký tài khoản: +1.000 điểm
- Hoàn thành khóa học: 200-500 điểm

**Components đã xây dựng:**
| Component | Mô tả |
|-----------|-------|
| MembershipCard | Card tổng quan: avatar, rank, point, coin, total spent |
| RankBadge | Badge nhỏ cho header/navigation |
| ProgressBar | Thanh tiến trình lên hạng |
| BenefitCard | Card quyền lợi |
| RankTimeline | Timeline các hạng |
| MembershipHistory | Lịch sử tích điểm |
| RankPopup | Popup chúc mừng lên hạng |
| CoinUsage | Dùng coin trong checkout |
| CoinSummary | Widget tổng quan coin |

**Pages:** MembershipPage (/my-account/membership)

---

### 3.6 👤 AUTH — Xác thực

**Tính năng:**
- ✅ Đăng nhập (email hoặc username)
- ✅ Đăng ký tài khoản
- ✅ JWT token management (access + refresh)
- ✅ Role-based access (admin, staff, user, creator)
- ✅ Auto-refresh token
- ✅ Demo accounts (6 tài khoản test)

**Demo Accounts:**
| Email | Password | Role |
|-------|:--------:|:----:|
| admin@lenem.vn | 123456 | Admin |
| staff@lenem.vn | 123456 | Staff |
| creator@lenem.vn | 123456 | Creator |
| user@gmail.com | 123456 | User |
| minh@lenem.vn | 123456 | User |
| thu@lenem.vn | 123456 | User |

**Pages:** LoginPage, RegisterPage, ForgotPasswordPage

---

### 3.7 🛡️ ADMIN — Quản trị

**Dashboard:**
- 📊 Thống kê: Users, Products, Orders, Revenue
- 📋 Recent Activity log
- 📈 Order Statistics (confirmed/pending/cancelled)

**Quản lý:**
- 👥 Users: CRUD, filter, role management
- 📦 Orders: Xem, xác nhận thanh toán, hủy
- 🏷️ Products: Quản lý sản phẩm
- 📝 Activity: Audit log

**Pages:** AdminDashboard, AdminUsers, AdminOrders, AdminProducts, AdminPage

---

### 3.8 🎨 CREATOR — Người sáng tạo

**Dashboard:**
- 📊 Tổng quan: Khóa học, bài học, sản phẩm, bài DIY
- 📚 Courses: Quản lý khóa học
- 📝 Lessons: Quản lý bài học (theo course)
- 🏷️ Products: Quản lý sản phẩm
- 🧶 DIY: Quản lý bài đăng DIY

---

### 3.9 ❤️ OTHER — Các tính năng khác

- **Favorites (Love):** Wishlist sản phẩm yêu thích
- **Profile:** Thông tin cá nhân
- **Purchased:** Lịch sử mua hàng
- **Mobile Support:** Bottom navigation, responsive, safe-area, pull-to-refresh
- **Theme:** Dark/Light mode toggle

---

## 4. MVP (MINIMUM VIABLE PRODUCT)

### 4.1 Core MVP Scope

Dựa trên phân tích codebase, đây là những gì đã được xây dựng để tạo thành một MVP hoàn chỉnh:

| # | Module | Trạng thái | Ghi chú |
|---|--------|:--------:|---------|
| 1 | **Authentication** | ✅ Hoàn chỉnh | Login/Register/JWT/RBAC/Demo |
| 2 | **Learn (Courses)** | ✅ Hoàn chỉnh | 6 courses, 6 free videos, lesson detail |
| 3 | **Shop (Products)** | ✅ Hoàn chỉnh | 22 products, filters, search, variants |
| 4 | **Cart & Checkout** | ✅ Hoàn chỉnh | Cart state, checkout flow, coin usage |
| 5 | **DIY Feed** | ✅ Hoàn chỉnh | 10 posts, linked combos, 1-tap add to cart |
| 6 | **Membership** | ✅ Hoàn chỉnh | 4 ranks, points, coin, history, benefits |
| 7 | **Admin Dashboard** | ✅ Hoàn chỉnh | Users, orders, products, activities |
| 8 | **Creator Dashboard** | ✅ Hoàn chỉnh | Courses, lessons, products, DIY |
| 9 | **Responsive Design** | ✅ Hoàn chỉnh | Desktop/Tablet/Mobile |
| 10 | **Dark/Light Theme** | ✅ Hoàn chỉnh | Theme toggle |

### 4.2 MVP User Flows Chính

**Flow 1: Khách mới → Mua hàng đầu tiên**
```
Guest → Home → Browse Shop → Product Detail → Add to Cart
  → Login/Register → Checkout → Place Order → Success
```

**Flow 2: Học + Mua nguyên liệu**
```
User → Learn → Course Detail → Xem bài học
  → Thấy linked materials → Add to Cart
  → Checkout → Mua combo → Học tiếp
```

**Flow 3: DIY + Cộng đồng**
```
User → DIY Feed → Xem bài Idol/Creator
  → "Buy combo" → Add to Cart → Checkout
  → Làm dự án → Đăng bài DIY của mình
```

**Flow 4: Membership & Loyalty**
```
User → Mua hàng → Nhận Points + Coin
  → Lên hạng Silver/Gold/Diamond
  → Mua hàng tiếp với % coin cao hơn
  → Dùng coin giảm giá ở checkout
```

### 4.3 Tính năng chưa có (cần bổ sung cho Production)

| # | Tính năng | Mức ưu tiên |
|---|----------|:---------:|
| 1 | Thanh toán online (VnPay, Momo, PayPal) | 🔴 Cao |
| 2 | Backend API thực (hiện dùng mock data) | 🔴 Cao |
| 3 | Video player thực (hiện dùng mock video) | 🔴 Cao |
| 4 | Upload ảnh khi đăng bài DIY | 🟡 Trung bình |
| 5 | Email verification | 🟡 Trung bình |
| 6 | Push notification | 🟡 Trung bình |
| 7 | Review/Rating sản phẩm | 🟢 Thấp |
| 8 | Live chat hỗ trợ | 🟢 Thấp |
| 9 | Multi-language (VN/EN) | 🟢 Thấp |
| 10 | SEO optimization | 🟢 Thấp |

---

## 5. BUSINESS MODEL CANVAS

### 5.1 Canvas Tổng Thể

| 🔑 **Key Partners** | 🎯 **Key Activities** | 💎 **Value Propositions** | 🤝 **Customer Relationships** | 👥 **Customer Segments** |
|---------------------|-----------------------|--------------------------|-----------------------------|-------------------------|
| • Nhà cung cấp len/dụng cụ | • Quản lý marketplace | **Cho người học:** | • Membership loyalty program | • **Người mới học đan móc** |
| • Idol/Creator nội dung | • Phát triển khóa học | • Học đan móc có cấu trúc | • Rank-based benefits | (Sinh viên, 18-25 tuổi) |
| • Đối tác workshop | • Kiểm duyệt DIY | • Nguyên liệu gắn trong video | • Community engagement | • **Người yêu thích handmade** |
| • Công ty vận chuyển | • Quản lý cộng đồng | • Không cần đoán mò nguyên liệu | • Creator support | (Phụ nữ 22-35 tuổi) |
| • Influencer KOL | | **Cho người mua:** | | • **Fan của Idol** |
| | 🗃️ **Key Resources** | • Combo nguyên liệu theo skill level | | (Teen, 14-22 tuổi) |
| | • Nền tảng công nghệ | • Một chạm mua toàn bộ combo | | • **Creator/Người bán** |
| | • Đội ngũ Creator | | | (Nghệ nhân, 25-40 tuổi) |
| | • Dữ liệu sản phẩm & khóa học | **Cho creator:** | 📢 **Channels** | |
| | • Thương hiệu Len&Em | • Nền tảng kiếm tiền từ nội dung | • Website (len-em.vercel.app) | |
| | | • Kết nối với fan | • Social media (TikTok, Facebook) | |
| | | | • Word of mouth cộng đồng DIY | |
| | | **Cho idol:** | • Workshop offline | |
| | | • Bán combo nguyên liệu cho fan | | |

| 💰 **Cost Structure** | 💵 **Revenue Streams** |
|-----------------------|----------------------|
| • **Chi phí cố định:** | • **Mua khóa học premium:** 59K-99K₫/khóa |
| - Hosting & infrastructure | • **Hoa hồng bán nguyên liệu:** ~20-30% |
| - Lương dev & operation | • **Combo kit:** Giá gốc + margin |
| - Marketing & ads | • **Workshop phí** (future) |
| • **Chi phí biến đổi:** | • **Subscription Creator** (future) |
| - Hoa hồng cho Creator | • **Quảng cáo từ nhà cung cấp** (future) |
| - Phí vận chuyển | • **Idol partnership** (future) |
| - Chi phí nhập hàng | |
| - Coin (3-6% cashback) | |

### 5.2 Giải Thích Chi Tiết

#### 💎 Value Propositions

1. **Closed-loop experience:** Học → Mua nguyên liệu → Làm sản phẩm → Chia sẻ, tất cả trên cùng một nền tảng
2. **No guesswork:** Nguyên liệu được gắn trực tiếp vào video tại timestamp chính xác
3. **Combo thông minh:** Combo nguyên liệu được phân loại theo skill level
4. **Gamification:** Hệ thống rank, điểm, coin tạo động lực mua sắm và học tập
5. **Idol effect:** Fan có thể mua combo nguyên liệu giống idol

#### 👥 Customer Segments

| Segment | Nỗi đau | Giải pháp Len&Em |
|---------|---------|------------------|
| **Sinh viên mới học** (18-25) | Không biết mua nguyên liệu gì, ở đâu | Combo beginner, video cơ bản free |
| **Nhân viên văn phòng** (25-35) | Stress, muốn hobby lành mạnh | DIY nhanh (scrunchie 1-2h), giảm stress |
| **Fan Idol** (14-22) | Muốn làm đồ giống idol | Idol Pick, combo chính hãng |
| **Creator** (25-40) | Muốn kiếm tiền từ đam mê | Creator dashboard, bán combo kèm bài dạy |

#### 💵 Revenue Streams

1. **Khóa học premium:** 59.000₫ → 99.000₫ (khoảng 6 khóa)
   - 4 khóa có phí: Cardigan (99K), Tote (79K), Bucket (59K), Daisy (59K)
   - 2 khóa free: Khăn cơ bản, Mũ Bunny (dùng để thu hút user)

2. **Margin bán nguyên liệu:** 
   - Len: 119K → 349K (margin ~30-50%)
   - Tools: 49K → 329K (margin ~40-60%)
   - Kits: 229K → 599K (margin ~35-45%)

3. **Coin system (đòn bẩy tài chính):**
   - Coin 3-6% cashback = chi phí marketing
   - 20% max usage = đảm bảo margin
   - Hạn 6 tháng = tạo urgency mua hàng

#### 🔑 Key Metrics (KPIs đề xuất)

| Metric | Mục tiêu (Tháng 1) | Mục tiêu (Tháng 6) |
|--------|:-----------------:|:-----------------:|
| Registered Users | 500 | 5.000 |
| Active Learners | 100 | 1.000 |
| Orders/Month | 50 | 500 |
| Average Order Value | 350.000₫ | 450.000₫ |
| Course Sales | 20 | 200 |
| DIY Posts | 30 | 300 |
| Member to Silver rate | 5% | 15% |
| Coin usage rate | 10% | 25% |
| Monthly Revenue | 17.5M₫ | 225M₫ |

---

## 6. ĐỀ XUẤT PHÁT TRIỂN

### 6.1 Giai đoạn MVP (Hiện tại) ✅

Những gì đã hoàn thành:
- [x] Toàn bộ UI/UX với mock data
- [x] 6 khóa học, 6 video free, 22 sản phẩm, 10 bài DIY
- [x] Authentication với JWT + demo accounts
- [x] Membership system (4 ranks, coin, points)
- [x] Admin & Creator dashboard
- [x] Responsive design, dark/light theme
- [x] Cart & Checkout flow

### 6.2 Giai đoạn 1 — Production Ready (Ưu tiên cao)

1. **Backend API Integration** — Thay mock data bằng API thực
2. **Payment Gateway** — Tích hợp VnPay/Momo
3. **Real Video Hosting** — YouTube/Vimeo embed thay vì mock video
4. **Image Upload** — Cho DIY posts, avatar
5. **Email Service** — Verification, order confirmation

### 6.3 Giai đoạn 2 — Growth (Ưu tiên trung bình)

1. **Creator Subscription** — Gói thành viên cho creator
2. **Mobile App** — React Native wrapper
3. **Workshop Booking** — Offline workshop đăng ký online
4. **Idol Partnership Program** — Hợp tác chính thức
5. **Affiliate Marketing** — Link giới thiệu

### 6.4 Giai đoạn 3 — Scale (Ưu tiên thấp)

1. **Multi-language** — Tiếng Anh, Nhật, Hàn
2. **Marketplace Expansion** — Cho phép creator bán pattern riêng
3. **AI Recommendations** — Gợi ý khóa học/sản phẩm
4. **Community Gamification** — Thử thách, leaderboard
5. **B2B Wholesale** — Bán sỉ cho shop đan móc nhỏ

---

## 📊 TỔNG KẾT

| Hạng mục | Chi tiết |
|----------|----------|
| **Dự án** | Len&Em — Nền tảng học & mua nguyên liệu đan móc |
| **MVP Status** | ✅ Hoàn chỉnh (UI + Mock data) |
| **Số page** | 25+ pages (bao gồm admin, creator, auth) |
| **Số component** | 80+ (bao gồm 50+ shadcn/ui components) |
| **Số dòng code ước tính** | ~15.000+ dòng TypeScript/TSX |
| **Modules chính** | Learn, Shop, DIY, Membership, Admin, Creator |
| **Sẵn sàng cho Production?** | ⚠️ Cần backend & payment integration |
| **Target Users** | Sinh viên (18-25), NV văn phòng (25-35), Fan Idol (14-22) |
| **Business Model** | Marketplace + Premium Content + Membership |

---

*Tài liệu phân tích dự án Len&Em — 25/06/2026*