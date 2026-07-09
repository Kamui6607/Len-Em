import { motion } from "motion/react";
import { HeroSection } from "../../components/HeroSection";
import { HowItWorksSection } from "../../components/HowItWorksSection";
import { LearnSection } from "../../components/LearnSection";
import { ShopSection } from "../../components/ShopSection";
import { DIYSection } from "../../components/DIYSection";
import { ClosingCTA, LenEmFooter } from "../../components/ClosingCTA";
import { Reveal } from "../../components/motion/Reveal";
import { ScrollProgress } from "../../components/motion/ScrollProgress";
import { BackToTop } from "../../components/motion/BackToTop";
import { SectionDivider } from "../../components/motion/SectionDivider";
import { AnimatedBackground } from "../../components/motion/AnimatedBackground";
import { CursorEffects } from "../../components/motion/CursorEffects";
import { useTheme } from "../../app/context/ThemeContext";

export function Home() {
  const { isDark } = useTheme();
  
  return (
    <>
      <AnimatedBackground />
      <CursorEffects isDark={isDark} />
      <ScrollProgress />

      {/* Page entrance fade — only on mount */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* ── Hero: nền sáng nhất (AnimatedBackground tự xử lý) ── */}
        <HeroSection stackMode="collapsed" />

        {/* ── How It Works: bg-surface — tối hơn 1 bậc ── */}
        <div className="bg-surface">
          <SectionDivider accent="var(--accent-pink)" />
          <Reveal>
            <HowItWorksSection />
          </Reveal>
        </div>

        {/* ── Learn: bg-background (ấm hơn 1 chút) ── */}
        <div className="bg-background">
          <SectionDivider accent="var(--accent-yellow)" />
          <Reveal delay={0.05} y={36}>
            <LearnSection />
          </Reveal>
        </div>

        {/* ── Shop: bg-surface (tối hơn nữa) ── */}
        <div className="bg-surface">
          <SectionDivider accent="var(--primary)" />
          <Reveal delay={0.05} y={40}>
            <ShopSection />
          </Reveal>
        </div>

        {/* ── DIY: bg-muted — tối nhất trước khi vào CTA ── */}
        <div className="bg-muted">
          <SectionDivider accent="var(--accent-pink)" />
          <Reveal delay={0.05} y={24}>
            <DIYSection />
          </Reveal>
        </div>

        {/* ── ClosingCTA: bg-primary (tím đậm) ── */}
        <Reveal y={20}>
          <ClosingCTA />
        </Reveal>
        {/* ── LenEmFooter: bg-card ── */}
        <LenEmFooter />

        {/* Yarn-ball scroll-to-top button */}
        <BackToTop />
      </motion.div>
    </>
  );
}