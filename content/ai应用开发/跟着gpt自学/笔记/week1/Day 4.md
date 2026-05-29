---
type: learning-note
domain: ai-application-development
phase: week1
day: 4
topic: structured-output
source: manual
status: active
privacy: normal
updated: 2026-05-21
---


今天的重点不是“再让模型返回一次 JSON”，而是理解：

> **模型能输出 JSON，不等于你的应用拿到了可靠数据。**

真正做 AI 应用时，至少要过这 3 层：

1. **模型输出层**：尽量让模型按 JSON 返回
2. **程序解析层**：把 JSON 字符串转成 Python 字典
3. **程序校验层**：检查字段是否完整、值是否合法、要不要做规范化

你昨天已经完成了前两层，今天开始补第三层。

---

# Day 4 学习主题

- 结构化输出的正确理解
- 为什么“能返回 JSON”还不够
- 如何做最基础的数据校验与规范化
- 让 `extract_json.py` 从“演示脚本”变成“更像应用原型”

---

# Day 4 学习目标

今天结束后，你要能清楚区分这几件事：

- **模型输出 JSON**：只是格式看起来像对
- **Python 解析成功**：只是说明它是合法 JSON
- **数据真正可用**：还要检查字段和值是否符合你的业务要求

你还要亲手把 `extract_json.py` 升级成一个更稳的版本。

---

# 今天先学清楚的 4 个核心概念

## 1. 结构化输出不等于业务正确

比如模型返回：

```json
{
  "task_name": "投两个岗位",
  "deadline": "今晚",
  "priority": "非常高"
}
```

这可能是合法 JSON。  
但对你的程序来说，它**不一定可用**，因为你要求 `priority` 只能是：

- 高
- 中
- 低

所以：

- **JSON 合法**
- 不代表
- **字段值合法**

---

## 2. Prompt 是第一道约束，不是最后一道保险

[[Day 3]]你已经看到，Prompt 可以影响结果。  
但就算 prompt 写得再严格，模型仍然可能：

- 多输出字段
- 漏字段
- 字段值不在允许范围内
- 做不必要的脑补

所以应用层一定要有程序校验。

---

## 3. 程序校验是“把模型输出拉回业务规则”

今天你要学会做最简单的校验：

- 如果缺字段，就补默认值
- 如果 `priority` 不合法，就兜底成 `"中"`
- 如果字段类型不对，就转成字符串
- 如果 `task_name` 为空，就提示失败

这一步很重要，因为它是你从“会调模型”走向“会做应用”的分水岭。

---

## 4. 先做最小规则，不要一上来就做复杂时间解析

今天我们不做：

- “明天下午 3 点前” → 精确转 `2026-04-08 15:00`
- “这周末” → 自动算具体日期

这些可以后学。  
今天只做：

- deadline 保留原文时间表达
- priority 保证只能是 高 / 中 / 低
- task_name 保证非空

---

# Day 4 的任务安排

## 今天你要做的 3 件事

### 任务 1：升级 system prompt

目标：让模型更少脑补、更守规则。

### 任务 2：加一个 `validate_result()` 函数

目标：就算模型输出有点飘，程序也能兜底。

### 任务 3：一次性测试 5 条输入

目标：开始形成“不是试一条能跑就算完”的习惯。

---

# 先给你今天要实现的规则

你的 `extract_json.py` 今天升级后，应该遵守这些规则：

## 字段要求

固定只保留这 3 个字段：

- `task_name`
- `deadline`
- `priority`

## 字段规则

### `task_name`

- 必须是字符串
- 不能为空
- 如果模型没提取出来，就设为 `"未识别任务"`

### `deadline`

- 必须是字符串
- 没有明确时间就设为 `""`
- 不要自己换算具体日期

### `priority`

- 必须只能是：`高 / 中 / 低`
- 如果模型输出了别的值，比如：
    - 紧急
    - 尽快
    - 高优先级
    - urgent  
        那就程序里兜底成 `"中"`

---

# 先解释升级版代码结构

今天这版脚本比昨天多 3 个函数，但仍然很适合初学者。

---

## 1）`extract_task_info()`

作用没变：

- 调模型
- 要求返回 JSON
- 用 `json.loads()` 解析

这是“模型输出层 + 程序解析层”。

---

## 2）`validate_result()`

这是今天新增的重点函数。

它负责：

- 检查是不是字典
- 补齐缺少的字段
- 把字段统一转成字符串
- 只保留 `task_name / deadline / priority`
- 校验 `priority` 是否合法
这是“程序校验层”。

---

## 3）`main()`

还是负责：

- 读输入
- 调用提取函数
- 调用校验函数
- 打印结果

---

# 升级后的完整代码：`extract_json.py`

你今天先用这版。

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
    调用模型，把自然语言任务描述提取成 JSON
    """
    system_prompt = """
你是一个信息抽取助手。
请从用户输入中提取任务信息，并严格按照 JSON 格式输出。
不要输出解释，不要输出 Markdown，不要输出代码块，只输出 JSON。
不要根据常识补充原文中没有出现的信息。

字段要求：
- task_name: 字符串，任务名称
- deadline: 字符串，如果没有明确时间就写空字符串
- priority: 字符串，只能是 高 / 中 / 低，如果无法判断默认填 中

规则要求：
1. 只输出这 3 个字段，不要增加其他字段
2. 如果原文中没有明确时间，不要猜测 deadline，直接输出空字符串
3. 如果原文中没有明确优先级，只能根据语义在 高 / 中 / 低 中选择一个最合理的值
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

    print("模型原始返回：")
    print(content)

    return json.loads(content)


def validate_result(result):
    """
    对模型返回结果做最基础的校验和兜底
    """
    if not isinstance(result, dict):
        raise ValueError("模型返回结果不是字典类型。")

    # 只取我们需要的字段
    task_name = str(result.get("task_name", "")).strip()
    deadline = str(result.get("deadline", "")).strip()
    priority = str(result.get("priority", "")).strip()

    # task_name 兜底
    if not task_name:
        task_name = "未识别任务"

    # deadline 兜底
    if not deadline:
        deadline = ""

    # priority 校验
    allowed_priorities = ["高", "中", "低"]
    if priority not in allowed_priorities:
        priority = "中"

    clean_result = {
        "task_name": task_name,
        "deadline": deadline,
        "priority": priority
    }

    return clean_result


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

            raw_result = extract_task_info(client, model_name, text)
            final_result = validate_result(raw_result)

            print("校验后的结果：")
            print(json.dumps(final_result, ensure_ascii=False, indent=2))
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

# 今天的重点不是“绝对正确”，而是“观察稳定性”

你今天测试时，重点看这 4 个问题：

1. 模型有没有多输出字段
2. 模型有没有乱猜 deadline
3. 模型对模糊优先级是否稳定
4. `validate_result()` 是否能把不规范结果兜回来

---

# Day 4 的必学 / 可后学 / 暂时不用学

## 必学

- JSON 输出只是第一步
- 程序层校验非常重要
- 字段合法性要自己控制
- 模糊语义会影响分类结果

## 可后学

- 用 `pydantic` 做更正式的 schema 校验
- 更严格的时间标准化
- 重试机制
- 批量测试脚本

## 暂时不用学

- function calling
- LangChain output parser
- 正式数据库
- 时间解析库的大规模接入

---

# 今天的作业

你做完后，把这 3 类内容贴给我：

1. 你升级后的 `extract_json.py` 关键代码
2. 5 条测试输入的结果
3. 你自己的总结：
    - 哪些结果稳定
    - 哪些结果不稳定
    - `validate_result()` 起了什么作用

---

# 我先提前给你一个判断标准

如果你今天做完后，能说出这句话，就说明 Day 4 学到了：

> “模型负责理解自然语言，但业务规则必须由程序兜底。”

你做完贴给我，我先评价，再决定要不要进 Day 5。

# 测试样例

## 测试 1

```text
明天下午 3 点前完成简历修改，优先级高
```

预期观察点：

- `deadline` 应该有值
- `priority` 应该是 `"高"`

实际：
```json
{
  "task_name": "简历修改",
  "deadline": "明天下午 3 点前",
  "priority": "高"
}
```

---

## 测试 2

```text
这周末整理项目 README，优先级中
```

预期观察点：

- `deadline` 应该是 `"这周末"` 或类似原文表达
- `priority` 应该是 `"中"`

实际：
```json
{
  "task_name": "整理项目 README",
  "deadline": "这周末",
  "priority": "中"
}
```

---

## 测试 3

```text
找 3 个后端岗位投递，尽快完成
```

预期观察点：

- `priority` 大概率仍然是 `"高"`

实际：
```json
{
  "task_name": "找 3 个后端岗位投递",
  "deadline": "",
  "priority": "高"
}
```

---

## 测试 4

```text
有空的时候整理一下 Python 笔记
```

预期观察点：

- `deadline` 应该是 `""`
- `priority` 大概率是 `"低"` 或 `"中"`

实际：
```json
{
  "task_name": "整理Python笔记",
  "deadline": "",
  "priority": "低"
}
```

---

## 测试 5

```text
记得处理一下那个事情
```

预期观察点：

- 看 `task_name` 会不会太模糊
- 看 `priority` 会不会兜底成 `"中"`

实际：
```json
{
  "task_name": "处理一下那个事情",
  "deadline": "",
  "priority": "中"
}
```

## 总结

`validate_result()` 主要提升了输出结果的格式健壮性和字段合法性，但不能保证语义一定足够准确或具体。
