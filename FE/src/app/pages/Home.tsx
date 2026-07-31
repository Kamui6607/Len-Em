import { motion } from "motion/react";
import { HeroSection } from "../../components/HeroSection";
import { HowItWorksSection } from "../../components/HowItWorksSection";
import { LearnSection } from "../../components/LearnSection";
import { ShopSection } from "../../components/ShopSection";
import { DIYSection } from "../../components/DIYSection";
import { ClosingCTA, LenEmFooter } from "../../components/ClosingCTA";
import { Reveal } from "../../components/motion/Reveal";
import { ScrollProgress } from "../../components/motion/ScrollProgress";
import { SectionDivider } from "../../components/motion/SectionDivider";
import { AnimatedBackground } from "../../components/motion/AnimatedBackground";

export function Home() {
  
  return (
    <>
      <AnimatedBackground />
      <ScrollProgress />

      {/* Page entrance fade — only on mount */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* ── Hero: nền sáng nhất (AnimatedBackground tự xử lý) ── */}
        <div id="section-hero" style={{ scrollMarginTop: "0px" }}>
          <HeroSection stackMode="collapsed" />
        </div>

        {/* ── How It Works: bg-surface — tối hơn 1 bậc ── */}
        <div id="section-how-it-works" className="bg-surface" style={{ scrollMarginTop: "0px" }}>
          <SectionDivider accent="var(--accent-pink)" />
          <Reveal>
            <HowItWorksSection />
          </Reveal>
        </div>

        {/* ── Learn: bg-background (ấm hơn 1 chút) ── */}
        <div id="section-learn" className="bg-background" style={{ scrollMarginTop: "0px" }}>
          <SectionDivider accent="var(--accent-yellow)" />
          <Reveal delay={0.05} y={36}>
            <LearnSection />
          </Reveal>
        </div>

        {/* ── Shop: bg-surface (tối hơn nữa) ── */}
        <div id="section-shop" className="bg-surface" style={{ scrollMarginTop: "0px" }}>
          <SectionDivider accent="var(--primary)" />
          <Reveal delay={0.05} y={40}>
            <ShopSection />
          </Reveal>
        </div>

        {/* ── DIY: bg-muted — tối nhất trước khi vào CTA ── */}
        <div id="section-diy" className="bg-muted" style={{ scrollMarginTop: "0px" }}>
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
      </motion.div>
    </>
  );
}