---
type: learning-note
domain: ai-application-development
phase: week1
day: 1
topic: api-basics
source: manual
status: active
privacy: normal
updated: 2026-05-21
---


# Day 1
- 能看懂 `messages`
- 能成功拿到 `response.choices[0].message.content`
- 能把 `.env` 配好
- 能跑通两个脚本

## 知识点

- 模型输出是“有理解能力的”，不是“绝对规则引擎”
- AI 应用开发里非常核心的一件事：不是“让模型会回答”，而是“让系统输出可控”。

## 问题

1. `chat_cli.py` 里，`messages` 为什么要用列表保存，而不是每次只发当前这一句？
	- 因为我们要在`messages`设定system级别提示词，这是需要重复利用的，~~而user级别提示词是需要大模型基于system提示词去回答的~~。
	- <font color="#ff0000"> messages用列表保存，是为了把 system 提示词和多轮对话历史一起发给模型，让模型在当前回答时拥有上下文，而不是只看到这一句。</font>跟后续学习memory有关，本质就是管理上下文。
2. 为什么 `.env` 比把 API Key 直接写进代码里更好？
	- API Key属于常量，用`.env`保存更方便修改和测试。
	- <font color="#ff0000">`.env` 的主要好处是把敏感信息和配置从代码里分离出来，更安全，也更方便切换不同环境和模型</font>。
3. `extract_json.py` 里，为什么我们要加：`response_format={"type": "json_object"}`
	- 因为我们要把数据提取成JSON格式，所以回答格式我们要设置成json_object.
	- <font color="#ff0000">提高模型输出 JSON 的稳定性，减少返回普通文本、解释说明、Markdown 代码块等不规范格式的概率</font>。`response_format`用于约束模型输出格式，`json.loads()`解析字符串为Python对象。
4. 为什么第三条“尽快完成”会被抽成 `"priority": "高"`？
	- 因为大模型学习人类语料中，“尽快完成”跟“优先级高”关联度较高。
	- <font color="#ff0000">因为我们在 prompt 里规定了 `priority` 只能是“高 / 中 / 低”，而“尽快完成”在中文语义里通常表示较强紧迫性，所以模型把它归类为“高”</font>。如果没有prompt的字段约束，就可能会输出`紧急、尽快、高优先级`等。

## 改动

### 给chat_cli.py增加调试输出
```python
messages.append({"role": "user", "content": user_input})
print("正在请求模型，请稍候...")
response = client.chat.completions.create(
model=model_name,
messages=messages,
temperature=0.7,
)
assistant_text = response.choices[0].message.content
print(f"AI：{assistant_text}\n")

输出：
(.venv) wuzhuoyi@redfieldMac-mini ai-app-dev % python chat_cli.py    
欢迎使用 chat_cli！
当前模型：qwen3.6-plus-2026-04-02
输入 quit 或 exit 退出。

你：你好
正在请求模型，请稍候...
AI：你好！我是你的 AI 学习助教，很高兴为你提供帮助。无论是想学新知识、解答疑问，还是制定学习计划，我都可以陪你一步步来。今天有什么想学的，或者需要我帮忙的地方吗？

你：exit
已退出。
```
这个位置很合适，因为它刚好把程序流程分成了：
1. 接收用户输入
2. 发请求
3. 返回结果

### 给 `extract_json.py` 打印原始返回字符串
```python
content = response.choices[0].message.content

print("模型原始返回：")

print(content)
return json.loads(content)

输出：
(.venv) wuzhuoyi@redfieldMac-mini ai-app-dev % python extract_json.py
欢迎使用 extract_json！
输入一句任务描述，我来帮你抽取成 JSON。
输入 quit 或 exit 退出。

请输入：找 3 个后端岗位投递，尽快完成
模型原始返回：
{"task_name": "找 3 个后端岗位投递", "deadline": "", "priority": "高"}
提取结果：
{
  "task_name": "找 3 个后端岗位投递",
  "deadline": "",
  "priority": "高"
}
```
这个练习也很好，而且你输出结果说明你已经看到：
- 模型原始返回其实是字符串
- Python 再把它变成字典
- 最后 `json.dumps(..., indent=2)` 再美化输出
你现在已经开始把这三个阶段区分开了：
1. **模型生成**
2. **程序解析**
3. **程序展示**
这对后面做 Tools / function calling 特别重要。


## 运行`chat_cli.py`的运行情况



```

(.venv) wuzhuoyi@redfieldMac-mini ai-app-dev % python chat_cli.py

欢迎使用 chat_cli！

当前模型：qwen3.6-plus-2026-04-02

输入 quit 或 exit 退出。


你：你好

AI：你好！很高兴为你提供帮助。我是你的 AI 学习助教，擅长把复杂的知识讲得简单易懂。无论是制定学习计划、梳理知识点，还是解答作业难题，都可以随时告诉我。


你今天想学什么内容，或者有什么具体问题需要帮忙吗？随时告诉我，我们一起一步步解决！😊

你：用 3 句话解释什么是 API

AI：API（应用程序编程接口）就像软件之间的“传话员”，负责让不同的程序能够安全、规范地互相沟通。比如你在外卖App点餐时，App就是通过API把订单发给餐厅系统，并把菜单和配送状态实时传回你的手机。有了它，开发者就能直接调用别人已经写好的功能或数据，不用从零开始，从而大大加快软件的开发速度。

  

你：给我一个 Python for 循环例子

AI：这是一个最基础、最直观的 Python `for` 循环例子：

```python

fruits = ["苹果", "香蕉", "橙子"]

  

for fruit in fruits:

print(f"我喜欢吃{fruit}")
```

```
**它是怎么工作的？**

`for` 循环会依次从列表 `fruits` 中取出一个元素，暂时存到变量 `fruit` 里，然后执行缩进部分的代码。运行后会逐行打印三句话。

`for` 循环非常适合用来“重复处理一组数据”，掌握它之后，你可以轻松遍历数字、字符串、字典等各种集合。如果想看带 `range()` 或嵌套循环的例子，随时告诉我！ 😊

你：exit

已退出。
```

## 运行`extract_json.py`的情况
```



  

(.venv) wuzhuoyi@redfieldMac-mini ai-app-dev % python extract_json.py

欢迎使用 extract_json！

输入一句任务描述，我来帮你抽取成 JSON。

输入 quit 或 exit 退出。

  

请输入：明天下午 3 点前完成简历修改，优先级高

提取结果：

{

"task_name": "简历修改",

"deadline": "明天下午 3 点前",

"priority": "高"

}

  

请输入：这周末整理项目 README，优先级中

提取结果：

{

"task_name": "整理项目 README",

"deadline": "这周末",

"priority": "中"

}

  

请输入：找 3 个后端岗位投递，尽快完成

提取结果：

{

"task_name": "找3个后端岗位投递",

"deadline": "",

"priority": "高"

}

  

请输入：exit

已退出。

  
```

