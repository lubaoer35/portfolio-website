import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { asset } from "../data";
import "./claw.css";
const pieces = [
  { id: "mouth", name: "嘴唇拼贴", x: 1345, grip: 780 },
  { id: "eyes", name: "蓝色眼部", x: 1500, grip: 790 },
  { id: "ears", name: "耳部条纹", x: 1700, grip: 930 },
  { id: "hair", name: "发型拼贴", x: 1830, grip: 625 },
];
const layer = (name) => asset(`/interactive/vision-claw/${name}.svg`);
function Artwork({ name }) {
  return <image href={layer(name)} width="2182.57" height="1227.69" />;
}
export default function ClawInteraction({ onOpenOriginal }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState("点击画面，让夹爪挑选一块素材");
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState(null);
  const [collected, setCollected] = useState([]);
  const lock = useRef(false), alive = useRef(true), runs = useRef(new Set());
  const x = useMotionValue(0), y = useMotionValue(0);
  const itemX = useMotionValue(0), itemY = useMotionValue(0);
  const ropeHeight = useTransform(y, (value) => 645 + value);
  const close = useMotionValue(0), opposite = useMotionValue(0);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; runs.current.forEach((run) => run.stop()); };
  }, []);
  async function tween(value, target, seconds = 0.55) {
    const run = animate(value, target, { duration: reduced ? 0 : seconds, ease: [0.45, 0, 0.2, 1] });
    runs.current.add(run);
    await run;
    runs.current.delete(run);
  }
  async function grab(piece) {
    if (lock.current || collected.some((c) => c.id === piece.id)) return;
    lock.current = true; setBusy(true);
    const dx = piece.x - 337, drop = piece.grip - 675;
    const destination = collected.length * 140;
    try {
      // A reduced-motion visitor gets the same result without spatial movement.
      if (!reduced) {
        setPhase(`正在移动到${piece.name}`);
        await tween(y, -240, 0.35);
        await tween(x, dx, 0.75);
        if (!alive.current) return;
        setPhase("夹爪下降，准备夹取");
        await tween(y, drop, 0.6);
        await Promise.all([tween(close, -20, 0.3), tween(opposite, 20, 0.3)]);
        if (!alive.current) return;
        setHeld(piece.id); itemX.set(0); itemY.set(0);
        setPhase(`已夹住${piece.name}，正在提起`);
        await Promise.all([tween(y, -240, 0.6), tween(itemY, -240 - drop, 0.6)]);
        await Promise.all([tween(x, destination, 0.8), tween(itemX, destination - dx, 0.8)]);
        await Promise.all([tween(y, 0, 0.4), tween(itemY, -drop, 0.4)]);
        await Promise.all([tween(close, 0, 0.25), tween(opposite, 0, 0.25)]);
      }
      if (!alive.current) return;
      setCollected((list) => [...list, { ...piece, dx: destination - dx, dy: -drop }]);
      setHeld(null);
      setPhase(`已夹取${piece.name}！${collected.length === 3 ? "四块素材已集齐，可重新开始" : "再点一次，继续夹取"}`);
    } finally {
      if (alive.current) { setBusy(false); lock.current = false; }
    }
  }
  const available = pieces.filter((p) => !collected.some((c) => c.id === p.id));
  const randomGrab = () => {
    if (available.length) grab(available[Math.floor(Math.random() * available.length)]);
  };
  const reset = () => {
    if (lock.current) return;
    setCollected([]); setHeld(null); x.set(0); y.set(0);
    setPhase("点击画面，让夹爪挑选一块素材");
  };
  return (
    <div className="claw-experience" data-phase={busy ? "grabbing" : "ready"}>
      <div className="claw-instructions">
        <span>INTERACTIVE COLLAGE / 面部重组互动</span>
        <span>点击画面随机抓取 · 或在下方选择素材</span>
      </div>
      <button className="claw-stage" onClick={randomGrab}
        disabled={busy || !available.length} aria-label="启动夹爪，随机抓取一块面部素材" aria-busy={busy}>
        <svg viewBox="0 0 2182.57 1227.69" aria-hidden="true">
          <defs><clipPath id="claw-bin"><rect width="2183" height="986" /></clipPath></defs>
          <Artwork name="background" />
          <g clipPath="url(#claw-bin)">
            {pieces.filter((p) => p.id !== held && !collected.some((c) => c.id === p.id)).map((p) =>
              <g key={p.id}><Artwork name={p.id} /></g>)}
          </g>
          {collected.map((p) => <g key={p.id} transform={`translate(${p.dx} ${p.dy})`}><Artwork name={p.id} /></g>)}
          {held && <motion.g style={{ x: itemX, y: itemY }} data-held={held}><Artwork name={held} /></motion.g>}
          <motion.g style={{ x }}>
            <motion.rect x="312" y="-300" width="44.47" height="645" fill="#aad6de" style={{ height: ropeHeight }} />
            <motion.g style={{ y }}>
              <motion.g style={{ rotate: close, originX: "337px", originY: "476px" }}><Artwork name="claw-left" /></motion.g>
              <motion.g style={{ rotate: opposite, originX: "337px", originY: "476px" }}><Artwork name="claw-right" /></motion.g>
              <Artwork name="claw-hub" />
            </motion.g>
          </motion.g>
        </svg>
      </button>
      <div className="claw-toolbar">
        <p role="status" aria-live="polite">{phase} <span>({collected.length} / 4)</span></p>
        <div className="claw-piece-controls" aria-label="选择夹取素材">
          {pieces.map((p) => <button key={p.id} onClick={() => grab(p)} disabled={busy || collected.some((c) => c.id === p.id)}>{p.name}</button>)}
        </div>
        <div className="claw-actions">
          <button onClick={reset} disabled={busy || !collected.length}>重新开始 ↻</button>
          <button onClick={onOpenOriginal}>查看 PDF 原稿 ↗</button>
        </div>
      </div>
    </div>
  );
}
