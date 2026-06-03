---
type: reference
domain: ai-application-development
phase: overview
topic: learning-roadmap
source: video
status: active
privacy: normal
updated: 2026-05-21
tags: [AI]
created: 2026-06-01
---

https://www.bilibili.com/video/BV1AYSXBLEQb/?spm_id_from=333.1391.0.0&vd_source=0cafd28c011c5492e6d7e39f1fd256d9
# 视频总结
1. AI应用开发方向不会像Java那样问很多又臭又长的八股，而是类似于“你用过langchain，说一下它怎么调用工具的”
2. 简历筛选阶段写的要符合工作JD，因为hr不一定懂技术，但是能知道你写的东西是不是跟他们业务相关。
3. **Python**只要菜鸟教程看看就行，异步、pandas数据处理、**langchain和langgraph**。
4. langchain做到简单的对话应用，之后是记忆、知识库（向量数据库）、调用工具，然后是跨agent协作。
5. 现在偏蓝海，很少有人教你写个项目，所以更推荐**自己ai手搓，遇到问题并解决问题就是自己经验**。
	1. 对话机器人开始，然后知识库检索、数据库查询，做成excel表等等
6. langchain相比于coze、dify这种低代码平台开发还是太慢了，但是底层都差不多，dify可以把工作流映射成http接口（api）交给langchain
7. 搞ai不要想着Java去搞，小公司可能SpringAI多一些，但是生态没python这么全面。
8. 没必要看网课，看完了也是Java学个连接数据库的程度，自己通过ai去自学，项目够深就行，底层稍微了解一下。
9. 工作经验看情况包装，但是要引用ai项目模块进来
10. 常见的agent业务：
	1. 电商：文员、销售想要查数据肯定不能直接从数据库查，这时候可以用openclaw写机器人，langchain写个框架调用底层数据库，然后返回excel表
11. 常见的问题：
	1. 大模型幻觉怎么解决
	2. langchian怎么调用工具
		1. 底层怎么传参？
12. **AI项目大于造轮子项目**，手写RPC、线程池只是你对这个技术有比较深的了解，现在重点是**怎样利用ai去提高你的效能**。


# 技术栈
![[ai相关/assets/ai应用开发路线参考/image.png|802]]
![[ai相关/assets/ai应用开发路线参考/image-1.png]]
