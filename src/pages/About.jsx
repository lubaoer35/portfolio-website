import React from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { asset } from "../data";
import { useContent, EditableText } from "../content/ContentProvider";
import PdfLink from "../components/PdfLink";
export default function About() {
  const {
    profile,
    projects,
    categories,
    featuredSlugs,
    sourceNote,
    styleFor,
    isAdmin,
    editing,
  } = useContent();
  return (
    <section className="page-section about-page">
      <div className="page-kicker">
        <span className="eyebrow">ABOUT THE DESIGNER / 关于我</span>
        <span className="eyebrow">2027 GRADUATE</span>
      </div>
      <h1 className="page-title">
        Hello, I’m
        <br />
        <em>
          <EditableText path="profile.englishName" />.
        </em>
        <span>
          <EditableText path="profile.name" />
        </span>
      </h1>
      <div className="about-grid">
        <div className="portrait-wrap">
          <img
            src={asset(profile.portrait)}
            alt="吕宝儿的个人照片，摘自作品集第 2 页"
            width="724"
            height="724"
          />
          <span className="eyebrow">LV BAO ER / 吕宝儿</span>
        </div>
        <div className="about-copy">
          <span className="eyebrow">DIGITAL MEDIA ART / 数字媒体艺术</span>
          <h2>
            以视觉表达，
            <br />
            连接创意与想象。
          </h2>
          <p>
            {profile.school} · {profile.degree}
            <br />
            {profile.major} · {profile.graduation}
          </p>
          <EditableText path="profile.intro" as="p" />
          <EditableText path="profile.bio" as="p" />
          <p>
            求职方向
            <br />
            <strong>
              <EditableText path="profile.direction" />
            </strong>
          </p>
          <a className="text-link" href={`mailto:${profile.email}`}>
            {profile.email}
            <ArrowUpRight size={18} />
          </a>
          <PdfLink className="text-link">下载作品集 PDF</PdfLink>
        </div>
      </div>
      <section className="awards-section" id="recognition">
        <div className="section-heading">
          <div>
            <span className="eyebrow">RECOGNITION / 获奖情况</span>
            <h2>
              Selected <em>recognition.</em>
            </h2>
          </div>
          <div className="award-total">
            42
            <span>
              项奖项
              <br />
              据作品集原稿
            </span>
          </div>
        </div>
        <div className="awards-list">
          {profile.awards.map(([name, award, rank], i) => (
            <div className="award-row" key={i}>
              <span className="award-n">{String(i + 1).padStart(2, "0")}</span>
              <h3>
                <EditableText path={`profile.awards.${i}.0`} />
              </h3>
              <span className="award-prize">
                <EditableText path={`profile.awards.${i}.1`} />
                <small>
                  <EditableText path={`profile.awards.${i}.2`} />
                </small>
              </span>
            </div>
          ))}
        </div>
        <p className="source-note">
          以上依据 PDF 第 2
          页逐项保留。原稿列有两条同名“米兰设计周全国三等奖”，未注明对应作品；此处未合并或补写。
        </p>
      </section>
      <section className="skills-section">
        <div>
          <span className="eyebrow">TOOLS & PRACTICE / 擅长软件</span>
          <h2>
            My creative
            <br />
            <em>toolkit.</em>
          </h2>
        </div>
        <ul>
          {profile.skills.map((s, i) => (
            <li key={s}>
              <span>0{i + 1}</span>
              <EditableText path={`profile.skills.${i}`} />
              <Plus size={18} />
            </li>
          ))}
        </ul>
      </section>
      <section className="timeline-section">
        <span className="eyebrow">JOURNEY / 学习与方向</span>
        <h2>
          A practice <em>in progress.</em>
        </h2>
        <ol>
          {profile.timeline.map((item, i) => (
            <li key={i}>
              <time>
                <EditableText path={`profile.timeline.${i}.date`} />
              </time>
              <div>
                <h3>
                  <EditableText path={`profile.timeline.${i}.title`} />
                </h3>
                <p>
                  <EditableText path={`profile.timeline.${i}.description`} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <div className="original-profile">
        <a
          className="text-link"
          href={asset("/projects/archive/page-02.webp")}
          target="_blank"
          rel="noreferrer"
        >
          查看个人信息原稿 · PDF P.02 <ArrowUpRight size={17} />
        </a>
      </div>
    </section>
  );
}
