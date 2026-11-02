// Shared, dependency-free validation for browser drafts and the offline publisher.
export const VERSION = 1;
const string = (value, limit = 12000) =>
  typeof value === "string" && value.length <= limit;
export function isImagePath(path) {
  return (
    string(path, 12 * 1024 * 1024) &&
    ((/^\/(projects|editor-assets)\/[A-Za-z0-9_./-]+$/.test(path) &&
      !path.includes("..")) ||
      /^data:image\/(png|jpeg|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(path))
  );
}
export function validateContent(c) {
  if (
    !c ||
    c.version !== VERSION ||
    !c.profile ||
    !Array.isArray(c.projects) ||
    !Array.isArray(c.categories)
  )
    throw new Error("发布包格式或版本不正确");
  for (const key of [
    "name",
    "englishName",
    "email",
    "school",
    "degree",
    "major",
    "graduation",
    "direction",
    "intro",
    "bio",
  ])
    if (!string(c.profile[key] ?? ""))
      throw new Error(`个人信息 ${key} 格式不正确`);
  if (c.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.profile.email))
    throw new Error("请输入有效邮箱");
  if (
    !Array.isArray(c.profile.awards) ||
    c.profile.awards.length > 100 ||
    !c.profile.awards.every(
      (a) =>
        Array.isArray(a) && a.length === 3 && a.every((x) => string(x, 500)),
    )
  )
    throw new Error("获奖信息格式不正确");
  if (
    !Array.isArray(c.profile.skills) ||
    !c.profile.skills.every((x) => string(x, 100))
  )
    throw new Error("技能格式不正确");
  if (
    !Array.isArray(c.profile.timeline) ||
    !c.profile.timeline.every(
      (x) =>
        string(x.date, 100) &&
        string(x.title, 300) &&
        string(x.description, 1000),
    )
  )
    throw new Error("经历格式不正确");
  if (!c.projects.length || c.projects.length > 50)
    throw new Error("请保留 1—50 个项目");
  const ids = new Set();
  const catIds = new Set();
  for (const cat of c.categories) {
    if (!string(cat.id, 100) || !string(cat.label, 100) || catIds.has(cat.id))
      throw new Error("分类名称或标识重复");
    catIds.add(cat.id);
  }
  for (const p of c.projects) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) || ids.has(p.slug))
      throw new Error("项目路径必须唯一，只能使用小写英文、数字及短横线");
    ids.add(p.slug);
    for (const key of [
      "name",
      "chinese",
      "summary",
      "intro",
      "number",
      "pageRange",
    ])
      if (!string(p[key] ?? "")) throw new Error(`项目 ${key} 格式错误`);
    if (
      !(p.year === null || string(p.year, 50)) ||
      !isImagePath(p.cover) ||
      !isImagePath(p.coverSmall)
    )
      throw new Error("封面或年份格式错误");
    if (!Array.isArray(p.tags) || !p.tags.every((x) => catIds.has(x)))
      throw new Error("项目分类不存在");
    if (
      !Array.isArray(p.pages) ||
      p.pages.length > 100 ||
      !p.pages.every(
        (x) =>
          string(x.title, 1000) && isImagePath(x.src) && isImagePath(x.small),
      )
    )
      throw new Error("项目图片数据格式错误");
    if (
      !Array.isArray(p.sections) ||
      !p.sections.every(
        (x) => Array.isArray(x) && x.length === 2 && x.every((v) => string(v)),
      )
    )
      throw new Error("设计叙事格式错误");
    if (!Array.isArray(p.services) || !p.services.every((x) => string(x, 200)))
      throw new Error("设计内容格式错误");
    for (const color of [p.accent, p.tint])
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("项目配色格式错误");
  }
  if (
    !Array.isArray(c.featuredSlugs) ||
    !c.featuredSlugs.every((x) => ids.has(x))
  )
    throw new Error("首页精选项目不存在");
  if (!isImagePath(c.hero.image) || !isImagePath(c.profile.portrait))
    throw new Error("首页或个人照片路径错误");
  for (const color of [c.theme?.background, c.theme?.accent, c.theme?.text])
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("主题颜色格式错误");
  if (
    !["sans", "serif"].includes(c.theme.font) ||
    !Number.isFinite(c.theme.spacing) ||
    c.theme.spacing < 30 ||
    c.theme.spacing > 140
  )
    throw new Error("主题字体或间距格式错误");
  for (const [key, style] of Object.entries(c.elementStyles || {})) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(key) || !style || typeof style !== "object")
      throw new Error("元素样式格式错误");
    for (const k of Object.keys(style))
      if (
        ![
          "color",
          "fontSize",
          "font",
          "align",
          "offsetX",
          "offsetY",
          "width",
          "gap",
          "ratio",
        ].includes(k)
      )
        throw new Error("不支持的元素样式");
    if (style.color && !/^#[0-9a-f]{6}$/i.test(style.color))
      throw new Error("颜色格式错误");
    if (
      (style.font && !["sans", "serif"].includes(style.font)) ||
      (style.align && !["left", "center", "right"].includes(style.align)) ||
      (style.ratio &&
        !["original", "landscape", "square", "portrait"].includes(style.ratio))
    )
      throw new Error("元素样式值不正确");
    for (const [k, min, max] of [
      ["fontSize", 8, 120],
      ["offsetX", -160, 160],
      ["offsetY", -160, 160],
      ["width", 50, 100],
      ["gap", 0, 100],
    ])
      if (
        style[k] !== undefined &&
        (!Number.isFinite(style[k]) || style[k] < min || style[k] > max)
      )
        throw new Error(`${k} 超出范围`);
  }
  if (JSON.stringify(c).length > 65 * 1024 * 1024)
    throw new Error("草稿总大小超过 65MB，请减少图片大小");
  return c;
}
export function setPath(object, path, value) {
  const next = structuredClone(object);
  const keys = path.split(".");
  if (keys.some((k) => ["__proto__", "constructor", "prototype"].includes(k)))
    throw new Error("非法字段");
  let cursor = next;
  for (const k of keys.slice(0, -1)) {
    if (cursor[k] === undefined) throw new Error("字段不存在");
    cursor = cursor[k];
  }
  cursor[keys.at(-1)] = value;
  return next;
}
export function getPath(object, path) {
  return path.split(".").reduce((o, k) => o?.[k], object);
}
