"use client";

import { useEffect, useState } from "react";

import { getCountdownParts, type CountdownParts } from "@/lib/countdown";

type CountdownTimerProps = {
  targetDateTime: string;
};

const placeholderParts: CountdownParts = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  completed: false,
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function CountdownTimer({ targetDateTime }: CountdownTimerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [parts, setParts] = useState(placeholderParts);

  useEffect(() => {
    const target = new Date(targetDateTime).getTime();

    function updateCountdown() {
      setParts(getCountdownParts(Date.now(), target));
    }

    const initialUpdateId = window.setTimeout(() => {
      setIsMounted(true);
      updateCountdown();
    }, 0);
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearTimeout(initialUpdateId);
      window.clearInterval(intervalId);
    };
  }, [targetDateTime]);

  if (isMounted && parts.completed) {
    return (
      <p className="font-serif text-3xl text-deep-blue" role="status">
        The day has arrived
      </p>
    );
  }

  return (
    <div
      aria-label={isMounted ? "Countdown to the wedding" : "Countdown loading"}
      className="grid grid-cols-4 gap-2"
      role="timer"
    >
      {([
        [parts.days, "days"],
        [parts.hours, "hours"],
        [parts.minutes, "minutes"],
        [parts.seconds, "seconds"],
      ] as Array<[number, string]>).map(([value, label]) => (
        <div key={label} className="border-t border-coral/60 pt-3">
          <p className="font-serif text-3xl text-deep-blue md:text-4xl">
            {isMounted ? (label === "days" ? value : pad(value)) : "--"}
          </p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-copper">{label}</p>
        </div>
      ))}
    </div>
  );
}
