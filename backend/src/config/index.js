// 設定管理

export const config = {
  // Server
  port: parseInt(process.env.PORT) || 3000,
  wsPort: parseInt(process.env.WS_PORT) || 3001,

  // Cloudflare Tunnel
  cloudflareTunnelUrl: process.env.CLOUDFLARE_TUNNEL_URL || '',

  // STT
  stt: {
    provider: process.env.STT_PROVIDER || 'whisper_cpp',
    whisper: {
      enabled: process.env.WHISPER_CPP_ENABLED === 'true',
      modelPath: process.env.WHISPER_MODEL_PATH || './models/ggml-base.bin',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-1.5-flash',
    },
  },

  // TTS
  tts: {
    provider: process.env.TTS_PROVIDER || 'aivis',
    aivis: {
      url: process.env.AIVIS_SPEECH_URL || 'http://localhost:10101',
      defaultSpeaker: parseInt(process.env.AIVIS_DEFAULT_SPEAKER) || 488039072,
      speedScale: 1.2,
      pitchScale: 1.0,
    },
  },

  // xangi Bridge
  xangi: {
    discordChannelId: process.env.XANGI_DISCORD_CHANNEL_ID || '',
    discordBotToken: process.env.XANGI_DISCORD_BOT_TOKEN || '',
  },

  // Security
  security: {
    apiKeyRequired: process.env.API_KEY_REQUIRED === 'true',
    apiKey: process.env.API_KEY || '',
  },

  // Latency
  latency: {
    streamChunkSize: parseInt(process.env.STREAM_CHUNK_SIZE) || 4096,
    maxLatencyMs: parseInt(process.env.MAX_LATENCY_MS) || 2000,
  },
};

export default config;
