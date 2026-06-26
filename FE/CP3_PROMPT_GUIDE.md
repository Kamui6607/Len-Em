# 🧶 CP3 - MVP Presentation & BMC Write-up: Prompt Guide cho PowerPoint

> **Dự án:** Yarn Shop (Nền tảng Học - Mua - DIY Len Móc)
> **Nhóm:** 6 thành viên | **3 trụ cột:** Learn – Shop – DIY | **Vệ tinh Community:** Facebook Group

---

## 📌 CẤU TRÚC TỔNG THỂ SLIDE (15 phút thuyết trình)

| Phần | Thời gian | Số slide gợi ý |
|------|-----------|----------------|
| 1. MVP Overview & Problem Recap | 2 phút | 2-3 slides |
| 2. MVP Details (Uses, Specs, Interface, Packaging, Price, AI-proof, Support) | 4 phút | 5-6 slides |
| 3. MVP Testing Results (20+ testers) | 3 phút | 2-3 slides |
| 4. Iterate or Persevere Decision | 2 phút | 1-2 slides |
| 5. Live Demo (không slide - mở trực tiếp app) | 3 phút | 0 slides |
| 6. AI Disclosure Statement | 1 phút | 1 slide |
| **Tổng** | **15 phút** | **~12-15 slides** |

---

## 🎯 PROMPT CHI TIẾT CHO TỪNG SLIDE

### SLIDE 1: Title Slide
```
Tạo slide mở đầu cho buổi thuyết trình MVP Check Point 3 với:
- Tên dự án: Yarn Shop
- Tagline: "Learn. Shop. Create. — The Crochet Ecosystem for Gen Z"
- Tên nhóm: [Điền tên nhóm]
- Danh sách 6 thành viên (tên + vai trò)
- Logo: [chèn logo yarn-shop-2-removebg-preview.svg]
- Ngày thuyết trình
- Màu sắc chủ đạo: cam đất (terracotta #C45E3E) kết hợp trắng kem, phong cách cozy, mềm mại
- Background: họa tiết len móc nhẹ nhàng
```

### SLIDE 2: Problem Recap (Nhắc lại vấn đề từ CP2)
```
Tạo slide "The Problem We're Solving" với:
- 3 "market pains" chính đã xác định ở CP2:
  1. 🧶 "Muốn học móc len nhưng không biết bắt đầu từ đâu" — thiếu lộ trình học có cấu trúc
  2. 🛒 "Mua nguyên liệu lẻ tẻ, không biết combo nào phù hợp với trình độ" — trải nghiệm mua sắm rời rạc
  3. 🎨 "Làm xong rồi để đấy, không có cộng đồng để khoe và bán" — thiếu kết nối xã hội
- Dùng icon/cảm xúc để thể hiện sự "đau đầu" của người dùng
- Font chữ to, rõ, tối giản
```

### SLIDE 3: Our Solution — MVP Overview
```
Tạo slide "Yarn Shop MVP — The 3-Pillar Ecosystem" với:
- Sơ đồ 3 trụ cột (Learn - Shop - DIY) kết nối với nhau bằng mũi tên vòng tròn
- Mỗi trụ cột có icon và mô tả 1 câu:
  • LEARN 📚: Khóa học video có nguyên liệu được gắn thẻ theo từng giây
  • SHOP 🛍️: Combo nguyên liệu được tuyển chọn theo trình độ
  • DIY 🎨: Dự án từ creator/idol, mua combo chỉ 1 chạm
- Vệ tinh: Facebook Group 👥 cho Community (tối ưu nguồn lực)
- Màu sắc: mỗi trụ cột một màu pastel riêng
```

### SLIDE 4: MVP Details — Uses & Specs
```
Tạo slide "MVP Features — What & How" chia làm 2 cột:

Cột trái — USES (Công dụng):
- Học móc len qua video với phụ đề tiếng Việt
- Mua nguyên liệu dạng combo theo trình độ (Beginner/Intermediate/Advanced)
- Xem và tái tạo dự án từ idol/creator yêu thích
- Theo dõi tiến độ học tập cá nhân

Cột phải — SPECS (Thông số kỹ thuật):
- Web App (PWA) — chạy trên mobile & desktop
- Framework: React + TypeScript + Vite
- UI: Shadcn/ui + Tailwind CSS + Framer Motion
- Video streaming: nhúng video với timestamp tagging
- Thanh toán: [phương thức đã chọn]
- Dùng mock data cho MVP, sẵn sàng kết nối backend
```

### SLIDE 5: MVP Details — Interface (Giao diện)
```
Tạo slide "Interface Highlights" với 3-4 ảnh chụp màn hình (screenshot) thật từ app:

1. 📱 Home Page: Hero section + 3 module buttons (Learn/Shop/DIY)
2. 📱 Learn Page: Danh sách khóa học + filter theo level
3. 📱 Shop Page: Product grid + filter sidebar + combo recommendations
4. 📱 DIY Feed: Bài đăng từ creator/idol + nút "Get Combo"

Mỗi ảnh có chú thích ngắn (2-3 từ) bên dưới.
Dùng mockup khung điện thoại để trình bày.
Highlight các tính năng chính bằng vòng tròn/vùng khoanh đỏ.
```

### SLIDE 6: MVP Details — Packaging & Price
```
Tạo slide "Packaging & Pricing Strategy" với:

PACKAGING (Cách đóng gói):
- Sản phẩm được đóng gói dưới dạng "Combo" — gói nguyên liệu trọn gói cho từng dự án
- Ví dụ 3 combos tiêu biểu:
  • Combo Khởi Đầu - Khăn Quàng: 496.000₫ (Beginner)
  • Combo Mũ Bucket Pro: 696.000₫ (Intermediate)
  • Combo Cardigan Cloud: 567.000₫ (Advanced)
- Mỗi combo bao gồm: len + kim móc + phụ kiện đi kèm

PRICE (Chiến lược giá):
- Freemium model:
  • Xem video miễn phí (có quảng cáo combo)
  • Mua combo để có nguyên liệu làm theo
- Giá combo: 168.000₫ - 905.000₫ (phù hợp sinh viên)
- Giá len lẻ: 49.000₫ - 349.000₫
- Margin: ~40-50% trên mỗi combo
- Dùng biểu đồ cột so sánh giá các combo
```

### SLIDE 7: MVP Details — AI-proof Features
```
Tạo slide "AI-Proof Features — Why AI Can't Replace Us" với:

3 tính năng "AI-proof" của Yarn Shop:
1. 🤝 **Hands-on Craft Experience**
   - AI không thể "móc len thay bạn" — trải nghiệm vật lý là không thể thay thế
   - Yarn Shop cung cấp nguyên liệu vật lý thật (physical goods)
   
2. 👩‍🎨 **Creator & Idol Economy**
   - Nội dung từ người thật (idol, creator) — fan theo dõi thần tượng
   - AI không thể tạo "fan community" và sự kết nối cảm xúc
   
3. 🧩 **Curated Combo System**
   - AI có thể gợi ý, nhưng quyết định mua và tự tay làm là của người dùng
   - Yarn Shop = công cụ + nguyên liệu, không phải sản phẩm thay thế con người

Mỗi tính năng có icon + giải thích ngắn + ví dụ thực tế.
```

### SLIDE 8: MVP Details — Customer Support
```
Tạo slide "Customer Support Strategy" với:

Các kênh hỗ trợ trong MVP:
1. 📖 **Knowledge Base (FAQ)**: Trong app — hướng dẫn chọn size len, đọc pattern, etc.
2. 💬 **Facebook Group**: Hỗ trợ peer-to-peer giữa các thành viên
3. 🤖 **Chatbot cơ bản**: Trả lời tự động các câu hỏi thường gặp (đơn hàng, vận chuyển)
4. 📧 **Email Support**: phản hồi trong 24h cho vấn đề phức tạp

Kế hoạch mở rộng (sau MVP):
- Live chat real-time
- Video call 1:1 cho người mới
- Idol Q&A session hàng tháng
```

### SLIDE 9: MVP Testing — Survey Design
```
Tạo slide "MVP Testing — Survey Methodology" với:

Thông tin khảo sát:
- Số lượng người thử nghiệm: 20+ người
- Đối tượng: sinh viên 18-24 tuổi, yêu thích handmade/K-pop idol
- Phương pháp: Google Form + phỏng vấn nhanh sau khi trải nghiệm
- Thời gian: [khoảng thời gian]

Các tính năng được test:
1. ⭐ Mức độ hữu ích của video học (1-5)
2. ⭐ Mức độ phù hợp của combo giá (1-5)
3. ⭐ Trải nghiệm mua hàng (1-5)
4. ⭐ Ý định quay lại sử dụng (1-5)
5. ⭐ Tính năng được yêu thích nhất (chọn 1)
6. 📝 Góp ý cải thiện (open-ended)

Dùng biểu đồ tròn hoặc thanh để hiển thị thang đo.
```

### SLIDE 10: MVP Testing — Results
```
Tạo slide "MVP Testing Results — Key Findings" với:

Kết quả chính (dùng số liệu giả định hợp lý, điều chỉnh theo số thực tế):
- 📊 Overall Satisfaction: 4.2/5 ★★★★
- 📊 Video Usefulness: 4.5/5 — "Dễ hiểu, có phụ đề tiếng Việt"
- 📊 Combo Price Fit: 3.8/5 — "Hơi cao nhưng chấp nhận được nếu chất lượng tốt"
- 📊 Intention to Return: 4.0/5 — "Sẽ quay lại khi có dự án mới"

Top 3 tính năng được yêu thích nhất:
1. 🥇 Video tagging nguyên liệu theo timestamp (65%)
2. 🥇 Combo mua 1 chạm từ bài DIY (52%)
3. 🥇 Nội dung từ idol (48%)

Top 3 điểm chưa hài lòng:
1. ❌ Cần thêm nhiều khóa học hơn
2. ❌ Giá combo hơi cao so với mua lẻ
3. ❌ Thiếu tính năng social (comment, chia sẻ)

Dùng biểu đồ cột/thanh ngang để trực quan hóa.
```

### SLIDE 11: Iterate or Persevere Decision
```
Tạo slide "Iterate or Persevere — Data-Driven Decision" với:

QUYẾT ĐỊNH: ✅ PERSEVERE (Tiếp tục chiến lược hiện tại)

Lý do:
1. 📈 80% người dùng đánh giá tích cực về trải nghiệm tổng thể
2. 🎯 3 trụ cột Learn-Shop-DIY được xác nhận là giải quyết đúng "nỗi đau"
3. 💰 Mô hình combo + freemium có tiềm năng revenue tốt
4. 👥 Facebook Group vệ tinh giúp tiết kiệm resources mà vẫn có community

Kế hoạch Iterate (cải tiến):
1. Thêm nhiều khóa học (ưu tiên beginner)
2. Tối ưu giá combo (thêm combo mini giá rẻ <200k)
3. Thêm tính năng comment và chia sẻ trong DIY Feed
4. Mở rộng nội dung idol (collab với nhiều idol hơn)

Dùng ma trận 2x2 (Impact vs Effort) để show các cải tiến sắp tới.
```

### SLIDE 12: AI Disclosure Statement
```
Tạo slide "AI Disclosure Statement" với nội dung:

📢 **AI Disclosure Statement**

Nhóm chúng tôi đã sử dụng AI (ChatGPT/GitHub Copilot) trong quá trình phát triển Yarn Shop MVP với các mục đích sau:

1. **Hỗ trợ code**: Tạo boilerplate components, viết mock data, tối ưu UI logic
   - Prompt mẫu: "Generate a React component for product card with image, name, price, and add-to-cart button using shadcn/ui card component"
   
2. **Tạo nội dung**: Viết mô tả sản phẩm, nội dung khóa học mẫu
   - Prompt mẫu: "Write 5 course descriptions for crochet lessons in Vietnamese, targeting beginner to advanced levels"

3. **Thiết kế slide**: Hỗ trợ cấu trúc nội dung cho bài thuyết trình này
   - Prompt mẫu: "Create a presentation outline for MVP Checkpoint 3 covering product details, testing results, and business model"

4. **Phân tích dữ liệu**: Xử lý kết quả khảo sát và đề xuất insights
   - Prompt mẫu: "Analyze these survey results from 20 users testing our crochet platform and suggest whether we should iterate or persevere"

⚠️ Tất cả nội dung do AI tạo đều được nhóm kiểm tra, chỉnh sửa và phê duyệt trước khi sử dụng. AI là công cụ hỗ trợ, không thay thế quyết định của nhóm.

[THIẾU PHẦN NÀY = 0 ĐIỂM CHO TOÀN BỘ CHECK POINT]
```

### SLIDE 13: Thank You & Q&A
```
Tạo slide kết thúc "Thank You — Let's Create Together!" với:
- Logo Yarn Shop
- Câu kết: "We're not just selling yarn. We're building a generation of creators."
- Thông tin liên hệ: [email nhóm / Facebook Group]
- QR code đến Facebook Group (nếu có)
- "Questions? — We're ready for critical thinking!"
- Màu sắc ấm áp, cozy
```

---

## 🎬 LIVE DEMO (50 điểm) — KHÔNG DÙNG SLIDE

**Prompt để chuẩn bị cho phần Live Demo:**

```
Tạo một checklist cho phần Live Demo MVP Yarn Shop (3 phút, không slide):

Trình tự demo:
1. [30s] Mở app trên trình duyệt → Trang chủ → Giới thiệu nhanh 3 module
2. [45s] Vào LEARN → Chọn khóa học "Khăn Quàng Cơ Bản" → Mở bài học → Show video + nguyên liệu được tag theo timestamp → Click mua nguyên liệu
3. [45s] Vào SHOP → Filter "Beginner" → Chọn "Combo Khởi Đầu - Khăn Quàng" → Add to cart → Xem giỏ hàng
4. [30s] Vào DIY → Chọn bài "Cardigan Cloud Puff" từ idol Mira Moon → Show nút "Get Combo" → Click để thêm vào giỏ
5. [30s] Tổng kết: "Đây là cách 3 trụ cột kết nối với nhau — học → mua → làm"

Lưu ý:
- Chuẩn bị sẵn tài khoản đã đăng nhập
- Chuẩn bị sẵn dữ liệu mẫu trong giỏ hàng
- Test trước đường truyền Internet
- Ai demo? Chọn 1 người tự tin nhất, thoải mái với app
- Các thành viên khác sẵn sàng hỗ trợ kỹ thuật nếu cần
```

---

## 📝 BUSINESS MODEL CANVAS (75 điểm) — 1 TRANG DUY NHẤT

**Prompt để tạo BMC 1 trang:**

```
Tạo Business Model Canvas cho Yarn Shop trên 1 trang A4 duy nhất, chia làm 9 ô theo layout chuẩn BMC:

MÀU SẮC: Nền trắng, viền cam đất #C45E3E, chữ đen/xám đậm

1. KEY PARTNERS (Đối tác chính) — Góc trên bên trái:
   - Nhà cung cấp len trong nước (Các shop len Việt Nam)
   - Idol/KOL trong ngành giải trí (hợp tác nội dung)
   - Creator/Influencer handmade
   - Đơn vị vận chuyển (GHN, Giao Hàng Nhanh, etc.)
   - Facebook (Platform cho Community Group)

2. KEY ACTIVITIES (Hoạt động chính) — Giữa trên:
   - Sản xuất nội dung khóa học video
   - Quản lý kho & đóng gói combo nguyên liệu
   - Duy trì cộng đồng Facebook Group
   - Phát triển tính năng web app
   - Marketing & hợp tác idol

3. KEY RESOURCES (Nguồn lực chính) — Phải trên:
   - Nền tảng web app (React + TypeScript)
   - Kho nguyên liệu (len, kim, phụ kiện)
   - Đội ngũ content creator
   - Hệ thống đóng gói & vận chuyển
   - Dữ liệu khóa học & pattern

4. VALUE PROPOSITIONS (Giá trị đề xuất) — Trung tâm:
   - 🎯 "Học - Mua - Làm" trong 1 hệ sinh thái
   - 🧶 Combo nguyên liệu theo trình độ (không cần suy nghĩ)
   - 📚 Video học có tagging nguyên liệu theo timestamp
   - 🌟 Nội dung từ idol/creator yêu thích
   - 💰 Giá cả phải chăng cho sinh viên
   - 👥 Cộng đồng Facebook Group hỗ trợ

5. CUSTOMER RELATIONSHIPS (Quan hệ khách hàng) — Trái dưới:
   - Self-service qua web app
   - Hỗ trợ peer-to-peer qua Facebook Group
   - Email support
   - Idol fan meeting / livestream (định kỳ)

6. CHANNELS (Kênh) — Giữa dưới:
   - Web App (kênh chính)
   - Facebook Group (kênh vệ tinh)
   - Instagram/TikTok (marketing)
   - Email (newsletter)

7. CUSTOMER SEGMENTS (Phân khúc khách hàng) — Phải dưới:
   - 👩‍🎓 Sinh viên nữ 18-24 tuổi yêu thích handmade
   - 🎀 Fan K-pop/V-pop muốn tự làm đồ giống idol
   - 🧑‍🎨 Người mới bắt đầu muốn học móc len
   - 💝 Người mua quà tặng handmade

8. COST STRUCTURE (Cấu trúc chi phí) — Góc trái dưới:
   - Chi phí nguyên liệu (COGS): ~40% giá bán
   - Phát triển & duy trì web app
   - Chi phí vận chuyển & đóng gói
   - Chi phí marketing & hợp tác idol
   - Chi phí nhân sự (content, support)

9. REVENUE STREAMS (Dòng doanh thu) — Góc phải dưới:
   - 💵 Bán combo nguyên liệu (nguồn chính)
   - 💵 Bán len lẻ & phụ kiện
   - 💵 Hoa hồng từ creator (affiliate)
   - 💵 Premium membership (tương lai — thêm tính năng)
   - 💵 Idol collab package (tương lai)

Lưu ý: 
- TẤT CẢ PHẢI NẰM GỌN TRONG 1 TRANG DUY NHẤT
- Dùng font nhỏ nhưng dễ đọc (10-11pt)
- Có thể dùng Canva, PowerPoint, hoặc Miro để vẽ
- Xuất file PDF hoặc ảnh để nộp
```

---

## ⭐ EXTRA CREDITS: Van Westendorp Price Map (0.5 điểm)

**Prompt cho nghiên cứu giá Van Westendorp:**

```
Tạo slide "Van Westendorp Price Sensitivity Study" với:

Phương pháp: Khảo sát 20+ người dùng với 4 câu hỏi về giá combo phổ biến (ví dụ: Combo Khởi Đầu - Khăn Quàng 496.000₫):

1. Ở mức giá nào bạn cho là RẺ (quá rẻ, nghi ngờ chất lượng)?
2. Ở mức giá nào bạn cho là ĐẮT nhưng vẫn CÂN NHẮC mua?
3. Ở mức giá nào bạn cho là QUÁ ĐẮT (không mua)?
4. Ở mức giá nào bạn cho là HỢP LÝ (vừa túi tiền)?

Kết quả giả định (điều chỉnh theo số thực tế):
- IDM (Quá rẻ): 150.000₫
- OPP (Rẻ nhưng chất lượng kém): 250.000₫
- PMC (Hợp lý nhất): 450.000₫
- PME (Đắt nhưng chấp nhận): 550.000₫
- RDM (Quá đắt): 700.000₫

Vẽ biểu đồ đường cong (Price Sensitivity Meter) với:
- Trục X: Giá (₫)
- Trục Y: % người dùng
- 4 đường cong: Too Cheap, Cheap, Expensive, Too Expensive
- Khoảng giá tối ưu (OPP - PME): 250.000₫ - 550.000₫
- Điểm giá tối ưu (IDP): ~350.000₫

Kết luận: Giá combo hiện tại (496.000₫) nằm trong khoảng chấp nhận được, nhưng nên thêm combo mini giá ~250.000-350.000₫ để thu hút thêm khách hàng nhạy cảm về giá.
```

---

## 🎤 CÂU HỎI PHẢN BIỆN (Critical Thinking Q&A)

**Prompt chuẩn bị cho phần Q&A:**

```
Tạo danh sách các câu hỏi phản biện có thể bị hỏi và câu trả lời gợi ý:

Q1: "Tại sao chọn Facebook Group thay vì xây community riêng trong app?"
A1: Tối ưu nguồn lực — Facebook đã có sẵn user base, không tốn chi phí phát triển tính năng social. MVP tập trung vào 3 trụ cột chính. Sau MVP sẽ xây dựng community riêng.

Q2: "Làm sao để cạnh tranh với các shop len truyền thống trên Shopee?"
A2: Yarn Shop không bán len đơn thuần — chúng tôi bán trải nghiệm "học + làm". Combo đi kèm khóa học, video hướng dẫn, và kết nối cộng đồng. Đây là giá trị mà shop len thông thường không có.

Q3: "Kế hoạch thu hút idol hợp tác?"
A3: Bắt đầu với micro-idol (10-50k followers) — chi phí thấp, engagement cao. Tạo affiliate program cho creator: hoa hồng trên mỗi combo bán được qua link của họ.

Q4: "Làm sao đảm bảo chất lượng khóa học?"
A4: Hệ thống đánh giá và review từ người học. Creator được xét duyệt trước khi đăng khóa học. Có chính sách hoàn tiền nếu không hài lòng.

Q5: "Tại sao không làm mobile app native?"
A5: PWA (Progressive Web App) đủ cho MVP — chi phí thấp, triển khai nhanh, chạy được trên cả mobile và desktop. Native app sẽ phát triển ở giai đoạn sau khi có traction.

Q6: "Doanh thu dự kiến trong 6 tháng đầu?"
A6: Target: 200-300 đơn hàng/tháng, revenue ~100-150 triệu/tháng. Break-even sau 4-5 tháng. Chi tiết trong BMC.
```

---

## ✅ CHECKLIST TRƯỚC KHI THUYẾT TRÌNH

```
Checklist chuẩn bị cho buổi thuyết trình CP3:

☐ Slide đã hoàn thiện đủ 12-15 slides
☐ AI Disclosure Statement đã có trong slide (QUAN TRỌNG: 0 điểm nếu thiếu)
☐ BMC đã làm xong, nằm gọn trong 1 trang
☐ Live Demo đã test thử ít nhất 3 lần
☐ Tất cả 6 thành viên đều có mặt
☐ Phân công người nói cho từng phần
☐ Chuẩn bị sẵn câu trả lời cho critical thinking questions
☐ Van Westendorp research (nếu làm extra credit)
☐ In BMC ra giấy hoặc để sẵn trên màn hình phụ để nộp
☐ Kiểm tra thiết bị (micro, projector, internet)
☐ Backup: có sẵn video quay sẵn demo phòng trường hợp mạng lỗi
```

---

## 📊 PHÂN CÔNG GỢI Ý (6 người)

| Thành viên | Phần phụ trách |
|------------|----------------|
| Member 1 | Mở đầu + MVP Overview + Problem Recap |
| Member 2 | MVP Details (Uses, Specs, Interface) |
| Member 3 | MVP Details (Packaging, Price, AI-proof, Support) |
| Member 4 | MVP Testing Results + Iterate or Persevere |
| Member 5 | Live Demo (người demo chính) |
| Member 6 | AI Disclosure + Kết luận + Q&A support |
| Cả nhóm | BMC (làm chung) + Chuẩn bị Q&A |

---

> **Lưu ý cuối:** Đây là prompt template — hãy điều chỉnh số liệu, kết quả survey, và nội dung cho phù hợp với kết quả thực tế của nhóm. Chúc nhóm đạt điểm cao! 🧶✨