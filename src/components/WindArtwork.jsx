import React, { useRef } from "react";
import { useInView } from "motion/react";
import { Maximize2 } from "lucide-react";
import { asset } from "../data";
import "./wind.css";
const source = (name) => asset(`/interactive/vision-hanger/${name}.svg`);
export default function WindArtwork({ title, onOpenOriginal }) {
  const ref = useRef(null);
  const visible = useInView(ref, { amount: 0.15 });
  return (
    <button ref={ref} className="gallery-image wind-artwork" data-wind={visible ? "active" : "paused"}
      onClick={onOpenOriginal} aria-label={`放大：${title}`}>
      <svg viewBox="0 0 2182.57 1227.69" role="img" aria-label="项目目标：衣架下的两块面部拼贴随微风轻轻摇摆">
        <image href={source("background")} width="2182.57" height="1227.69" />
        <g className="wind-piece wind-mouth"><image href={source("mouth")} width="2182.57" height="1227.69" /></g>
        <g className="wind-piece wind-eyes"><image href={source("eyes")} width="2182.57" height="1227.69" /></g>
      </svg>
      <span className="zoom-label"><Maximize2 size={15} /> VIEW FULL SIZE</span>
    </button>
  );
}
