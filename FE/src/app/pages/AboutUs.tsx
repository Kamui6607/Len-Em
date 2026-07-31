import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { Reveal } from "../../components/motion/Reveal";
import {
  Users,
  BookOpen,
  ShoppingBag,
  Palette,
  Heart,
  Sparkles,
  Scissors,
} from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "../../context/LanguageContext";

/* ------------------------------------------------------------------
   The signature element: a hand-stitched thread that runs the length
   of the page and draws itself in as the person scrolls — a nod to
   LEN&EM's own craft (đan, thêu, may) rather than a generic progress
   bar. It sits behind every section so nothing needs its own boxed
   background; the page reads as one continuous seam, not five
   stacked blocks.
------------------------------------------------------------------- */
function StitchThread({ progress }: { progress: any }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 hidden md:block"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 100 1000"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M52 0 C 30 60, 30 90, 52 140 S 74 220, 52 270 S 28 340, 50 400 S 76 470, 52 520 S 28 590, 50 650 S 76 720, 52 770 S 28 840, 50 900 S 74 960, 52 1000"
          stroke="var(--border)"
          strokeWidth="0.35"
          strokeDasharray="1.4 3.2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <motion.path
          d="M52 0 C 30 60, 30 90, 52 140 S 74 220, 52 270 S 28 340, 50 400 S 76 470, 52 520 S 28 590, 50 650 S 76 720, 52 770 S 28 840, 50 900 S 74 960, 52 1000"
          stroke="var(--primary)"
          strokeWidth="0.55"
          strokeDasharray="1.4 3.2"
          strokeLinecap="round"
          style={{ pathLength: progress }}
        />
      </svg>
    </div>
  );
}

function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"
      style={{ color: color ?? "var(--primary)" }}
    >
      <span
        className="inline-block h-[6px] w-[6px] rounded-full"
        style={{ backgroundColor: color ?? "var(--primary)" }}
      />
      {children}
    </div>
  );
}

export function AboutUs() {
  const { t } = useLanguage();
  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  });
  const thread = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  });

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
      color: "var(--accent-blush)",
    },
    {
      name: "Võ Ngọc Quý Phi",
      role: "Thiết kế giao diện & trải nghiệm người dùng (GD)",
      icon: Palette,
      color: "var(--decor-heart)",
    },
    {
      name: "Võ Thị Thúy Hiền",
      role: "Quản lý kinh doanh (IB)",
      icon: ShoppingBag,
      color: "var(--accent-green-text)",
    },
    {
      name: "Lê Trần Minh Chí",
      role: "Phát triển tính năng thông minh (AI)",
      icon: BookOpen,
      color: "var(--accent-blue-text)",
    },
  ];

  const values = [
    {
      title: t("about.learnTitle"),
      desc: t("about.learnDesc"),
      icon: BookOpen,
      swatch: "var(--brand-100)",
      ink: "var(--primary)",
      rotate: "md:-rotate-2 md:hover:-rotate-1",
      offset: "md:mt-0",
    },
    {
      title: t("about.shopTitle"),
      desc: t("about.shopDesc"),
      icon: ShoppingBag,
      swatch: "var(--brand-150)",
      ink: "var(--primary)",
      rotate: "md:rotate-1 md:hover:rotate-0",
      offset: "md:mt-10",
    },
    {
      title: t("about.diyTitle"),
      desc: t("about.diyDesc"),
      icon: Palette,
      swatch: "var(--brand-100)",
      ink: "var(--primary)",
      rotate: "md:-rotate-1 md:hover:rotate-0",
      offset: "md:mt-2",
    },
  ];

  const whyUs = [
    {
      title: t("about.seamlessExperience"),
      desc: t("about.seamlessDesc"),
      icon: Sparkles,
      color: "var(--primary)",
    },
    {
      title: t("about.healingHobby"),
      desc: t("about.healingDesc"),
      icon: Heart,
      color: "var(--decor-heart)",
    },
    {
      title: t("about.connectionPlatform"),
      desc: t("about.connectionDesc"),
      icon: Users,
      color: "var(--accent-green-text)",
    },
  ];

  return (
    <div ref={pageRef} className="relative">
      <StitchThread progress={thread} />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden pt-4 pb-[var(--section-py-lg)] pb-40 md:pb-5">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "var(--bg-gradient-160)" }}
        />
        <motion.div
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -left-16 top-16 -z-10 size-72 rounded-full blur-3xl"
          style={{ background: "var(--glow-lavender)" }}
        />
        <motion.div
          animate={{ y: [0, 22, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-10 bottom-0 -z-10 size-80 rounded-full blur-3xl"
          style={{ background: "var(--glow-primary)" }}
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              {/* eyebrow tag — reuses the site's own hero line, no new copy invented */}
              <div
                className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em]"
                style={{
                  borderColor: "var(--chip-border)",
                  color: "var(--primary)",
                  background: "var(--chip-bg)",
                }}
              >
                <Sparkles className="size-3.5" />
                {t("hero.eyebrow")}
              </div>

              {/* monogram ringed by a slowly spinning stitched badge —
                  reads as a fabric/thread label rather than a flat logo mark */}
              <div
                className="relative mx-auto mb-8 flex items-center justify-center"
                style={{ width: 176, height: 176 }}
              >
                <motion.svg
                  viewBox="0 0 176 176"
                  className="absolute inset-0 h-full w-full text-[var(--primary)]"
                  style={{ opacity: 0.5 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
                  aria-hidden="true"
                >
                  <defs>
                    <path
                      id="heroRingPath"
                      d="M88,88 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"
                    />
                  </defs>
                  <circle
                    cx="88"
                    cy="88"
                    r="74"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="1.5 5"
                    opacity="0.6"
                  />
                  <text fontSize="10" letterSpacing="3.5" fontWeight="700" fill="currentColor">
                    <textPath href="#heroRingPath" startOffset="0%">
                      {t("nav.tagline")} • {t("nav.tagline")} •
                    </textPath>
                  </text>
                </motion.svg>

                <motion.div
                  initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 flex size-20 items-center justify-center rounded-3xl text-3xl font-bold text-white"
                  style={{
                    background: "var(--cta-gradient)",
                    boxShadow: "var(--cta-shadow)",
                  }}
                >
                  L&E
                </motion.div>
              </div>

              <h1 className="font-heading text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-6xl">
                {t("about.welcomeTitle")}{" "}
                <span className="text-[var(--primary)]">LEN&EM</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--foreground-muted)] md:text-xl">
                {t("about.welcomeSubtitle")}
              </p>

              {/* the three pillars as small pinned fabric-swatch chips —
                  each drifts on its own rhythm so the row feels handmade,
                  not machine-aligned */}
              <div className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-3">
                {[
                  { label: t("nav.learn"), icon: BookOpen, rotate: -3 },
                  { label: t("nav.shop"), icon: ShoppingBag, rotate: 2 },
                  { label: t("nav.diy"), icon: Palette, rotate: -2 },
                ].map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <motion.div
                      key={p.label}
                      animate={{ y: [0, i % 2 === 0 ? -5 : 5, 0] }}
                      transition={{
                        duration: 4 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.4,
                      }}
                      className="flex items-center gap-1.5 rounded-full border-2 border-dashed px-4 py-1.5 text-xs font-bold uppercase tracking-wide"
                      style={{
                        borderColor: "var(--primary)",
                        color: "var(--primary)",
                        background: "var(--card)",
                        transform: `rotate(${p.rotate}deg)`,
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <Icon className="size-3.5" />
                      {p.label}
                    </motion.div>
                  );
                })}
              </div>

              {/* scroll cue — a bead drifting on a stitched thread, handing
                  off visually to the page's main thread below */}
              <div className="mx-auto mt-14 flex flex-col items-center gap-2">
                <svg width="2" height="40" className="text-[var(--primary)]" style={{ opacity: 0.5 }}>
                  <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="40"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="2 5"
                    strokeLinecap="round"
                  />
                </svg>
                <motion.span
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="block size-2 rounded-full"
                  style={{ background: "var(--primary)" }}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= STORY ================= */}
      <section className="relative py-[var(--section-py-md)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-12 md:items-start">
            {/* grid tracks are set on these two plain divs; Reveal only
                animates the content inside, so it never breaks the
                column sizing */}
            <div className="md:col-span-7">
              <Reveal>
                <Eyebrow>Câu chuyện</Eyebrow>
                <h2 className="font-heading text-3xl font-bold text-[var(--foreground)] md:text-4xl mb-6">
                  {t("about.storyTitle")}
                </h2>
                <div className="prose prose-lg max-w-none text-[var(--foreground-secondary)]">
                  <p dangerouslySetInnerHTML={{ __html: t("about.storyP1") }} />
                </div>
              </Reveal>
            </div>

            <div className="md:col-span-5">
              <Reveal delay={0.15}>
                <div
                  className="relative w-full rounded-3xl border-2 border-dashed p-8 md:-rotate-2 md:hover:rotate-0 transition-transform duration-500"
                  style={{
                    borderColor: "var(--primary)",
                    background: "var(--card)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <Scissors
                    className="absolute -top-4 -left-4 size-8 rotate-[-20deg] text-[var(--primary)]"
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
                  />
                  <p
                    className="text-2xl leading-snug break-words"
                    style={{
                      fontFamily: "var(--font-script)",
                      color: "var(--text-accent)",
                    }}
                    dangerouslySetInnerHTML={{ __html: t("about.storyP2") }}
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE VALUES ================= */}
      <section className="relative py-[var(--section-py-md)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-14 text-center">
              <Eyebrow>
                <span className="mx-auto">Giá trị cốt lõi</span>
              </Eyebrow>
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)] md:text-4xl mb-4">
                {t("about.coreValuesTitle")}
              </h2>
              <p
                className="mx-auto max-w-2xl text-lg text-[var(--foreground-muted)]"
                dangerouslySetInnerHTML={{ __html: t("about.coreValuesSubtitle") }}
              />
            </div>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 0.12}>
                  <div className={`${v.offset}`}>
                    <div
                      className={`group relative rounded-3xl border border-[var(--border)] p-8 transition-all duration-500 ${v.rotate} hover:shadow-xl`}
                      style={{ background: v.swatch, boxShadow: "var(--shadow-card)" }}
                    >
                      <div
                        className="mb-5 flex size-14 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: "rgba(91,61,245,0.14)", color: v.ink }}
                      >
                        <Icon className="size-7" />
                      </div>
                      <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">
                        {v.title}
                      </h3>
                      <p
                        className="text-[var(--foreground-secondary)]"
                        dangerouslySetInnerHTML={{ __html: v.desc }}
                      />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE US — zigzags around the thread ================= */}
      <section className="relative py-[var(--section-py-md)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-heading text-3xl font-bold text-[var(--foreground)] md:text-4xl mb-16 text-center">
              {t("about.whyChooseTitle")}
            </h2>
          </Reveal>

          <div className="space-y-10">
            {whyUs.map((w, i) => {
              const Icon = w.icon;
              const isEven = i % 2 === 0;
              return (
                <Reveal key={w.title} delay={i * 0.12}>
                  <div
                    className={`flex md:w-1/2 gap-4 ${
                      isEven ? "md:mr-auto" : "md:ml-auto md:flex-row-reverse md:text-right"
                    }`}
                  >
                    <div
                      className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${w.color}1F`, color: w.color }}
                    >
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-bold text-[var(--foreground)]">
                        {w.title}
                      </h3>
                      <p
                        className="text-[var(--foreground-muted)]"
                        dangerouslySetInnerHTML={{ __html: w.desc }}
                      />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= TEAM ================= */}
      <section className="relative py-[var(--section-py-md)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-14 text-center">
              <Eyebrow>
                <span className="mx-auto">Gặp gỡ đội ngũ</span>
              </Eyebrow>
              <h2 className="font-heading text-3xl font-bold text-[var(--foreground)] md:text-4xl mb-4">
                {t("about.teamTitle")}
              </h2>
              <p
                className="mx-auto max-w-2xl text-lg text-[var(--foreground-muted)]"
                dangerouslySetInnerHTML={{ __html: t("about.teamSubtitle") }}
              />
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member, index) => {
              const Icon = member.icon;
              return (
                <Reveal key={member.name} delay={index * 0.08}>
                  <div
                    className="group relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 pt-8 transition-all duration-300 hover:-translate-y-1"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <span
                      className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4"
                      style={{
                        backgroundColor: member.color,
                        // @ts-ignore css var ring color
                        "--tw-ring-color": "var(--card)",
                      }}
                    />
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
      </section>

      {/* ================= CTA ================= */}
      <section className="relative py-[var(--section-py-lg)]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-[2rem] border-2 border-dashed p-10 text-center md:p-14"
              style={{
                borderColor: "rgba(255,255,255,0.35)",
                background: "var(--cta-gradient)",
                boxShadow: "var(--cta-shadow)",
              }}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full"
                style={{ background: "rgba(255,255,255,0.12)" }}
              />
              <h2 className="font-heading text-3xl font-bold text-white md:text-4xl mb-4">
                "{t("about.ctaHeadline")}"
              </h2>
              <p className="mb-8 text-lg text-white/90">{t("about.ctaSubtitle")}</p>
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
      </section>
    </div>
  );
}