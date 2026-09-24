# HeizPro KI — an AI voice agent that answers real sales calls

<p align="center">
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-0d9488?style=flat-square"></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App%20Router-20252b?style=flat-square">
  <img alt="Voice" src="https://img.shields.io/badge/voice-ElevenLabs-20252b?style=flat-square">
  <img alt="Agent" src="https://img.shields.io/badge/agent-OpenAI-20252b?style=flat-square">
  <img alt="Docker" src="https://img.shields.io/badge/deploy-Docker-20252b?style=flat-square">
</p>

**Talk to it live: [mischa.mokka-dev.de](https://mischa.mokka-dev.de)**

https://github.com/user-attachments/assets/4a67b4e1-f58e-4039-81f6-167f39737da1

![Simulator: two agents talking](simulator-preview.png)

A heating company was missing inbound calls while out on jobs. Answering services are expensive, chatbots don't answer phones. So this: a voice agent that picks up, holds a real-time German conversation, qualifies the lead (who, what, where, how urgent), and writes a structured record the human can call back on.

## What's inside

- **Live voice conversation** — continuous speech recognition with silence debounce, TTS with automatic voice fallback, responses only to final speech (the transcript's half-sentences never reach the agent)
- **Two-agent simulator** — a customer persona agent plays real inbound calls against the sales agent, so conversation quality is testable without anyone picking up a phone
- **Lead dashboard** — every conversation lands as a structured lead record (drizzle/PostgreSQL)

![Dashboard](dashboard-preview.png)

## Stack

Next.js (App Router) · TypeScript · ElevenLabs voice (`@elevenlabs/react`) · OpenAI (agent logic) · Drizzle ORM + PostgreSQL · Framer Motion · Docker

## How a call flows

```mermaid
flowchart LR
    C[Caller] -- audio --> STT[continuous recognition<br/>silence debounce · final-only]
    STT --> AG[agent · OpenAI<br/>qualifies: who · what · where · urgency]
    AG -- final speech only --> TTS[TTS · ElevenLabs<br/>automatic voice fallback]
    TTS -- audio --> C
    AG --> LEAD[(structured lead record<br/>Drizzle · PostgreSQL)]
    SIM[customer-persona simulator] -- plays inbound calls --> AG
    LEAD --> DASH[lead dashboard]
```

## The unglamorous part (where the work actually went)

Voice agents fail in the boring places, so that's where the commits are: a mic stale-closure bug that froze recognition after the first reply, TTS dying when the configured voice was unavailable (now falls back instead of going silent), and the recognition loop firing on interim results (now only final speech triggers a response). None of it is clever. All of it is the difference between a demo and something a customer can call.

## Run it

```bash
cd heizung-agent
pnpm install
cp .env.example .env   # ELEVENLABS + OPENAI keys
pnpm dev
```

Built by [Youssef Ouhaghi Ahmian](https://github.com/Gjusev). More production AI systems at [mokka-agentur.de](https://mokka-agentur.de).
