// TTSマネージャー - 複数のTTSエンジンを管理

import config from '../config/index.js';
import { AivisTTS } from './aivis.js';

export class TTSManager {
  constructor() {
    this.providers = new Map();
    this.currentProvider = config.tts.provider;

    // プロバイダー初期化
    this.providers.set('aivis', new AivisTTS());

    // 将来的な拡張
    // this.providers.set('mio', new MioTTS());
    // this.providers.set('qwen', new QwenTTS());
  }

  getProvider(name = null) {
    const providerName = name || this.currentProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`TTS provider not found: ${providerName}`);
    }

    return provider;
  }

  async synthesize(text, options = {}) {
    const provider = options.provider
      ? this.providers.get(options.provider)
      : this.getProvider();

    if (!provider) {
      throw new Error(`TTS provider not found: ${options.provider || this.currentProvider}`);
    }

    return provider.synthesize(text, options);
  }

  async synthesizeStream(text, options = {}) {
    const provider = options.provider
      ? this.providers.get(options.provider)
      : this.getProvider();

    if (!provider || !provider.synthesizeStream) {
      throw new Error(`Streaming not supported for provider: ${options.provider || this.currentProvider}`);
    }

    return provider.synthesizeStream(text, options);
  }

  setProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`TTS provider not found: ${name}`);
    }

    this.currentProvider = name;
    console.log(`TTS provider changed to: ${name}`);
  }

  addProvider(name, provider) {
    this.providers.set(name, provider);
    console.log(`TTS provider added: ${name}`);
  }

  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }
}

export default TTSManager;
