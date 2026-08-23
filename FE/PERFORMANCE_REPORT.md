# 📊 Báo Cáo Phân Tích Hiệu Năng & Khả Năng Mở Rộng — Len&Em Yarn Shop

> **Ngày**: 08/01/2026  
> **Phạm vi**: Frontend (Vite + React + TypeScript) + Backend (Node.js + Express + MongoDB — repo riêng)  
> **Mục tiêu**: Đánh giá khả năng mở rộng với 100K – 1M products & hàng nghìn concurrent users  
> **Lưu ý**: Source backend **KHÔNG** nằm trong workspace (`Yarn-Shop/FE`). Backend deploy tại `https://yarn-shop-be.onrender.com`. Mọi đánh giá về backend/database đều suy luận từ API contract & response shape quan sát được từ FE. Phân loại theo: `✔️ Có sẵn` | `⚠️ Yếu/Hạn chế` | `❌ Không có/Nguy cơ` | `🔍 Need Manual Review`.

> ⚠️ **CẬP NHẬT (snapshot cũ)**: Tài liệu này là **ảnh chụp tại thời điểm 08/01/2026**, dựa trên cấu trúc thư mục **cũ** (các đường dẫn bên dưới như `src/api/*`, `src/app/hooks`, `src/app/components`, `src/context`, `src/app/store` đã được **di dời về `src/shared/*`** và **không còn tồn tại**). Bên cạnh đó, khẳng định "TanStack Query không được sử dụng" ở Phần 1 **đã không còn đúng**: `App.tsx` **đã bọc `QueryClientProvider`** và `src/shared/hooks/useProductsQuery.ts` **đã gọi `useQuery`**. Trước khi sử dụng, hãy đối chiếu lại với code hiện tại.

---

## Phần 1. Phân Tích Cấu Trúc Project

### 1.1 Tổng quan kiến trúc

| Tầng | Công nghệ | Đánh giá |
|------|-----------|----------|
| **Frontend** | React 18.3 + Vite 6 + TypeScript 5.8 | ✔️ Hiện đại, build nhanh |
| **Router** | React Router 7 (`react-router`) | ✔️ Code-splitting bằng `React.lazy()` |
| **State Management** | Zustand 5 (auth, learn) + React Context (cart, favorites, theme, language, review) | ⚠️ Context dùng cho cart/favorites → re-render toàn cây khi thay đổi |
| **Server State** | TanStack Query 5 (✅ ĐÃ SỬ DỤNG từ sau snapshot) | ✅ Đã có `QueryClientProvider` trong `App.tsx` + `useQuery` trong `src/shared/hooks/useProductsQuery.ts` |
| **API Layer** | Axios + interceptor (JWT, refresh queue) | ✔️ Tốt; có dedupe 401 với refresh-queue |
| **Backend** | Node.js + Express + **MongoDB + Mongoose** (repo riêng, host Render) | ⚠️ **Khác giả định ban đầu**: KHÔNG dùng PostgreSQL |
| **Realtime** | Socket.IO client | ✔️ Cho notification/chat |

### 1.2 Vị trí & chức năng các thành phần

| Path | Chức năng | Ghi chú |
|------|-----------|---------|
| `src/app/pages/Shop.tsx` | Product List (filter/sort/search/paginate) | 1.515 dòng — quá lớn, chứa toàn bộ CSS custom trong `<style>` |
| `src/app/pages/ProductDetail.tsx` | Product Detail | Fetch + mock fallback |
| `src/app/hooks/useProducts.ts` | Logic Shop (filters, pagination, manual cache) | Chứa filter **client-side** cho color/material/weight/difficulty/price |
| `src/app/components/ProductCard.tsx` | Product card | ✔️ React.memo; nhưng 1.225 dòng animation nặng |
| `src/lib/axiosClient.ts` | Axios + JWT + silent refresh | ✔️ Refresh-queue chống duplicate refresh |
| `src/lib/queryClient.ts` | QueryClient config | ✅ Đã được nối vào app qua `QueryClientProvider` (từ sau snapshot) |
| `src/api/productService.ts` | Product API | ✔️ Clean |
| `src/api/kitService.ts` | Kit (combo) API | ⚠️ Kit list response chứa **products được populate đầy đủ** → over-fetching |
| `src/features/shop/services/product.service.ts` | Adapt backend → frontend Product | ✔️ Có adapter |
| `src/routes/AppRouter.tsx` | Routing + lazy loading | ✔️ Tốt |
| `src/app/App.tsx` | Provider tree | ✅ Đã có `QueryClientProvider` (từ sau snapshot) |
| `src/app/data/products.ts` | **Mock data** (567 dòng) | ❌ Vẫn là fallback — rủi ro nhất quán dữ liệu |

### 1.3 Database (suy luận từ API contract)

- **Kiểu DB**: MongoDB (NoSQL) — từ README `### Backend (separate repository): Node.js + Express, MongoDB + Mongoose`.
- **Collection products** (từ `BackendProduct` type): `_id`, `name`, `description`, `category`, `image`, `tags[]`, `variants[{_idVariants, color, hexCode, price, stock, image}]`, `isActive`, `averageRating`, `totalRatings`, `ratings[]`, `createdAt`, `updatedAt`.
- **Collection kits** (từ `Kit` type): `products[].productId` là ObjectId **được `.populate()`** trả về full product object.
- **Collection users/orders/reviews**: ✅ Suy ra từ README (JWT, order tracking, membership) — 🔍 Need Manual Review (backend source ngoài workspace).

---

## Phần 2. Phân Tích API Product

### 2.1 Danh sách API đã xác định

| Endpoint | FE gọi tại | Pagination | Limit | Filter | Sort | Select fields |
|----------|-----------|-----------|-------|--------|------|---------------|
| `GET /products` | `product.service.ts` `fetchProducts()` | ✔️ page/limit | ✔️ (12) | ⚠️ Chỉ **category, search** server-side; còn lại client-side | ⚠️ Chỉ `newest`, `rating`; `popular`/`price-asc`/`price-desc` bị map thành `undefined` (lý do: backend trả 400) | ❌ Không |
| `GET /products/:id` | `fetchProductById()` | — | — | — | — | ❌ Không |
| `POST /products` | Admin productService.create | — | — | — | — | — |
| `PUT /products/:id` | productService.update | — | — | — | — | — |
| `PATCH /products/:id` | productService.restore | — | — | — | — | — |
| `DELETE /products/:id` | productService.delete | — | — | — | — | — |
| `POST /products/:id/rate` | productService.rateProduct | — | — | — | — | — |
| `GET /kits` | kitService.getAll | ✔️ page/limit | ✔️ (12/50) | ⚠️ Chỉ `level` | ❌ | ❌ |
| `GET /kits/:id` | kitService.getById | — | — | — | — | ❌ |
| `GET /diy-posts` | diyService.getAllPosts | ✔️ page/limit | ✔️ (20) | ❌ | ❌ | ❌ |

### 2.2 Đánh giá chi tiết

| Tiêu chí | Trạng thái | Phân tích |
|----------|-----------|-----------|
| Pagination | ✔️ Có | Offset-based `page` + `limit` (FE mặc định 12 products, 50 admin) |
| Cursor pagination | ❌ Không | Ở 1M products, `skip()` của MongoDB ở page sâu sẽ **chậm nhanh** (skip 10K+ docs) |
| Filter | ⚠️ Hạn chế | Chỉ `category`, `search`, `includeInactive` được gửi lên server. **Color/Material/Weight/Difficulty/Price bị lọc ở FE** sau khi nhận 12 products → ❌ Kết quả không chính xác với catalog lớn |
| Sort | ⚠️ Hạn chế | Chỉ `newest`, `rating`. Sort phổ biến nhất (`popular`, `price-asc/desc`) **không được backend hỗ trợ** → FE comment trực tiếp: *"Backend only supports: newest. Remove price-asc, price-desc, rating (cause 400)"* |
| Select field | ❌ Không | API trả full document (kể cả `description` dài, `ratings[]` mảng người dùng, `tags`) ngay cả khi card chỉ cần tên/giá/ảnh → over-fetching |
| Query tối ưu | ❌ Không | Không dùng projection `.select()`, không aggregation pipeline cho filter tổng hợp, không có endpoint riêng cho dynamic filter facets (categories/colors/materials counts) |

---

## Phần 3. Đánh Giá Database (suy luận — backend ngoài workspace)

> ⚠️ **Cảnh báo**: Workspace chỉ chứa FE. Các đánh giá dưới đây dựa trên API response shape + best-practice MongoDB. Ghi `🔍 Need Manual Review` khi không chắc chắn.

### 3.1 Checklist

| Kiểm tra | Trạng thái | Ghi chú |
|----------|-----------|---------|
| SELECT * tương đương (`find({})` không projection) | ⚠️ **Có nguy cơ cao** | FE nhận full product (có `description`, `ratings[]` đầy đủ user) chứng tỏ backend không projection |
| Index đơn | 🔍 Need Manual Review | Không thấy source → không xác nhận được `name`, `category`, `price` index |
| Composite index | 🔍 Need Manual Review | Rất cần cho filter `{category, isActive, createdAt}` — không xác nhận được |
| Unique index | 🔍 Need Manual Review | `name` product nên unique; không xác nhận được |
| Full-text search | 🔍 Need Manual Review | FE chỉ gửi `search` param → nếu backend dùng regex `$regex` trên 1M docs sẽ **rất chậm**; nếu dùng MongoDB text index mới khả thi |

### 3.2 Đánh giá với 1 triệu products — vấn đề sẽ gặp

| Vấn đề | Mức độ | Giải thích |
|--------|--------|------------|
| `$regex` search không index | 🔴 Nghiêm trọng | Nếu search dùng `{ name: { $regex: q } }` → full collection scan O(N) trên 1M docs |
| `skip()` pagination sâu | 🟠 Cao | `page=50000&limit=12` → MongoDB phải bỏ qua ~600K docs |
| Không projection | 🟠 Cao | Mỗi doc trả về ~2–5 KB thừa (description, ratings[]) → bandwidth + JSON parse chậm |
| Populate kit → products | 🟠 Cao | Kit trả về full product object cho từng product trong kit → payload rất lớn (1 kit 5 sp = 5M doc đọc) |
| Facet filter | 🟡 Trung bình | Dynamic filter options được **fetch 200 products rồi đếm ở FE** — với 1M products đây là ước lượng sai lệch hoàn toàn |
| Ratings nhúng trong product | 🟡 Trung bình | `ratings[]` là array nhúng → khi số rating lớn, document phình to, mỗi lần rating mới tốn write toàn bộ doc |

---

## Phần 4. Frontend Performance

### 4.1 Product List (Shop)

| Kiểm tra | Trạng thái | Chi tiết |
|----------|-----------|----------|
| Render toàn bộ | ⚠️ Giới hạn | Chỉ 12 products/trang (pagination) — OK hiện tại |
| Pagination | ✔️ Có | Offset-based số trang (trigger `goToPage`) |
| Infinite scroll | ❌ Không | Không có |
| Virtualization | ❌ Không | Không dùng `react-window`/`@tanstack/react-virtual` — với grid lớn sẽ lag |
| React.memo | ✔️ Có | `ProductCard = memo(...)` |
| useMemo | ✔️ Nhiều | Shop dùng `useMemo` cho paginationRange, categoryOptions, filteredKits... |
| useCallback | ✔️ Nhiều | `updateFilter`, `toggleArrayFilter`, `goToPage`, `removeChip` |
| **vấn đề re-render lớn** | ⚠️ | `FilterContent` được định nghĩa **bên trong component Shop** (dù có `memo`) → mỗi lần Shop re-render là memo vô dụng vì props mới (closure) — **`memo()` trên component định nghĩa nội-bộ KHÔNG có tác dụng** |
| CSS trong JSX | ⚠️ | ~300 dòng CSS trong thẻ `<style>` của Shop render lại mỗi lần — nên tách file CSS |

### 4.2 Image

| Kiểm tra | Trạng thái | Chi tiết |
|----------|-----------|----------|
| Lazy loading | ❌ **Không có** | Không một `<img loading="lazy">` nào trong toàn repo (đã regex toàn bộ) |
| Placeholder | ⚠️ Có | Skeleton loading (ProductSkeleton) cho lúc fetch, nhưng image self không có placeholder |
| Skeleton | ✔️ Có | `ProductSkeleton`, `ProductGridSkeleton`, `ProductDetailSkeleton` |
| Responsive image (`srcSet`/`sizes`) | ❌ Không | Không có `srcSet`/`sizes` bất kỳ đâu |
| CDN | ⚠️ Một phần | Mock dùng **images.unsplash.com** (CDN bên ngoài, miễn phí nhưng không kiểm soát). Product thật từ Render trả ảnh gốc, không resize |
| WebP/AVIF | ❌ Không | Không có `.webp`/`.avif`; Unsplash `fm=jpg` |
| Image compression | ❌ Không | Upload admin gửi raw file (không nén phía FE trước khi upload) |
| Thumbnail | ❌ Không | Shop/ProductDetail cùng load 1 ảnh gốc 800px cho mọi kích thước hiển thị |
| Fallback | ✔️ Có | `onError` → picsum.photos (tốt cho UX, xấu cho hiệu năng: thêm request khi ảnh lỗi) |

### 4.3 Search

| Kiểm tra | Trạng thái | Chi tiết |
|----------|-----------|----------|
| Debounce | ✔️ Có | `useDebounce` 400ms (Shop), `useDebouncedSearch` (Kits/DIY) |
| Throttle | ❌ Không | Không cần thiết khi đã debounce |
| Cache | ⚠️ Thủ công | `productsCache` Map 5 phút trong `useProducts` (module-level, không chia sẻ giữa các hook/page) |

> ⚠️ **Ghi chú Search**: `KitsPage` và `DIYFeedPage` search **client-side** trên dữ liệu đã fetch (12–20 items/trang). Với 100K+ items, search client-side là không đầy đủ — chỉ tìm được trong trang hiện tại.

---

## Phần 5. React Query / TanStack Query

### 5.1 Trạng thái

| Kiểm tra | Trạng thái | Chi tiết |
|----------|-----------|----------|
| Sử dụng | ❌ **KHÔNG sử dụng** | Cài `@tanstack/react-query` ^5.100.10 nhưng app **không có `QueryClientProvider`** và **0 lần gọi `useQuery`/`useMutation`** (đã regex toàn src) |
| Cache | ❌ Không | Thay vào đó: manual `Map` cache trong `useProducts` + `localStorage` cho cart/favorites/reviews |
| staleTime | ⚠️ Cấu hình trong file chết | `queryClient.ts` setup `staleTime: 5m`, `gcTime: 30m`, `retry: 2` — nhưng file này **không được import vào app** |
| gcTime | ⚠️ Như trên | Chết cùng file |
| Prefetch | ❌ Không | Không có |
| Invalidate | ❌ Không | Sau khi admin create/update/delete ⇒ gọi lại `fetchProducts()` thủ công — không invalidation chuẩn |
| Optimistic update | ❌ Không | Không có |
| Retry | ❌ Không dùng được | Config có `retry: 2` + `retryDelay` nhưng không hoạt động vì không dùng hook |

### 5.2 Đánh giá

TanStack Query được cài nhưng hoàn toàn bỏ phí. Toàn bộ data fetching đang chạy theo pattern `useEffect + useState + isCancelled`:

- `src/app/hooks/useProducts.ts` — fetch thủ công, có race-condition guard nhưng không có loading error states chuẩn, không có background refetch, không có request deduplication giữa **hai** lần mount.
- `src/app/pages/admin/ProductManagement.tsx` — fetch thủ công, không có cache.
- `src/app/pages/ProductDetail.tsx` — fetch thủ công.
- `src/app/pages/DIYFeedPage.tsx` — fetch thủ công.

**Hệ quả**: mỗi lần rời khỏi Shop rồi quay lại, `useProducts` chạy lại 2 request (1 list + 1 all-products-filter) — không có global cache; 100K users quay đi quay lại = duplicate request lên backend.

---

## Phần 6. API Performance

| Kiểm tra | Trạng thái | Chi tiết |
|----------|-----------|----------|
| N+1 query | ⚠️ **Có ở nhiều nơi** | 1) `DIYFeedPage.fetchPosts()`: fetch 20 posts → **1 request mỗi creator** = N+1 (dù dùng `Promise.allSettled`, vẫn N request). 2) `KitsPage` list trả về kit với `products[].productId` được populate → 1 kit = đọc nhiều product |
| Over-fetching | ⚠️ Có | `GET /products` trả full document gồm `description`, `ratings[]` — nhưng `ProductCard` chỉ render tên/giá/ảnh/tags. `GET /kits` trả full product objects bên trong |
| Under-fetching | ⚠️ Có | Filter color/material/price không được backend hỗ trợ → FE chỉ có 12 items/trang để lọc → kết quả hiển thị **thiếu sản phẩm hợp lệ** |
| Duplicate request | ⚠️ Có | 1) StrictMode double-mount → `useProducts` mount 2 lần → 2× request filter 2 trang. 2) Không global cache: quay lại Shop = fetch lại. 3) `ProductDetail` fallback mock + fetch API cùng lúc |
| Request gọi nhiều lần | ⚠️ Có | Với dynamic filters, **mỗi user khi vào Shop** fetch `page=1&limit=100` + `page=2&limit=100` (tối đa 200 records) chỉ để đếm facet — với 1K concurrent users = 2K request chỉ cho filter sidebar |

---

## Phần 7. Image Performance

| Kiểm tra | Trạng thái | Chi tiết |
|----------|-----------|----------|
| `loading="lazy"` | ❌ Không có | Ảnh product list & DIY feed load tất cả ngay lập tức |
| Responsive image | ❌ Không | Không `srcSet`/`sizes`; cùng 1 URL 800px cho card 100px và modal 800px |
| WebP | ❌ Không | Không sử dụng (kể cả Unsplash đang bị ép `fm=jpg`) |
| AVIF | ❌ Không | Không sử dụng |
| Image compression | ❌ Không | Upload admin gửi file gốc — backend không thấy đề cập resize/compress 🔍 |
| Thumbnail | ❌ Không | Không có hệ thống thumbnail riêng |
| CDN | ⚠️ Một phần | Mock: Unsplash CDN. Production: ảnh host từ Render (cùng server API) — không CDN tách biệt |

**Ước tính tác động**: Mỗi product image ~200–400 KB (JPEG 800px). 1 trang 12 products + ảnh nền banner = ~3–5 MB mỗi lần load. Với 100K users đồng thời xem Shop = ~300–500 GB bandwidth chỉ riêng ảnh. Thiếu lazy-load là nguyên nhân chính.

---

## Phần 8. Caching

### 8.1 Frontend

| Loại | Trạng thái | Chi tiết |
|------|-----------|----------|
| React Query cache | ❌ Không dùng | Setup sẵn nhưng không nối |
| Manual memory cache | ⚠️ Có | `productsCache: Map<string, CachedProducts>` (5 phút) trong `useProducts` — không share giữa các trang |
| LocalStorage | ⚠️ Dùng nhiều | Cart (`yarn_shop_cart`), Favorites (`lenEm_favorites`), Reviews (`lenEm_reviews`), theme, language, notification dismissed... |
| SessionStorage | ⚠️ Có | Token (khi không "Remember me") |

> ❌ **Rủi ro LocalStorage**: Cart price/stock lưu local **không đồng bộ server** — backend recalc khi tạo order (có comment xác nhận). Nếu giá sản phẩm thay đổi, cart hiển thị giá cũ. Favorites/reviews hoàn toàn client-side — khi đổi máy sẽ mất.

### 8.2 Backend (🔍 Need Manual Review — source ngoài workspace)

| Loại | Trạng thái |
|------|-----------|
| Redis | 🔍 Need Manual Review |
| Memory cache | 🔍 Need Manual Review |
| Mongo query cache | 🔍 Need Manual Review |

### 8.3 HTTP

| Kiểm tra | Trạng thái | Chi tiết |
|----------|-----------|----------|
| `Cache-Control` | ❌ Không thấy FE kiểm soát | Axios không set cache headers; ảnh không có version query |
| `ETag` | 🔍 Need Manual Review | Backend phải kiểm tra |
| Service Worker / PWA offline | ❌ Không | Không có |

---

## Phần 9. Search System

### 9.1 Hiện trạng

- FE gửi tham số `search` lên `GET /products?search=...`.
- FE dùng `useDebounce` 400ms rồi push vào URL `?search=`.
- **KitsPage / DIYFeedPage**: search **100% client-side** trên 12–20 items — không phải backend search.
- Backend mechanism: 🔍 Need Manual Review (khả năng cao là regex trên MongoDB; nếu vậy rất chậm ở quy mô lớn).

### 9.2 Khuyến nghị theo quy mô

| Quy mô | Giải pháp | Ưu điểm | Nhược điểm |
|--------|-----------|---------|------------|
| ≤ 100K products | **MongoDB Text Index** hoặc **PostgreSQL FTS** (nếu move SQL) | Chi phí 0, đủ cho độ chính xác cơ bản; support diacritic tiếng Việt nếu custom | Không có typo-tolerance, ranking yếu, không facet search |
| ≤ 500K products | **Meilisearch** | Cực nhanh (<50ms), dễ setup, hỗ trợ typo-tolerance & facet filter sẵn, chỉ số hóa realtime | Phải vận hành thêm 1 service; memory ~1 GB cho 500K docs; giới hạn license cho bản open-source |
| ≤ 500K products (thay thế) | **Typesense** | Tương tự Meilisearch, nhanh, ít resource hơn | Ít cộng đồng hơn; setup phức tạp hơn Meilisearch |
| 1M products | **Elasticsearch / OpenSearch** | Chuẩn công nghiệp, scale ngang dễ, ranking tùy biến, aggregations mạnh cho facet filter | Ops nặng nề (cluster), memory lớn, độ phức tạp cao |

**Khuyến nghị**: Với quy mô dự án hiện tại (đồ án + có thể chạy thật nhỏ), bắt đầu với **Meilisearch** — cân bằng tốt nhất giữa effort/chi phí/kết quả. Khi vượt 1M & cần ranking tinh vi → mới nên Elasticsearch.

---

## Phần 10. Khả Năng Scale

### 10.1 Bottleneck theo mức concurrent users

| Thành phần | 1.000 users | 5.000 users | 10.000 users | Bottleneck chính? |
|------------|-------------|-------------|--------------|-------------------|
| **API (Render free tier)** | ⚠️ Render free tier sleep khi idle, cold start 5–20s | ❌ Quá tải nhanh | ❌ | 🔴 **API server đơn instance** là bottleneck #1 |
| **Database MongoDB** | 🟡 OK nếu có index | 🟠 Chậm nếu regex/skip | ❌ | 🔴 Không index + không cache = chậm |
| **Frontend Vercel** | ✔️ CDN toàn cầu | ✔️ Static; vấn đề là API | ✔️ Static OK | 🟢 Không phải bottleneck |
| **Cache** | ❌ Không có Redis | ❌ | ❌ | 🔴 Không có tầng cache tập trung |
| **Search** | 🟡 Nếu regex | ❌ Regex scan toàn collection | ❌ | 🔴 |
| **Image** | 🟠 Server Render phục vụ ảnh gốc | ❌ Băng thông vỡ | ❌ | 🔴 Ảnh không CDN tách biệt |

### 10.2 Thứ tự bottleneck

1. **API instance đơn (Render free)** — tất cả request về 1 instance
2. **Image serving** — ảnh host cùng API server, không CDN, không lazy-load
3. **Database query** — không index (nghi vấn), không projection, populates nặng
4. **Không caching** — mỗi user vào Shop lại gõ backend 2–3 request
5. **Frontend rendering** — không virtualization khi grid lớn

---

## Phần 11. Security

| Kiểm tra | Trạng thái | Chi tiết |
|----------|-----------|----------|
| Rate Limit | ⚠️ Có dấu hiệu | Axios map 429 "Too many requests" → **backend có rate limit** (không thấy chi tiết). FE không có retry-after handling |
| Compression | 🔍 Need Manual Review | Backend; chưa thấy FE yêu cầu gzip/brotli (Axios mặc định gửi `Accept-Encoding: gzip`) |
| Helmet | 🔍 Need Manual Review | Backend |
| CORS | 🔍 Need Manual Review | Backend; FE không set CORS |
| SQL Injection | 🟢 Không áp dụng | MongoDB, không SQL |
| XSS | ⚠️ Rủi ro | React tự escape hầu hết; nhưng dùng `dangerouslySetInnerHTML`/`raw` chỗ nào đó cần rà 🔍; `<img src>` từ user-controlled URL có thể leak data qua query string 🔍 |
| CSRF | 🟢 Giảm thiểu | JWT Bearer token trong header (không cookie-based) → ít rủi ro CSRF |
| Validation | ⚠️ Có nhưng lỏng | FE dùng Yup cho forms; backend không rõ. `ProductManagement.validate()` chỉ check name/category/image/variants |
| File Upload | ⚠️ Nguy cơ | FE gửi file gốc không validate type/size phía FE; admin upload ảnh. Backend cần validate magic bytes & kích thước 🔍 |
| Token storage | ⚠️ Tốt một phần | Hỗ trợ sessionStorage khi không "Remember me" (tốt cho máy dùng chung); nhưng **JWT access token không có expiry ngắn rõ ràng, refresh token lưu storage** — nếu XSS lấy được token là chiếm được session |
| `.env` | ⚠️ | `.env.local` tồn tại trong thư mục (gitignored nhưng cần xác nhận không push) ✔️ `.gitignore` đã có `.env*` |

---

## Phần 12. Best Practices — So Sánh Amazon/Shopee/Lazada

| Kỹ thuật | Amazon | Shopee/Lazada | **Dự án hiện tại** | Ghi chú |
|----------|--------|---------------|-------------------|---------|
| **Lazy-load image + placeholder LQIP** | ✔️ | ✔️ (`blurhash`, `loading=lazy`, srcSet) | ❌ Không | **Cần làm ngay** |
| **CDN riêng cho media** | ✔️ CloudFront | ✔️ CDN nội địa | ❌ Render host ảnh | Di chuyển sang Cloudinary/Cloudflare R2 |
| **Server-side search (Meilisearch/ES)** | ✔️ | ✔️ | ⚠️ Regex client-side | Phần 9 |
| **Caching nhiều tầng (CDN→Redis→DB)** | ✔️ | ✔️ | ❌ | Thêm Redis + CDN cache cho public GET |
| **Product list API server-side filter/sort/paginate** | ✔️ | ✔️ | ⚠️ Một phần | Color/material/price phải chuyển lên server |
| **Facet filter counts từ server** | ✔️ | ✔️ (`aggregate`) | ❌ Đếm ở FE trên 200 items | |
| **Virtualization cho grid lớn** | ✔️ | ✔️ | ❌ | Khi grid > 50 item |
| **Infinite scroll + pagination kết hợp** | ⚠️ (pagination) | ✔️ Infinite scroll | ❌ Chỉ pagination nút | UX tốt hơn cho mobile |
| **Optimistic UI cho cart/favorite** | ✔️ | ✔️ | ✔️ Local-only | Nhưng không sync server |
| **Prefetch product detail khi hover card** | ✔️ | ✔️ | ❌ | Có thể prefetch bằng TanStack Query |
| **Service Worker / App Shell** | ✔️ (PWA) | ✔️ | ❌ | |
| **Observer/analytics** | ✔️ | ✔️ | ❌ | Chưa thấy |
| **A/B testing** | ✔️ | ✔️ | ❌ | |

---

## Phần 13. Refactoring Plan

**Ký hiệu độ khó**: 🟢 Dễ (≤ 1 ngày) | 🟡 Trung bình (2–5 ngày) | 🔴 Khó (1–2 tuần)

| Priority | Module | Mức độ ảnh hưởng | Độ khó | Lợi ích |
|----------|--------|-----------------|--------|---------|
| **P0** | **Nối TanStack Query vào app** — thêm `QueryClientProvider` trong `App.tsx`, chuyển `useProducts`, ProductDetail, AdminProducts, KitDetail sang `useQuery`; `useMutation` + `invalidateQueries` cho admin CRUD | Toàn hệ thống | 🟡 | Cache global, dedupe request, retry tự động, background refetch — giảm ngay 30–50% request |
| **P0** | **Chuyển filter lên server** — color/material/weight/difficulty/price thành params API; backend aggregate filter + facet counts | Product, Admin | 🔴 | Kết quả đúng 100% với catalog lớn; giảm 200-record fetch mỗi user |
| **P0** | **Image pipeline** — `loading="lazy"` ngay lập tức; sau đó di chuyển ảnh lên CDN (Cloudinary) + `srcSet`/WebP + thumbnail sizes | Toàn FE | 🟡 | Giảm 60–80% bandwidth, cải thiện LCP |
| **P1** | **API select/projection** — backend thêm `?fields=id,name,image,price` cho list; bỏ `ratings[]` khỏi list response | API, FE adapter | 🟢 | Giảm payload 50%+ |
| **P1** | **React.memo hiệu quả** — đưa `FilterContent` ra ngoài component (fix memo vô dụng); vô hiệu hóa `StrictMode` double-fetch (hoặc dùng TanStack Query để dedupe) | Shop | 🟢 | Giảm re-render & duplicate request |
| **P1** | **Fix N+1 DIYFeed** — backend populate `creator` 1 lần (hoặc FE dùng 1 `GET /users?ids=`) | DIY | 🟢 | Giảm từ N request → 1 |
| **P1** | **Tách CSS custom** ra file (`shop.css`) khỏi `<style>` trong JSX | Shop, ProductCard | 🟢 | Giảm re-render, dễ maintain |
| **P1** | **Search backend** — ít nhất MongoDB text index; so sánh Meilisearch khi >100K | Search | 🟡 | Kết quả đúng, nhanh |
| **P2** | **Redis cache** cho GET /products, /products/:id, /kits (TTL 5–15 phút) | Backend 🔍 | 🟡 | Giảm tải DB mạnh |
| **P2** | **Pagination nâng cấp** — cursor-based cho page > N (tránh skip) | Backend 🔍 | 🟡 | Ổn định khi deep page |
| **P2** | **Infinite scroll + virtualization** cho Shop grid (react-window) | Shop | 🟡 | UX & render tốt hơn |
| **P2** | **WebSocket/SWR sync cart/favorites** với server (thay localStorage) | Cart, Favorites | 🔴 | Đồng bộ nhiều thiết bị |
| **P3** | **PWA + Service Worker** (caching static assets, offline fallback) | Toàn FE | 🟡 | Tải lại nhanh, offline |
| **P3** | **Code splitting thêm**: dynamic import 3D (Three.js) chỉ khi cần | Toàn FE | 🟢 | Giảm bundle vendor-3d ban đầu |
| **P3** | **Analytics + RUM** (Vercel Analytics / Sentry) | Toàn FE | 🟢 | Đo lường thật |
| **P3** | **Image upload compression phía FE** (canvas → WebP trước khi upload) + validate type/size | Admin | 🟢 | Giảm storage & bandwidth |

---

## Phần 14. Báo Cáo Chi Tiết Từng Vấn Đề

### V1. TanStack Query cài nhưng không sử dụng

- **File**: `package.json` (deps), `src/lib/queryClient.ts`, `src/app/App.tsx`
- **Đường dẫn**: `src/app/App.tsx` (thiếu `QueryClientProvider`)
- **Mô tả**: QueryClient được config đầy đủ (staleTime 5m, gcTime 30m, retry 2) nhưng không được kết nối; 0 lần dùng `useQuery`.
- **Nguyên nhân**: Chuyển từ pattern cũ `useEffect+useState` chưa hoàn tất; hoặc cài dependency sẵn để dùng sau.
- **Mức độ ảnh hưởng**: 🔴 Cao — mất global cache, dedupe request, retry, background refetch, optimistic UI.
- **Hướng giải quyết**: Bọc `QueryClientProvider` trong `App.tsx`; viết hooks `useProductsQuery(params)`; dùng `useMutation` + `queryClient.invalidateQueries(["products"])` cho admin CRUD.
- **Độ ưu tiên**: **P0**

### V2. Filter client-side không chính xác

- **File**: `src/app/hooks/useProducts.ts` (dòng ~245–330)
- **Đường dẫn**: `src/app/hooks/useProducts.ts`
- **Mô tả**: Sau khi nhận 12 products từ server, FE tiếp tục lọc color/material/weight/difficulty/price `result.data.filter(...)`. Nếu có 1.000 sản phẩm màu "Hồng Phấn" nhưng page 1 không chứa → trả về 0 kết quả (sai lệch).
- **Nguyên nhân**: Backend không hỗ trợ filter các field này trong `/products`; FE bù bằng client-side filter.
- **Mức độ ảnh hưởng**: 🔴 Cao — kết quả hiển thị thiếu/thừa, trải nghiệm tệ, không scale được.
- **Hướng giải quyết**: Thêm params `colors, materials, weights, difficulties, minPrice, maxPrice` vào API; backend dùng MongoDB `$in` + `$elemMatch` trên variants; trả facet counts qua aggregation.
- **Độ ưu tiên**: **P0**

### V3. Không lazy-load image

- **File**: `src/app/components/ProductCard.tsx` (dòng 783 `<img src={product.image}>`), `src/app/pages/Shop.tsx`, `KitsPage.tsx`, `DIYFeedPage.tsx`, `ProductDetail.tsx`
- **Đường dẫn**: toàn FE
- **Mô tả**: Không `<img loading="lazy">`; browser tải toàn bộ ảnh grid cùng lúc; không `srcSet`, không WebP.
- **Nguyên nhân**: Chưa áp dụng best-practice image.
- **Mức độ ảnh hưởng**: 🔴 Cao — bandwidth lớn gấp 3–5× so với cần; LCP/INP xấu trên mobile.
- **Hướng giải quyết**: Thêm `loading="lazy"` + `decoding="async"` ngay; sau đó CDN (Cloudinary) tạo multi-size + WebP/AVIF + `srcSet`/`sizes`; placeholder LQIP (blurhash).
- **Độ ưu tiên**: **P0**

### V4. API over-fetching / không projection

- **File**: `src/features/shop/services/product.service.ts`, `src/api/kitService.ts`, `src/shared/types/product.types.ts` (`BackendProduct` có `ratings[]`)
- **Đường dẫn**: `src/api/*`
- **Mô tả**: List product trả full document (description, ratings[]) trong khi card chỉ cần ảnh/tên/giá. Kit list trả full populated products.
- **Nguyên nhân**: Backend `find()` không projection; FE không yêu cầu field select.
- **Mức độ ảnh hưởng**: 🟠 Trung bình — payload ~2–5 KB thừa/product; với 1M products & traffic cao → tốn bandwidth + DB I/O.
- **Hướng giải quyết**: Backend hỗ trợ `?fields=...` hoặc mặc định list chỉ trả summary fields; FE adapter map theo.
- **Độ ưu tiên**: **P1**

### V5. Search dùng regex/client-side

- **File**: `src/app/hooks/useProducts.ts`, `src/app/pages/KitsPage.tsx` (dòng 35–43), `src/app/pages/DIYFeedPage.tsx` (dòng 143–146)
- **Đường dẫn**: `src/app/pages/*`
- **Mô tả**: Shop search truyền `?search=` lên backend (cách không rõ — có thể $regex). KitsPage & DIYFeed search hoàn toàn client-side trên 12–20 items.
- **Nguyên nhân**: Chưa có search engine.
- **Mức độ ảnh hưởng**: 🔴 Cao khi scale — regex full-scan 1M docs = hàng giây; client-side search thiếu kết quả.
- **Hướng giải quyết**: Mongo text index trước; Meilisearch/Typesense khi >100K (xem Phần 9).
- **Độ ưu tiên**: **P1**

### V6. N+1 query ở DIY Feed

- **File**: `src/app/pages/DIYFeedPage.tsx` (dòng 48–79)
- **Đường dẫn**: `src/app/pages/DIYFeedPage.tsx`
- **Mô tả**: Fetch 20 posts, rồi `creatorIds.map(async id => userService.getUserById(id))` — 1 request per creator.
- **Nguyên nhân**: API `/diy-posts` không populate creator; FE phải tự lấy.
- **Mức độ ảnh hưởng**: 🟡 Trung bình — với page 20 posts thường 5–15 creators = 5–15 request/page load.
- **Hướng giải quyết**: Backend populate `creator` trong `/diy-posts`; hoặc thêm endpoint `GET /users?ids=a,b,c`.
- **Độ ưu tiên**: **P1**

### V7. `React.memo` vô dụng do component nội bộ

- **File**: `src/app/pages/Shop.tsx` (dòng 410–567 `const FilterContent = memo(...)` bên trong `Shop`)
- **Đường dẫn**: `src/app/pages/Shop.tsx`
- **Mô tả**: Component memo được định nghĩa trong thân component cha ⇒ mỗi render cha tạo instance mới ⇒ memo không thể so sánh bằng.
- **Nguyên nhân**: Hiểu nhầm cơ chế memo.
- **Mức độ ảnh hưởng**: 🟡 Trung bình — re-render toàn sidebar filter mỗi lần Shop state đổi (mỗi lần gõ search).
- **Hướng giải quyết**: Đưa `FilterContent` ra ngoài component Shop; hoặc bỏ memo và tách sub-components thuần.
- **Độ ưu tiên**: **P1**

### V8. StrictMode double-fetch + không cache global

- **File**: `src/main.tsx` (StrictMode), `src/app/hooks/useProducts.ts`
- **Đường dẫn**: `src/main.tsx`, `src/app/hooks/useProducts.ts`
- **Mô tả**: StrictMode mount 2 lần ở dev → mỗi lần vào Shop chạy 2×(list + 200-filter records) = 4 request. Production không double nhưng quay lại Shop luôn fetch lại (không global cache).
- **Nguyên nhân**: TanStack Query không được dùng.
- **Mức độ ảnh hưởng**: 🟡 Trung bình — dev chậm, prod nhiều duplicate request.
- **Hướng giải quyết**: TanStack Query dedupe + cache 5 phút (đã config sẵn!).
- **Độ ưu tiên**: **P1** (giải quyết cùng V1)

### V9. Admin CRUD không invalidate cache chuẩn

- **File**: `src/app/pages/admin/ProductManagement.tsx`, `AdminKits.tsx`
- **Đường dẫn**: `src/app/pages/admin/*`
- **Mô tả**: Sau create/update/delete, gọi `fetchProducts()` thủ công; không có optimistic update; UI chờ full round-trip.
- **Nguyên nhân**: Chưa dùng TanStack Query.
- **Mức độ ảnh hưởng**: 🟡 Trung bình — UX chậm, không rollback khi lỗi.
- **Hướng giải quyết**: `useMutation` + `queryClient.setQueryData` + `invalidateQueries`.
- **Độ ưu tiên**: **P1**

### V10. Cart/Favorites/Reviews lưu localStorage, không sync server

- **File**: `src/context/CartContext.tsx`, `src/app/context/FavoritesContext.tsx`, `src/app/context/ReviewContext.tsx`
- **Đường dẫn**: `src/context/*`
- **Mô tả**: Cart price/stock local; favorites, reviews local — mất khi đổi thiết bị, không thống nhất với server.
- **Nguyên nhân**: Chưa có cart/review API (comment trong CartContext: *"No cart API exists"*).
- **Mức độ ảnh hưởng**: 🟠 Trung bình-Cao — giá/stock hiển thị sai ảnh hưởng trải nghiệm mua; reviews không phản ánh thật.
- **Hướng giải quyết**: Thêm cart/review API backend; SWR sync qua WebSocket; optimistic với server validation.
- **Độ ưu tiên**: **P2**

### V11. CSS trong JSX làm chậm render

- **File**: `src/app/pages/Shop.tsx` (dòng 572–993 ~400 dòng CSS trong `<style>`)
- **Đường dẫn**: `src/app/pages/Shop.tsx`
- **Mô tả**: Toàn bộ CSS của Shop nằm trong string JSX; mỗi lần render lại tạo node style mới.
- **Nguyên nhân**: Phát triển nhanh, không tách file.
- **Mức độ ảnh hưởng**: 🟡 Trung bình — re-render tốn thêm work; khó maintain.
- **Hướng giải quyết**: Tách `shop.css`, import qua Vite (`styles/shop.css`).
- **Độ ưu tiên**: **P1**

### V12. Không virtualization cho grid lớn

- **File**: `src/app/pages/Shop.tsx` (dòng 1209 `.product-grid`), `DIYFeedPage.tsx`
- **Đường dẫn**: `src/app/pages/*`
- **Mô tả**: Grid render tất cả items trong trang (12 hiện tại); nếu tăng limit hoặc infinite scroll → DOM lớn.
- **Nguyên nhân**: Chưa cần ở hiện tại; sẽ cần khi đổi sang infinite scroll.
- **Mức độ ảnh hưởng**: 🟡 Trung bình (tương lai) — FPS thấp khi 100+ cards.
- **Hướng giải quyết**: `@tanstack/react-virtual` cho grid khi vượt ~50 items/trang.
- **Độ ưu tiên**: **P2**

### V13. Backend không có Redis/cache — throughput giới hạn

- **File**: 🔍 Need Manual Review (backend)
- **Đường dẫn**: N/A
- **Mô tả**: API response không cho thấy dấu hiệu cache (không header, không đề cập Redis); Render free tier 1 instance.
- **Nguyên nhân**: Chưa có tầng cache.
- **Mức độ ảnh hưởng**: 🔴 Cao — mỗi request chạm DB; 5K users = 5K+ query/s nếu họ vào Shop cùng lúc (2–3 request/user).
- **Hướng giải quyết**: Redis cache GET /products, /products/:id, /kits (TTL 5–15 phút), cache thêm facet counts; hoặc CDN cache public GET (Vercel edge caching).
- **Độ ưu tiên**: **P2**

### V14. Ảnh host cùng API server (Render), không CDN

- **File**: `src/shared/types/product.types.ts` (resolveImageUrl → API base), `src/api/kitService.ts`
- **Đường dẫn**: `src/shared/types/product.types.ts`, `src/api/kitService.ts`
- **Mô tả**: Product/kit images trỏ về `yarn-shop-be.onrender.com` — cùng server API; không tách biệt.
- **Nguyên nhân**: Dùng backend như file server luôn.
- **Mức độ ảnh hưởng**: 🔴 Cao khi scale — ảnh chiếm băng thông server API, làm chậm API chính.
- **Hướng giải quyết**: Di chuyển ảnh lên Cloudinary/Cloudflare R2/S3; backend upload → CDN URL; FE dùng `cdn.jsdelivr.net`/Cloudflare transform.
- **Độ ưu tiên**: **P2**

### V15. Không có file upload validation phía FE

- **File**: `src/app/pages/admin/ProductManagement.tsx` (dòng 573–592 `<input type="file" accept="image/*">`)
- **Đường dẫn**: `src/app/pages/admin/ProductManagement.tsx`
- **Mô tả**: Không check type/size trước khi upload; file gốc gửi thẳng.
- **Nguyên nhân**: Thiếu validation.
- **Mức độ ảnh hưởng**: 🟡 Trung bình — user upload 50MB ảnh → tốn storage, chậm.
- **Hướng giải quyết**: Validate MIME + max size (ví dụ 5MB) trước; nén bằng canvas → WebP; backend re-validate magic bytes.
- **Độ ưu tiên**: **P3**

### V16. ProductDetail fallback mock không đồng bộ

- **File**: `src/app/pages/ProductDetail.tsx` (dòng 144–162)
- **Đường dẫn**: `src/app/pages/ProductDetail.tsx`
- **Mô tả**: Nếu `products` mock có id → hiển thị mock (không đúng dữ liệu thật); chỉ fallback API khi không có mock. Sản phẩm tạo qua admin sẽ không bao giờ có trong mock — nhưng có id mới thì vẫn fetch API đúng.
- **Nguyên nhân**: Tồn tại dual data source.
- **Mức độ ảnh hưởng**: 🟡 Trung bình — rủi ro hiển thị dữ liệu cũ/khác backend.
- **Hướng giải quyết**: Luôn fetch API; bỏ mock fallback cho production.
- **Độ ưu tiên**: **P2**

### V17. Không có `VITE_API_BASE_URL` trong `.env.production` kiểm soát rõ

- **File**: `.env.example`, `src/lib/axiosClient.ts`
- **Đường dẫn**: `src/lib/axiosClient.ts`
- **Mô tả**: Prod fallback cứng `https://yarn-shop-be.onrender.com/api/v1` — nếu đổi backend phải sửa code.
- **Nguyên nhân**: Thiếu env config production.
- **Mức độ ảnh hưởng**: 🟢 Thấp — nhưng không flexible.
- **Hướng giải quyết**: Dùng env Vite (`VITE_API_BASE_URL`) bắt buộc; fallback chỉ cho dev.
- **Độ ưu tiên**: **P3**

---

## Tóm tắt — 5 hành động quan trọng nhất

| # | Hành động | Effort | Tác động |
|---|-----------|--------|----------|
| 1 | Nối TanStack Query (`QueryClientProvider` + hooks) | 🟡 2–3 ngày | Giảm 30–50% request, ổn định loading/error state |
| 2 | Lazy-load image + CDN + WebP/AVIF/srcSet | 🟡 3–5 ngày | Giảm 60–80% bandwidth, tốt LCP |
| 3 | Chuyển filter color/material/price lên server | 🔴 1–2 tuần (cả BE+FE) | Kết quả đúng ở mọi quy mô |
| 4 | Thêm Redis cache tầng API (hoặc CDN edge) | 🟡 2–3 ngày (BE) | Chịu được hàng nghìn request/s |
| 5 | Search: Mongo text index → Meilisearch | 🟡 1 tuần | Tìm kiếm nhanh & đúng |

---

## Phụ lục — File đã phân tích

| File | Vai trò |
|------|---------|
| `src/app/App.tsx` | Provider tree — thiếu QueryClientProvider |
| `src/app/hooks/useProducts.ts` | Core Shop logic + manual cache |
| `src/app/pages/Shop.tsx` | Product list (1.515 dòng, CSS inline) |
| `src/app/pages/ProductDetail.tsx` | Product detail |
| `src/app/components/ProductCard.tsx` | Product card (memo, 1.225 dòng) |
| `src/lib/axiosClient.ts` | Axios + JWT + refresh queue |
| `src/lib/queryClient.ts` | QueryClient config (chưa dùng) |
| `src/api/productService.ts` / `kitService.ts` / `orderService.ts` | API wrappers |
| `src/features/shop/services/product.service.ts` | Adapter + fetch |
| `src/features/diy/services/diy.service.ts` | DIY API |
| `src/app/pages/admin/ProductManagement.tsx` | Admin CRUD thủ công |
| `src/app/pages/DIYFeedPage.tsx` | N+1 creator fetch |
| `src/app/pages/KitsPage.tsx` | Client-side search kits |
| `src/context/CartContext.tsx` / `FavoritesContext.tsx` / `ReviewContext.tsx` | LocalStorage state |
| `src/main.tsx` / `src/routes/AppRouter.tsx` | Entry + routing (lazy OK) |
| `index.html` / `vite.config.ts` / `vercel.json` | Build & deploy |

---

*Báo cáo được tạo bởi phân tích tĩnh toàn bộ source FE trong workspace. Backend (MongoDB/Express) nằm ngoài workspace nên các phần đánh giá về DB/index/RateLimit/Redis được suy luận từ API contract và ghi chú `Need Manual Review` khi chưa chắc chắn. Không có file code nào bị sửa.*