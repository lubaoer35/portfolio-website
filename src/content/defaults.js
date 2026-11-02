import {
  profile,
  projects,
  categories,
  featuredSlugs,
  sourceNote,
} from "../data.js";
export const defaultContent = {
  version: 1,
  profile: {
    ...profile,
    direction: "品牌视觉 / 创意视觉 / 插画设计 / UI设计 / IP设计 / 动态视觉",
    portrait: "/projects/identity/portrait.webp",
    intro:
      "一名关注品牌视觉、创意设计与数字媒体表达的设计师。擅长通过视觉叙事、图形语言与多媒介设计，将创意概念转化为具有识别度和感染力的视觉作品。",
    bio: "在品牌视觉、UI设计、插画、IP形象及动态视觉等领域持续探索，尝试在商业表达与艺术实验之间寻找平衡。",
    skills: [
      "Adobe Illustrator",
      "Adobe Photoshop",
      "Adobe Premiere Pro",
      "After Effects",
      "AIGC Video",
      "Basic 3D Modeling",
    ],
    timeline: [
      {
        date: "本科在读",
        title: "武昌工学院 · 数字媒体艺术",
        description: "依据作品集第 2 页；原稿未提供入学时间。",
      },
      {
        date: "2027届",
        title: "品牌视觉 / 创意视觉 / 数字媒体艺术设计",
        description: "毕业届别与求职方向依据本人提供的信息。",
      },
    ],
  },
  projects,
  featuredSlugs: [
    "vision-reconstructed",
    "iqiyi-vision",
    ...featuredSlugs.filter(
      (s) => !["vision-reconstructed", "iqiyi-vision"].includes(s),
    ),
  ],
  sourceNote,
  categories: categories.map((id) => ({
    id,
    label:
      { All: "ALL", UI: "UI DESIGN", IP: "IP DESIGN", Motion: "MOTION" }[id] ||
      id.toUpperCase(),
  })),
  hero: { image: "/projects/identity/portfolio-lettering.webp" },
  theme: {
    background: "#f5f3ec",
    text: "#20211e",
    accent: "#193b85",
    font: "sans",
    spacing: 90,
  },
  elementStyles: {},
};
