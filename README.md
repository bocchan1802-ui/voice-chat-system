# ぼっちゃんボイスチャットシステム

iPhoneから自宅Mac mini上のxangiとリアルタイム音声会話するシステム。

## 🏗️ アーキテクチャ

```
iPhone Safari
    ↓ WSS (Cloudflare Tunnel)
Mac mini Node.js Backend
    ├─ STT (Whisper.cpp / Gemini Flash)
    ├─ xangi Bridge (Discord API)
    └─ TTS (Aivis Speech / MioTTS / QwenTTS)
```

## 📋 ステップバイステップ実装

### ステップ1: 環境準備

```bash
cd /Users/k/github_local/xangi/voice-chat-system/backend
npm install
cp .env.example .env
# .envを編集してAPIキー等を設定
```

### ステップ2: サーバー起動

```bash
npm start
```

### ステップ3: Cloudflare Tunnel設定

```bash
# Cloudflare Tunnelをインストール
brew install cloudflare/tunnel/cloudflared

# トンネル起動
cloudflared tunnel --url http://localhost:3001
```

### ステップ4: HTTPSアクセス

Cloudflare Tunnelで発行されたURLにiPhoneからアクセス。

## 🔧 設定項目 (.env)

| 項目 | 説明 | デフォルト |
|------|------|----------|
| WS_PORT | WebSocketポート | 3001 |
| STT_PROVIDER | STTプロバイダ (whisper_cpp/gemini) | whisper_cpp |
| GEMINI_API_KEY | Gemini APIキー | - |
| TTS_PROVIDER | TTSプロバイダ (aivis/mio/qwen) | aivis |
| AIVIS_SPEECH_URL | Aivis Speech URL | http://localhost:10101 |
| AIVIS_DEFAULT_SPEAKER | デフォルト話者ID | 488039072 (korosuke) |

## 🎯 機能

- [x] WebSocket双方向通信
- [x] 音声録音・送信
- [x] TTS音声再生
- [x] 設定パネル
- [ ] STT実装
- [ ] xangi応答取得
- [ ] WebRTC対応

## 🚀 将来的な拡張

1. **WebRTC化** - より低遅延なリアルタイム通信
2. **マルチTTS対応** - ずんだもん、MioTTS、QwenTTS
3. **STT最適化** - Whisper.cppローカル実行
4. **プッシュ通知** - 着信時に自動起動

## 📱 iPhone対応

- iOS Safari 15+
- Web Audio API対応
- WebSocket Secure (WSS)必須

## 🔒 セキュリティ

- APIキーはサーバー側で管理
- Cloudflare TunnelでHTTPS
- APIキー認証（オプション）
