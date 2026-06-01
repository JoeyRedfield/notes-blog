---
tags: [AI, 工具, 文档转换]
category: tech
status: done
created: 2026-06-01
source: https://github.com/microsoft/markitdown
---

# MarkItDown：文档转 Markdown 工具

微软开源的 Python 工具，将各种文件格式转换为 Markdown，专为 LLM 文本分析管线设计。

## 适用场景

将 Word、PDF、PPT 等办公文档转为 Markdown，方便 [[../提示词/README|LLM]] 阅读和 [[../index|知识库]] 摄入。

## 安装

```bash
# 用 uv 安装（推荐，自动隔离环境 + Python 3.12）
uv tool install "markitdown[all] @ git+https://github.com/microsoft/markitdown.git#subdirectory=packages/markitdown"

# 安装后 markitdown 命令全局可用
markitdown --help
```

> 当前环境已通过 uv 安装 markitdown 0.1.6，包含全部可选依赖（pdf, docx, pptx, xlsx, audio 等），Python 3.12 环境。

## 命令行用法

```bash
# 基本转换
markitdown document.docx -o output.md

# 管道模式
cat document.pdf | markitdown > output.md
```

## Python API

```python
from markitdown import MarkItDown

md = MarkItDown()
result = md.convert("document.pdf")
print(result.text_content)
```

## 支持格式

| 格式 | 说明 |
|------|------|
| PDF | 文本提取 |
| Word (.docx) | 保留标题、列表、表格 |
| PowerPoint (.pptx) | 幻灯片转 Markdown |
| Excel (.xlsx/.xls) | 表格数据 |
| 图片 | EXIF 元数据 + OCR（需 LLM） |
| 音频 | 语音转录 |
| HTML | 网页转 Markdown |
| EPUB | 电子书 |
| ZIP | 遍历压缩包内容 |
| YouTube | 字幕提取 |

## OCR 插件（图片文字提取）

```bash
pip install markitdown-ocr openai
```

```python
from markitdown import MarkItDown
from openai import OpenAI

md = MarkItDown(
    enable_plugins=True,
    llm_client=OpenAI(),
    llm_model="gpt-4o",
)
result = md.convert("scanned_document.pdf")
```

## 知识库工作流中的用法

```
┌──────────┐     ┌────────────┐     ┌──────────┐
│ Word/PDF │ ──→ │ MarkItDown │ ──→ │  raw/*.md│ ──→ LLM Ingest
└──────────┘     └────────────┘     └──────────┘
```

1. 将 Word/PDF 文档放到某个临时位置
2. 运行 `markitdown doc.docx -o raw/doc.md`
3. 在此会话中说"处理 raw/doc.md"，我会按照 [[../CLAUDE|Ingest 流程]] 提取知识并写入 wiki

## 安全注意

- 不要在不可信输入上运行——MarkItDown 以当前进程权限执行 I/O
- 使用最窄的 API：`convert_local()` 仅处理本地文件，`convert_stream()` 用于流式输入

## 相关笔记

- [[Claude Code 切换 API、Resume 与缓存命中学习笔记]] — LLM API 使用实践
- [[../提示词/文件上传与工具选择提示词/ChatGPT与Codex文件上传决策手册|文件上传决策手册]] — 何时上传文件给 LLM
