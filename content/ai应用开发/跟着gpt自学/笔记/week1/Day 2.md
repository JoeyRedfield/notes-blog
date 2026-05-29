---
type: learning-note
domain: ai-application-development
phase: week1
day: 2
topic: cli-and-env
source: manual
status: active
privacy: normal
updated: 2026-05-21
---


# Day 2
## 学习目标
今天结束后，你要能自己不看代码说清楚`chat_cli.py`：
1. 程序从哪里开始执行
	1. `main()`函数
2. `.env` 是怎么被读取的
	1. load_dotenv()函数读取环境变量
	2. <font color="#ff0000">`load_dotenv()`会把`.env`文件中的配置加载到环境变量里, 然后再通过`os.getenv()`把具体的值读出来</font>。
3. 客户端是怎么创建的
	1. `create_client()`函数输入api key和url
	2. <font color="#ff0000">`create_client(api_key, base_url)`内部调用`OpenAI(...)`, 用`api_key`和`base_url`创建一个客户端对象`client`，后续所有模型请求都通过这个`client`发出去</font>。
4. `messages` 为什么能支持多轮
	1. 因为程序用`while True`循环将每次用户的输入和大模型的回答追加到messages，所以支持多轮。
	2. `while True` 负责一轮一轮运行，  `messages.append(...)` 负责把每轮上下文保存下来。  真正让模型“看到历史”的关键是 **messages 被持续传给 API**。
5. 模型回复是怎么取出来的
	1. `response.choices[0].message.content`
6. 为什么要加异常处理
	1. 因为要确保客户端创建成功，如果有异常就需要及时处理。
	2. <font color="#ff0000">异常处理是为了让程序在出错时不要直接崩掉，而是给出清晰提示，方便排查和继续使用</font>。

## 练习
1. 显示当前轮数
	1. 目标：每次提问时，显示这是第几轮对话。
2. 新增 `clear` 命令，清空历史对话
	1. 目标：  当你输入 `clear` 时，聊天历史清空，但保留 system prompt。

```python
print("输入 quit 或 exit 退出。\n")

print("输入 clear 清空历史记录。\n")

  

system_message = {

"role": "system",

"content": "你是一个友好的 AI 学习助教，请用清晰、简洁、适合初学者的方式回答问题。"

}

  

messages = [system_message]

  

# messages = [

# {

# "role": "system",

# "content": "你是一个友好的 AI 学习助教，请用清晰、简洁、适合初学者的方式回答问题。"

# }

# ]

  

round_num = 1

while True:

try:

print(f"第 {round_num} 轮对话：")

user_input = input("你：").strip()

  

if not user_input:

print("请输入内容，不要直接回车。\n")

continue

  

if user_input.lower() in ["quit", "exit"]:

print("已退出。")

break

  

if user_input.lower() == "clear":

messages = [system_message] # 保留系统提示

round_num = 1

print("历史记录已清空。\n")

continue

  

messages.append({"role": "user", "content": user_input})

  

print("正在请求模型，请稍候...")

response = client.chat.completions.create(

model=model_name,

messages=messages,

temperature=0.7,

)

  

assistant_text = response.choices[0].message.content

print(f"AI：{assistant_text}\n")

  

messages.append({"role": "assistant", "content": assistant_text})

round_num += 1
```
