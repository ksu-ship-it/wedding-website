export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
};

const millisecondsPerSecond = 1000;
const millisecondsPerMinute = millisecondsPerSecond * 60;
const millisecondsPerHour = millisecondsPerMinute * 60;
const millisecondsPerDay = millisecondsPerHour * 24;

export function getCountdownParts(now: number, target: number): CountdownParts {
  const remaining = Math.max(0, target - now);

  if (remaining === 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, completed: true };
  }

  return {
    days: Math.floor(remaining / millisecondsPerDay),
    hours: Math.floor((remaining % millisecondsPerDay) / millisecondsPerHour),
    minutes: Math.floor((remaining % millisecondsPerHour) / millisecondsPerMinute),
    seconds: Math.floor((remaining % millisecondsPerMinute) / millisecondsPerSecond),
    completed: false,
  };
}
