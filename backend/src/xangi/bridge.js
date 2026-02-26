// xangiブリッジ - Discord経由でxangiと通信

import config from '../config/index.js';

export class XangiBridge {
  constructor(options = {}) {
    this.channelId = options.channelId || config.xangi.discordChannelId;
    this.botToken = options.botToken || config.xangi.discordBotToken;
    this.apiUrl = 'https://discord.com/api/v10';
  }

  async sendMessage(text) {
    try {
      const response = await fetch(`${this.apiUrl}/channels/${this.channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Message sent to xangi:', result.id);

      return result;
    } catch (error) {
      console.error('xangi bridge error:', error);
      throw error;
    }
  }

  async getLatestMessages(limit = 5) {
    try {
      const response = await fetch(
        `${this.apiUrl}/channels/${this.channelId}/messages?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bot ${this.botToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('xangi bridge error:', error);
      throw error;
    }
  }

  async waitForResponse(messageId, timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const messages = await this.getLatestMessages(10);

      // 送信メッセージ以降のボットメッセージを探す
      const messageIndex = messages.findIndex(m => m.id === messageId);

      if (messageIndex >= 0) {
        for (let i = messageIndex - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.author.bot && msg.content) {
            return msg;
          }
        }
      }

      await this.delay(1000);
    }

    throw new Error('Response timeout');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default XangiBridge;
