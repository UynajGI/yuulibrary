# 贡献指南

欢迎 issue 和 PR。

## 开发流程

1. **Fork 并 clone**(带子模块):
   ```bash
   git clone --recurse-submodules https://github.com/<你的用户名>/yuulibrary.git
   ```

2. **建分支**:
   ```bash
   git checkout -b fix/your-fix       # 或 feat/your-feature
   ```

3. **安装 git hooks**(强烈推荐):
   ```bash
   lefthook install
   ```
   之后每次 commit / push 会自动跑质量校验(详见 [docs/architecture.md#质量校验体系](docs/architecture.md#质量校验体系))。

4. **本地验证**:
   ```bash
   hugo server                        # 本地预览
   python3 .claude/skills/add-book-to-library/scripts/validate_book.py content/    # 36 项校验
   python3 .claude/skills/add-book-to-library/scripts/test_translate.py            # 翻译回归测试
   ```

5. **提交 PR**:确保 lefthook 全过(尤其 `[E]` 级错误会阻断 commit)。

## Commit 风格

使用 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <描述>

type 可选:feat / fix / docs / style / refactor / perf / test / chore
```

示例:
- `feat: 加馆藏统计 shortcode`
- `fix: 翻译脚本附录 bug(三元组解包)`
- `docs: 同步 tag 触发 CI 文档`

## lefthook 会跑什么

**pre-commit**(顺序执行,任一失败阻断):

| Hook | 检查 |
|------|------|
| trailing-whitespace | 行末空格 |
| prettier | 格式化(JS/CSS/Markdown) |
| eslint | JS 静态检查 |
| css-check | CSS 合法性 |
| hugo-build-check | `hugo --gc --minify` 能过 |
| pageindex-build | PageIndex 增量构建 |
| markdownlint | 9 条 Markdown 规则 |
| image-refs | 图片引用存在 |
| front-matter | YAML front matter 合法 |
| book-validate | 书籍 36 项验证 |
| paper-validate | 论文 36 项验证 |
| latex-render | LaTeX 渲染坑(裸 `\|` / `$$` 行首 `+/-`) |

**pre-push**:

| Hook | 检查 |
|------|------|
| hugo-build | 生产构建能过 |
| html-check | 关键页面生成 + broken link |

误报标记:行末加 `<!-- validate-skip -->` 跳过单行。

## 报 issue

- **Bug**:用 bug 模板,附 Hugo 版本、复现步骤、预期 vs 实际
- **Feature request**:用 feature 模板,说清场景和动机

## 部署

CI 只在打 tag(`YYYY.MM.DD.NN`)时部署,push 到 main 不触发。详见 [docs/deployment.md](docs/deployment.md)。
