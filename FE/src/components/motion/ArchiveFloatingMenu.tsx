import { Fragment, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export function ArchiveFloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Theo dõi breakpoint mobile để chỉnh bán kính/kích thước cho vừa màn hình nhỏ
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleMessagesClick = () => {
    navigate("/messages");
    setIsOpen(false);
  };

  const handleDemoClick = (demoName: string) => {
    toast.info(`${demoName} clicked! (Demo only)`);
    setIsOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Thứ tự xòe: 6h (dưới) → 9h (trái) → 12h (trên).
  // Nếu thêm nút mới, cứ thêm vào cuối mảng — góc sẽ tự nối tiếp
  // theo chiều kim đồng hồ (qua 3h rồi về lại 6h) nhờ công thức bên dưới.
  const arcButtons = [
    { id: "back-to-top", icon: "back-to-top", onClick: scrollToTop, label: "Về đầu trang" },
    { id: "messages", icon: "messages", onClick: handleMessagesClick, label: "Tin nhắn" },
    { id: "demo1", icon: "demo1", onClick: () => handleDemoClick("Demo Button 1"), label: "Demo 1" },
    { id: "demo2", icon: "demo2", onClick: () => handleDemoClick("Demo Button 2"), label: "Demo 2" },
    { id: "demo3", icon: "demo3", onClick: () => handleDemoClick("Demo Button 3"), label: "Demo 3" },
  ];

  // ── Kích thước responsive: chật hơn trên mobile, thoáng hơn trên desktop ──
  const mainSize = isMobile ? 48 : 54;
  const buttonSize = isMobile ? 44 : 48;
  const radius = isMobile ? 64 : 84;      // đủ xa để 2 nút cạnh nhau không dính
  const labelGap = isMobile ? 20 : 26;    // khoảng cách thêm để đặt nhãn ra ngoài vòng nút

  const startAngle = 180; // 6 giờ — bắt đầu từ phía dưới, gần nút chính nhất
  const angleStep = 45;   // 45° / nút → 5 nút phủ đúng nửa vòng tròn 6h→9h→12h

  // Quy ước góc: 0° = hướng lên (12h), 90° = phải (3h), 180° = xuống (6h), 270° = trái (9h)
  const getPoint = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: Math.sin(rad) * r, y: -Math.cos(rad) * r };
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "back-to-top":
        return (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1" />
            <path d="M6 12L10 7L14 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
      case "messages":
        return (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V14C17 14.5523 16.5523 15 16 15H8L4 18V15H4C3.44772 15 3 14.5523 3 14V4Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "demo1":
        return (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" fill="white" />
          </svg>
        );
      case "demo2":
        return (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="6" y="6" width="8" height="8" rx="2" fill="white" />
          </svg>
        );
      case "demo3":
        return (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 4L13 9H17L14 13L15 18L10 15L5 18L6 13L3 9H7L10 4Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed z-200"
      style={{
        bottom: "max(90px, env(safe-area-inset-bottom, 80px))",
        right: "max(12px, env(safe-area-inset-right, 12px))",
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop — bấm ra ngoài để đóng */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20"
              style={{ zIndex: -1 }}
            />

            {/* Khớp đúng kích thước nút chính → tâm quạt = tâm nút chính */}
            <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%" }}>
                {arcButtons.map((btn, index) => {
                  const angle = startAngle + index * angleStep;
                  const point = getPoint(angle, radius);
                  const labelPoint = getPoint(angle, radius + buttonSize / 2 + labelGap);

                  return (
                    <Fragment key={btn.id}>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
                        animate={{ opacity: 1, scale: 1, x: point.x, y: point.y }}
                        exit={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
                        transition={{
                          delay: 0.045 * index,
                          type: "spring",
                          stiffness: 320,
                          damping: 22,
                        }}
                        whileHover={{ scale: 1.14 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          btn.onClick();
                          setIsOpen(false);
                        }}
                        className="absolute flex items-center justify-center border-none cursor-pointer rounded-full"
                        style={{
                          width: buttonSize,
                          height: buttonSize,
                          top: -buttonSize / 2,
                          left: -buttonSize / 2,
                          background: "var(--primary)",
                          boxShadow:
                            "0 6px 16px rgba(91,61,245,0.35), 0 0 0 3px var(--background)",
                          pointerEvents: "auto",
                        }}
                        aria-label={btn.label}
                      >
                        {getIcon(btn.icon)}
                      </motion.button>

                      {/* Nhãn tên — giúp nhìn là hiểu ngay, không phải đoán icon */}
                      {btn.id !== "back-to-top" && (
                        <motion.span
                          initial={{ opacity: 0, x: 0, y: 0 }}
                          animate={{ opacity: 1, x: labelPoint.x, y: labelPoint.y }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: 0.045 * index + 0.08 }}
                          className="absolute whitespace-nowrap"
                          style={{
                            top: 0,
                            left: 0,
                            translate: "-50% -50%",
                            background: "var(--card)",
                            color: "var(--foreground)",
                            border: "1px solid var(--border)",
                            borderRadius: 999,
                            padding: "4px 10px",
                            fontSize: 11,
                            fontWeight: 500,
                            boxShadow: "var(--shadow-sm)",
                            pointerEvents: "none",
                          }}
                        >
                          {btn.label}
                        </motion.span>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Nút chính */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center border-none cursor-pointer rounded-full"
        style={{
          width: mainSize,
          height: mainSize,
          background: "var(--primary)",
          boxShadow: "0 6px 20px rgba(107,63,160,0.35)",
        }}
        whileHover={{ scale: 1.08, rotate: -8 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Archive menu"
      >
        <motion.svg
          width={isMobile ? 20 : 22}
          height={isMobile ? 20 : 22}
          viewBox="0 0 20 20"
          fill="none"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path
            d="M10 4V16M4 10H16"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>
    </div>
  );
}