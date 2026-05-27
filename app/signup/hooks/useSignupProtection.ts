'use client';

import { useEffect, useRef, useState } from 'react';

const SIGNUP_FAILURE_KEY = 'signup:failedAttempts';
const SIGNUP_COOLDOWN_KEY = 'signup:cooldownUntil';
const SIGNUP_MAX_FAILED_ATTEMPTS = 4;
const SIGNUP_COOLDOWN_SECONDS = 60;

export interface SignupProtectionState {
  cooldownMessage: string;
  cooldownSeconds: number;
  failedAttempts: number;
  isCoolingDown: boolean;
  recordFailedAttempt: () => void;
  clearProtection: () => void;
}

export function useSignupProtection(): SignupProtectionState {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [cooldownMessage, setCooldownMessage] = useState('');
  const cooldownUntilRef = useRef<number | null>(null);

  const clearProtection = () => {
    setFailedAttempts(0);
    setCooldownSeconds(0);
    setCooldownMessage('');
    cooldownUntilRef.current = null;

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SIGNUP_FAILURE_KEY);
      window.localStorage.removeItem(SIGNUP_COOLDOWN_KEY);
    }
  };

  const setProtectionState = (attemptCount: number, until?: number) => {
    setFailedAttempts(attemptCount);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIGNUP_FAILURE_KEY, attemptCount.toString());
    }

    if (until) {
      cooldownUntilRef.current = until;
      setCooldownSeconds(SIGNUP_COOLDOWN_SECONDS);
      setCooldownMessage(
        `Too many signup attempts. Please wait ${SIGNUP_COOLDOWN_SECONDS} seconds before trying again.`
      );
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SIGNUP_COOLDOWN_KEY, until.toString());
      }
      return;
    }

    setCooldownMessage(
      `That attempt didn’t work. ${SIGNUP_MAX_FAILED_ATTEMPTS - attemptCount} more failed attempt${
        attemptCount === SIGNUP_MAX_FAILED_ATTEMPTS - 1 ? '' : 's'
      } will trigger a brief cooldown.`
    );
  };

  const recordFailedAttempt = () => {
    setFailedAttempts(previous => {
      const nextAttempt = previous + 1;

      if (nextAttempt >= SIGNUP_MAX_FAILED_ATTEMPTS) {
        const until = Date.now() + SIGNUP_COOLDOWN_SECONDS * 1000;
        setProtectionState(nextAttempt, until);
      } else {
        setProtectionState(nextAttempt);
      }

      return nextAttempt;
    });
  };

  const loadProtectionState = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedAttempts = Number(window.localStorage.getItem(SIGNUP_FAILURE_KEY) || '0');
    const storedUntil = Number(window.localStorage.getItem(SIGNUP_COOLDOWN_KEY) || '0');
    setFailedAttempts(storedAttempts);

    if (storedUntil > Date.now()) {
      cooldownUntilRef.current = storedUntil;
      const remaining = Math.ceil((storedUntil - Date.now()) / 1000);
      setCooldownSeconds(remaining);
      setCooldownMessage(
        `Too many signup attempts. Please wait ${remaining} second${remaining === 1 ? '' : 's'} before trying again.`
      );
    }
  };

  useEffect(() => {
    loadProtectionState();
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0 || typeof window === 'undefined') {
      return;
    }

    const intervalId = window.setInterval(() => {
      const until = cooldownUntilRef.current;
      if (!until) {
        clearProtection();
        window.clearInterval(intervalId);
        return;
      }

      const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setCooldownSeconds(remaining);

      if (remaining > 0) {
        setCooldownMessage(
          `Too many signup attempts. Please wait ${remaining} second${remaining === 1 ? '' : 's'} before trying again.`
        );
      } else {
        clearProtection();
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [cooldownSeconds]);

  return {
    cooldownMessage,
    cooldownSeconds,
    failedAttempts,
    isCoolingDown: cooldownSeconds > 0,
    recordFailedAttempt,
    clearProtection,
  };
}
