// WebSocketハンドラー - クライアントとの通信を管理

import { WebSocketServer } from 'ws';
import config from '../config/index.js';
import TTSManager from '../tts/manager.js';
import STTManager from '../stt/manager.js';
import XangiBridge from '../xangi/bridge.js';

export class WebSocketHandler {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.tts = new TTSManager();
    this.stt = new STTManager();
    this.xangi = new XangiBridge();
    this.clients = new Map();

    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`Client connected: ${clientId}`);

      this.clients.set(clientId, {
        ws,
        id: clientId,
        isProcessing: false,
      });

      // ウェルカムメッセージ
      this.send(ws, {
        type: 'connected',
        clientId,
        ttsProvider: config.tts.provider,
        sttProvider: config.stt.provider,
      });

      ws.on('message', async (data) => {
        await this.handleMessage(clientId, data);
      });

      ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
      });
    });
  }

  async handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.isProcessing) return;

    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'audio':
          await this.handleAudio(client, message);
          break;

        case 'text':
          await this.handleText(client, message);
          break;

        case 'config':
          this.handleConfig(client, message);
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling message from ${clientId}:`, error);
      this.sendError(client.ws, error.message);
    }
  }

  async handleAudio(client, message) {
    client.isProcessing = true;

    try {
      const { audioData, mimeType } = message;

      // Base64をArrayBufferに変換
      const audioBuffer = this.base64ToArrayBuffer(audioData);

      // STT処理
      console.log('STT processing...');
      const text = await this.stt.transcribe(audioBuffer, { mimeType });
      console.log('STT result:', text);

      if (!text || text.length < 2) {
        this.send(client.ws, { type: 'stt_result', text: '' });
        return;
      }

      this.send(client.ws, { type: 'stt_result', text });

      // xangiに送信
      await this.xangi.sendMessage(text);

      // xangiの応答を取得
      const responseText = await this.getXangiResponse(text);

      // TTS合成
      const ttsAudioBuffer = await this.tts.synthesize(responseText);

      // 音声送信
      this.send(client.ws, {
        type: 'tts_audio',
        audioData: this.arrayBufferToBase64(ttsAudioBuffer),
        text: responseText,
      });

    } catch (error) {
      console.error('Error in handleAudio:', error);
      this.sendError(client.ws, error.message);
    } finally {
      client.isProcessing = false;
    }
  }

  async handleText(client, message) {
    try {
      const { text } = message;

      // xangiに送信
      await this.xangi.sendMessage(text);

      // 応答生成
      const responseText = await this.getXangiResponse(text);

      // TTS合成
      const audioBuffer = await this.tts.synthesize(responseText);

      // 音声送信
      this.send(client.ws, {
        type: 'tts_audio',
        audioData: this.arrayBufferToBase64(audioBuffer),
        text: responseText,
      });

    } catch (error) {
      console.error('Error in handleText:', error);
      this.sendError(client.ws, error.message);
    }
  }

  handleConfig(client, message) {
    const { ttsProvider, sttProvider, voiceSpeed } = message;

    if (ttsProvider) {
      this.tts.setProvider(ttsProvider);
    }

    if (sttProvider) {
      this.stt.setProvider(sttProvider);
    }

    this.send(client.ws, {
      type: 'config_updated',
      ttsProvider: ttsProvider,
      sttProvider: sttProvider,
      voiceSpeed,
    });
  }

  async getXangiResponse(userText) {
    // xangiからの応答を取得
    // 注: 実際のxangiブリッジが実装されたら置き換え

    // 現在は簡易実装：ローカルで応答生成
    // 将来的には以下を実装：
    // 1. Discord APIで最新メッセージをポーリング
    // 2. ボットの応答を検出
    // 3. 応答テキストを返す

    const responses = [
      `「${userText}」ですね、ぼっちゃんです！`,
      `${userText}、了解しました！`,
      `ぼっちゃんです。${userText}について何かしましょうか？`,
      `${userText}ですね！ちょっと待ってくださいね。`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  send(ws, data) {
    if (ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify(data));
    }
  }

  sendError(ws, error) {
    this.send(ws, {
      type: 'error',
      error,
    });
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  broadcast(data) {
    this.clients.forEach((client) => {
      this.send(client.ws, data);
    });
  }
}

export default WebSocketHandler;
