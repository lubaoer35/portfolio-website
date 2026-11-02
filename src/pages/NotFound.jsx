import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
export default function NotFound() {
  return (
    <section className="page-section not-found">
      <span className="eyebrow">404 / PAGE NOT FOUND</span>
      <h1 className="page-title">
        A different
        <br />
        <em>direction.</em>
      </h1>
      <p>这个页面不存在，不如回到作品中继续探索。</p>
      <Link className="text-link" to="/work">
        返回作品页 <ArrowRight size={18} />
      </Link>
    </section>
  );
}
