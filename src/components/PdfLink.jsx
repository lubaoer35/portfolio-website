import React from "react";
import { Download } from "lucide-react";
import { asset } from "../data";
export default function PdfLink({ children = "下载作品集", className = "" }) {
  return (
    <a
      className={className}
      href={asset("/projects/lv-bao-er-portfolio.pdf")}
      download="吕宝儿-2027届-作品集.pdf"
    >
      {children}
      <Download size={16} />
    </a>
  );
}
