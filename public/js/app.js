import { init3DBackground, pulseBackground, explodeBackground } from './three-bg.js';
import SecureChatCrypto from './crypto.js';

// Initialize 3D Background Matrix
init3DBackground('bg-canvas');

const socket = io();
const cryptoMgr = new SecureChatCrypto();

const UI = {
  startScreen: document.getElementById('start-screen'),
  chatScreen: document.getElementById('chat-screen'),
  onlineCount: document.getElementById('online-count'),
  interestInput: document.getElementById('interest-input'),
  startBtn: document.getElementById('start-btn'),
  chatStatus: document.getElementById('chat-status'),
  encBadge: document.getElementById('encryption-badge'),
  chatBox: document.getElementById('chat-box'),
  msgInput: document.getElementById('msg-input'),
  sendBtn: document.getElementById('send-btn'),
  nextBtn: document.getElementById('next-btn'),
  typingIndicator: document.getElementById('typing-indicator'),
  fileInput: document.getElementById('file-input'),
  attachBtn: document.getElementById('attach-btn'),
};

let currentState = 'START'; // START, SEARCHING, MATCHED
let typingTimeout = null;

// ==== Sound Effects (Web Audio API) ====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'recv') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    }
}

socket.on('user_count', count => {
  UI.onlineCount.textContent = `Live Users Online: ${count}`;
});

UI.startBtn.addEventListener('click', () => {
    switchScreen('chat');
    startSearch();
});

UI.nextBtn.addEventListener('click', () => {
    socket.disconnect(); // force disconnect to leave room
    socket.connect();
    startSearch();
});

function startSearch() {
    currentState = 'SEARCHING';
    UI.chatBox.innerHTML = '';
    UI.msgInput.disabled = true;
    UI.sendBtn.disabled = true;
    UI.attachBtn.disabled = true;
    UI.encBadge.classList.add('hidden');
    UI.chatStatus.textContent = "Searching for a stranger...";
    
    // Grab the interest tag to match via the server 
    const tag = UI.interestInput.value.trim();
    socket.emit('find_match', tag);
}

function switchScreen(screen) {
    if(screen === 'chat') {
        UI.startScreen.classList.remove('active');
        UI.chatScreen.classList.add('active');
    } else {
        UI.startScreen.classList.add('active');
        UI.chatScreen.classList.remove('active');
    }
}

// ==== Match & Crypto Logic ====
socket.on('waiting', (msg) => {
    UI.chatStatus.textContent = msg;
});

socket.on('matched', async (data) => {
    currentState = 'MATCHED';
    UI.chatStatus.textContent = "Connecting Securely...";
    
    // Generate ECDH Keys for End-to-End Encryption
    await cryptoMgr.generateKeyPair();
    const pubKeyJwk = await cryptoMgr.exportPublicKey();
    
    // Exchange public keys with the matched stranger
    socket.emit('public_key', pubKeyJwk);
});

socket.on('public_key', async (strangerJwk) => {
    if(currentState !== 'MATCHED') return;
    
    // Derive AES-GCM shared secret from stranger's public key
    await cryptoMgr.computeSharedSecret(strangerJwk);
    
    // Connection established and secured
    UI.chatStatus.textContent = "Connected with a stranger";
    UI.encBadge.classList.remove('hidden');
    UI.msgInput.disabled = false;
    UI.sendBtn.disabled = false;
    UI.attachBtn.disabled = false;
    UI.msgInput.focus();
    appendSystemMessage("You are now anonymously chatting. Messages are end-to-end encrypted.");
});

socket.on('partner_left', () => {
    appendSystemMessage("Stranger has disconnected.");
    UI.chatStatus.textContent = "Disconnected";
    UI.msgInput.disabled = true;
    UI.sendBtn.disabled = true;
    UI.attachBtn.disabled = true;
    UI.encBadge.classList.add('hidden');
});

// ==== Messaging & Typing Logic ====
function generateUUID() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

UI.sendBtn.addEventListener('click', sendMessage);
UI.msgInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendMessage();
});

UI.msgInput.addEventListener('input', () => {
    if(currentState !== 'MATCHED') return;
    socket.emit('typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop_typing');
    }, 1200);
});

// ==== File Attachments ====
UI.attachBtn.addEventListener('click', () => {
    if(currentState === 'MATCHED') UI.fileInput.click();
});

UI.fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file || currentState !== 'MATCHED') return;
    
    // Validate file size limit (100MB limit)
    if(file.size > 100 * 1024 * 1024) {
        alert("File is too large! Limit is 100MB.");
        UI.fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
        const base64Data = ev.target.result;
        const msgId = generateUUID();
        
        // Formulate special payload for file
        const payload = JSON.stringify({ type: 'file', name: file.name, data: base64Data });
        const encrypted = await cryptoMgr.encryptMessage(payload);
        
        appendFileMessage(msgId, file.name, base64Data, 'you');
        
        socket.emit('message', { id: msgId, encrypted });
        
        explodeBackground();
        playSound('send');
    };
    reader.readAsDataURL(file);
    UI.fileInput.value = ''; // reset
});


async function sendMessage() {
    const text = UI.msgInput.value.trim();
    if(!text || currentState !== 'MATCHED') return;
    
    UI.msgInput.value = '';
    
    const msgId = generateUUID();
    
    const payload = JSON.stringify({ type: 'text', data: text });
    
    // Encrypt Message Client-Side
    const encrypted = await cryptoMgr.encryptMessage(payload);
    
    // Show locally
    appendTextMessage(msgId, text, 'you');
    
    // Send to Stranger
    socket.emit('message', {
        id: msgId,
        encrypted
    });
    
    explodeBackground();
    playSound('send');
}

socket.on('message', async (data) => {
    socket.emit('stop_typing');
    UI.typingIndicator.classList.add('hidden');
    
    // Decrypt Message Client-Side
    const decryptedStr = await cryptoMgr.decryptMessage(data.encrypted);
    
    try {
        const payload = JSON.parse(decryptedStr);
        if(payload.type === 'file') {
            appendFileMessage(data.id, payload.name, payload.data, 'stranger');
        } else {
            appendTextMessage(data.id, payload.data, 'stranger');
        }
    } catch(e) {
        // Fallback for older plaintext before JSON wrap
        appendTextMessage(data.id, decryptedStr, 'stranger');
    }
    
    pulseBackground();
    playSound('recv');
});

socket.on('typing', () => UI.typingIndicator.classList.remove('hidden'));
socket.on('stop_typing', () => UI.typingIndicator.classList.add('hidden'));

// ==== Chat UI Rendering ====
function appendSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'msg system-msg';
    el.textContent = text;
    UI.chatBox.appendChild(el);
    scrollToBottom();
}

function appendTextMessage(id, text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `msg-bubble`;
    bubble.textContent = text;
    wrapMessage(id, bubble, sender);
}

function appendFileMessage(id, fileName, dataUrl, sender) {
    const bubble = document.createElement('div');
    bubble.className = `msg-bubble file-bubble`;
    
    if(dataUrl.startsWith('data:image')) {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = 'img-preview';
        img.style.maxWidth = '200px';
        img.style.borderRadius = '10px';
        img.style.display = 'block';
        img.style.marginBottom = '8px';
        bubble.appendChild(img);
    }
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.textContent = '📎 Download ' + fileName;
    link.style.color = 'inherit';
    link.style.textDecoration = 'underline';
    bubble.appendChild(link);
    
    wrapMessage(id, bubble, sender);
}

function wrapMessage(id, bubbleNode, sender) {
    const wrap = document.createElement('div');
    wrap.className = `msg-wrap ${sender}`;
    wrap.id = `msg-${id}`;
    
    wrap.appendChild(bubbleNode);
    
    if (sender === 'you') {
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = '🗑️';
        delBtn.title = "Delete for everyone";
        delBtn.onclick = () => deleteMessage(id);
        wrap.appendChild(delBtn);
    }
    
    UI.chatBox.appendChild(wrap);
    scrollToBottom();
}

function scrollToBottom() {
    UI.chatBox.scrollTop = UI.chatBox.scrollHeight;
}

// ==== Snapchat-style Deletions ====
function deleteMessage(id) {
    // Send deletion event via websocket immediately
    socket.emit('delete_message', id);
    replaceWithPlaceholder(id, 'You');
}

socket.on('delete_message', (id) => {
    replaceWithPlaceholder(id, 'Stranger');
});

function replaceWithPlaceholder(id, who) {
    const wrap = document.getElementById(`msg-${id}`);
    if(wrap) {
        wrap.innerHTML = `<span class="deleted-msg">🚫 ${who} deleted a message</span>`;
        if (who === 'You') wrap.classList.add('fade-out');
    }
}
