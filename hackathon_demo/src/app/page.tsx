"use client";
import { ATMConsole } from "../components/ATMConsole";

export default function Home() {
  return (
    <div className="min-h-screen p-6 sm:p-10 flex flex-col gap-10">
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold">GibberLink Telecare</h1>
        <p className="text-muted-foreground max-w-3xl">
          UK analog telecare alarm failures are a growing concern during the digital phone network switchover. Old analog alarm boxes send DTMF over new IP lines and calls can distort, delay, or simply fail—reported failure rates range from ~2.3%–3.4% up to 5%+. 
          This project is a spoof. We&apos;re demonstrating ggwave (FSK) as a hypothetical way to ship ATM transmissions across VoIP networks—since industry tones rely on strict timing, which newer networks often deform and break.
        </p>
      </section>

      <section className="flex justify-center">
        <ATMConsole />
      </section>
    </div>
  );
}
