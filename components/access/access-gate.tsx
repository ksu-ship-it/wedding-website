"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

const SECRET_WORD = "lenny";

type AccessGateProps = {
  children: ReactNode;
};

export function AccessGate({ children }: AccessGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [secretWord, setSecretWord] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  }, [isUnlocked]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isCorrect = secretWord.trim().toLowerCase() === SECRET_WORD;

    setHasError(!isCorrect);
    if (isCorrect) {
      setIsUnlocked(true);
    }
  }

  return (
    <>
      <div
        aria-hidden={!isUnlocked}
        className={isUnlocked ? "" : "pointer-events-none select-none blur-md"}
      >
        {children}
      </div>

      {!isUnlocked ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-blue/45 p-6 backdrop-blur-sm">
          <section
            aria-labelledby="access-title"
            className="w-full max-w-md rounded-3xl bg-cream p-8 text-center shadow-2xl md:p-10"
          >
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-copper">Private celebration</p>
            <h1 id="access-title" className="mt-4 font-serif text-5xl leading-none text-deep-blue">
              Enter the secret word
            </h1>
            <p className="mt-5 text-sm leading-6 text-deep-blue/70">
              This invitation is for friends and family.
            </p>
            <form className="mt-8" onSubmit={handleSubmit}>
              <label htmlFor="secret-word" className="sr-only">
                Secret word
              </label>
              <input
                id="secret-word"
                name="secret-word"
                type="password"
                autoComplete="off"
                autoFocus
                value={secretWord}
                onChange={(event) => {
                  setSecretWord(event.target.value);
                  setHasError(false);
                }}
                placeholder="Secret word"
                aria-invalid={hasError}
                className="min-h-12 w-full rounded-xl border border-dusty-blue bg-white/70 px-4 text-center text-deep-blue outline-none focus:border-coral focus:ring-2 focus:ring-coral/30"
              />
              <button
                type="submit"
                className="mt-4 min-h-12 w-full rounded-xl bg-deep-blue px-5 text-sm font-medium text-cream transition-colors hover:bg-coral"
              >
                Enter
              </button>
              {hasError ? (
                <p role="alert" className="mt-4 text-sm text-coral">
                  That secret word is not quite right.
                </p>
              ) : null}
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}