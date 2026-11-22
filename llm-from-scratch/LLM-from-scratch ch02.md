---
base: "[[HenryWu’s Blog.base]]"
password: ""
icon: ""
date: 2025-12-21
type: Post
category: LLM-from-scratch
slug: llm-from-scratch-02
tags: [AI, LLM]
created: 2026-06-01
summary: 处理文本数据
status: Published
---
这一章的内容讲述了关于如何处理文本数据的内容，因为Large Language Model的地基是Transformer，所以主要是讲Transformer如何处理文本数据。

首先关于Transformer的训练包含两部分：预训练和微调。预训练是准备好大量文本数据喂给Transformer，让它通过自监督学习去找到文本单词之间的联系，而微调则是用小样本去让Transformer去针对某一特定任务去学习内容。经过微调的Transformer表现效果比通用的要好。

> **预训练学的是“语言结构本身”**
> - 词与词的统计关系
> - 语法、风格、常识模式
> 
> **微调学的是“如何使用这种语言能力”**
> 
> - 分类
> - 问答
> - 指令遵循

但是，Transformer本质上也是深度神经网络，它没法理解文本、音频、视频等内容，我们需要通过预处理模型去把这些数据转换成神经网络可识别的形式，不同的模态有不同的模型可以用。以文本为例，预处理就是把文本的每个单词、符号转换成词元ID，这部分操作叫做编码（Encoder），将词元ID还原成文本，叫做解码（Decoder）。编码后的文本才能转换成嵌入（Embedding），相当于把文本转换成了向量空间中连续的点。

> **Tokenizer 的 encode / decode**
> - encode：文本 → token IDs
> - decode：token IDs → 文本
> 
> **Transformer 的 Encoder / Decoder**
> 
> - 是模型结构（比如 BERT / T5）
> - 和 tokenizer 不是一回事

> 这是“分词器的编码解码”，不是“模型结构的 Encoder/Decoder”。

要把文本转换成词元ID就要有字典，但是字典也可能没法涵盖所有的文本，所以字典需要有特殊上下文，标注一些没有识别到的文本，以及文本结束时的终止符等等。

GPT用的是BPE（Byte Pair Encoding）方法，尽管会出现字典里没有的词，BPE会把这个词逐步拆分成可以识别的词元，比如AKwife，会拆开AK和wife，所以它所需要的特殊字符只有<|endoftext|>用于判断段落、语句是否结束，以及不同文章、书籍的间隔符。

> BPE 的目标不是“理解语义”，而是“保证任何文本都能被表示”。

使用滑动窗口进行数据采样，也是回到了前面关于Transformer如何预测下一单词：input=[0, text.size()], target=[1, text.size()+1], input预测下一单词的词元，并且用target作为对照，不断迭代。如下所示：

一个 batch 里有**8 个独立的训练样本，**每个样本是，**长度为 4 的 token 序列，**

每隔 `stride=4` 个 token，取一个长度为 4 的窗口，收集满 8 个 → 组成一个 batch

**这里batch 中 8 行之间没有时间依赖关系**，

```python
dataloader = create_dataloader_v1(raw_text, batch_size=8, max_length=4, stride=4, shuffle=False)

data_iter = iter(dataloader)
inputs, targets = next(data_iter)
print("Inputs:\n", inputs)
print("\nTargets:\n", targets)

 tensor([[   40,   367,  2885,  1464],
        [ 1807,  3619,   402,   271],
        [10899,  2138,   257,  7026],
        [15632,   438,  2016,   257],
        [  922,  5891,  1576,   438],
        [  568,   340,   373,   645],
        [ 1049,  5975,   284,   502],
        [  284,  3285,   326,    11]])

Targets:
 tensor([[  367,  2885,  1464,  1807],
        [ 3619,   402,   271, 10899],
        [ 2138,   257,  7026, 15632],
        [  438,  2016,   257,   922],
        [ 5891,  1576,   438,   568],
        [  340,   373,   645,  1049],
        [ 5975,   284,   502,   284],
        [ 3285,   326,    11,   287]])

```

![[image 970.png]]

但是编码成词元嵌入是有一定缺陷的：“苹果汁”和“苹果手机”的“苹果”属于同一个词元id。

- token embedding 是**静态的**
- “苹果”的语义歧义不是 embedding 解决的
- 而是 **上下文 + self-attention** 在解决

最后讲到位置嵌入，因为仅仅是文本→词元ID→词元嵌入还不够，Transformer没办法学习到它们的位置关系，也就是说”I and You”和“You and I”所得到的词元嵌入向量是一致的，因此需要引入位置嵌入。可以通过`torch.arrange(max_length)` 去生成[0～max_length-1]数字然后进行Embedding，最终得到每个位置对应的位置嵌入，两者相加即可。

> 我所做的毕业设计需要把API序列转换成编号，就利用到了这里的思想。不过我没有把它进一步转换成Embedding。

### 🔹 建议 1：区分“token embedding”和“contextual embedding”

你现在的表述是“词元嵌入有缺陷”，这是对的，但可以更精确：

- token embedding：静态
- Transformer 输出的 hidden states：**上下文相关**

这个区分一旦建立，后面理解：

- ELMo
- BERT
- GPT hidden states
会非常顺。

### 🔹 建议 2：位置嵌入 ≠ 只有一种

你现在写的是 learned positional embedding（可学习的），完全没问题。

但可以心里留一个钩子：

- learned
- sinusoidal
- RoPE（后面一定会遇到）

---

## 相关笔记

- [[LLM-from-scratch ch03]] — 下一章
- [[GPT-Transformer里的残差网络]] — Transformer 结构专题
- [[AI 应用开发学习库.base]]