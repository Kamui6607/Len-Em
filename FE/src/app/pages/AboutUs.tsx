import { motion } from "motion/react";
import { Reveal } from "../../components/motion/Reveal";
import {
  Users,
  BookOpen,
  ShoppingBag,
  Palette,
  Heart,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../../context/LanguageContext";

export function AboutUs() {
  const { t } = useLanguage();
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
                {t("about.welcomeTitle")}{" "}
                <span className="text-[var(--primary)]">LEN&EM</span>
              </h1>
              <p className="mt-6 text-lg text-[var(--foreground-muted)] md:text-xl max-w-3xl mx-auto">
                {t("about.welcomeSubtitle")}
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
                {t("about.storyTitle")}
              </h2>
              <div className="prose prose-lg max-w-none text-[var(--foreground-secondary)] space-y-4">
                <p dangerouslySetInnerHTML={{ __html: t("about.storyP1") }} />
                <p
                  className="text-lg font-medium text-[var(--primary)]"
                  dangerouslySetInnerHTML={{ __html: t("about.storyP2") }}
                />
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
                {t("about.coreValuesTitle")}
              </h2>
              <p
                className="text-lg text-[var(--foreground-muted)] max-w-3xl mx-auto"
                dangerouslySetInnerHTML={{ __html: t("about.coreValuesSubtitle") }}
              />
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
                  <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">
                    {t("about.learnTitle")}
                  </h3>
                  <p
                    className="text-[var(--foreground-muted)]"
                    dangerouslySetInnerHTML={{ __html: t("about.learnDesc") }}
                  />
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
                  <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">
                    {t("about.shopTitle")}
                  </h3>
                  <p
                    className="text-[var(--foreground-muted)]"
                    dangerouslySetInnerHTML={{ __html: t("about.shopDesc") }}
                  />
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
                  <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">
                    {t("about.diyTitle")}
                  </h3>
                  <p
                    className="text-[var(--foreground-muted)]"
                    dangerouslySetInnerHTML={{ __html: t("about.diyDesc") }}
                  />
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
              {t("about.whyChooseTitle")}
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            <Reveal delay={0.1}>
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--foreground)]">
                    {t("about.seamlessExperience")}
                  </h3>
                  <p
                    className="text-[var(--foreground-muted)]"
                    dangerouslySetInnerHTML={{ __html: t("about.seamlessDesc") }}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-pink)]/10 text-[var(--accent-pink)]">
                  <Heart className="size-6" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--foreground)]">
                    {t("about.healingHobby")}
                  </h3>
                  <p
                    className="text-[var(--foreground-muted)]"
                    dangerouslySetInnerHTML={{ __html: t("about.healingDesc") }}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-green)]/10 text-[var(--accent-green-text)]">
                  <Users className="size-6" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--foreground)]">
                    {t("about.connectionPlatform")}
                  </h3>
                  <p
                    className="text-[var(--foreground-muted)]"
                    dangerouslySetInnerHTML={{ __html: t("about.connectionDesc") }}
                  />
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
                {t("about.teamTitle")}
              </h2>
              <p
                className="text-lg text-[var(--foreground-muted)] max-w-3xl mx-auto"
                dangerouslySetInnerHTML={{ __html: t("about.teamSubtitle") }}
              />
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
                        style={{
                          backgroundColor: `${member.color}20`,
                          color: member.color,
                        }}
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
                "{t("about.ctaHeadline")}"
              </h2>
              <p className="mb-8 text-lg text-white/90">
                {t("about.ctaSubtitle")}
              </p>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-bold text-[var(--primary)] shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                {t("about.ctaButton")}
                <Sparkles className="size-5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}