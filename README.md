# Why DTMF is failing after the BT Digital Voice Switchover  
### and why FSK is a better alternative for analogue telecare alarms

## 🔗 GibberLink (ggwave Telecare Demo)

A proof-of-concept client/server transport that sends **NOWIP telecare XML payloads** using **audio modulation via ggwave ("GibberLink")**, replacing brittle **DTMF alarm protocols** with a **robust FSK-style signalling layer**.

This project demonstrates that *audio-FSK modem bursts survive VoIP far better than tightly timed DTMF digit sequences*, which is critical as the UK PSTN becomes fully packetised under BT Digital Voice.

This project is purely for "fun" and not to be taken seriously!

---

## 🚨 UK Telecare is stuck in the analogue tone era

Most legacy social alarm telecare devices still depend on **DTMF alarm protocols**, originally designed for perfectly stable analogue circuits (PSTN, ISDN).

Those protocols require:

- Fixed tone frequencies and precise levels
- Strict tone **durations and inter-digit gaps**
- A continuous end-to-end circuit path with **no packetisation or transcoding**
- Extremely small payloads with minimal error tolerance

The UK PSTN shutdown (January 2027) replaces analogue landlines with **packet-based Digital Voice / VoIP**, breaking all of those assumptions.

This leaves millions of vulnerable users relying on alarms that increasingly fail to deliver distress messages to Alarm Receiving Centres (ARCs).

---

## 💥 Why DTMF is so fragile on VoIP/digital voice paths

Tone-based DTMF social alarms are now unreliable because VoIP voice paths introduce distortion and timing instability. The main causes are:

### 1. **Speech-optimised audio codecs**
- Codecs such as **G.729, GSM, AMR, and some wideband compression profiles** assume audio contains human speech
- They reshape frequency content and remove what looks like "non-speech noise"
- This corrupts the exact dual-tone spectral shape that DTMF digit detectors depend on
- Mid-call transcoding (codec changes between gateways) often **mis-detects or strips digit tones entirely**

### 2. **Jitter and variable delay**
- DTMF protocols for telecare depend on **exact timing**
- Jitter or delay variation clips tones or shortens gaps between digits
- Losing one tone burst = losing one digit = invalid or failed alarm message

### 3. **Echo cancellation, AGC, VAD/DTX**
- **Echo cancellers** misinterpret long tone bursts as feedback/noise
- **Automatic Gain Control (AGC)** alters levels during tone sequences
- **Voice Activity Detection (VAD)** disables transmission during perceived silence
- **Discontinuous Transmission (DTX)** inserts synthetic comfort noise instead of true audio
- Telecare alarm tone streams rely on the "quiet parts" for framing—if those are gated, the protocol breaks

---

## ✅ Why FSK-over-audio is a stronger choice than DTMF

FSK (*Frequency Shift Keying*) is modem-style audio signalling where **bits are encoded as shifts between two stable frequencies**. It is **much better suited to VoIP** because:

### 1. **Symbol recovery is continuous & timing-tolerant**
- DTMF uses isolated digit tone bursts with strict gaps
- FSK sends a **continuous stream of symbols**, allowing the demodulator to recover clocking over many cycles
- Small dropouts or jitter no longer destroy framing

### 2. **Supports strong error detection (CRC) and optional correction**
- Legacy telecare DTMF has *almost no error detection at the tone layer*
- FSK modem bursts can include:
  - **Framing**
  - **Checksums / CRC**
  - **Repetition or Forward Error Correction (FEC)**
- Provides graceful failure instead of silent mis-decode

### 3. **More codec-friendly than dual-tone digit bursts**
- FSK can be tuned into **frequency bands that pass reliably through G.711 and many VoIP stacks**
- Demodulation relies on **energy correlation over time**, not perfect spectral purity
- Phones, laptop mics, speakers, and resampling chains already tolerate FSK modem bursts well (ggwave is designed for this)

### 4. **Carry full binary payloads instead of digit-only messages**
- DTMF was designed for 16 fixed digit symbols
- FSK can send **arbitrary bytes**, enabling transport of:
  - NOWIP XML
  - Rich metadata
  - IP addressing
  - Device IDs
  - Alarm telemetry
- All transmitted in **one compact audio burst per call**

---

## 🎯 The key point

> **DTMF telecare alarms fail because they treat a VoIP speech channel like a perfect analogue circuit.**  
> **FSK succeeds because it was *designed for imperfect channels*, and can embed error checking and timing recovery inside the signal itself.**

This project doesn’t claim VoIP is ideal for analogue alarms—it proves **FSK gives far more survival margin than legacy DTMF** while the sector completes its slow move to digital, IP-native telecare protocols.

---

## 📡 How VoIP affects FSK too (but less catastrophically)

VoIP can still disrupt FSK when conditions are extreme:

- Very low-bit-rate codecs compress aggressively (e.g., G.729)
- Packet loss is severe
- VAD/DTX is enabled and not configured for modem passthrough
- Endpoints insert synthetic noise instead of transmitting real audio segments

But unlike DTMF digit bursts, FSK failures are **detectable using checksums**, and the protocol **can request retries or correct bits**, preventing silent alarm corruption.

---

## 🛠 Running the Demo

### Sender
```sh
# Generate an audio FSK modem burst carrying demo NOWIP XML
node sender.js my_telecare_payload.xml
