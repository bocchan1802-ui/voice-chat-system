// Gemini Flash API STT

import config from '../config/index.js';

export class GeminiSTT {
  constructor(options = {}) {
    this.apiKey = options.apiKey || config.stt.gemini.apiKey;
    this.model = options.model || config.stt.gemini.model;
  }

  async transcribe(audioBuffer) {
    // 音声をBase64エンコード
    const base64Audio = this.arrayBufferToBase64(audioBuffer);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: 'audio/webm',
                    data: base64Audio,
                  },
                },
                {
                  text: 'この音声を日本語で文字起こししてください。音声の内容だけを返してください。',
                },
              ],
            }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return text.trim();
    } catch (error) {
      console.error('Gemini STT error:', error);
      throw error;
    }
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export default GeminiSTT;
