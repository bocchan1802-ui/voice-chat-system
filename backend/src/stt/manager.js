// STTマネージャー - 複数のSTTエンジンを管理

import config from '../config/index.js';
import { GeminiSTT } from './gemini.js';

export class STTManager {
  constructor() {
    this.providers = new Map();
    this.currentProvider = config.stt.provider;

    // プロバイダー初期化
    if (config.stt.gemini.apiKey) {
      this.providers.set('gemini', new GeminiSTT());
    }

    // 将来的な拡張
    // this.providers.set('handy', new HandySTT());
    // this.providers.set('whisper_cpp', new WhisperCppSTT());
  }

  getProvider(name = null) {
    const providerName = name || this.currentProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`STT provider not found: ${providerName}`);
    }

    return provider;
  }

  async transcribe(audioBuffer, options = {}) {
    const provider = options.provider
      ? this.providers.get(options.provider)
      : this.getProvider();

    if (!provider) {
      throw new Error(`STT provider not found: ${options.provider || this.currentProvider}`);
    }

    return provider.transcribe(audioBuffer, options);
  }

  setProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`STT provider not found: ${name}`);
    }

    this.currentProvider = name;
    console.log(`STT provider changed to: ${name}`);
  }

  addProvider(name, provider) {
    this.providers.set(name, provider);
    console.log(`STT provider added: ${name}`);
  }

  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }
}

export default STTManager;
