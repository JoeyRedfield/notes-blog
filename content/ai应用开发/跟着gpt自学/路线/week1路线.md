---
type: learning-route
domain: ai-application-development
phase: week1
topic: weekly-plan
source: manual
status: active
privacy: normal
updated: 2026-05-21
---

下面只执行**第 1 周**，目标很明确：

- 你要先把 **“Python 调模型”** 这件事亲手跑通
    
- 本周只做两类最小脚本：
    
    1. `chat_cli.py`：命令行聊天
        
    2. `extract_json.py`：把自然语言抽成 JSON
        
- 默认使用**通义千问的 OpenAI 兼容接口**。阿里云百炼官方文档给出了直接使用 `openai` Python SDK、配置 `DASHSCOPE_API_KEY` 和 `base_url` 的方式；同一套思路后面也能较容易切到智谱，因为智谱官方也提供 OpenAI-compatible 接口。([阿里云帮助中心](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions "OpenAI Chat API 参考-大模型服务平台百炼(Model Studio)-阿里云帮助中心"))
    

---

# 第 1 周的 7 天详细安排

## Day 1：把第一个 LLM Python 脚本跑起来

**学什么**

- Python 调用大模型 API 的基本结构
    
- `messages` 是什么
    
- `system` / `user` 的区别
    
- `.env` 和 API Key 管理
    

**做什么**

- 安装依赖
    
- 配置 `.env`
    
- 跑通 `chat_cli.py`
    
- 能进行至少 3 轮问答
    

**今天产出**

- 一个能运行的 `chat_cli.py`
    

---

## Day 2：看懂聊天脚本的每一行

**学什么**

- `OpenAI(...)` 客户端初始化
    
- `client.chat.completions.create(...)`
    
- 为什么返回里要取 `choices[0].message.content`
    
- 基本异常处理：API Key 缺失、网络异常、空输入
    

**做什么**

- 自己给 `chat_cli.py` 加两个小功能：
    
    1. `quit/exit` 退出
        
    2. 打印当前使用的模型名
        

**今天产出**

- 你能不看答案，自己说清楚脚本从“输入问题”到“输出答案”的流程
    

---

## Day 3：Prompt 基础

**学什么**

- 什么是好 Prompt
    
- 什么时候用 `system prompt`
    
- 如何让输出更稳定
    
- few-shot 的最小概念
    

**做什么**

- 改 3 版 `system prompt`
    
- 分别测试：
    
    1. 普通助手
        
    2. Python 助教
        
    3. JSON 提取助手
        

**今天产出**

- 一份你的 `prompt_notes.md`
    
- 记录每版 prompt 的效果差异
    

---

## Day 4：结构化输出入门

**学什么**

- 为什么“能聊天”不等于“能做应用”
    
- JSON 输出的重要性
    
- 字段设计：`task_name`、`deadline`、`priority`
    
- 如何把自然语言约束成结构化结果
    

**做什么**

- 跑通 `extract_json.py`
    
- 输入 5 条不同风格的中文文本，观察 JSON 是否稳定
    

**今天产出**

- 一个能运行的 `extract_json.py`
    

阿里云百炼的 OpenAI 兼容 Chat API 支持 `response_format={"type":"json_object"}`，并且官方文档明确写了：如果你要求 `json_object`，提示词里还需要明确要求模型输出 JSON，否则可能报错。([阿里云帮助中心](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions "OpenAI Chat API 参考-大模型服务平台百炼(Model Studio)-阿里云帮助中心"))

---

## Day 5：调试与报错处理

**学什么**

- 常见报错怎么看
    
- 什么是“代码问题”，什么是“Prompt 问题”
    
- 如何打印中间信息辅助调试
    

**做什么**

- 给两个脚本都加上：
    
    - API Key 缺失提示
        
    - 空输入校验
        
    - 请求失败时的友好报错
        
- 故意制造一次错误，再修复
    

**今天产出**

- 两个“更抗报错”的版本
    

---

## Day 6：代码整理与复用

**学什么**

- 为什么要抽函数
    
- 什么是“配置”和“业务逻辑”分离
    
- 初学者最小项目目录怎么组织
    

**做什么**

- 新建目录结构：
    
    ```text
    week1/
    ├── .env
    ├── chat_cli.py
    ├── extract_json.py
    ├── README.md
    └── notes.md
    ```
    
- 给两个脚本都加注释
    
- 自己试着把“读取环境变量”提成一个函数
    

**今天产出**

- 一个更整洁的第 1 周小项目目录
    

---

## Day 7：复盘 + 小测验

**学什么**

- 回顾这一周的关键概念
    
- 能不能脱离答案自己写一个最小 API 调用脚本
    

**做什么**

- 回答这 5 个问题：
    
    1. `system` 和 `user` 消息有什么区别？
        
    2. 为什么 API Key 不该写死在代码里？
        
    3. `response_format={"type":"json_object"}` 是干什么的？
        
    4. 为什么 JSON 提取比自由文本更适合做应用？
        
    5. 如果以后换成智谱，代码大概要改哪几个地方？
        

**今天产出**

- 一份一页纸复盘
    
- 你自己的“第 1 周总结”
    

---

# 今天就能开始的第 1 天任务清单

按这个顺序做就行：

## 1）准备 Python 环境

终端里先确认：

```bash
python --version
```

如果你平时是 `python3`，那后面的命令也用 `python3`。

---

## 2）新建项目目录

```bash
mkdir week1_ai_app
cd week1_ai_app
```

---

## 3）安装依赖

阿里云百炼官方示例使用的是 `openai` Python SDK；如果你想在本地通过 `.env` 自动加载密钥，再加一个 `python-dotenv` 即可。`python-dotenv` 官方说明里给出了 `pip install python-dotenv` 和 `load_dotenv()` 的用法。([阿里云帮助中心](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions "OpenAI Chat API 参考-大模型服务平台百炼(Model Studio)-阿里云帮助中心"))

```bash
python -m pip install openai python-dotenv
```

---

## 4）创建 `.env`

新建一个 `.env` 文件，内容先写成这样：

```env
DASHSCOPE_API_KEY=你的通义千问API_KEY
BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-turbo
```

阿里云百炼官方文档给出的中国内地 OpenAI-compatible `base_url` 是 `https://dashscope.aliyuncs.com/compatible-mode/v1`，官方 Python 示例也是从环境变量 `DASHSCOPE_API_KEY` 读取 API Key。支持的模型列表里包含 `qwen-turbo` 和 `qwen-plus`。([阿里云帮助中心](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions "OpenAI Chat API 参考-大模型服务平台百炼(Model Studio)-阿里云帮助中心"))

---

## 5）创建并运行 `chat_cli.py`

把我后面给你的完整代码保存成 `chat_cli.py`，然后运行：

```bash
python chat_cli.py
```

测试输入：

- 你好
    
- 用 3 句话解释什么是 API
    
- 给我一个 Python for 循环例子
    

---

## 6）创建并运行 `extract_json.py`

把后面的代码保存成 `extract_json.py`，然后运行：

```bash
python extract_json.py
```

测试输入：

- 明天下午 3 点前完成简历修改，优先级高
    
- 这周末整理项目 README，优先级中
    
- 找 3 个后端岗位投递，尽快完成
    

---

## 7）记录今天的问题

把你遇到的问题写到一个 `notes.md` 里，格式可以是：

```md
# Day 1 问题记录

1. 哪一步报错了？
2. 报错原文是什么？
3. 我猜原因是什么？
4. 最后怎么解决的？
```

---

# 先解释代码结构

---

## 一、`chat_cli.py` 的结构

这个脚本只做 5 件事：

### 1. 加载环境变量

用 `load_dotenv()` 读取 `.env`，这样 API Key 不用写死在代码里。`python-dotenv` 官方文档说明它会把 `.env` 里的键值对加载进 `os.environ`。([PyPI](https://pypi.org/project/python-dotenv/?utm_source=chatgpt.com "python-dotenv"))

### 2. 创建客户端

这里用 `OpenAI(...)`，但其实连的是**通义千问的 OpenAI-compatible 接口**，所以要传：

- `api_key=os.getenv("DASHSCOPE_API_KEY")`
    
- `base_url=os.getenv("BASE_URL")`
    

这正是阿里云百炼官方示例的调用方式。([阿里云帮助中心](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions "OpenAI Chat API 参考-大模型服务平台百炼(Model Studio)-阿里云帮助中心"))

### 3. 保存对话历史

用一个 `messages` 列表保存上下文：

- 第一条通常是 `system`
    
- 后面不断追加用户输入和模型回复
    

### 4. 发起请求

核心调用是：

```python
client.chat.completions.create(...)
```

阿里云百炼官方示例就是这个接口。([阿里云帮助中心](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions "OpenAI Chat API 参考-大模型服务平台百炼(Model Studio)-阿里云帮助中心"))

### 5. 打印回复并继续循环

把模型回复追加回 `messages`，就能做多轮对话。

---

## 二、`extract_json.py` 的结构

这个脚本也只做 5 件事：

### 1. 加载环境变量

和前一个脚本一样。

### 2. 创建客户端

也是同一个 OpenAI-compatible 客户端。

### 3. 写一个“提取 JSON”的 system prompt

明确告诉模型：

- 你要做信息抽取
    
- 你只能返回 JSON
    
- 字段有哪些
    

### 4. 指定 `response_format={"type":"json_object"}`

阿里云百炼官方文档说明，这个参数可以让返回内容变成标准 JSON 字符串。([阿里云帮助中心](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions "OpenAI Chat API 参考-大模型服务平台百炼(Model Studio)-阿里云帮助中心"))

### 5. 用 `json.loads()` 解析结果

拿到字符串后转成 Python 字典，再美化打印。

---

# 完整代码：`chat_cli.py`

```python
import os
from openai import OpenAI
from dotenv import load_dotenv


def load_config():
    """加载 .env 配置并返回必要参数"""
    load_dotenv()

    api_key = os.getenv("DASHSCOPE_API_KEY")
    base_url = os.getenv("BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    model_name = os.getenv("MODEL_NAME", "qwen-turbo")

    if not api_key:
        raise ValueError("缺少 DASHSCOPE_API_KEY，请先在 .env 中配置。")

    return api_key, base_url, model_name


def create_client(api_key, base_url):
    """创建 OpenAI 兼容客户端"""
    client = OpenAI(
        api_key=api_key,
        base_url=base_url,
    )
    return client


def main():
    try:
        api_key, base_url, model_name = load_config()
        client = create_client(api_key, base_url)
    except Exception as e:
        print(f"初始化失败：{e}")
        return

    print("欢迎使用 chat_cli！")
    print(f"当前模型：{model_name}")
    print("输入 quit 或 exit 退出。\n")

    messages = [
        {
            "role": "system",
            "content": "你是一个友好的 AI 学习助教，请用清晰、简洁、适合初学者的方式回答问题。"
        }
    ]

    while True:
        try:
            user_input = input("你：").strip()

            if not user_input:
                print("请输入内容，不要直接回车。\n")
                continue

            if user_input.lower() in ["quit", "exit"]:
                print("已退出。")
                break

            messages.append({"role": "user", "content": user_input})

            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7,
            )

            assistant_text = response.choices[0].message.content
            print(f"AI：{assistant_text}\n")

            messages.append({"role": "assistant", "content": assistant_text})

        except KeyboardInterrupt:
            print("\n你手动中断了程序。")
            break
        except Exception as e:
            print(f"请求失败：{e}\n")


if __name__ == "__main__":
    main()
```

---

# 完整代码：`extract_json.py`

```python
import os
import json
from openai import OpenAI
from dotenv import load_dotenv


def load_config():
    """加载 .env 配置并返回必要参数"""
    load_dotenv()

    api_key = os.getenv("DASHSCOPE_API_KEY")
    base_url = os.getenv("BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    model_name = os.getenv("MODEL_NAME", "qwen-turbo")

    if not api_key:
        raise ValueError("缺少 DASHSCOPE_API_KEY，请先在 .env 中配置。")

    return api_key, base_url, model_name


def create_client(api_key, base_url):
    """创建 OpenAI 兼容客户端"""
    return OpenAI(
        api_key=api_key,
        base_url=base_url,
    )


def extract_task_info(client, model_name, text):
    """
    把自然语言任务描述提取成 JSON
    """
    system_prompt = """
你是一个信息抽取助手。
请从用户输入中提取任务信息，并严格按照 JSON 格式输出。
不要输出解释，不要输出 Markdown，不要输出代码块，只输出 JSON。

字段要求：
- task_name: 字符串，任务名称
- deadline: 字符串，如果没有明确时间就写空字符串
- priority: 字符串，只能是 高 / 中 / 低，如果无法判断默认填 中
"""

    user_prompt = f"请把下面这段话提取为 JSON：\n{text}"

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    return json.loads(content)


def main():
    try:
        api_key, base_url, model_name = load_config()
        client = create_client(api_key, base_url)
    except Exception as e:
        print(f"初始化失败：{e}")
        return

    print("欢迎使用 extract_json！")
    print("输入一句任务描述，我来帮你抽取成 JSON。")
    print("输入 quit 或 exit 退出。\n")

    while True:
        try:
            text = input("请输入：").strip()

            if not text:
                print("请输入内容，不要直接回车。\n")
                continue

            if text.lower() in ["quit", "exit"]:
                print("已退出。")
                break

            result = extract_task_info(client, model_name, text)

            print("提取结果：")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            print()

        except KeyboardInterrupt:
            print("\n你手动中断了程序。")
            break
        except json.JSONDecodeError:
            print("模型返回的不是合法 JSON，请重试。\n")
        except Exception as e:
            print(f"请求失败：{e}\n")


if __name__ == "__main__":
    main()
```

---

# `.env` 应该怎么写

```env
DASHSCOPE_API_KEY=你的通义千问API_KEY
BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-turbo
```

说明：

- `DASHSCOPE_API_KEY`：通义千问 API Key
    
- `BASE_URL`：通义千问 OpenAI-compatible 入口
    
- `MODEL_NAME`：你先用 `qwen-turbo` 就行；如果后面你觉得回答或 JSON 稳定性不够，可以切成 `qwen-plus`
    

阿里云百炼官方文档给出的 Python 示例就是 `OpenAI(api_key=os.getenv("DASHSCOPE_API_KEY"), base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")`，并且支持包括 `qwen-turbo`、`qwen-plus` 在内的模型。([阿里云帮助中心](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions "OpenAI Chat API 参考-大模型服务平台百炼(Model Studio)-阿里云帮助中心"))

---

# 运行方法

## 运行聊天脚本

```bash
python chat_cli.py
```

## 运行 JSON 提取脚本

```bash
python extract_json.py
```

---

# 你今天先不要纠结的点

## 必学

- 能看懂 `messages`
    
- 能成功拿到 `response.choices[0].message.content`
    
- 能把 `.env` 配好
    
- 能跑通两个脚本
    

## 可后学

- 流式输出 `stream=True`
    
- 多轮会话裁剪
    
- 更复杂的 prompt 模板
    
- 更严格的 JSON schema
    

## 暂时不用学

- LangChain
    
- LangGraph
    
- Agent
    
- RAG
    
- 向量数据库
    

---

# 如果以后想切到智谱，大概改哪里

因为智谱官方也提供 OpenAI-compatible 接口，所以你的代码结构基本可以不变，主要改这几项：

- API Key
    
- `base_url`
    
- `model_name`
    

这个判断来自智谱官方的 OpenAI API 兼容文档。([智谱AI开放文档](https://docs.bigmodel.cn/cn/guide/develop/openai/introduction?utm_source=chatgpt.com "OpenAI API 兼容- 智谱AI开放文档"))

---

# 你现在立刻该做的事

1. 建目录
    
2. 安装依赖
    
3. 写 `.env`
    
4. 复制 `chat_cli.py` 跑起来
    
5. 再复制 `extract_json.py` 跑起来
    
6. 把报错贴给我，我再按“先定位原因，再给完整修改代码”的方式带你改
    

下一步最适合继续的是：**我带你做 Day 1 实操验收**。
