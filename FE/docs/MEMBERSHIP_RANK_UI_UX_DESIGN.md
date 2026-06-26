# Len&em — Membership Rank UI/UX Design Document

> **Tài liệu thiết kế Frontend cho chương trình khách hàng thân thiết**
> Phiên bản: 1.0 | Ngày: 22/06/2026

---

## 📋 Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Vị trí chức năng](#2-vị-trí-chức-năng)
3. [Membership Card](#3-membership-card)
4. [Progress Bar](#4-progress-bar)
5. [Rank Benefits](#5-rank-benefits)
6. [Membership History](#6-membership-history)
7. [Rank Timeline](#7-rank-timeline)
8. [Popup khi lên hạng](#8-popup-khi-lên-hạng)
9. [Responsive Design](#9-responsive-design)
10. [Component List](#10-component-list)
11. [UI States](#11-ui-states)
12. [UX Suggestions](#12-ux-suggestions)
13. [Navigation Flow](#13-navigation-flow)
14. [Phân tích Learn: Khóa học phí + Video miễn phí](#14-phân-tích-learn-khóa-học-phí--video-miễn-phí)
15. [Hệ thống Coin ảo](#15-hệ-thống-coin-ảo)

---

## 1. Tổng quan hệ thống

### 1.1 Coin (Tiền ảo)

| Thuộc tính | Giá trị |
|-----------|---------|
| Tỷ lệ tặng | 3%–6% (theo Rank) |
| Hạn sử dụng | 6 tháng kể từ ngày nhận |
| Giới hạn dùng | Tối đa 20% giá trị đơn hàng |
| Điều kiện đổi | Đơn từ 100.000₫ trở lên |
| Công thức giá | Giá bán ≈ N × (1 + C% + L%) |

### 1.2 Membership Point (Điểm hạng)

| Thuộc tính | Giá trị |
|-----------|---------|
| Tỷ lệ quy đổi | 1.000₫ = 1 Point |
| Mục đích | Chỉ dùng để nâng hạng |
| Chu kỳ | Tích lũy vĩnh viễn (không hết hạn) |

### 1.3 Các hạng thành viên

| Rank | Yêu cầu Point | Coin Reward | Biểu tượng |
|-----|:-------------:|:-----------:|:----------:|
| **Member** | 0 | 3% | ⭐ |
| **Silver** | 1.000 | 4% | 🥈 |
| **Gold** | 3.000 | 5% | 🥇 |
| **Diamond** | 8.000 | 6% | 💎 |

---

## 2. Vị trí chức năng

### 2.1 Header — Badge Rank

**Vị trí:** Kế bên avatar/User Menu trên Navigation bar

```
┌─────────────────────────────────────────────────────┐
│  [Logo]  Learn  Shop  DIY    [💎] [🛒] [🧑 User ▼]  │
└─────────────────────────────────────────────────────┘
```

**Giải thích:**
- Hiển thị Rank badge nhỏ cạnh avatar để tạo **cảm giác thành tựu** ngay lập tức
- Khi click vào badge → mở Membership Card trong dropdown
- Tạo FOMO (Fear Of Missing Out) cho người dùng chưa có rank cao

### 2.2 User Profile — Membership Overview

**Vị trí:** Tab "Membership" trong trang Profile

```
┌────────────────────────────────────────────────────┐
│  Profile                                            │
│  ┌─────┬──────┬──────┬──────────┐                  │
│  │Info │Orders│Love  │Membership│ ◄── Tab active   │
│  └─────┴──────┴──────┴──────────┘                  │
│                                                     │
│  [Nội dung Membership Card full-size]               │
└─────────────────────────────────────────────────────┘
```

**Giải thích:**
- Profile là nơi người dùng quản lý thông tin cá nhân
- Membership là một phần của "tài khoản" người dùng
- Dễ dàng truy cập và theo dõi

### 2.3 Dashboard — Point Summary

**Vị trí:** Sidebar của Admin/Creator Dashboard

```
┌──────────────────────┬────────────────────────────┐
│ Sidebar              │  Content                   │
│ ┌──────────────────┐ │                            │
│ │ Dashboard        │ │  [Point Summary Widget]    │
│ │ Products         │ │  ┌────────────────────┐   │
│ │ Orders           │ │  │ Points: 2,450       │   │
│ │ Membership ◄     │ │  │ Rank: Silver 🥈     │   │
│ └──────────────────┘ │  │ Next: Gold in 550pt │   │
│                      │  └────────────────────┘   │
└──────────────────────┴────────────────────────────┘
```

**Giải thích:**
- Người dùng cần thấy tổng quan nhanh về điểm và rank
- Widget nhỏ gọn, không chiếm nhiều diện tích

### 2.4 My Account — Full Membership Management

**Vị trí:** Menu "My Account" → "My Membership"

```
My Account
├── Profile
├── Orders
├── Purchased
├── Love / Wishlist
├── My Membership ◄── Đầy đủ tính năng
│   ├── Membership Card
│   ├── Rank Benefits
│   ├── History
│   └── Timeline
└── Settings
```

**Giải thích:**
- Là trung tâm quản lý membership đầy đủ
- Người dùng có thể xem chi tiết điểm, lịch sử, quyền lợi

### 2.5 Checkout — Coin Usage & Earn Preview

**Vị trí:** Bên dưới Order Summary, trước nút Place Order

```
┌──────────────────────────────────────────┐
│  Order Summary                           │
│  ─────────────────────────────────────── │
│  Subtotal:                    507.000₫   │
│  Delivery fee:                 25.000₫   │
│  ─────────────────────────────────────── │
│  Total:                       532.000₫   │
│                                          │
│  ┌─── Use Coin ──────────────────────┐   │
│  │  You have 12.500 Coin             │   │
│  │  [🗹] Use Coin (-106.400₫) 20%   │   │
│  │  └──────────────────────────────┘   │   │
│  │  You'll earn 15.960 Coin ★         │   │
│  └─────────────────────────────────────┘   │
│                                          │
│  [Place Order ─ 425.600₫]               │
└──────────────────────────────────────────┘
```

**Giải thích:**
- Tại thời điểm quyết định mua hàng, người dùng cần thấy:
  - Họ có bao nhiêu coin
  - Có thể giảm bao nhiêu
  - Sẽ nhận được bao nhiêu coin sau khi mua
- Tạo động lực: "Mua ngay để nhận coin!"

---

## 3. Membership Card

### 3.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐   │
│  │  MEMBERSHIP CARD                              │   │
│  │                                                │   │
│  │       ┌──────┐                                │   │
│  │       │ Avatar│  🥈 Silver                     │   │
│  │       └──────┘  Nguyễn Thị Ngọc                │   │
│  │                                                │   │
│  │  ┌──────────────────────────────────────┐      │   │
│  │  │ ████████████░░░░░░░░░░░             │      │   │
│  │  │ 650 / 1.000 Point                    │      │   │
│  │  │ Còn 350 điểm để lên Gold             │      │   │
│  │  └──────────────────────────────────────┘      │   │
│  │                                                │   │
│  │  🪙 Coin: 12.500 (≈ 12.500₫)                  │   │
│  │  💰 Tổng chi tiêu: 12.000.000₫               │   │
│  │                                                │   │
│  │  [Lịch sử]  [Quyền lợi]  [Timeline]           │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 3.2 Kích thước

| Thiết bị | Kích thước Card |
|----------|----------------|
| Desktop  | 480×320px |
| Tablet   | 100% width × auto |
| Mobile   | 100% width × auto (padding 16px) |

### 3.3 Màu sắc theo Rank

| Rank | Màu nền | Gradient | Text |
|-----|---------|---------|------|
| Member | #F5F0EB | — | #8B7355 |
| Silver | #E8E8E8 → #C0C0C0 | Horizontal | #4A4A4A |
| Gold | #FFF3CD → #FFD700 | Diagonal | #7A5C00 |
| Diamond | #E8F4FD → #B3D9F2 | Radial | #1A5276 |

### 3.4 Hiệu ứng

- **Card hover:** Scale 1.02 + box-shadow elevation
- **Rank badge:** Shimmer animation (đối với Gold/Diamond)
- **Progress fill:** Gradient animation chạy từ trái sang phải

---

## 4. Progress Bar

### 4.1 Cấu trúc

```
  ┌──────────────────────────────────────┐
  │  ⬛⬛⬛⬛⬛⬛⬛⬛⬜⬜⬜⬜⬜   650/1.000  │
  │  ████████████░░░░░░░░░░░             │
  │  Còn 350 điểm để lên Gold            │
  │                                       │
  │  Member ── Silver ──── Gold ── Diamond│
  │     ●━━━━━━━━●━━━━━━○━━━━━━○        │
  │        0     1.000    3.000   8.000  │
  └──────────────────────────────────────┘
```

### 4.2 Chi tiết

| Thuộc tính | Giá trị |
|-----------|---------|
| Chiều cao | 8px (desktop), 6px (mobile) |
| Border radius | 100px (pill) |
| Màu nền (empty) | var(--border) / #E8DDD4 |
| Màu fill | Gradient theo rank (Silver → Gold) |
| Hiệu ứng fill | Ease-out, duration 0.8s |
| Tooltip | "650/1.000 points — 35% to next rank" |

### 4.3 Animation khi lên hạng

1. **Step 1:** Progress bar fill về 100% với hiệu ứng glow
2. **Step 2:** Confetti animation (canvas overlay) trong 2s
3. **Step 3:** Rank badge cũ fade out, badge mới scale in (0.5→1, spring)
4. **Step 4:** Popup xuất hiện (xem section 8)

### 4.4 Tooltip

```
                        ┌──────────────────────┐
                        │ 650 / 1.000 Points   │
                        │ Tích lũy: 65%        │
                        │ Còn 350 điểm ≈ 350K  │
                        │ để lên Gold 🥇       │
                        └──────────────────────┘
                                  ▲
                                  │
  ████████████░░░░░░░░░░░ ────────┘
```

---

## 5. Rank Benefits

### 5.1 Layout — Desktop

```
┌─────────────────────────────────────────────────────────┐
│  Quyền lợi của bạn                                      │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ 🪙       │  │ 🎂       │  │ 🎓       │  │ 🏷️       ││
│  │ Tích Coin│  │ Voucher  │  │ Ưu tiên  │  │ Flash Sale││
│  │ 4%       │  │ Sinh nhật│  │ Workshop │  │ Sớm      ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔒 Quyền lợi hạng tiếp theo: Gold               │    │
│  │ • Tích Coin 5% (tăng 1%)                        │    │
│  │ • Flash Sale sớm hơn 2 giờ                      │    │
│  │ • Quà tặng tri ân mỗi quý                       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Benefit Cards — Chi tiết

| Rank | Benefit 1 | Benefit 2 | Benefit 3 | Benefit 4 |
|-----|-----------|-----------|-----------|-----------|
| Member | 🪙 Coin 3% | 🎂 Voucher sinh nhật | — | — |
| Silver | 🪙 Coin 4% | 🎂 Voucher sinh nhật | 🎓 Ưu tiên Workshop | — |
| Gold | 🪙 Coin 5% | 🎂 Voucher sinh nhật | 🎓 Ưu tiên Workshop | 🏷️ Flash Sale sớm 2h |
| Diamond | 🪙 Coin 6% | 🎂 Voucher sinh nhật | 🎓 Ưu tiên Workshop | 🏷️ Flash Sale sớm 4h + Quà quý |

### 5.3 Unlock Animation

- Khi người dùng lên hạng mới, benefit cards mới sẽ **flip-in** từ dưới lên
- Các benefit đã có sẽ **glow** nhẹ khi hover

---

## 6. Membership History

### 6.1 Bảng — Desktop

```
┌─────────────────────────────────────────────────────────────────────┐
│  Lịch sử tích điểm                              [Lọc theo tháng ▼] │
│                                                                     │
│  ┌────────┬──────────┬──────────┬──────────────┬────────┬─────────┐│
│  │ Ngày   │ Điểm     │ Nguồn    │ Đơn hàng     │ Rank   │ Trạng   ││
│  │        │          │          │              │ mới    │ thái    ││
│  ├────────┼──────────┼──────────┼──────────────┼────────┼─────────┤│
│  │15/06   │ +2      │ Mua hàng │ ORD-2026-001 │ —      │ ✅     ││
│  │         │          │          │ 507.000₫     │        │         ││
│  ├────────┼──────────┼──────────┼──────────────┼────────┼─────────┤│
│  │10/06   │ +850    │ Mua hàng │ ORD-2026-002 │ Silver │ 🆕     ││
│  │         │          │          │ 850.000₫     │ 🥈     │         ││
│  ├────────┼──────────┼──────────┼──────────────┼────────┼─────────┤│
│  │01/06   │ +500    │ Đăng bài │ DIY: "Túi     │ —      │ ✅     ││
│  │         │          │ Video    │ Tote Sage"   │        │         ││
│  └────────┴──────────┴──────────┴──────────────┴────────┴─────────┘│
│                                                                     │
│                                   [Xem thêm ▼]                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Mobile

```
┌────────────────────────────────────────────┐
│  Lịch sử tích điểm    [Tháng 6/2026 ▼]     │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  15/06                               │  │
│  │  +2 điểm • Mua hàng                  │  │
│  │  ORD-2026-001 • 507.000₫            │  │
│  │  Trạng thái: ✅ Thành công           │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  10/06                               │  │
│  │  +850 điểm • Mua hàng                │  │
│  │  🆕 Lên hạng Silver 🥈              │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [Xem thêm]                                 │
└────────────────────────────────────────────┘
```

---

## 7. Rank Timeline

### 7.1 Layout

```
  Hành trình thành viên
  ─────────────────────

       ⭐                    Member
        │
        │  ✅ Đã đạt (0 → 1.000 điểm)
        ▼
       🥈 ──── [Bạn đang ở đây]
        │
        │  🔒 Còn 2.350 điểm
        ▼
       🥇 ──── Gold
        │
        │  🔒 Còn 7.350 điểm
        ▼
       💎 ──── Diamond
```

### 7.2 Desktop — Horizontal Timeline

```
  ════════════════════════════════════════════════════════
  ║  Member ║   Silver   ║     Gold      ║   Diamond    ║
  ║    ●━━━━━━━━●━━━━━━━━━━○━━━━━━━━━━━━━━○             ║
  ║    0     1.000       3.000            8.000          ║
  ║  Current  Achieved   🔒 In Progress   🔒            ║
  ════════════════════════════════════════════════════════
```

### 7.3 Mobile — Vertical Timeline

```
  ════════════════════════
  ║  ⭐ Member            ║
  ║  0 point              ║
  ║  ─── Đã qua ───────── ║
  ║        │              ║
  ║        ▼              ║
  ║  🥈 Silver            ║
  ║  1.000 point          ║
  ║  ─── Đang ở đây ───── ║
  ║        │              ║
  ║        ▼              ║
  ║  🥇 Gold 🔒           ║
  ║  3.000 point          ║
  ║  Còn 350 điểm         ║
  ║  [Progress bar]       ║
  ║        │              ║
  ║        ▼              ║
  ║  💎 Diamond 🔒        ║
  ║  8.000 point          ║
  ════════════════════════
```

---

## 8. Popup khi lên hạng

### 8.1 Desktop Popup

```
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │        🎉🎊 CHÚC MỪNG! 🎊🎉                       │
  │                                                     │
  │           ┌──────────────────┐                      │
  │           │                  │                      │
  │           │     🥈 → 🥇     │                      │
  │           │   Silver → Gold  │                      │
  │           │                  │                      │
  │           └──────────────────┘                      │
  │                                                     │
  │  Bạn đã lên hạng GOLD! 🥇                           │
  │                                                     │
  │  Quyền lợi mới:                                     │
  │  ✅ Tích Coin 5% (tăng từ 4%)                      │
  │  ✅ Flash Sale sớm hơn 2 giờ                       │
  │  ✅ Quà tặng tri ân mỗi quý                        │
  │                                                     │
  │  ┌─────────────────────────────────────┐            │
  │  │  🔥 Khám phá quyền lợi              │            │
  │  └─────────────────────────────────────┘            │
  │                                                     │
  │  [Để sau]                                           │
  └─────────────────────────────────────────────────────┘
```

### 8.2 Animation Sequence

1. **0.0s:** Backdrop tối dần (opacity 0→0.5)
2. **0.3s:** Popup scale in (0→1, spring) với confetti
3. **0.8s:** Rank badge glow + rotate
4. **1.2s:** Text xuất hiện (fade in)
5. **1.5s:** Benefits slide in từ dưới
6. **2.0s:** Button pulse animation

### 8.3 Mobile Popup

```
  ┌──────────────────────────────────────┐
  │        🎉 CHÚC MỪNG! 🎉             │
  │                                      │
  │         🥈 → 🥇                      │
  │       Silver → Gold                  │
  │                                      │
  │  Bạn đã lên hạng GOLD!              │
  │                                      │
  │  ✅ Coin 5% + Flash Sale            │
  │                                      │
  │  ┌──────────────────────────────┐   │
  │  │ Khám phá quyền lợi           │   │
  │  └──────────────────────────────┘   │
  │                                      │
  │  [Để sau]                           │
  └──────────────────────────────────────┘
```

---

## 9. Responsive Design

### 9.1 Desktop (≥1024px)

```
┌───────────────────────────────────────────────────────────┐
│ Header: [Logo] [Nav ×4] [💎 Badge] [🛒] [User ▼]         │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────── Membership Card (480px) ──────────────┐   │
│  │ 🥈 Silver                                        │   │
│  │ [Progress Bar] ████████░░ 650/1.000               │   │
│  │ 🪙 12.500 Coin    💰 12.000.000₫ tổng chi        │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌── Benefits ──┐  ┌── Timeline ──┐ ┌── History ──────┐ │
│  │ Coin 4%      │  │ ⭐ → 🥈      │ │ 15/06  +2 điểm  │ │
│  │ Voucher SN   │  │      → 🥇 🔒  │ │ 10/06  +850    │ │
│  │ Workshop     │  │      → 💎 🔒  │ │ 01/06  +500    │ │
│  └──────────────┘  └──────────────┘ └─────────────────┘ │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ Footer                                                    │
└───────────────────────────────────────────────────────────┘
```

**Bố trí:** 3 cột: Card full-width → Benefits | Timeline | History (grid 3)

### 9.2 Tablet (768px → 1023px)

```
┌───────────────────────────────────────────────┐
│ Header: [Logo] [💎] [🛒] [☰ Menu]            │
├───────────────────────────────────────────────┤
│                                               │
│  ┌── Membership Card (100%) ──────────────┐  │
│  │ 🥈 Silver  650/1.000                    │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌── Benefits ──┐  ┌── Timeline ──┐          │
│  │ Coin 4%      │  │ ⭐ → 🥈      │          │
│  │ Voucher SN   │  │      → 🥇 🔒  │          │
│  │ Workshop     │  │      → 💎 🔒  │          │
│  └──────────────┘  └──────────────┘          │
│                                               │
│  ┌── History (100%) ─────────────────────┐   │
│  │ 15/06  +2 điểm • Mua hàng             │   │
│  │ 10/06  +850 điểm • Lên Silver         │   │
│  └───────────────────────────────────────┘   │
├───────────────────────────────────────────────┤
│ Footer                                        │
└───────────────────────────────────────────────┘
```

**Bố trí:** 2 cột (Benefits | Timeline) + History full-width

### 9.3 Mobile (<768px)

```
┌──────────────────────────────────┐
│ Header: [Logo] [💎][☰]          │
├──────────────────────────────────┤
│                                  │
│  ┌ Membership Card ─────────┐   │
│  │ 🥈 Silver                │   │
│  │ ████████░░ 650/1.000    │   │
│  │ 🪙 12.500 Coin          │   │
│  │ 💰 12.000.000₫          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌ Benefits (horizontal scroll) │
│  │ [Coin 4%] [Voucher] [Wkshp] │
│  └──────────────────────────────┘
│                                  │
│  ┌ Timeline ──────────────────┐  │
│  │ ⭐ Member                  │  │
│  │ 🥈 Silver ◄               │  │
│  │ 🥇 Gold 🔒                 │  │
│  │ 💎 Diamond 🔒              │  │
│  └──────────────────────────────┘
│                                  │
│  ┌ History (card list) ───────┐ │
│  │ 15/06  +2 điểm             │ │
│  │ 10/06  +850 điểm 🆕        │ │
│  │ 01/06  +500 điểm           │ │
│  └──────────────────────────────┘
│                                  │
├──────────────────────────────────┤
│ Bottom Nav: [🏠] [📚] [🛒] [🧶] │
└──────────────────────────────────┘
```

**Bố trí:** Single column, horizontal scroll cho benefits card

---

## 10. Component List

### 10.1 Danh sách đầy đủ

| # | Component | Mô tả | Props |
|---|-----------|-------|-------|
| 1 | **MembershipCard** | Card tổng quan membership: avatar, name, rank, point, coin, total spent | `user`, `rank`, `points`, `coin`, `totalSpent` |
| 2 | **RankBadge** | Badge hiển thị rank nhỏ (dùng trong Header, Navigation) | `rank: RankType`, `size: 'sm' \| 'md' \| 'lg'` |
| 3 | **ProgressBar** | Thanh tiến trình lên hạng tiếp theo | `currentPoints`, `nextThreshold`, `nextRank`, `animate: boolean` |
| 4 | **BenefitCard** | Card hiển thị 1 quyền lợi | `icon`, `title`, `description`, `isLocked: boolean` |
| 5 | **BenefitList** | Grid các BenefitCard | `benefits: Benefit[]`, `currentRank` |
| 6 | **NextRankPreview** | Card preview quyền lợi hạng tiếp theo | `nextRank`, `nextBenefits`, `pointsNeeded` |
| 7 | **RankTimeline** | Timeline các hạng thành viên | `currentRank`, `points` |
| 8 | **TimelineNode** | Một node trong timeline | `rank`, `isAchieved`, `isCurrent`, `points` |
| 9 | **MembershipHistoryTable** | Bảng lịch sử (desktop) | `history: HistoryEntry[]` |
| 10 | **MembershipHistoryList** | Danh sách lịch sử (mobile) | `history: HistoryEntry[]` |
| 11 | **HistoryRow** | 1 dòng lịch sử | `entry: HistoryEntry` |
| 12 | **RankPopup** | Popup chúc mừng khi lên hạng | `oldRank`, `newRank`, `newBenefits`, `onExplore`, `onDismiss` |
| 13 | **ConfettiOverlay** | Hiệu ứng confetti khi lên hạng | `trigger: boolean`, `duration: number` |
| 14 | **PointSummary** | Widget tổng quan điểm nhỏ (dùng trong Dashboard) | `points`, `rank`, `nextRank`, `pointsToNext` |
| 15 | **CoinSummary** | Widget tổng quan coin | `coinBalance`, `coinExpiry` |
| 16 | **CoinUsage** | Component dùng coin trong Checkout | `coinBalance`, `orderTotal`, `maxUsage`, `onApply` |
| 17 | **RankGuard** | Higher-order component kiểm tra rank | `requiredRank`, `fallback`, `children` |

### 10.2 Component Tree

```
MembershipPage
├── MembershipCard
│   ├── RankBadge
│   └── ProgressBar
├── BenefitList
│   ├── BenefitCard (×4)
│   └── NextRankPreview
├── RankTimeline
│   └── TimelineNode (×4)
└── MembershipHistoryTable (desktop)
    └── HistoryRow (×N)
    └── MembershipHistoryList (mobile)
        └── HistoryRow (×N)

RankPopup
├── ConfettiOverlay
├── RankBadge (x2: old + new)
├── BenefitCard (new benefits)
└── Button "Khám phá"

CheckoutPage
└── CoinUsage
    ├── BalanceDisplay
    ├── ToggleSwitch
    └── EarnPreview
```

---

## 11. UI States

### 11.1 Loading

```
┌──────────────────────────────────────┐
│  💎 Loading...                        │
│                                       │
│  ┌──────────────────────────────┐    │
│  │  ┌──────┐                    │    │
│  │  │ ████ │  █████████████████  │    │  ← Skeleton
│  │  └──────┘                    │    │
│  │  ████████████████████████████ │    │
│  │  ████████████████████████████ │    │
│  └──────────────────────────────┘    │
│                                       │
│  ┌────────┐ ┌────────┐ ┌────────┐   │  ← Skeleton cards
│  │ █████  │ │ █████  │ │ █████  │   │
│  │ █████  │ │ █████  │ │ █████  │   │
│  └────────┘ └────────┘ └────────┘   │
└──────────────────────────────────────┘
```

**Component sử dụng:** SkeletonMembershipCard, SkeletonBenefitCard, SkeletonTimeline

### 11.2 Empty

```
┌──────────────────────────────────────────┐
│  📊 Chưa có dữ liệu                       │
│                                           │
│  ┌── Membership Card ─────────────────┐   │
│  │ ⭐ Member                           │   │
│  │ 0 Point                             │   │
│  │ ░░░░░░░░░░░░░░░░░░░░ 0/1.000       │   │
│  │ 🪙 0 Coin                           │   │
│  │ 💰 0₫                               │   │
│  └─────────────────────────────────────┘   │
│                                           │
│  💡 Mua sắm ngay để tích điểm!           │
│  [Khám phá Shop]                          │
│                                           │
│  ─── Lịch sử tích điểm ───               │
│  📭 Chưa có giao dịch nào                │
└──────────────────────────────────────────┘
```

### 11.3 Error

```
┌──────────────────────────────────────┐
│  ⚠️ Không thể tải dữ liệu             │
│                                       │
│  Đã có lỗi xảy ra khi tải thông tin   │
│  thành viên. Vui lòng thử lại.        │
│                                       │
│  [🔄 Thử lại]                         │
└──────────────────────────────────────┘
```

### 11.4 Success (Đã tải dữ liệu đầy đủ)

```
┌──────────────────────────────────────────┐
│  🥇 Gold                                  │
│  ████████████████░░ 3.000/8.000          │
│  🪙 45.000 Coin    💰 45.000.000₫        │
└──────────────────────────────────────────┘
```

### 11.5 User chưa đủ điểm

```
┌──────────────────────────────────────────────┐
│  🔒 Còn 350 điểm để lên Gold                 │
│                                               │
│  💡 Tương đương 350.000₫ mua sắm             │
│  [Mua sắm ngay →]                            │
│                                               │
│  Tiến độ hiện tại: 65%                        │
│  ████████████░░░░░░░░ 650/1.000              │
└──────────────────────────────────────────────┘
```

### 11.6 User vừa lên hạng

→ Xem Popup (Section 8)

### 11.7 User đạt Diamond

```
┌──────────────────────────────────────────────┐
│  💎 DIAMOND                                  │
│                                               │
│  ┌──────────────────────────────────────┐    │
│  │    ✨ Bạn đã đạt hạng cao nhất! ✨    │    │
│  │    ████████████████████████ 8.000     │    │
│  │    🪙 Coin 6% — Cao nhất hệ thống    │    │
│  └──────────────────────────────────────┘    │
│                                               │
│  Quyền lợi VIP:                              │
│  ✅ Coin 6%                                   │
│  ✅ Flash Sale sớm 4h                        │
│  ✅ Quà tặng quý                              │
│  ✅ Workshop premium miễn phí                 │
│  ✅ Voucher sinh nhật ×2                      │
└──────────────────────────────────────────────┘
```

### 11.8 Không có lịch sử

```
┌──────────────────────────────────────────┐
│  Lịch sử tích điểm                        │
│                                           │
│  📭 Chưa có giao dịch nào                 │
│                                           │
│  Khi bạn mua hàng hoặc đăng video,       │
│  lịch sử tích điểm sẽ xuất hiện ở đây.   │
│                                           │
│  [Mua sắm ngay]  [Đăng video]            │
└──────────────────────────────────────────┘
```

---

## 12. UX Suggestions

### 12.1 Thanh tiến trình trực quan

- **Hiển thị số điểm còn thiếu** dưới progress bar (ví dụ: "Còn 350 điểm để lên Gold")
- **Quy đổi tiền:** "Tương đương 350.000₫ mua sắm" — giúp người dùng dễ hình dung
- **Mini milestone markers** trên progress bar (25%, 50%, 75%)

### 12.2 Hiệu ứng khi lên hạng

- Confetti animation khi lên Gold và Diamond
- Sound effect nhẹ (có thể tắt trong settings)
- Badge animation: badge cũ xoay ra, badge mới spring in
- Auto-send notification (in-app + email)

### 12.3 Tooltip giải thích cách tính điểm

```
  ┌──────────────────────────────────────┐
  │  ℹ️ Cách tính điểm hạng              │
  │                                       │
  │  • Mỗi 1.000₫ mua sắm = 1 điểm      │
  │  • Đăng video DIY: +500 điểm         │
  │  • Điểm không hết hạn                │
  │  • Điểm chỉ dùng để nâng hạng        │
  │                                       │
  │  ┌──────────────────────────────┐    │
  │  │  Tích điểm thêm →            │    │
  │  └──────────────────────────────┘    │
  └──────────────────────────────────────┘
```

Vị trí: Icon ℹ️ bên cạnh "Membership Point"

### 12.4 Hiển thị điểm còn thiếu để lên hạng

Luôn hiển thị ở 3 vị trí:
1. **Trong Membership Card** — Progress bar + text
2. **Trong Checkout** — "Bạn chỉ còn 350 điểm (350K) để lên Gold!"
3. **Sau khi đặt hàng thành công** — Thông báo popup

### 12.5 Thông báo sau khi hoàn tất đơn hàng

```
  ┌──────────────────────────────────────┐
  │  🎉 Đặt hàng thành công!             │
  │                                       │
  │  Bạn đã nhận:                        │
  │  +15.960 Coin (≈15.960₫)             │
  │  +507 Membership Point                │
  │                                       │
  │  Tổng điểm hiện tại: 1.157           │
  │  Còn 1.843 điểm để lên Gold 🥇       │
  │                                       │
  │  [Xem Membership →]                  │
  └──────────────────────────────────────┘
```

### 12.6 Tạo động lực mua sắm

- **Next rank preview:** Hiển thị "Bạn sẽ nhận được gì khi lên Gold?"
- **Gamification:** "Bạn chỉ còn 350 điểm (1 đơn hàng nữa!) để lên Gold"
- **Limited time:** "Ưu đãi Flash Sale chỉ dành cho Gold trở lên"
- **Social proof:** "85% khách hàng của Len&em đạt Silver sau 2 tháng"

### 12.7 Micro-interactions

| Interaction | Hiệu ứng |
|------------|---------|
| Hover vào RankBadge | Glow + tooltip |
| Click vào progress bar | Expand detail |
| Hoàn thành order | Toast: "+XYZ Coin earned" |
| Đạt milestone (50%) | Subtle celebration |
| Hover benefit card | Flip show detail |

---

## 13. Navigation Flow

### 13.1 Sơ đồ điều hướng

```
[Header: Rank Badge]
       │
       ├── Click → [Membership Card Dropdown (mini)]
       │              ├── "Xem chi tiết" → /my-account/membership
       │              └── Coin balance
       │
[Profile Page]
       │
       └── Tab "Membership" → /my-account/membership
                                │
                                ├── Membership Card (full)
                                ├── Rank Benefits
                                ├── Rank Timeline
                                └── Membership History
                                      │
                                      └── Click row → Order detail

[Checkout Page]
       │
       └── CoinUsage section
              ├── Toggle "Use Coin"
              ├── Preview discount
              └── Show earn preview

[After Order Success]
       │
       └── Toast → Points + Coin earned
              └── Click → /my-account/membership

[Rank Up Notification]
       │
       └── Popup 🎉
              ├── "Khám phá quyền lợi" → Scroll to Benefits
              └── "Để sau" → Dismiss
```

### 13.2 Route cấu hình

```
/my-account
├── /my-account/profile
├── /my-account/orders
├── /my-account/purchased
├── /my-account/love
├── /my-account/membership    ← NEW
│   ├── (MembershipCard)
│   ├── (Benefits)
│   ├── (Timeline)
│   └── (History)
└── /my-account/settings
```

---

## 14. Phân tích Learn: Khóa học phí + Video miễn phí

### 14.1 Cấu trúc hiện tại

Hiện tại, **Learn** có 6 khóa học, tất cả đều hiển thị chung một danh sách:

```
Learn
├── Khăn Quàng Cơ Bản (Beginner) — 4 lessons
├── Mũ Bucket Pastel (Intermediate) — 4 lessons
├── Túi Tote Cá Tính (Advanced) — 4 lessons
├── Áo Croptop Daisy (Intermediate) — 3 lessons
├── Mũ Bunny Idol (Beginner) — 3 lessons
└── Cardigan Cloud Puff (Advanced) — 5 lessons
```

### 14.2 Phân chia mới

#### A. Premium Courses (Khóa học có phí)

Khóa học chuyên sâu, có cấu trúc bài bản, người dùng phải **mua** để học.

| Khóa học | Giá đề xuất |
|---------|:----------:|
| Cardigan Cloud Puff (Advanced) | 99.000₫ |
| Túi Tote Cá Tính (Advanced) | 79.000₫ |
| Mũ Bucket Pastel (Intermediate) | 59.000₫ |
| Áo Croptop Daisy (Intermediate) | 59.000₫ |

**Đặc điểm:**
- ⏱ Video dài (10–25 phút/bài)
- 📋 Có tài liệu PDF kèm theo
- 🧵 Có linked materials để mua
- 🏆 Nhận 500 Points khi hoàn thành
- 💎 Yêu cầu Membership Gold để được giảm 10%

#### B. Free Videos (Video miễn phí)

Video ngắn, dạy kỹ thuật đơn lẻ, **miễn phí** cho tất cả người dùng.

| Video | Thời lượng | Kỹ năng |
|------|:---------:|---------|
| Magic Knot — Nối Len Không Đầu Chỉ | 6 phút | Beginner |
| Cách Đọc Chart Móc Cơ Bản | 8 phút | Beginner |
| Mũi Magic Ring — Bắt Đầu Vòng Tròn | 5 phút | Beginner |
| 5 Loại Mũi Cơ Bản Ai Cũng Phải Biết | 12 phút | Beginner |
| Kỹ Thuật Đổi Màu Sạch Đẹp | 7 phút | Intermediate |
| Cách Đo Size Mũ Chuẩn | 4 phút | Beginner |

**Đặc điểm:**
- ⏱ Video ngắn (4–12 phút)
- 📺 Không cần đăng nhập để xem
- 🏆 Đăng video DIY được tặng 500 Points
- 🔗 Có nút "Mua nguyên liệu" dẫn đến Shop
- 🆓 Hoàn toàn miễn phí

### 14.3 UI Layout

#### Desktop

```
┌──────────────────────────────────────────────────────────┐
│  📚 Learn                                                │
│                                                          │
│  ┌──────────────────────┬──────────────────────────────┐ │
│  │  🔥 Premium Courses  │  🆓 Free Videos              │ │
│  │                      │                              │ │
│  │  ┌──────────────────┐│  ┌────────────────────────┐  │ │
│  │  │ Cardigan Cloud   ││  │ Magic Knot             │  │ │
│  │  │ 99.000₫ • 5 bài  ││  │ 6 phút • Beginner     │  │ │
│  │  │ [Xem thêm →]     ││  │ [Xem ngay →]           │  │ │
│  │  └──────────────────┘│  └────────────────────────┘  │ │
│  │                      │                              │ │
│  │  ┌──────────────────┐│  ┌────────────────────────┐  │ │
│  │  │ Túi Tote Pro     ││  │ Đọc Chart Móc          │  │ │
│  │  │ 79.000₫ • 4 bài  ││  │ 8 phút • Beginner     │  │ │
│  │  │ [Xem thêm →]     ││  │ [Xem ngay →]           │  │ │
│  │  └──────────────────┘│  └────────────────────────┘  │ │
│  └──────────────────────┴──────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Mobile

```
┌──────────────────────────────────┐
│  📚 Learn                        │
│                                   │
│  🔥 Premium Courses              │
│  ┌──────────────────────────────┐│
│  │ Cardigan Cloud Puff          ││
│  │ ⭐⭐⭐⭐⭐ 4.7 • 5 bài          ││
│  │ 💰 99.000₫                   ││
│  │ [Mua ngay]                   ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ Túi Tote Promax              ││
│  │ ⭐⭐⭐⭐⭐ 4.7 • 4 bài          ││
│  │ 💰 79.000₫                   ││
│  │ [Mua ngay]                   ││
│  └──────────────────────────────┘│
│                                   │
│  🆓 Free Videos                  │
│  ┌──────────────────────────────┐│
│  │ Magic Knot                   ││
│  │ 6 phút • Beginner            ││
│  │ ▶ [Xem ngay]                 ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ Đọc Chart Móc                ││
│  │ 8 phút • Beginner            ││
│  │ ▶ [Xem ngay]                 ││
│  └──────────────────────────────┘│
└──────────────────────────────────┘
```

### 14.4 Flow mua Premium Course

```
User click "Mua ngay"
       │
       ▼
  Check đăng nhập?
       │
       ├── Chưa → Redirect /auth/login → Sau login quay lại
       │
       ▼
  [Checkout page]
  ┌──────────────────────────────────────┐
  │  Mua khóa học: Cardigan Cloud Puff   │
  │  Giá: 99.000₫                        │
  │                                      │
  │  Bạn sẽ nhận được:                   │
  │  ✅ Full 5 video lessons             │
  │  ✅ PDF patterns                     │
  │  ✅ +500 Points khi hoàn thành       │
  │  ✅ +1.980 Coin (≈2%)                │
  │                                      │
  │  ┌── Use Coin ───────────────────┐   │
  │  │ Bạn có 12.500 Coin            │   │
  │  │ [🗹] Dùng 19.800₫ (20% max)   │   │
  │  └───────────────────────────────┘   │
  │                                      │
  │  [Thanh toán 79.200₫]               │
  └──────────────────────────────────────┘
       │
       ▼
  Success → Redirect to Course
```

### 14.5 Data model mở rộng

```typescript
// Mở rộng Course type
interface Course {
  // ... existing fields
  type: "premium" | "free";       // ← NEW
  price?: number;                   // ← NEW (cho premium)
  pointReward?: number;            // ← NEW (VD: 500 points khi hoàn thành)
  purchasedBy?: string[];          // ← NEW (danh sách userId đã mua)
}

// Video miễn phí (FreeVideo)
interface FreeVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;               // phút
  level: CourseLevel;
  thumbnail: string;
  linkedProducts?: LinkedProduct[];
  tags: string[];
  createdAt: string;
}
```

---

## 15. Hệ thống Coin ảo

### 15.1 Công thức tính

```
Giá bán tối thiểu = N × (1 + C% + L%)

Trong đó:
  N  = Giá nhập
  C% = Tỷ lệ coin tặng (3%–6% theo Rank)
  L% = Lợi nhuận mong muốn

Ví dụ:
  N = 100.000₫
  C% = 5% (Gold)
  L% = 30%
  Giá bán = 100.000 × (1 + 0.05 + 0.30) = 135.000₫
```

### 15.2 Quy tắc Coin

| Quy tắc | Giá trị |
|---------|--------|
| Tỷ lệ tặng | 3% (Member) → 6% (Diamond) |
| Hạn sử dụng | 6 tháng kể từ ngày nhận |
| Giới hạn dùng | Tối đa 20% giá trị đơn hàng |
| Điều kiện đổi | Đơn từ 100.000₫ trở lên |
| Quy đổi | 1 Coin = 1₫ |

### 15.3 Cách nhận Coin

| Hành động | Coin nhận được |
|-----------|:-------------:|
| Mua hàng (Member) | 3% × giá trị đơn |
| Mua hàng (Silver) | 4% × giá trị đơn |
| Mua hàng (Gold) | 5% × giá trị đơn |
| Mua hàng (Diamond) | 6% × giá trị đơn |
| Đăng video DIY | 500 Coin |
| Đăng ký tài khoản | 1.000 Coin (lần đầu) |

### 15.4 UI: Coin Usage trong Checkout (chi tiết)

```
┌──────────────────────────────────────────────┐
│  🪙 Sử dụng Coin                             │
│                                               │
│  Số dư: 12.500 Coin (≈ 12.500₫)             │
│  Hạn sử dụng: 15/12/2026                     │
│                                               │
│  ┌─── Giới hạn ─────────────────────────┐    │
│  │  Tối đa: 106.400₫ (20% giá trị đơn)   │    │
│  │  Tối thiểu: 100.000₫ (để đổi)         │    │
│  └───────────────────────────────────────┘    │
│                                               │
│  Số Coin muốn dùng:                          │
│  [10.000 ────○────────── 12.500]             │  ← Slider
│                                               │
│  Giảm: -10.000₫                              │
│  Thành tiền: 522.000₫                        │
│                                               │
│  🎁 Bạn sẽ nhận được 15.660 Coin (3%)       │
│  khi hoàn tất đơn hàng này!                  │
│                                               │
│  [Áp dụng]  [Không dùng Coin]                │
└──────────────────────────────────────────────┘
```

### 15.5 UI: Coin Balance Widget

```
┌──────────────────────┐
│  🪙 Coin của bạn      │
│                       │
│  12.500 Coin          │
│  ≈ 12.500₫           │
│                       │
│  ┌──────────────────┐ │
│  │ 🔄 Đổi Coin      │ │
│  └──────────────────┘ │
│                       │
│  ⏳ Hết hạn: 15/12   │
│  (còn 6 tháng)       │
└──────────────────────┘
```

### 15.6 Coin History

```
┌──────────────────────────────────────────────┐
│  Lịch sử Coin                                │
│                                               │
│  ┌────────┬──────────┬──────────┬───────────┐│
│  │ Ngày   │ Số Coin  │ Loại     │ Mô tả     ││
│  ├────────┼──────────┼──────────┼───────────┤│
│  │15/06   │ +12.500  │ Nhận     │ Mua hàng  ││
│  │         │          │          │ ORD-2026  ││
│  ├────────┼──────────┼──────────┼───────────┤│
│  │14/06   │ -10.000  │ Sử dụng  │ Checkout  ││
│  │         │          │          │ ORD-2026  ││
│  ├────────┼──────────┼──────────┼───────────┤│
│  │10/06   │ +500     │ Nhận     │ Đăng video││
│  └────────┴──────────┴──────────┴───────────┘│
│                                               │
│  Coin sắp hết hạn (trong 30 ngày):           │
│  ⚠️ 5.000 Coin hết hạn ngày 15/07/2026      │
│                                               │
│  [Sử dụng ngay]                               │
└──────────────────────────────────────────────┘
```

---

## 📊 Tổng kết

| Hạng mục | Số lượng |
|---------|:-------:|
| Components | 17 |
| UI States | 8 |
| Vị trí hiển thị | 5 |
| Màn hình responsive | 3 |
| Ranks | 4 |
| Loại nội dung Learn | 2 (Premium + Free) |
| Công thức tính | 1 |
| Flow điều hướng | 5 |

---

*Tài liệu thiết kế UI/UX — Len&em Membership Rank v1.0*