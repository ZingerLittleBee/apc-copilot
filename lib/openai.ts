/**
 * 服务端 OpenAI API 工具
 * 仅在服务端使用，保护API密钥安全
 */

import OpenAI from 'openai';
import { observeOpenAI } from "@langfuse/openai";

// 初始化 OpenAI 客户端（仅在服务端）
export function getOpenAIClient() {
  const apiKey = process.env['ARK_API_KEY'];

  if (!apiKey) {
    throw new Error('请配置 ARK_API_KEY 环境变量');
  }

  return observeOpenAI(new OpenAI({
    apiKey,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  }), {
      tags: ['apc-ai']
  });
}

// 类型定义 - 使用OpenAI标准类型
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface ChatCompletionOptions {
  messages: ChatCompletionMessageParam[];
  model?: string;
  reasoning_effort?: 'low' | 'medium' | 'high';
  stream?: boolean;
}

export interface ChatCompletionResponse {
  reasoning_content?: string;
  content: string;
}

export interface StreamingResponse {
  reasoning_content?: string;
  content: string;
  done: boolean;
}

/**
 * 非流式聊天完成请求
 */
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const {
    messages,
    model = 'doubao-seed-1-6-251015',
    reasoning_effort = 'medium',
  } = options;

  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    messages,
    model,
    reasoning_effort,
  });

  return {
    reasoning_content: (completion.choices[0]?.message as any)?.reasoning_content || '',
    content: completion.choices[0]?.message?.content || '',
  };
}

/**
 * 流式聊天完成请求
 */
export async function createStreamingChatCompletion(
  options: ChatCompletionOptions,
  onChunk: (chunk: StreamingResponse) => void
): Promise<void> {
  const {
    messages,
    model = 'doubao-seed-1-6-251015',
    reasoning_effort = 'medium',
  } = options;

  const client = getOpenAIClient();
  const stream = await client.chat.completions.create({
    messages,
    model,
    reasoning_effort,
    stream: true,
  });

  for await (const part of stream) {
    const chunk: StreamingResponse = {
      reasoning_content: (part.choices[0]?.delta as any)?.reasoning_content || '',
      content: part.choices[0]?.delta?.content || '',
      done: part.choices[0]?.finish_reason === 'stop',
    };

    onChunk(chunk);
  }
}

/**
 * 创建包含图像和文本的消息
 */
export function createImageTextMessage(
  imageUrl: string,
  text: string
): ChatCompletionMessageParam {
  return {
    role: 'user',
    content: [
      {
        type: 'image_url',
        image_url: {
          url: imageUrl,
        },
      },
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * 创建纯文本消息
 */
export function createTextMessage(
  text: string,
  role: 'user' | 'assistant' | 'system' = 'user'
): ChatCompletionMessageParam {
  return {
    role,
    content: text,
  };
}
