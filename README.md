# ぼっちゃんボイスチャットシステム

iPhoneから自宅Mac mini上のxangiとリアルタイム音声会話するシステム。

## 🏗️ アーキテクチャ

```
iPhone Safari (Tailscaleネットワーク)
    ↓ WS (Tailscale direct connection)
Mac mini M4 (100.117.13.73:3001)
    ├─ STT (Gemini Flash / Handy将来対応)
    ├─ xangi Bridge (Discord API)
    └─ TTS (Aivis Speech korosuke)
```

## 📋 クイックスタート

### 1. サーバー起動

```bash
cd /Users/k/github_local/xangi/voice-chat-system/backend
npm start
```

### 2. iPhoneからアクセス

```
http://100.117.13.73:3001
```

※ Tailscaleが両端末で有効である必要があります

## 🔧 設定項目 (.env)

| 項目 | 説明 | デフォルト |
|------|------|----------|
| WS_PORT | WebSocketポート | 3001 |
| STT_PROVIDER | STTプロバイダ (gemini/handy) | gemini |
| GEMINI_API_KEY | Gemini APIキー | 必須 |
| TTS_PROVIDER | TTSプロバイダ (aivis/mio/qwen) | aivis |
| AIVIS_SPEECH_URL | Aivis Speech URL | http://localhost:10101 |
| AIVIS_DEFAULT_SPEAKER | デフォルト話者ID | 488039072 (korosuke) |

## 🌐 Tailscale接続

### Mac側

```bash
# Tailscale起動
sudo tailscale up

# IP確認
tailscale ip -4
# 出力: 100.117.13.73
```

### iPhone側

1. App Storeで「Tailscale」をインストール
2. アカウントにログイン
3. トグルをオンにして有効化
4. Safariで `http://100.117.13.73:3001` にアクセス

## 🎯 実装済み機能

- [x] WebSocket双方向通信
- [x] 音声録音・送信
- [x] Gemini STT
- [x] Aivis TTS音声合成
- [x] 設定パネル
- [x] レイテンシ表示

## 🚀 将来的な拡張

1. **Handy STT対応** - Rust製高速音声認識
2. **MioTTS/QwenTTS** - マルチTTS対応
3. **xangi実応答取得** - Discord APIポーリング
4. **WebRTC化** - より低遅延な通信

## 📱 iPhone対応

- iOS Safari 15+
- Web Audio API対応
- Tailscaleネットワーク必須

## 🔒 セキュリティ

- APIキーはサーバー側で管理
- Tailscaleの暗号化通信
- ローカルネットワーク閉じた環境
