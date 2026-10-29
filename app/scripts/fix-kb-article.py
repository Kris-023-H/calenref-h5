#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""修复知库文章点击：文章页读取 articleId 参数；各入口带上 id；PWA 改 autoUpdate。"""
import io, os, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAIRS = [
    # ---- article-screen：读取 articleId，相关文章用 replace 切篇 ----
    ('src/screens/article-screen.tsx',
     "import { useNav } from './types';",
     "import { useNav, useNavParams } from './types';"),
    ('src/screens/article-screen.tsx',
     "  const { pop, push } = useNav();\n  const a = KB_ARTICLES[0];",
     "  const { pop, push, replace } = useNav();\n  const params = useNavParams('article');\n  const articleId = params?.articleId;\n  const a = (articleId ? KB_ARTICLES.find((x) => String(x.id) === articleId) : undefined) ?? KB_ARTICLES[0];"),
    ('src/screens/article-screen.tsx',
     "onClick={() => push('article')}>",
     "onClick={() => replace('article', { articleId: String(x.id) })}>"),

    # ---- kb-screen：主推 + 列表都带 id ----
    ('src/screens/kb-screen.tsx',
     '<div className="feat" role="button" tabIndex={0} onClick={() => push(\'article\')}>',
     '<div className="feat" role="button" tabIndex={0} onClick={() => push(\'article\', { articleId: String(feat.id) })}>'),
    ('src/screens/kb-screen.tsx',
     '<div key={a.id} className="ai" role="button" tabIndex={0} onClick={() => push(\'article\')}>',
     '<div key={a.id} className="ai" role="button" tabIndex={0} onClick={() => push(\'article\', { articleId: String(a.id) })}>'),

    # ---- home-screen：首页文章卡带 id ----
    ('src/screens/home-screen.tsx',
     '<div className="mini-art" role="button" tabIndex={0} onClick={() => push(\'article\')}>',
     '<div className="mini-art" role="button" tabIndex={0} onClick={() => push(\'article\', { articleId: String(article.id) })}>'),

    # ---- PWA：prompt → autoUpdate（新版本自动接管，避免用户卡在旧缓存）----
    ('vite.config.ts', "registerType: 'prompt',", "registerType: 'autoUpdate',"),
]

total = 0
miss = 0
for rel, old, new in PAIRS:
    path = os.path.join(ROOT, rel)
    s = io.open(path, encoding='utf-8').read()
    n = s.count(old)
    if n == 0:
        print(f'MISS  {rel}  ::  {old[:50]}')
        miss += 1
        continue
    s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8', newline='').write(s)
    total += n
    print(f'ok {n:>2}  {rel}  ::  {old[:44]}')

print(f'\n替换 {total} 处，未命中 {miss} 条')
