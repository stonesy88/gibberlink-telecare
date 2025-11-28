#Why DTMF tones are failing due to BT Digital Switchover

#GibberLink

This is a demo of a simple client/server chain transmitting NOWIP alarm XMLs over an audio link using ggwave (“GibberLink”) instead of legacy DTMF tones.

#UK telecare is stuck on analogue

The UK technology enabled care (TEC) / telecare sector was built on analogue phone lines and tone-based protocols. Most legacy social alarms still use DTMF-based signalling, such as BS8521-1 and manufacturer formats like Tunstall TT92, to send alarm data from a home unit to an Alarm Receiving Centre (ARC). 
telecare.digitaloffice.scot
+1

That whole stack assumes:

A stable, end-to-end analogue circuit (PSTN or ISDN)

Precise tone levels, durations and gaps

No packetisation, jitter or transcoding on the path

But the underlying network is being ripped out from under it. The UK’s analogue PSTN will be switched off and replaced with all-IP “digital landlines” (e.g. BT Digital Voice) by January 2027. 
bt.com
+2
TSA
+2
 Millions of telecare users still rely on analogue alarms, and government and TSA (the industry body) now have a joint Telecare National Action Plan to stop vulnerable users being cut off during the switchover. 
TSA
+2
GOV.UK
+2

The result is a huge installed base of DTMF-only devices trying to signal distress across all-IP voice networks that were never designed for this kind of timing-sensitive signalling. Failures seen in the field include:

Alarms that “seize” the line but never deliver a valid message

Calls that connect to the ARC, but where Contact-ID / BS8521 tones are mangled or truncated

Increasingly intermittent failures as providers change codecs, gateways or router firmware

Fundamentally, the industry didn’t move off analogue fast enough – and those tone-only devices are now brittle on modern networks.

Why plain DTMF is so fragile on BT Digital Voice / VoIP

DTMF in telecare isn’t just “pressing digits”; it’s a full protocol built from tightly timed tone bursts. BS8521-1 and similar DTMF-based protocols are typically half-duplex and rely on very narrow margins for tone timing and inter-digit gaps. 
NICC Standards
+1

On an all-IP voice path, several things attack those assumptions:

Speech-optimised codecs
Low-bit-rate codecs (G.729, GSM, etc.) and some wideband profiles are tuned for human speech, not pure dual-tone signals. They reshape or discard spectral details that DTMF detectors rely on, and transcoding mid-path can distort tone frequencies or levels. 
StarTrinity
+1

Packet loss, jitter and variable delay
DTMF timing is critical. Even small amounts of jitter or packet loss can clip tone starts/ends, shorten inter-digit gaps or introduce artifacts that cause the receiver to mis-detect or drop digits entirely. 
Cisco
+1

Echo cancellation, AGC, VAD/DTX
Network features like echo cancellers, automatic gain control and voice-activity detection are tuned for conversations, not machine tones. They can ramp levels, gate “silence” (i.e. quiet parts of a protocol) or mis-treat long tone sequences as noise, which is disastrous for BS8521/Contact-ID bursts.

Telecom standards bodies now explicitly list DTMF-based telecare, security and lift alarm protocols as at-risk when carried over packet networks without special handling. 
NICC Standards
+1

Why this project uses FSK-over-audio instead of DTMF

Rather than sending the alarm payload as a sequence of DTMF digits, GibberLink uses FSK-style audio modulation (via ggwave) to carry the NOWIP XML as a short, robust data burst.

FSK isn’t new – it underpins things like early telephone modems and many caller ID implementations – but it is better suited to unreliable, packetised voice paths than naked DTMF digit streams. 
O'Reilly Media
+1

Why FSK is more robust than DTMF in an all-IP world

1. Continuous data stream vs. fragile digit bursts

DTMF encodes each digit as a separate tone pair with strict min/max durations and gaps; lose or mangle one burst and you lose that digit.

FSK treats the whole message as a continuous stream of symbols. Timing recovery is done over many cycles, so moderate jitter or small dropouts can be absorbed without losing framing.

2. Better use of redundancy and error checking

Classic telecare DTMF protocols largely rely on “did the sequence match or not?” with limited error detection and no retransmission inside the tone layer.

An FSK modem stream can carry framing, checksums/CRCs and even repetition or FEC, so the receiver can detect and often correct bit errors instead of silently mis-decoding the alarm payload.

3. Designed for distorted channels

Modem-style FSK demodulation correlates energy over time at known frequencies, making it more tolerant of level changes, some clipping and modest codec distortion than simple DTMF detectors which expect very clean dual tones.

ggwave in particular is built to survive consumer-grade audio paths (phone speakers, laptop mics), background noise and re-sampling, which is exactly the messy environment that BT Digital Voice and other VoIP paths create.

4. Codec-friendly tone design

DTMF uses a fixed set of 16 tone pairs defined decades ago; you’re stuck with those exact frequencies and levels.

An FSK scheme can be tuned to use frequency bands and symbol rates that are known to pass reasonably well through G.711 and many modern voice chains, improving end-to-end survivability even when the network isn’t “data-aware”.

5. More payload per call

Telecare DTMF protocols were designed for very small messages; they become unwieldy once you need richer metadata or IP-style addressing.

FSK can carry arbitrary bytes, so you can embed full NOWIP/SCAIP-style payloads in one shot instead of stretching DTMF to breaking point. 
appello.co.uk
+1

But VoIP can still hurt any analogue signal

Even with FSK, the VoIP path can still damage the signal if:

Aggressive low-bit-rate codecs (e.g. G.729, heavily compressed mobile profiles) are used

VAD/DTX chops up what looks like “non-speech”

Packet loss is severe

This demo doesn’t magically make analogue perfectly safe – it shows that an FSK-based audio modem (ggwave) is significantly more tolerant than legacy DTMF telecare signalling, buying resilience and headroom while the sector completes its migration to fully digital, IP-native protocols.
