/**
 * AIC Hola Church Schedule & Dynamic Gathering Timing
 *
 * Normal Gathering Schedule (East Africa Time / UTC+3):
 * - Sunday 1st Service (Swahili): 8:30 AM – 10:15 AM
 * - Sunday 2nd Service (English): 10:45 AM – 12:45 PM
 * - Sunday Watoto Church: 8:30 AM & 10:45 AM
 * - Wednesday Midweek Fellowship & Prayer: 5:00 PM – 6:30 PM
 */

export function getNextServiceInfo() {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 Monday, ..., 3 Wednesday, 6 Saturday
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const timeInMinutes = currentHour * 60 + currentMinute;

  // 1. Check if a service is live right now
  // Sunday live window: 8:30 AM (510 min) to 12:45 PM (765 min)
  if (day === 0 && timeInMinutes >= 510 && timeInMinutes <= 765) {
    return {
      isLiveNow: true,
      serviceName: "Sunday Divine Service &bull; In Session",
      badge: "LIVE NOW",
      targetTime: null,
      timeRemaining: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    };
  }

  // Wednesday live window: 5:00 PM (1020 min) to 6:30 PM (1110 min)
  if (day === 3 && timeInMinutes >= 1020 && timeInMinutes <= 1110) {
    return {
      isLiveNow: true,
      serviceName: "Wednesday Midweek Prayer &bull; In Session",
      badge: "LIVE NOW",
      targetTime: null,
      timeRemaining: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    };
  }

  // 2. Otherwise calculate next upcoming gathering target time
  let target = new Date(now);

  if (day === 0) {
    // If it's early Sunday morning before 8:30 AM
    if (timeInMinutes < 510) {
      target.setHours(8, 30, 0, 0);
    } else {
      // Sunday afternoon: next is Wednesday 5:00 PM (3 days later)
      target.setDate(now.getDate() + 3);
      target.setHours(17, 0, 0, 0);
    }
  } else if (day < 3) {
    // Mon, Tue: Next is Wednesday 5:00 PM
    const daysUntilWed = 3 - day;
    target.setDate(now.getDate() + daysUntilWed);
    target.setHours(17, 0, 0, 0);
  } else if (day === 3) {
    // Wednesday before 5:00 PM
    if (timeInMinutes < 1020) {
      target.setHours(17, 0, 0, 0);
    } else {
      // Wednesday night: Next is Sunday 8:30 AM (4 days later)
      target.setDate(now.getDate() + 4);
      target.setHours(8, 30, 0, 0);
    }
  } else {
    // Thu (4), Fri (5), Sat (6): Next is Sunday 8:30 AM
    const daysUntilSun = 7 - day;
    target.setDate(now.getDate() + daysUntilSun);
    target.setHours(8, 30, 0, 0);
  }

  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isSundayNext = target.getDay() === 0;

  return {
    isLiveNow: false,
    serviceName: isSundayNext
      ? "Sunday Gathering: Swahili 8:30 AM &bull; English 10:45 AM"
      : "Midweek Gathering: Wednesday 5:00 PM",
    badge: isSundayNext ? "NEXT SUNDAY GATHERING" : "NEXT MIDWEEK PRAYER",
    targetTime: target,
    timeRemaining: { days, hours, minutes, seconds },
  };
}

