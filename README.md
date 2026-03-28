<div align="center">

<br/>

<!-- HERO BANNER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:1a1f35,100:0d2137&height=200&section=header&text=random-chat&fontSize=58&fontColor=e2e8f0&fontAlignY=38&desc=Real-Time%20Anonymous%20Chat%20%7C%20Node.js%20%2B%20Socket.io&descAlignY=58&descColor=7090aa" width="100%"/>

<br/>

<!-- BADGES -->
![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-v4-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-v4-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

![Anonymous](https://img.shields.io/badge/🕵️-Anonymous%20by%20Design-6366f1?style=flat-square)
![Real-Time](https://img.shields.io/badge/⚡-Real--Time%20Messaging-10b981?style=flat-square)
![No Auth](https://img.shields.io/badge/🚫-No%20Login%20Required-ef4444?style=flat-square)
![Open Source](https://img.shields.io/badge/❤️-Open%20Source-f59e0b?style=flat-square)

<br/>

> *Connect with a random stranger instantly — no accounts, no history, no traces. Just two people and a conversation.*

<br/>

---

</div>

## 📸 Screenshots

<div align="center">

| Waiting for a Match | Live Chat Session |
|:-:|:-:|
| ![Waiting](screenshots/waiting.png) | ![Chat](screenshots/chat.png) |

| Stranger Disconnected | Mobile View |
|:-:|:-:|
| ![Disconnected](screenshots/disconnected.png) | ![Mobile](screenshots/mobile.png) |

</div>

> 💡 *Drop your screenshots into a `screenshots/` folder to make these render on GitHub.*

---

## ✨ Features

| Feature | Description |
|---|---|
| ⚡ **Instant Matchmaking** | Paired with a stranger the moment one is available |
| 🕵️ **Fully Anonymous** | No sign-up, no login, no personal data stored |
| 💬 **Real-Time Messaging** | WebSocket-powered — zero perceptible latency |
| 🔌 **Disconnect & Skip** | End a chat anytime and get matched with someone new |
| 🔔 **Live Status Indicators** | Know when a stranger connects or leaves |
| 📱 **Responsive UI** | Works seamlessly on desktop and mobile browsers |
| 🪶 **Lightweight** | Minimal dependencies — runs straight out of the box |

---

## 🏗️ How It Works

```
User A connects → placed in waiting queue
User B connects → server pairs A & B into a private session
  ↓
Messages relay: A → server → B  (and vice versa)
  ↓
Either user disconnects → session ends → other user is notified
  ↓
Both users return to queue → ready for next match
```

> The server never stores messages. Everything is ephemeral — when the session ends, it's gone.

---

## 🗂️ Project Structure

```
random-chat/
├── public/
│   ├── index.html        # Main chat interface
│   ├── style.css         # Styling and responsive layout
│   └── client.js         # Socket.io client logic
├── server.js             # Express server + Socket.io matchmaking
├── package.json          # Project metadata and dependencies
├── package-lock.json     # Locked dependency tree
└── .gitignore
```

---

## ⚙️ Installation

### Prerequisites

- **[Node.js](https://nodejs.org/)** v14 or higher
- **npm** — comes bundled with Node.js

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/adi-with-tea/random-chat.git
cd random-chat
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

---

### Step 3 — Start the Server

```bash
npm start
```

---

### Step 4 — Open in Browser

```
http://localhost:3000
```

Open it in **two separate tabs or browsers** to simulate two users connecting and chatting!

> ⚠️ If port `3000` is already in use, update the port value in `server.js` before starting.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js | JavaScript server environment |
| Framework | Express v4 | HTTP server & static file serving |
| WebSockets | Socket.io v4 | Real-time bidirectional communication |
| Frontend | HTML + CSS + JS | Chat UI and client-side socket logic |

---

## 🔌 Socket Events

| Event | Direction | Description |
|---|---|---|
| `connection` | Client → Server | User connects to the server |
| `waiting` | Server → Client | Placed in queue, awaiting a partner |
| `matched` | Server → Client | Paired with a stranger — chat begins |
| `message` | Bidirectional | A message sent or received |
| `stranger_left` | Server → Client | Partner disconnected |
| `disconnect` | Client → Server | User closes the tab or leaves |

---

## 🚀 Deployment

You can deploy this to any Node.js hosting platform:

**[Railway](https://railway.app)**
```bash
# Connect your GitHub repo and Railway auto-detects Node.js
# Set start command: node server.js
```

**[Render](https://render.com)**
```bash
# New Web Service → connect repo
# Build command: npm install
# Start command: npm start
```

**[Fly.io](https://fly.io)**
```bash
fly launch
fly deploy
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork this repository
2. Create your feature branch: `git checkout -b feature/your-idea`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-idea`
5. Open a Pull Request

Some ideas to contribute: typing indicators, room-based chats, message timestamps, interest-based matching, or a dark/light theme toggle.

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d2137,50:1a1f35,100:0d1117&height=100&section=footer" width="100%"/>

Made with ☕ by **[adi-with-tea](https://github.com/adi-with-tea)**

⭐ Star this repo if you found it useful!

</div>
