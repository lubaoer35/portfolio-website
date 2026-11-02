import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { asset } from "../data";
import { useContent, EditableText } from "../content/ContentProvider";
export default function ProfileSummary() {
  const c = useContent();
  const reduced = useReducedMotion();
  return (
    <section className="home-profile">
      <div className="home-profile-grid">
        <div
          className="home-portrait"
          data-edit={c.isAdmin && c.editing ? "profile.portrait" : undefined}
          style={c.styleFor("profile.portrait")}
        >
          <img
            src={asset(c.profile.portrait)}
            alt={`${c.profile.name}个人照片`}
            width="724"
            height="724"
            loading="lazy"
          />
          <span>THE PERSON BEHIND THE WORK</span>
        </div>
        <div className="home-profile-copy">
          <span className="eyebrow">02 / ABOUT THE DESIGNER</span>
          <h2>
            <EditableText path="profile.name" />
            <small>
              <EditableText path="profile.englishName" />
            </small>
          </h2>
          <p className="education">
            {c.profile.school} / {c.profile.major}
            <br />
            {c.profile.degree} · {c.profile.graduation}
          </p>
          <EditableText path="profile.intro" as="p" />
          <EditableText path="profile.bio" as="p" />
          <Link to="/about" className="text-link">
            Explore my story · 关于我 <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="home-practice">
        <div>
          <span className="eyebrow">TOOLS / SOFTWARE</span>
          <h3>
            Ideas into
            <br />
            <em>visual language.</em>
          </h3>
        </div>
        <ul>
          {c.profile.skills.map((skill, i) => (
            <motion.li
              key={i}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: reduced ? 0 : i * 0.05,
                duration: reduced ? 0 : 0.45,
              }}
            >
              <span>0{i + 1}</span>
              <EditableText path={`profile.skills.${i}`} />
              <motion.i
                aria-hidden="true"
                initial={reduced ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: reduced ? 0 : 0.8,
                  delay: reduced ? 0 : i * 0.05,
                }}
              />
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="home-recognition">
        <div>
          <span className="eyebrow">SELECTED RECOGNITION / 获奖</span>
          <strong>
            42<small>项奖项 · 据 PDF 原稿</small>
          </strong>
        </div>
        <div>
          {c.profile.awards.slice(0, 3).map((a, i) => (
            <p key={i}>
              <span>{a[0]}</span>
              <strong>
                {a[1]}
                <small>{a[2]}</small>
              </strong>
            </p>
          ))}
          <Link to="/about#recognition" className="text-link">
            查看全部获奖记录 <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
