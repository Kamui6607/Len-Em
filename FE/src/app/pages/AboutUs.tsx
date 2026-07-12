import { motion } from "motion/react";
import { Reveal } from "../../components/motion/Reveal";
import { Users, BookOpen, ShoppingBag, Palette, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router";

export function AboutUs() {
  const teamMembers = [
    {
      name: "Nguyễn Trần Tú & Võ Tuấn Anh",
      role: "Phụ trách kỹ thuật hệ thống (SE)",
      icon: Users,
      color: "var(--primary)",
    },
    {
      name: "Hoàng Thế Nhất",
      role: "Chiến lược Marketing (MKT)",
      icon: Sparkles,
      color: "var(--accent-yellow)",
    },
    {
      name: "Võ Ngọc Quý Phi",
      role: "Thiết kế giao diện & trải nghiệm người dùng (GD)",
      icon: Palette,
      color: "var(--accent-pink)",
    },
    {
      name: "Võ Thị Thúy Hiền",
      role: "Quản lý kinh doanh (IB)",
      icon: ShoppingBag,
      color: "var(--accent-green)",
    },
    {
      name: "Lê Trần Minh Chí",
      role: "Phát triển tính năng thông minh (AI)",
      icon: BookOpen,
      color: "var(--accent-blue-text)",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[var(--bg-1)] to-[var(--bg-2)] py-20 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--primary)] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--accent-pink)] rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-3xl font-bold text-white shadow-[0_8px_32px_rgba(107,63,160,0.3)]"
              >
                L&E
              </motion.div>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-6xl">
                Chào mừng đến với <span className="text-[var(--primary)]">LEN&EM</span>
              </h1>
              <p className="mt-6 text-lg text-[var(--foreground-muted)] md:text-xl max-w-3xl mx-auto">
                Hệ sinh thái đan len tích hợp "tất cả trong một" đầu tiên dành riêng cho Gen Z tại Việt Nam
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12">
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)] md:text-4xl mb-6">
                Câu chuyện của chúng tôi
              </h2>
              <div className="prose prose-lg max-w-none text-[var(--foreground-secondary)] space-y-4">
                <p>
                  Chúng tôi bắt đầu hành trình này khi nhận thấy sự <strong className="text-[var(--foreground)]">phân mảnh và rời rạc</strong> trong trải nghiệm của những người yêu thích thủ công. 
                  Hiện nay, để hoàn thành một sản phẩm, bạn phải tìm ý tưởng trên TikTok, học trên YouTube, mua nguyên liệu trên Shopee và đặt câu hỏi trong các nhóm Facebook. 
                  Quy trình phức tạp này khiến nhiều người mới bắt đầu (Beginner) dễ cảm thấy nản lòng và bỏ cuộc.
                </p>
                <p className="text-lg font-medium text-[var(--primary)]">
                  LEN&EM ra đời với sứ mệnh xóa bỏ những rào cản đó, giúp bạn đi từ <strong>"Zero đến Hero"</strong> chỉ trên một nền tảng duy nhất.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)] md:text-4xl mb-4">
                Giá trị cốt lõi: Vòng lặp khép kín
              </h2>
              <p className="text-lg text-[var(--foreground-muted)] max-w-3xl mx-auto">
                Chúng tôi không chỉ bán len; chúng tôi bán <strong>trải nghiệm hoàn thành một sản phẩm</strong> và cảm giác chữa lành (healing hobby) thông qua đôi tay của chính bạn.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            <Reveal delay={0.1}>
              <div className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-yellow)]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-yellow)]/20 text-[var(--accent-yellow)]">
                    <BookOpen className="size-7" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">Learn (Học tập)</h3>
                  <p className="text-[var(--foreground-muted)]">
                    Kho video hướng dẫn bài bản theo lộ trình từ cơ bản đến nâng cao.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--primary)]/20 text-[var(--primary)]">
                    <ShoppingBag className="size-7" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">Shop (Mua sắm)</h3>
                  <p className="text-[var(--foreground-muted)]">
                    Tính năng <strong>In-video purchasing</strong> cho phép bạn chọn đúng bộ Kit nguyên liệu ngay trong bài học mà không cần tìm kiếm bên ngoài.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-pink)]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-pink)]/20 text-[var(--accent-pink)]">
                    <Palette className="size-7" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">DIY & Community (Sáng tạo)</h3>
                  <p className="text-[var(--foreground-muted)]">
                    Không gian để bạn chia sẻ thành quả, gắn tag nguyên liệu và truyền cảm hứng cho cộng đồng.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-heading text-3xl font-bold text-[var(--foreground)] md:text-4xl mb-12 text-center">
              Tại sao chọn LEN&EM?
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            <Reveal delay={0.1}>
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--foreground)]">Trải nghiệm liền mạch</h3>
                  <p className="text-[var(--foreground-muted)]">
                    Bạn sẽ không bao giờ phải lo lắng về việc mua sai loại len hay thiếu dụng cụ nhờ các bộ <strong>Starter Kit</strong> được chuẩn hóa theo từng bài học.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-pink)]/10 text-[var(--accent-pink)]">
                  <Heart className="size-6" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--foreground)]">Healing Hobby</h3>
                  <p className="text-[var(--foreground-muted)]">
                    Chúng tôi tin rằng đan móc không chỉ là một kỹ năng thủ công, mà còn là hoạt động <strong>tự chăm sóc bản thân và giảm căng thẳng</strong> hiệu quả cho giới trẻ.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-green)]/10 text-[var(--accent-green-text)]">
                  <Users className="size-6" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--foreground)]">Nền tảng của sự kết nối</h3>
                  <p className="text-[var(--foreground-muted)]">
                    Nơi những người mới học, các nghệ nhân (Creator) và người yêu đồ thủ công gặp gỡ, hỗ trợ và cùng nhau phát triển.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)] md:text-4xl mb-4">
                Đội ngũ CozyCrew
              </h2>
              <p className="text-lg text-[var(--foreground-muted)] max-w-3xl mx-auto">
                Chúng tôi là <strong className="text-[var(--foreground)]">CozyCrew</strong>, một nhóm gồm 6 thành viên đến từ nhiều lĩnh vực khác nhau, 
                cùng chung niềm đam mê xây dựng cộng đồng handmade lớn nhất Việt Nam
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member, index) => {
              const Icon = member.icon;
              return (
                <Reveal key={index} delay={index * 0.1}>
                  <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:shadow-lg hover:scale-105">
                    <div className="flex items-start gap-4">
                      <div 
                        className="flex size-14 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${member.color}20`, color: member.color }}
                      >
                        <Icon className="size-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">
                          {member.name}
                        </h3>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-b from-[var(--primary)] to-[var(--primary-hover)] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold text-white md:text-4xl mb-4">
                "Học đan len, sống sáng tạo"
              </h2>
              <p className="mb-8 text-lg text-white/90">
                Learn to knit, live creatively – Hãy để LEN&EM đồng hành cùng bạn trong dự án handmade tiếp theo!
              </p>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-bold text-[var(--primary)] shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Bắt đầu ngay
                <Sparkles className="size-5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}