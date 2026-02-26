// Aivis Speech TTS

import config from '../config/index.js';

export class AivisTTS {
  constructor(options = {}) {
    this.url = options.url || config.tts.aivis.url;
    this.defaultSpeaker = options.speaker || config.tts.aivis.defaultSpeaker;
    this.speedScale = options.speedScale || config.tts.aivis.speedScale;
    this.pitchScale = options.pitchScale || config.tts.aivis.pitchScale;
  }

  async synthesize(text, options = {}) {
    const speaker = options.speaker || this.defaultSpeaker;
    const speedScale = options.speedScale || this.speedScale;
    const pitchScale = options.pitchScale || this.pitchScale;

    try {
      // クエリ作成
      const encodedText = encodeURIComponent(text);
      const queryResponse = await fetch(`${this.url}/audio_query?text=${encodedText}&speaker=${speaker}`, {
        method: 'POST',
      });

      if (!queryResponse.ok) {
        throw new Error(`Aivis query failed: ${queryResponse.statusText}`);
      }

      const query = await queryResponse.json();

      // パラメータ調整
      query.speedScale = speedScale;
      query.pitchScale = pitchScale;

      // 音声合成
      const synthResponse = await fetch(`${this.url}/synthesis?speaker=${speaker}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });

      if (!synthResponse.ok) {
        throw new Error(`Aivis synthesis failed: ${synthResponse.statusText}`);
      }

      return await synthResponse.arrayBuffer();
    } catch (error) {
      console.error('Aivis TTS error:', error);
      throw error;
    }
  }

  async synthesizeStream(text, options = {}) {
    // ストリーミング用（将来的な拡張）
    const audioBuffer = await this.synthesize(text, options);

    // チャンクに分割してストリー�ミング
    const chunkSize = config.latency.streamChunkSize;
    const chunks = [];

    for (let i = 0; i < audioBuffer.byteLength; i += chunkSize) {
      const chunk = audioBuffer.slice(i, Math.min(i + chunkSize, audioBuffer.byteLength));
      chunks.push(chunk);
    }

    return {
      chunks,
      totalLength: audioBuffer.byteLength,
    };
  }

  // 音声をWAVヘッダー付きで返す
  async synthesizeWav(text, options = {}) {
    const audioBuffer = await this.synthesize(text, options);

    // WAVヘッダー作成
    const wavBuffer = this.createWavHeader(audioBuffer);

    return wavBuffer;
  }

  createWavHeader(audioBuffer) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const sampleRate = 24000; // Aivis Speechのデフォルト

    const dataLength = audioBuffer.byteLength;
    const bufferLength = 44 + dataLength;
    const wavBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(wavBuffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // PCM data
    const uint8Array = new Uint8Array(wavBuffer);
    uint8Array.set(new Uint8Array(audioBuffer), 44);

    return wavBuffer;
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export default AivisTTS;
