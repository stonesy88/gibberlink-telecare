"use client";
import { ATMConsole } from "../components/ATMConsole";

export default function Home() {
  return (
    <div className="min-h-screen p-6 sm:p-10 flex flex-col gap-10">
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold">GibberLink Telecare</h1>
        <p className="text-muted-foreground max-w-3xl">
          An internal joke project to show how we might “fix” the UK&apos;s broken telecare stack—thousands of aging analog alarm devices still firing DTMF over IP. 
          Here we spoof a tiny ATM alarm flow over ggwave: one tab acts as the responder (server), the other as the device (client).
        </p>
      </section>

      <section className="flex justify-center">
        <ATMConsole />
      </section>
    </div>
  );
}
