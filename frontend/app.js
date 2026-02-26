// ぼっちゃんボイス - フロントエンドアプリケーション

class VoiceChatApp {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.latencyHistory = [];

    this.config = {
      wsUrl: this.getWebSocketUrl(),
      ttsProvider: 'aivis',
      voiceSpeed: 1.2,
    };

    this.initElements();
    this.initAudio();
    this.connectWebSocket();
    this.bindEvents();
  }

  initElements() {
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.latencyDisplay = document.getElementById('latencyDisplay');
    this.characterStatus = document.getElementById('characterStatus');
    this.chatLog = document.getElementById('chatLog');
    this.currentText = document.getElementById('currentText');
    this.micButton = document.getElementById('micButton');
    this.settingsButton = document.getElementById('settingsButton');
    this.settingsPanel = document.getElementById('settingsPanel');
    this.closeSettings = document.getElementById('closeSettings');
    this.ttsProvider = document.getElementById('ttsProvider');
    this.voiceSpeed = document.getElementById('voiceSpeed');
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.error('Web Audio API not available:', e);
    }
  }

  getWebSocketUrl() {
    // 現在のURLからWebSocket URLを作成
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = location.host;
    return `${protocol}//${host}`;
  }

  connectWebSocket() {
    try {
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.updateStatus('connected');
        this.addSystemMessage('ぼっちゃんに接続しました！');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.updateStatus('disconnected');
        this.addSystemMessage('接続が切れました。再接続中...');
        setTimeout(() => this.connectWebSocket(), 3000);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.addSystemMessage('通信エラーが発生しました');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.addSystemMessage('接続に失敗しました');
    }
  }

  handleMessage(data) {
    const startTime = Date.now();

    switch (data.type) {
      case 'connected':
        this.config.clientId = data.clientId;
        this.config.ttsProvider = data.ttsProvider;
        this.ttsProvider.value = data.ttsProvider;
        break;

      case 'stt_result':
        this.handleSTTResult(data.text);
        break;

      case 'tts_audio':
        this.handleTTSAudio(data.audioData, data.text, startTime);
        break;

      case 'error':
        this.addSystemMessage(`エラー: ${data.error}`);
        break;

      case 'config_updated':
        this.config.ttsProvider = data.ttsProvider;
        break;
    }
  }

  handleSTTResult(text) {
    if (!text) return;

    this.addChatMessage('user', text);
    this.currentText.textContent = `「${text}」を認識中...`;
    this.characterStatus.textContent = '考え中...';
  }

  async handleTTSAudio(base64Audio, text, startTime) {
    this.addChatMessage('assistant', text);
    this.currentText.textContent = text;
    this.characterStatus.textContent = '話しています...';

    // 音声再生
    try {
      const audioBuffer = this.base64ToArrayBuffer(base64Audio);
      const audioData = await this.audioContext.decodeAudioData(audioBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioData;
      source.connect(this.audioContext.destination);
      source.start(0);

      source.onended = () => {
        this.characterStatus.textContent = '待機中';
        this.currentText.textContent = '';

        // レイテンシ計算
        const latency = Date.now() - startTime;
        this.updateLatency(latency);
      };

    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  bindEvents() {
    // マイクボタン
    this.micButton.addEventListener('click', () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });

    // 設定ボタン
    this.settingsButton.addEventListener('click', () => {
      this.settingsPanel.classList.toggle('active');
    });

    this.closeSettings.addEventListener('click', () => {
      this.settingsPanel.classList.remove('active');
    });

    // 設定変更
    this.ttsProvider.addEventListener('change', () => {
      this.config.ttsProvider = this.ttsProvider.value;
      this.sendConfig();
    });

    this.voiceSpeed.addEventListener('change', () => {
      this.config.voiceSpeed = parseFloat(this.voiceSpeed.value);
      this.sendConfig();
    });
  }

  async startRecording() {
    try {
      // マイク取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder.mimeType,
        });

        // サイズ制限（10MB）
        if (audioBlob.size > 10 * 1024 * 1024) {
          this.addSystemMessage('音声が長すぎます');
          return;
        }

        // 音声を送信
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = this.arrayBufferToBase64(arrayBuffer);

        this.send({
          type: 'audio',
          audioData: base64Audio,
          mimeType: this.mediaRecorder.mimeType,
        });

        // ストリームを停止
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      this.micButton.classList.add('recording');
      this.characterStatus.textContent = '話してください...';

    } catch (error) {
      console.error('Recording error:', error);
      this.addSystemMessage('マイクにアクセスできません');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      this.micButton.classList.remove('recording');
      this.characterStatus.textContent = '処理中...';
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendConfig() {
    this.send({
      type: 'config',
      ttsProvider: this.config.ttsProvider,
      voiceSpeed: this.config.voiceSpeed,
    });
  }

  updateStatus(status) {
    this.statusDot.className = 'status-dot';

    switch (status) {
      case 'connected':
        this.statusDot.classList.add('connected');
        this.statusText.textContent = '接続済み';
        break;
      case 'recording':
        this.statusDot.classList.add('recording');
        this.statusText.textContent = '録音中';
        break;
      default:
        this.statusText.textContent = '接続中...';
    }
  }

  updateLatency(latency) {
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 10) {
      this.latencyHistory.shift();
    }

    const avg = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
    this.latencyDisplay.textContent = `応答時間: ${Math.round(avg)}ms`;
  }

  addChatMessage(type, text) {
    const div = document.createElement('div');
    div.className = `chat-message ${type}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });

    div.appendChild(bubble);
    div.appendChild(time);

    this.chatLog.appendChild(div);
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
  }

  addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'system-message';
    div.textContent = text;

    this.chatLog.appendChild(div);
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
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

// アプリ起動
document.addEventListener('DOMContentLoaded', () => {
  new VoiceChatApp();
});
