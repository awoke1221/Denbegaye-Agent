'use client';

import { useEffect, useRef, useState } from 'react';

const LOGIN_FAILURE_KEY = 'login:failedAttempts';
const LOGIN_COOLDOWN_KEY = 'login:cooldownUntil';
const LOGIN_MAX_FAILED_ATTEMPTS = 4;
const LOGIN_COOLDOWN_SECONDS = 45;

interface LoginProtectionState {
  cooldownMessage: string;
  cooldownSeconds: number;
  failedAttempts: number;
  isCoolingDown: boolean;
  recordFailedAttempt: () => void;
  clearProtection: () => void;
}

const getAttemptMessage = (attemptCount: number) => {
  if (attemptCount <= 0) {
    return '';
  }

  const remainingAttempts = Math.max(0, LOGIN_MAX_FAILED_ATTEMPTS - attemptCount);
  return `That attempt didn’t work. ${remainingAttempts} more failed attempt${
    remainingAttempts === 1 ? '' : 's'
  } will trigger a brief cooldown.`;
};

const getCooldownMessage = (remainingSeconds: number) =>
  `Too many login attempts. Please wait ${remainingSeconds} second${
    remainingSeconds === 1 ? '' : 's'
  } before trying again.`;

export function useLoginProtection(): LoginProtectionState {
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
      window.localStorage.removeItem(LOGIN_FAILURE_KEY);
      window.localStorage.removeItem(LOGIN_COOLDOWN_KEY);
    }
  };

  const activateCooldown = (attemptCount: number, until: number) => {
    cooldownUntilRef.current = until;
    setFailedAttempts(attemptCount);
    setCooldownSeconds(LOGIN_COOLDOWN_SECONDS);
    setCooldownMessage(getCooldownMessage(LOGIN_COOLDOWN_SECONDS));

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOGIN_FAILURE_KEY, attemptCount.toString());
      window.localStorage.setItem(LOGIN_COOLDOWN_KEY, until.toString());
    }
  };

  const updateAttemptState = (attemptCount: number) => {
    setFailedAttempts(attemptCount);
    setCooldownMessage(getAttemptMessage(attemptCount));

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOGIN_FAILURE_KEY, attemptCount.toString());
      window.localStorage.removeItem(LOGIN_COOLDOWN_KEY);
    }
  };

  const recordFailedAttempt = () => {
    setFailedAttempts(previous => {
      const nextAttempt = previous + 1;

      if (nextAttempt >= LOGIN_MAX_FAILED_ATTEMPTS) {
        const until = Date.now() + LOGIN_COOLDOWN_SECONDS * 1000;
        activateCooldown(nextAttempt, until);
      } else {
        updateAttemptState(nextAttempt);
      }

      return nextAttempt;
    });
  };

  const loadProtectionState = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedAttempts = Number(window.localStorage.getItem(LOGIN_FAILURE_KEY) || '0');
    const storedUntil = Number(window.localStorage.getItem(LOGIN_COOLDOWN_KEY) || '0');
    const now = Date.now();

    if (storedUntil > now) {
      const remaining = Math.max(0, Math.ceil((storedUntil - now) / 1000));
      cooldownUntilRef.current = storedUntil;
      setFailedAttempts(storedAttempts);
      setCooldownSeconds(remaining);
      setCooldownMessage(getCooldownMessage(remaining));
      return;
    }

    if (storedAttempts >= LOGIN_MAX_FAILED_ATTEMPTS) {
      clearProtection();
      return;
    }

    if (storedAttempts > 0) {
      setFailedAttempts(storedAttempts);
      setCooldownSeconds(0);
      setCooldownMessage(getAttemptMessage(storedAttempts));
      return;
    }

    clearProtection();
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
        setCooldownMessage(getCooldownMessage(remaining));
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
