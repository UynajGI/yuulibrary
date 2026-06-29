---
title: "Playing Atari with Deep Reinforcement Learning"
description: "DQN 论文阅读笔记——深度强化学习的开山之作"
date: 2026-06-23
author: "Mnih et al., DeepMind"
year: 2013
tags: ["机器学习", "深度学习"]
links:
  - name: "arXiv"
    url: "https://arxiv.org/abs/1312.5602"
weight: 1
---

## 核心思想

用深度卷积神经网络近似 Q 函数，直接从高维像素输入（游戏画面）学习到端到端的策略，无需人工特征工程。

关键创新是 **经验回放（experience replay）**：把 `(s, a, r, s')` 转移存进回放缓冲区，训练时从中随机采样 minibatch。这打破连续样本间的相关性，平滑数据分布，让训练更稳定。

## Q 学习更新

目标函数是最小化当前 Q 值与目标之间的差距：

$$
L(\theta) = \mathbb{E}_{(s,a,r,s') \sim U(D)} \left[ \left( r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta) \right)^2 \right]
$$

其中 $\theta^-$ 是目标网络参数（定期固定），$D$ 是回放缓冲区。

## 要点

- 单一网络结构处理所有 Atari 游戏（同一套超参数）
- 输入：84×84×4 堆叠帧；输出：每个动作的 Q 值
- $\varepsilon$-greedy 探索，$\varepsilon$ 从 1 衰减到 0.1

这篇奠定了后续 DQN 系列（Double DQN、Dueling、Prioritized Replay）的基础。
