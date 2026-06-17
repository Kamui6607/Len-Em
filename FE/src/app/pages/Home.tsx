import { BookOpen, Check, Palette, ShoppingBag, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

interface HomeProps {
  isAuthOpen?: boolean;
}

const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const modules = [
  {
    label: "LEARN",
    icon: BookOpen,
    description: "Video lessons with materials tagged at exact timestamps.",
    sectionId: "section-learn",
  },
  {
    label: "SHOP",
    icon: ShoppingBag,
    description: "Combos curated by skill level — pick yours and go.",
    sectionId: "section-shop",
  },
  {
    label: "DIY",
    icon: Palette,
    description: "Creator projects you can recreate with one tap.",
    sectionId: "section-diy",
  },
];

const features = [
  "Beginner, Intermediate & Advanced tracks",
  "Creator-taught, community-reviewed",
  "Materials tagged at exact video timestamps",
];

// Using picsum.photos with fixed seeds for consistent, reliable images
const mockProducts = [
  { name: "Sage Beginner Wool", price: "129.000₫", seed: 1062 },
  { name: "Terracotta Hook Set", price: "189.000₫", seed: 1080 },
  { name: "Creamy Cotton Bundle", price: "159.000₫", seed: 1074 },
  { name: "Cozy Stitch Markers", price: "49.000₫", seed: 1059 },
];

const diyPosts = [
  {
    creator: "Mai Anh",
    likes: "2.4k",
    isIdol: true,
    seed: 1062,
    avatar: 10,
  },
  {
    creator: "Linh Studio",
    likes: "986",
    isIdol: false,
    seed: 1080,
    avatar: 20,
  },
  {
    creator: "Nắng Handmade",
    likes: "1.8k",
    isIdol: false,
    seed: 1074,
    avatar: 30,
  },
  {
    creator: "Yarn by Vy",
    likes: "734",
    isIdol: false,
    seed: 1059,
    avatar: 40,
  },
];

const img = (seed: number, w = 600, h = 400) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const avatar = (seed: number) =>
  `https://picsum.photos/seed/${seed + 500}/80/80`;

const containerVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.12 },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

function YarnPattern({ light = false }: { light?: boolean }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={light ? "yarn-l" : "yarn-d"}
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 32 C16 4 48 4 64 32 C48 60 16 60 0 32ZM16 32 C24 18 40 18 48 32 C40 46 24 46 16 32Z"
            fill="none"
            stroke={light ? "#fff" : "#C45E3E"}
            strokeWidth="1.2"
          />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill={`url(#${light ? "yarn-l" : "yarn-d"})`}
        opacity={light ? 0.08 : 0.04}
      />
    </svg>
  );
}

function SectionMotion({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Home({ isAuthOpen: _isAuthOpen = false }: HomeProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const startLearning = () => navigate("/learn");
  const openShop = () => navigate(isAuthenticated ? "/shop" : "/auth/login");

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,var(--color-bg)_0%,#F5EDE4_100%)] text-[var(--color-text)] dark:bg-[linear-gradient(135deg,var(--color-bg)_0%,#241C18_100%)]">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <YarnPattern />
        <div className="absolute left-0 top-0 size-72 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] blur-3xl" />
        <div className="absolute bottom-0 right-0 size-72 rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_12%,transparent)] blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-card)_75%,transparent)] px-4 py-2 text-sm font-bold text-[var(--color-text-muted)] shadow-sm backdrop-blur">
              <Sparkles className="size-4 text-[var(--color-primary)]" />
              Learn to knit • Buy materials • Create endlessly
            </div>

            <h1 className="font-heading text-[clamp(2.6rem,6vw,3.6rem)] font-bold leading-[1] tracking-tight">
              Learn to knit,
              <br />
              <span className="relative inline-block italic">
                live creatively
                <svg
                  className="absolute -bottom-3 left-0 h-5 w-full overflow-visible"
                  viewBox="0 0 360 32"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M6 18 C48 30 86 6 128 18 S208 30 252 17 S320 7 354 17"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeLinecap="round"
                    strokeWidth="7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 1.1,
                      ease: "easeInOut",
                      delay: 0.3,
                    }}
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-text-muted)] md:text-lg">
              A cozy closed-loop platform where beginners, creators, and idol
              fans learn, buy the right materials, and share handmade pieces.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startLearning}
                className="btn-primary px-7 py-3 text-sm"
              >
                Start learning now
              </button>
              <button
                type="button"
                onClick={openShop}
                className="btn-outline px-7 py-3 text-sm"
              >
                Browse material combos
              </button>
            </div>

            <div className="mt-7 flex flex-col gap-2">
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => scrollToSection(m.sectionId)}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] border-l-[3px] border-l-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-bg-card)_80%,transparent)] px-4 py-2.5 text-left backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--color-primary)_7%,transparent)]"
                  >
                    <Icon className="size-4 shrink-0 text-[var(--color-primary)]" />
                    <span className="w-14 shrink-0 text-xs font-extrabold tracking-[0.18em] text-[var(--color-text)]">
                      {m.label}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {m.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative h-full min-h-[420px] lg:min-h-[520px]">
            <img
              src={img(1062, 1000, 1200)}
              alt="Warm yarn and crochet materials"
              className="absolute inset-0 size-full rounded-3xl object-cover shadow-2xl"
              style={{ transform: "rotate(1deg)" }}
            />
            <div className="absolute -bottom-4 -left-4 max-w-[210px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 shadow-xl">
              <p className="font-heading text-lg font-bold text-[var(--color-primary)]">
                3-step loop
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-muted)]">
                Watch → add tagged materials → post your DIY.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEARN ── */}
      <section
        id="section-learn"
        className="scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8"
      >
        <SectionMotion className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <motion.div variants={childVariants} className="relative">
            <img
              src={img(1080, 800, 600)}
              alt="Knitting tutorial"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
            />
            <div className="absolute left-4 top-4 rounded-full bg-[var(--color-secondary)] px-4 py-2 text-xs font-extrabold text-white shadow-lg">
              🎬 3 skill levels
            </div>
          </motion.div>

          <motion.div variants={childVariants}>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.22em] text-[var(--color-primary)]">
              <BookOpen className="size-3.5" /> LEARN
            </div>
            <h2 className="font-heading text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl">
              Master every stitch, one lesson at a time
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
              Structured videos from beginner to advanced. Materials tagged
              inside each lesson — add to cart without leaving the video.
            </p>
            <ul className="mt-5 space-y-3">
              {features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm text-[var(--color-text)]"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_16%,transparent)] text-[var(--color-secondary)]">
                    <Check className="size-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <blockquote className="mt-6 border-l-4 border-[var(--color-accent)] pl-4 text-sm italic leading-7 text-[var(--color-text-muted)]">
              "I learned the magic knot from a 6-minute lesson and ordered the
              yarn right away."
              <cite className="mt-1 block text-xs font-bold not-italic">
                — Linh, Hanoi 🌿
              </cite>
            </blockquote>
            <button
              type="button"
              onClick={startLearning}
              className="btn-primary mt-7 px-6 py-3 text-sm"
            >
              Browse courses →
            </button>
          </motion.div>
        </SectionMotion>
      </section>

      {/* ── SHOP ── */}
      {/*
        FIX: items-center → items-start so text col doesn't stretch.
        2×2 card grid replaced with a horizontal list of 4 compact rows
        so the visual height stays proportional to the text column.
      */}
      <section
        id="section-shop"
        className="scroll-mt-20 bg-[...] px-4 py-16 sm:px-6 lg:px-8 min-h-[600px]"
      >
        <SectionMotion className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <motion.div variants={childVariants}>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.22em] text-[var(--color-secondary)]">
              <ShoppingBag className="size-3.5" /> SHOP
            </div>
            <h2 className="font-heading text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl">
              Materials matched to your project
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
              No more guessing which yarn weight to buy. Combos curated by skill
              level — just pick yours and go.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["🌱 Beginner Combo", "🧶 Pro Combo", "🔥 Promax Combo"].map(
                (c) => (
                  <span
                    key={c}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-1.5 text-xs font-bold text-[var(--color-text)] shadow-sm"
                  >
                    {c}
                  </span>
                ),
              )}
            </div>
            <button
              type="button"
              onClick={openShop}
              className="btn-outline mt-7 px-6 py-3 text-sm"
            >
              Shop combos →
            </button>
          </motion.div>

          {/* 4 compact horizontal cards — height matches text column naturally */}
          <motion.div
            variants={childVariants}
            className="relative flex flex-col gap-3"
          >
            <div className="absolute -right-2 -top-4 z-10 rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-extrabold text-[#7A5C00] shadow-md">
              📚 Smart picks for your lesson
            </div>
            {mockProducts.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
              >
                <img
                  src={img(p.seed, 120, 120)}
                  alt={p.name}
                  className="size-14 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--color-text)]">
                    {p.name}
                  </p>
                  <p className="font-heading text-base font-bold text-[var(--color-primary)]">
                    {p.price}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-primary-light)]"
                >
                  Add
                </button>
              </div>
            ))}
          </motion.div>
        </SectionMotion>
      </section>

      {/* ── DIY ── */}
      {/*
        FIX: scroll-mt-20 (was 24) + removed extra top padding from header block
        so nav scroll lands right at the DIY label, no empty gap above.
      */}
      <section
        id="section-diy"
        className="scroll-mt-16 px-4 pt-6 pb-16 sm:px-6 lg:px-8"
      >
        <SectionMotion className="mx-auto max-w-7xl">
          <motion.div
            variants={childVariants}
            className="mx-auto mb-8 max-w-2xl text-center"
          >
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.22em] text-[var(--color-primary)]">
              <Palette className="size-3.5" /> DIY
            </div>
            <h2 className="font-heading text-3xl font-bold leading-tight text-[var(--color-text)] md:text-4xl">
              See it made. Buy the kit. Make it yours.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
              Creators and idols post their pieces with every material they
              used. One tap and the full combo is in your cart.
            </p>
          </motion.div>

          <motion.div
            variants={childVariants}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {diyPosts.map((post) => (
              <article
                key={post.creator}
                className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-sm"
              >
                {post.isIdol && (
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[10px] font-extrabold text-[#7A5C00]">
                    ⭐ Idol Pick
                  </div>
                )}
                <img
                  src={img(post.seed, 600, 800)}
                  alt={`${post.creator} knitting project`}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={avatar(post.avatar)}
                      alt={post.creator}
                      className="size-8 rounded-full border-2 border-white object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">
                        {post.creator}
                      </p>
                      <p className="text-[10px] text-white/70">
                        ♥ {post.likes}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-full bg-white py-1.5 text-xs font-extrabold text-[var(--color-primary)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  >
                    Buy combo
                  </button>
                </div>
              </article>
            ))}
          </motion.div>

          <motion.div variants={childVariants} className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate("/diy")}
              className="btn-primary px-7 py-3 text-sm"
            >
              Explore all DIY →
            </button>
          </motion.div>
        </SectionMotion>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-[var(--color-primary)] px-4 py-16 text-white sm:px-6 lg:px-8">
        <YarnPattern light />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white md:text-5xl">
            Your next handmade project starts here.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/80">
            Join thousands of learners, shoppers, and makers on Len&Em.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={startLearning}
              className="rounded-full bg-white px-7 py-3 text-sm font-extrabold text-[var(--color-primary)] shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Start learning for free
            </button>
            <button
              type="button"
              onClick={openShop}
              className="rounded-full border border-white/70 px-7 py-3 text-sm font-extrabold text-white hover:bg-white/10"
            >
              Explore the shop
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
