# GibberLink

This demo of "client/server" transmitting NOWIP ATM XMLs via ggwave

## UK telecare is broke

The UK telecare industry has struggled to move away from legacy DTMF alarm protocols. Thousands of analogue field devices still depend on tight, timing‑sensitive DTMF tones to signal distress, leaving them brittle on modern voice networks where slight jitter or codec shifts can garble intent. This project uses ggwave GibberLink to demonstrate carrying alarm traffic via FSK instead of DTMF, making the link more 'resilient' to timing drift and audio mangling across VoIP hops. Fundamentally, the industry failed to move fast enough—and the installed base is now at risk.

How VoIP codecs affect FSK signals:

- Compression algorithms: Most VoIP codecs (especially low-bit-rate ones like G.729 or GSM) use algorithms optimized for speech patterns. They identify and discard audio information that is not essential for human hearing, which often includes the specific frequencies and timing of FSK signals. The wideband codecs like G.711 (which offers uncompressed audio) are more compatible but still susceptible to other network issues.
- Packet loss: VoIP operates over packet-switched networks, which are prone to packet loss. FSK-based systems (like traditional alarm signals or caller ID) usually do not have error correction mechanisms built in, so even minor packet loss can lead to data failure or synchronization errors on the receiving end.
- Voice Activity Detection (VAD) and Discontinuous Transmission (DTX): Features like VAD, which stop transmitting data during periods of silence to save bandwidth, can interrupt the continuous stream required for FSK transmission, leading to signal failure.

