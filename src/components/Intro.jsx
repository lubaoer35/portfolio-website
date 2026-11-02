import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
export default function Intro() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(
    () => !sessionStorage.getItem("portfolio:intro:2027"),
  );
  const finish = () => {
    sessionStorage.setItem("portfolio:intro:2027", "seen");
    setActive(false);
    window.dispatchEvent(new Event("portfolio:skip-intro"));
  };
  useEffect(() => {
    if (reduced) {
      finish();
      return;
    }
    if (active) {
      const id = setTimeout(finish, 2500);
      return () => clearTimeout(id);
    }
  }, [active, reduced]);
  if (!active || reduced) return null;
  return (
    <div className="opening-intro">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2.5 }}
      >
        PORTFOLIO 2027 / LV BAO ER
      </motion.span>
      <button onClick={finish}>SKIP INTRO · 跳过开场 ↗</button>
    </div>
  );
}
