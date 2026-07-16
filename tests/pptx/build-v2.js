// yuulibrary 比赛 PPT v2 (5 页) —— 一人公司效率 Agent 赛道
// v2 改动：完整呈现项目（入库流水线 skills + Agent + CI 质量门 + 站点功能 + 检索）
// 配色 Ocean: 主色深蓝 065A82 / 辅助青 1C7293 / 强调午夜 21295C / 浅底 F8FAFC
const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 × 7.5
pres.author = "UynajGI";
pres.title = "yuulibrary — 个人知识管理效率系统";

// ── 配色 ────────────────────────────────────────────────
const C = {
  navy: "065A82",
  teal: "1C7293",
  midnight: "21295C",
  ink: "0F172A",
  slate: "475569",
  mist: "94A3B8",
  bg: "F8FAFC",
  card: "FFFFFF",
  accent: "14B8A6",
  warn: "EA580C",
  hairline: "E2E8F0",
};

const FH = "Noto Serif CJK SC";
const FB = "Noto Sans CJK SC";

const cardShadow = () => ({
  type: "outer",
  color: "000000",
  blur: 8,
  offset: 2,
  angle: 90,
  opacity: 0.08,
});

// 通用页眉（浅底页用）
function header(s, tag, title) {
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.3,
    h: 1.1,
    fill: { color: C.card },
    line: { type: "none" },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 1.1,
    w: 13.3,
    h: 0.03,
    fill: { color: C.hairline },
    line: { type: "none" },
  });
  s.addText(tag, {
    x: 0.6,
    y: 0.28,
    w: 5,
    h: 0.35,
    fontSize: 13,
    fontFace: FB,
    color: C.accent,
    bold: true,
    charSpacing: 3,
    margin: 0,
  });
  s.addText(title, {
    x: 0.6,
    y: 0.62,
    w: 12,
    h: 0.45,
    fontSize: 21,
    fontFace: FH,
    color: C.ink,
    bold: true,
    margin: 0,
  });
}

// ════════════════════════════════════════════════════════
// Slide 1 — 封面
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.midnight };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.25,
    h: 7.5,
    fill: { color: C.accent },
    line: { type: "none" },
  });

  s.addText("一人公司效率 Agent · 参赛作品", {
    x: 0.9,
    y: 1.4,
    w: 11,
    h: 0.4,
    fontSize: 13,
    fontFace: FB,
    color: C.accent,
    charSpacing: 4,
    bold: true,
    margin: 0,
  });

  s.addText("yuulibrary", {
    x: 0.9,
    y: 2.0,
    w: 11,
    h: 1.3,
    fontSize: 62,
    fontFace: "Arial Black",
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });

  s.addText("个人知识管理效率系统", {
    x: 0.9,
    y: 3.3,
    w: 11,
    h: 0.7,
    fontSize: 28,
    fontFace: FH,
    color: "FFFFFF",
    margin: 0,
  });

  s.addText("PDF 自动入库 · 无向量 AI 问答 · 静态站点全自动构建", {
    x: 0.9,
    y: 4.2,
    w: 11,
    h: 0.5,
    fontSize: 15,
    fontFace: FB,
    color: C.mist,
    margin: 0,
  });

  // 底部三个小标签（系统三大模块预告）
  const mods = ["自动化入库", "智能检索", "站点功能"];
  mods.forEach((m, i) => {
    const x = 0.9 + i * 3.3;
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 5.1,
      w: 3.0,
      h: 0.5,
      fill: { color: C.navy },
      line: { type: "none" },
    });
    s.addText(m, {
      x,
      y: 5.1,
      w: 3.0,
      h: 0.5,
      fontSize: 13,
      fontFace: FB,
      color: "FFFFFF",
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0,
    });
  });

  s.addText(
    [
      { text: "github.com/UynajGI/yuulibrary", options: { color: C.accent, bold: true } },
      { text: "    ·    uynajgi.github.io/yuulibrary", options: { color: C.mist } },
    ],
    { x: 0.9, y: 6.7, w: 11, h: 0.4, fontSize: 12, fontFace: "Consolas", margin: 0 }
  );
}

// ════════════════════════════════════════════════════════
// Slide 2 — 系统全景：三大模块一图概览
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "系统全景", "三个模块，覆盖知识从入库到复用全链路");

  // 三大模块卡片（横向）
  const mods = [
    {
      t: "① 自动化入库",
      sub: "Skills + Agent 工作流",
      items: [
        "4 个入库 Skill（书/论文/综述/笔记）",
        "PDF→提取→清洗→翻译→结构化",
        "4 个 Agent（质检/重构/数学推导）",
        "15 个 CI 质量门自动校验",
      ],
      color: C.navy,
    },
    {
      t: "② 智能检索",
      sub: "无向量 RAG 引擎",
      items: [
        "正文 chunk 倒排索引",
        "BM25F + 多路召回 + RRF 融合",
        "多信号 confidence 校准",
        "浏览器端 BYOK AI 问答",
      ],
      color: C.teal,
    },
    {
      t: "③ 站点功能",
      sub: "Hugo 静态站点",
      items: [
        "书架/论文架/统计仪表盘自动生成",
        "三态主题切换（日/夜/自动）",
        "Staticrypt 站点加密",
        "KaTeX 数学 + 手绘图 + 算法块",
      ],
      color: C.accent,
    },
  ];

  const cw = 3.85,
    gap = 0.3;
  const startX = (13.3 - (cw * 3 + gap * 2)) / 2;
  mods.forEach((m, i) => {
    const x = startX + i * (cw + gap);
    // 卡片
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 1.55,
      w: cw,
      h: 4.4,
      fill: { color: C.card },
      line: { type: "none" },
      shadow: cardShadow(),
    });
    // 顶部色条
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 1.55,
      w: cw,
      h: 0.12,
      fill: { color: m.color },
      line: { type: "none" },
    });
    // 模块标题
    s.addText(m.t, {
      x: x + 0.3,
      y: 1.85,
      w: cw - 0.6,
      h: 0.5,
      fontSize: 18,
      fontFace: FB,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(m.sub, {
      x: x + 0.3,
      y: 2.35,
      w: cw - 0.6,
      h: 0.35,
      fontSize: 11.5,
      fontFace: FB,
      color: m.color,
      bold: true,
      margin: 0,
    });
    // 分隔线
    s.addShape(pres.shapes.LINE, {
      x: x + 0.3,
      y: 2.8,
      w: cw - 0.6,
      h: 0,
      line: { color: C.hairline, width: 0.75 },
    });
    // 列表
    const bullets = m.items.map((it, idx) => ({
      text: it,
      options: { bullet: { code: "2022" }, breakLine: idx < m.items.length - 1 },
    }));
    s.addText(bullets, {
      x: x + 0.3,
      y: 2.95,
      w: cw - 0.6,
      h: 2.8,
      fontSize: 11.5,
      fontFace: FB,
      color: C.slate,
      paraSpaceAfter: 5,
      margin: 0,
    });
  });

  // 底部数据条
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6,
    y: 6.25,
    w: 12.1,
    h: 0.85,
    fill: { color: C.midnight },
    line: { type: "none" },
  });
  s.addText(
    [
      { text: "82 篇文档", options: { color: C.accent, bold: true, fontSize: 15 } },
      { text: " 已入库  ·  ", options: { color: "FFFFFF", fontSize: 13 } },
      { text: "7984 节点", options: { color: C.accent, bold: true, fontSize: 15 } },
      { text: " 结构化  ·  ", options: { color: "FFFFFF", fontSize: 13 } },
      { text: "42822 chunk", options: { color: C.accent, bold: true, fontSize: 15 } },
      { text: " 全文索引  ·  ", options: { color: "FFFFFF", fontSize: 13 } },
      { text: "15 项 CI 检查", options: { color: C.accent, bold: true, fontSize: 15 } },
      { text: " 全自动", options: { color: "FFFFFF", fontSize: 13 } },
    ],
    { x: 0.9, y: 6.35, w: 11.5, h: 0.65, fontFace: FB, valign: "middle", margin: 0 }
  );
}

// ════════════════════════════════════════════════════════
// Slide 3 — 入库流水线：从 PDF 到结构化，全自动
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "入库流水线", "PDF 扔进去，结构化中文笔记出来——全程脚本驱动");

  // 顶部流程条（6 步）
  const steps = ["PDF/EPUB", "MinerU 提取", "清洗+翻译", "结构化分析", "质量校验", "入库发布"];
  const sw = 1.78,
    sgap = 0.18;
  const sx = (13.3 - (sw * 6 + sgap * 5)) / 2;
  steps.forEach((st, i) => {
    const x = sx + i * (sw + sgap);
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 1.65,
      w: sw,
      h: 0.6,
      fill: { color: C.navy },
      line: { type: "none" },
    });
    s.addText(st, {
      x,
      y: 1.65,
      w: sw,
      h: 0.6,
      fontSize: 12,
      fontFace: FB,
      color: "FFFFFF",
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0,
    });
    if (i < 5) {
      s.addText("→", {
        x: x + sw - 0.02,
        y: 1.65,
        w: sgap + 0.04,
        h: 0.6,
        fontSize: 16,
        color: C.accent,
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0,
      });
    }
  });

  // 下方两栏：左 = Skills/Agent 清单，右 = CI 质量门
  // 左栏
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6,
    y: 2.6,
    w: 6.0,
    h: 4.1,
    fill: { color: C.card },
    line: { type: "none" },
    shadow: cardShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6,
    y: 2.6,
    w: 0.08,
    h: 4.1,
    fill: { color: C.navy },
    line: { type: "none" },
  });
  s.addText("Skills 与 Agent", {
    x: 0.85,
    y: 2.75,
    w: 5.5,
    h: 0.4,
    fontSize: 15,
    fontFace: FB,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  const skills = [
    ["add-book-to-library", "9 个脚本：提取/清洗/翻译/交叉引用/定理格式化"],
    ["add-paper-to-library", "论文 7 栏目结构化分析 + cross-link"],
    ["add-papers-to-review", "多篇论文综述生成（跨论文分析）"],
    ["add-note-to-library", "笔记蒸馏：思维框架/决策启发式"],
    ["spot-check Agent", "随机抽 2 章，18 点清单 AI 质检"],
    ["narrative-restructurer", "章节脉络重构（推导链追踪）"],
  ];
  skills.forEach((sk, i) => {
    const y = 3.25 + i * 0.55;
    s.addText(sk[0], {
      x: 0.95,
      y,
      w: 2.6,
      h: 0.3,
      fontSize: 10.5,
      fontFace: "Consolas",
      color: C.accent,
      bold: true,
      margin: 0,
    });
    s.addText(sk[1], {
      x: 3.55,
      y,
      w: 2.9,
      h: 0.45,
      fontSize: 10,
      fontFace: FB,
      color: C.slate,
      margin: 0,
    });
  });

  // 右栏：CI 质量门
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.9,
    y: 2.6,
    w: 5.8,
    h: 4.1,
    fill: { color: C.card },
    line: { type: "none" },
    shadow: cardShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.9,
    y: 2.6,
    w: 0.08,
    h: 4.1,
    fill: { color: C.warn },
    line: { type: "none" },
  });
  s.addText("CI 质量门（lefthook + GitHub Actions）", {
    x: 7.15,
    y: 2.75,
    w: 5.3,
    h: 0.4,
    fontSize: 14,
    fontFace: FB,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  const checks = [
    ["prettier / eslint", "代码格式 + 语法"],
    ["markdownlint", "Markdown 规范"],
    ["hugo-build", "构建不报错"],
    ["html-check", "产物完整性"],
    ["book-validate", "38 项机械验证"],
    ["latex-render", "公式可渲染"],
    ["translate-test", "翻译回归（34 用例）"],
    ["pageindex-build", "索引增量构建"],
  ];
  checks.forEach((ck, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const x = 7.15 + col * 2.7;
    const y = 3.3 + row * 0.55;
    s.addText("✓", {
      x,
      y,
      w: 0.25,
      h: 0.3,
      fontSize: 11,
      fontFace: FB,
      color: C.accent,
      bold: true,
      margin: 0,
    });
    s.addText(ck[0], {
      x: x + 0.3,
      y,
      w: 1.5,
      h: 0.3,
      fontSize: 10,
      fontFace: "Consolas",
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(ck[1], {
      x: x + 0.3,
      y: y + 0.25,
      w: 2.3,
      h: 0.25,
      fontSize: 9,
      fontFace: FB,
      color: C.mist,
      margin: 0,
    });
  });
}

// ════════════════════════════════════════════════════════
// Slide 4 — 检索引擎：无向量 RAG
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  header(s, "智能检索", "不用向量库，检索照样准——而且更省、更透明");

  // 左：对比表（修正措辞）
  s.addText("vs. 传统向量 RAG", {
    x: 0.6,
    y: 1.5,
    w: 6,
    h: 0.4,
    fontSize: 14,
    fontFace: FB,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  const cmp = [
    ["维度", "向量 RAG", "yuulibrary"],
    ["运行时检索", "向量 API 调用", "浏览器本地计算"],
    ["部署", "向量数据库+后端", "纯静态文件"],
    ["可解释性", "黑盒相似度", "倒排表 + BM25F"],
    ["用户 Key", "托管在服务端", "BYOK 不经服务端"],
    ["fork 难度", "配置复杂", "clone 即用"],
  ];
  const rows = cmp.map((row, ri) =>
    row.map((cell, ci) => ({
      text: cell,
      options:
        ri === 0
          ? {
              fill: { color: C.navy },
              color: "FFFFFF",
              bold: true,
              align: "center",
              fontSize: 11,
              fontFace: FB,
            }
          : ci === 2
            ? { fill: { color: "ECFDF5" }, color: C.ink, bold: true, fontSize: 10.5, fontFace: FB }
            : { color: C.slate, fontSize: 10.5, fontFace: FB },
    }))
  );
  s.addTable(rows, {
    x: 0.6,
    y: 2.0,
    w: 6.0,
    colW: [1.3, 2.3, 2.4],
    border: { type: "solid", pt: 0.5, color: C.hairline },
    rowH: 0.5,
    valign: "middle",
    fontFace: FB,
  });

  // 右：4 个技术亮点
  s.addText("核心实现", {
    x: 7.2,
    y: 1.5,
    w: 5.5,
    h: 0.4,
    fontSize: 14,
    fontFace: FB,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  const feats = [
    { t: "正文 chunk 倒排索引", d: "200 字摘要外的深处内容也可搜" },
    { t: "多路召回 + RRF 融合", d: "标题/BM25/TOC 三路，解主题消歧" },
    { t: "多信号 confidence", d: "无答案检测 7/7 正确，不硬答" },
    { t: "稳定引用 ID", d: "多轮检索引用编号不错位" },
  ];
  feats.forEach((f, i) => {
    const y = 2.0 + i * 1.05;
    s.addShape(pres.shapes.OVAL, {
      x: 7.2,
      y: y + 0.05,
      w: 0.28,
      h: 0.28,
      fill: { color: C.accent },
      line: { type: "none" },
    });
    s.addText(String(i + 1), {
      x: 7.2,
      y: y + 0.05,
      w: 0.28,
      h: 0.28,
      fontSize: 11,
      fontFace: "Consolas",
      color: "FFFFFF",
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0,
    });
    s.addText(f.t, {
      x: 7.65,
      y,
      w: 5,
      h: 0.35,
      fontSize: 13,
      fontFace: FB,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(f.d, {
      x: 7.65,
      y: y + 0.35,
      w: 5,
      h: 0.4,
      fontSize: 11,
      fontFace: FB,
      color: C.slate,
      margin: 0,
    });
  });

  // 底部一行：检索流程
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6,
    y: 6.35,
    w: 12.1,
    h: 0.65,
    fill: { color: C.midnight },
    line: { type: "none" },
  });
  s.addText(
    [
      { text: "检索流程：", options: { color: C.accent, bold: true, fontSize: 12 } },
      {
        text: "query → 倒排索引召回 → BM25F 打分 → RRF 多路融合 → 词法重排 → MMR 去冗余 → LLM 带引用回答",
        options: { color: "FFFFFF", fontSize: 11 },
      },
    ],
    { x: 0.9, y: 6.42, w: 11.5, h: 0.5, fontFace: FB, valign: "middle", margin: 0 }
  );
}

// ════════════════════════════════════════════════════════
// Slide 5 — 实证 & Demo
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.midnight };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.25,
    h: 7.5,
    fill: { color: C.accent },
    line: { type: "none" },
  });

  s.addText("实证 & Demo", {
    x: 0.9,
    y: 0.6,
    w: 8,
    h: 0.4,
    fontSize: 13,
    fontFace: FB,
    color: C.accent,
    bold: true,
    charSpacing: 4,
    margin: 0,
  });
  s.addText("不只是能跑，是经过量化评测的", {
    x: 0.9,
    y: 1.0,
    w: 11,
    h: 0.7,
    fontSize: 26,
    fontFace: FH,
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });

  // 4 个统计数字
  const stats = [
    { n: "0.86", l: "总体 Recall@10", s: "148 题 golden benchmark" },
    { n: "7/7", l: "无答案检测准确", s: "不硬答没收录的内容" },
    { n: "82篇", l: "已入库文档", s: "书/论文/笔记/综述" },
    { n: "15项", l: "CI 自动质检", s: "提交即校验，无需人工" },
  ];
  stats.forEach((st, i) => {
    const x = 0.9 + i * 3.0;
    s.addText(st.n, {
      x,
      y: 2.1,
      w: 2.8,
      h: 0.9,
      fontSize: 46,
      fontFace: "Arial Black",
      color: C.accent,
      bold: true,
      margin: 0,
    });
    s.addText(st.l, {
      x,
      y: 3.05,
      w: 2.8,
      h: 0.35,
      fontSize: 13,
      fontFace: FB,
      color: "FFFFFF",
      bold: true,
      margin: 0,
    });
    s.addText(st.s, {
      x,
      y: 3.4,
      w: 2.8,
      h: 0.4,
      fontSize: 10,
      fontFace: FB,
      color: C.mist,
      margin: 0,
    });
  });

  // 分隔线
  s.addShape(pres.shapes.LINE, {
    x: 0.9,
    y: 4.2,
    w: 11.5,
    h: 0,
    line: { color: C.teal, width: 0.75 },
  });

  // Demo 路径（左）
  s.addText("Demo 路径", {
    x: 0.9,
    y: 4.4,
    w: 5,
    h: 0.35,
    fontSize: 13,
    fontFace: FB,
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText(
    [
      { text: "① 打开 ", options: { color: "FFFFFF" } },
      { text: "uynajgi.github.io/yuulibrary", options: { color: C.accent, bold: true } },
      {
        text: "\n② 右下角 AI 问答按钮，填自己的 API Key",
        options: { color: C.mist, breakLine: true },
      },
      { text: "\n③ 提问，如「Kubo 公式的证明」", options: { color: C.mist, breakLine: true } },
      { text: "\n④ 顶部切换日/夜主题，浏览书架", options: { color: C.mist } },
    ],
    { x: 0.9, y: 4.8, w: 6.5, h: 1.6, fontSize: 11.5, fontFace: FB, margin: 0, paraSpaceAfter: 3 }
  );

  // 适用场景（右）
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.2,
    y: 4.4,
    w: 4.3,
    h: 2.4,
    fill: { color: C.navy },
    line: { type: "none" },
  });
  s.addText("适用场景", {
    x: 8.4,
    y: 4.5,
    w: 3.9,
    h: 0.35,
    fontSize: 12,
    fontFace: FB,
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText(
    [
      { text: "· 个人/小团队知识库\n", options: { color: "FFFFFF", breakLine: true } },
      { text: "· 术语明确的专业领域\n", options: { color: "FFFFFF", breakLine: true } },
      { text: "· 研究综述批量生成\n", options: { color: "FFFFFF", breakLine: true } },
      { text: "· 低成本静态部署", options: { color: "FFFFFF" } },
    ],
    { x: 8.4, y: 4.9, w: 3.9, h: 1.8, fontSize: 11, fontFace: FB, margin: 0, paraSpaceAfter: 3 }
  );

  // 底部一句
  s.addText(
    "AI 使用披露：ZCode (GLM-5.2) 辅助编码 · DeepSeek 生成摘要/翻译 · 内容经人工审核 · MIT 开源",
    {
      x: 0.9,
      y: 7.0,
      w: 11.5,
      h: 0.35,
      fontSize: 9,
      fontFace: FB,
      color: C.mist,
      margin: 0,
    }
  );
}

// ── 写出 ────────────────────────────────────────────────
const outDir = __dirname;
const outFile = path.join(outDir, "yuulibrary-比赛展示-v2.pptx");
pres.writeFile({ fileName: outFile }).then(() => {
  console.log("OK ->", outFile);
});
