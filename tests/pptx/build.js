// yuulibrary 比赛 PPT (5 页) —— 一人公司效率 Agent 赛道
// 配色 Ocean: 主色深蓝 065A82 / 辅助青 1C7293 / 强调午夜 21295C / 浅底 F8FAFC
const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 × 7.5
pres.author = "UynajGI";
pres.title = "yuulibrary — 无向量个人知识图书馆";

// ── 配色 ────────────────────────────────────────────────
const C = {
  navy: "065A82", // 主色
  teal: "1C7293", // 辅助
  midnight: "21295C", // 深底
  ink: "0F172A", // 正文
  slate: "475569", // 次正文
  mist: "94A3B8", // 弱文
  bg: "F8FAFC", // 浅底
  card: "FFFFFF",
  accent: "14B8A6", // 强调(青绿)
  warn: "EA580C", // 问题橙
  hairline: "E2E8F0", // 分隔线
};

const FH = "Noto Serif CJK SC"; // 标题宋体
const FB = "Noto Sans CJK SC"; // 正文黑体（若无则用系统默认中文）

// 复用工厂：阴影 / 卡片
const cardShadow = () => ({
  type: "outer",
  color: "000000",
  blur: 8,
  offset: 2,
  angle: 90,
  opacity: 0.08,
});

// ════════════════════════════════════════════════════════
// Slide 1 — 封面
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.midnight };

  // 左侧色带（视觉母题：贯穿全片的单侧粗边）
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.25,
    h: 7.5,
    fill: { color: C.accent },
    line: { type: "none" },
  });

  // 小标签：赛道
  s.addText("一人公司效率 Agent · 参赛作品", {
    x: 0.9,
    y: 1.5,
    w: 8,
    h: 0.4,
    fontSize: 13,
    fontFace: FB,
    color: C.accent,
    charSpacing: 4,
    bold: true,
    margin: 0,
  });

  // 主标题
  s.addText("yuulibrary", {
    x: 0.9,
    y: 2.1,
    w: 11,
    h: 1.4,
    fontSize: 66,
    fontFace: "Arial Black",
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });

  // 副标题
  s.addText("无向量个人知识图书馆", {
    x: 0.9,
    y: 3.5,
    w: 11,
    h: 0.8,
    fontSize: 30,
    fontFace: FH,
    color: "FFFFFF",
    margin: 0,
  });

  // 一句话定位
  s.addText("PDF 自动入库 · 浏览器端 AI 问答 · 静态部署零成本", {
    x: 0.9,
    y: 4.5,
    w: 11,
    h: 0.5,
    fontSize: 16,
    fontFace: FB,
    color: C.mist,
    margin: 0,
  });

  // 底部链接
  s.addText(
    [
      { text: "github.com/UynajGI/yuulibrary", options: { color: C.accent, bold: true } },
      { text: "    ·    uynajgi.github.io/yuulibrary", options: { color: C.mist } },
    ],
    { x: 0.9, y: 6.6, w: 11, h: 0.4, fontSize: 12, fontFace: "Consolas", margin: 0 }
  );
}

// ════════════════════════════════════════════════════════
// Slide 2 — 问题：知识散落，复用困难
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // 顶部页眉条
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
  s.addText("问题", {
    x: 0.6,
    y: 0.3,
    w: 3,
    h: 0.5,
    fontSize: 13,
    fontFace: FB,
    color: C.accent,
    bold: true,
    charSpacing: 3,
    margin: 0,
  });
  s.addText("个人知识管理，正在浪费时间", {
    x: 0.6,
    y: 0.55,
    w: 12,
    h: 0.5,
    fontSize: 22,
    fontFace: FH,
    color: C.ink,
    bold: true,
    margin: 0,
  });

  // 三张痛点卡片
  const pains = [
    { t: "PDF 堆积如山", d: "下载的书、论文散落各处，文件名混乱，找一篇要翻半天" },
    { t: "读完就忘", d: "没有结构化整理，几个月后等于没读过，知识无法复用" },
    { t: "问答要靠记忆", d: "想查某个概念在第几页，只能人工翻；跨文档对比几乎不可能" },
  ];
  pains.forEach((p, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 1.7,
      w: 3.8,
      h: 2.8,
      fill: { color: C.card },
      line: { type: "none" },
      shadow: cardShadow(),
    });
    // 左侧色条（卡片视觉母题）
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 1.7,
      w: 0.06,
      h: 2.8,
      fill: { color: C.warn },
      line: { type: "none" },
    });
    s.addText("0" + (i + 1), {
      x: x + 0.25,
      y: 1.85,
      w: 1,
      h: 0.4,
      fontSize: 13,
      fontFace: "Consolas",
      color: C.mist,
      bold: true,
      margin: 0,
    });
    s.addText(p.t, {
      x: x + 0.25,
      y: 2.25,
      w: 3.3,
      h: 0.6,
      fontSize: 17,
      fontFace: FB,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(p.d, {
      x: x + 0.25,
      y: 2.9,
      w: 3.3,
      h: 1.4,
      fontSize: 12.5,
      fontFace: FB,
      color: C.slate,
      margin: 0,
      paraSpaceAfter: 4,
    });
  });

  // 底部结论条
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6,
    y: 4.7,
    w: 12.1,
    h: 0.9,
    fill: { color: C.midnight },
    line: { type: "none" },
  });
  s.addText(
    [
      { text: "知识工作者 30% 的时间 ", options: { color: C.accent, bold: true, fontSize: 17 } },
      {
        text: "花在『找资料』而不是『用资料』上——这个缺口，正是效率 Agent 的价值。",
        options: { color: "FFFFFF", fontSize: 14 },
      },
    ],
    { x: 0.9, y: 4.85, w: 11.5, h: 0.6, fontFace: FB, valign: "middle", margin: 0 }
  );
}

// ════════════════════════════════════════════════════════
// Slide 3 — 方案：自动化入库 + AI 问答（效率闭环）
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

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
  s.addText("方案", {
    x: 0.6,
    y: 0.3,
    w: 3,
    h: 0.5,
    fontSize: 13,
    fontFace: FB,
    color: C.accent,
    bold: true,
    charSpacing: 3,
    margin: 0,
  });
  s.addText("从 PDF 到可问答的知识库，全自动化", {
    x: 0.6,
    y: 0.55,
    w: 12,
    h: 0.5,
    fontSize: 22,
    fontFace: FH,
    color: C.ink,
    bold: true,
    margin: 0,
  });

  // 流程：4 步
  const steps = [
    { t: "自动入库", d: "PDF/EPUB\nMinerU 提取\n脚本清洗翻译", icon: "📥" },
    { t: "结构化", d: "章节树\n书/论文/笔记\n统一中文整理", icon: "🗂" },
    { t: "建索引", d: "正文 chunk 切分\n倒排索引\nBM25F 加权", icon: "🔍" },
    { t: "AI 问答", d: "浏览器直连 LLM\nBYOK 自带 Key\n带引用回答", icon: "💬" },
  ];
  const sw = 2.7,
    gap = 0.35;
  const startX = (13.3 - (sw * 4 + gap * 3)) / 2;
  steps.forEach((st, i) => {
    const x = startX + i * (sw + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 1.6,
      w: sw,
      h: 3.3,
      fill: { color: C.card },
      line: { type: "none" },
      shadow: cardShadow(),
    });
    // 顶部编号圆
    s.addShape(pres.shapes.OVAL, {
      x: x + sw / 2 - 0.35,
      y: 1.85,
      w: 0.7,
      h: 0.7,
      fill: { color: C.navy },
      line: { type: "none" },
    });
    s.addText("STEP " + (i + 1), {
      x: x + sw / 2 - 0.35,
      y: 1.85,
      w: 0.7,
      h: 0.7,
      fontSize: 9,
      fontFace: "Consolas",
      color: "FFFFFF",
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0,
    });
    s.addText(st.t, {
      x: x + 0.2,
      y: 2.75,
      w: sw - 0.4,
      h: 0.5,
      fontSize: 17,
      fontFace: FB,
      color: C.ink,
      bold: true,
      align: "center",
      margin: 0,
    });
    s.addText(st.d, {
      x: x + 0.2,
      y: 3.3,
      w: sw - 0.4,
      h: 1.4,
      fontSize: 11.5,
      fontFace: FB,
      color: C.slate,
      align: "center",
      margin: 0,
      paraSpaceAfter: 2,
    });

    // 箭头（除最后一个）
    if (i < 3) {
      s.addText("→", {
        x: x + sw - 0.05,
        y: 2.9,
        w: gap + 0.1,
        h: 0.5,
        fontSize: 22,
        color: C.accent,
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0,
      });
    }
  });

  // 底部价值条
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6,
    y: 5.3,
    w: 12.1,
    h: 1.2,
    fill: { color: C.card },
    line: { type: "none" },
    shadow: cardShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6,
    y: 5.3,
    w: 0.08,
    h: 1.2,
    fill: { color: C.accent },
    line: { type: "none" },
  });
  s.addText(
    [
      { text: "效率闭环：", options: { bold: true, color: C.ink, fontSize: 15 } },
      { text: "一次入库 → 永久可问答。", options: { color: C.slate, fontSize: 14 } },
      {
        text: "  知识不再『读一遍就丢』，而是随时可检索、可对比、可追溯的资产。",
        options: { color: C.slate, fontSize: 14 },
      },
    ],
    { x: 0.95, y: 5.5, w: 11.5, h: 0.8, fontFace: FB, valign: "middle", margin: 0 }
  );
}

// ════════════════════════════════════════════════════════
// Slide 4 — 技术亮点：无向量 RAG 的差异化
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

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
  s.addText("技术亮点", {
    x: 0.6,
    y: 0.3,
    w: 3,
    h: 0.5,
    fontSize: 13,
    fontFace: FB,
    color: C.accent,
    bold: true,
    charSpacing: 3,
    margin: 0,
  });
  s.addText("不用向量库，检索照样准——而且更省、更透明", {
    x: 0.6,
    y: 0.55,
    w: 12,
    h: 0.5,
    fontSize: 22,
    fontFace: FH,
    color: C.ink,
    bold: true,
    margin: 0,
  });

  // 左：对比表
  s.addText("vs. 传统向量 RAG", {
    x: 0.6,
    y: 1.5,
    w: 6,
    h: 0.4,
    fontSize: 15,
    fontFace: FB,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  const cmp = [
    ["维度", "向量 RAG", "yuulibrary"],
    ["索引成本", "需 embedding API", "构建期零 LLM"],
    ["部署", "需向量数据库", "纯静态文件"],
    ["可解释性", "黑盒相似度", "倒排表 + BM25F"],
    ["隐私", "文档上传云端", "BYOK 本地浏览器"],
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
            ? { fill: { color: "ECFDF5" }, color: C.ink, bold: true, fontSize: 11, fontFace: FB }
            : { color: C.slate, fontSize: 11, fontFace: FB },
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

  // 右：4 个技术点
  s.addText("核心实现", {
    x: 7.2,
    y: 1.5,
    w: 5.5,
    h: 0.4,
    fontSize: 15,
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
      y: y,
      w: 5,
      h: 0.35,
      fontSize: 13.5,
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
      fontSize: 11.5,
      fontFace: FB,
      color: C.slate,
      margin: 0,
    });
  });
}

// ════════════════════════════════════════════════════════
// Slide 5 — Demo & 数据：实证有效
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.midnight };

  // 左侧色带
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
    y: 0.7,
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
    y: 1.1,
    w: 11,
    h: 0.7,
    fontSize: 26,
    fontFace: FH,
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });

  // 4 个大数字
  const stats = [
    { n: "0.86", l: "总体 Recall@10", s: "148 题 golden benchmark" },
    { n: "7/7", l: "无答案检测准确", s: "不会对没收录的内容硬答" },
    { n: "82篇", l: "已入库文档", s: "书/论文/笔记，含正文检索" },
    { n: "0元", l: "索引构建成本", s: "无向量库，零 LLM 调用" },
  ];
  stats.forEach((st, i) => {
    const x = 0.9 + i * 3.0;
    s.addText(st.n, {
      x,
      y: 2.3,
      w: 2.8,
      h: 1.0,
      fontSize: 52,
      fontFace: "Arial Black",
      color: C.accent,
      bold: true,
      margin: 0,
    });
    s.addText(st.l, {
      x,
      y: 3.35,
      w: 2.8,
      h: 0.4,
      fontSize: 14,
      fontFace: FB,
      color: "FFFFFF",
      bold: true,
      margin: 0,
    });
    s.addText(st.s, {
      x,
      y: 3.75,
      w: 2.8,
      h: 0.5,
      fontSize: 10.5,
      fontFace: FB,
      color: C.mist,
      margin: 0,
    });
  });

  // 分隔线
  s.addShape(pres.shapes.LINE, {
    x: 0.9,
    y: 4.7,
    w: 11.5,
    h: 0,
    line: { color: C.teal, width: 0.75 },
  });

  // Demo 路径
  s.addText("Demo 路径", {
    x: 0.9,
    y: 4.9,
    w: 5,
    h: 0.4,
    fontSize: 14,
    fontFace: FB,
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText(
    [
      { text: "① 打开 ", options: { color: "FFFFFF" } },
      { text: "uynajgi.github.io/yuulibrary", options: { color: C.accent, bold: true } },
      { text: "\n② 右下角点击 AI 问答按钮，填入自己的 LLM API Key", options: { color: C.mist } },
      {
        text: "\n③ 直接提问，如「Kubo 公式的证明」「双精度算术精度损失」",
        options: { color: C.mist },
      },
    ],
    { x: 0.9, y: 5.35, w: 7, h: 1.4, fontSize: 12, fontFace: FB, margin: 0, paraSpaceAfter: 3 }
  );

  // 右下角适用边界
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.5,
    y: 4.9,
    w: 4,
    h: 2.0,
    fill: { color: C.navy },
    line: { type: "none" },
  });
  s.addText("适用场景", {
    x: 8.7,
    y: 5.0,
    w: 3.6,
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
      { text: "· 隐私敏感、不愿上云\n", options: { color: "FFFFFF", breakLine: true } },
      { text: "· 低成本静态部署", options: { color: "FFFFFF" } },
    ],
    { x: 8.7, y: 5.4, w: 3.6, h: 1.4, fontSize: 11, fontFace: FB, margin: 0, paraSpaceAfter: 2 }
  );
}

// ── 写出 ────────────────────────────────────────────────
const outDir = __dirname;
const outFile = path.join(outDir, "yuulibrary-比赛展示.pptx");
pres.writeFile({ fileName: outFile }).then(() => {
  console.log("OK ->", outFile);
});
