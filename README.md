# VMONSTER Streaming Demo for Vanilla JS

This project is a basic Vanilla Javascript demo using the `vmonster-streaming-js` library.

![demo](./public/screenshot-demo.png)

## Features

This demo implements the following features using VmonsterRoom:

[Official Document (Korean)](https://docs.vmonster.io/undefined/real-time-streaming-sdk/vmonsterRoom)
[Official Document (English)](https://docs.vmonster.io/english/real-time-streaming-sdk/vmonsterRoom)

- Join/Leave Vmonster Streaming stream
- Request AI Avatar to speak text
- Chat with AI Avatar using OpenAI API (text, text stream)
- Stop agent speaking
- Add/Remove agent video
- STT (Speech-to-Text)
- Set background / position / scale

## Getting Started

### Prerequisites

- Your Vmonster API Key (https://app.vmonster.io/api-key)
- npm or yarn

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/VMONSTER-AI/vmonster-streaming-js-vanilla-demo.git
cd vmonster-streaming-js-vanilla-demo
```

#### 2. Install dependencies

```bash
npm install
# or
yarn install
```

#### 3. Set environment variables

```bash
VITE_API_KEY=YOUR_API_KEY  // Your vmonster API Key
VITE_AIAVATAR_ID=AI AVATAR ID  // vmonster AI Avatar ID
VITE_SERVER_URL=SERVER_URL  // Use https://api.vmonster.io/v1 by default.
```

#### 4. Start the application

```bash
npm run dev
# or
yarn run dev
```

The development server will now run on localhost:3001.
