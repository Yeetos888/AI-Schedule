import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from 'date-fns';

export function formatDateTime(isoString: string): string {
  try {
    return format(parseISO(isoString), 'MMM d, yyyy h:mm a');
  } catch {
    return isoString;
  }
}

export function formatTime(isoString: string): string {
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string): string {
  try {
    return format(parseISO(isoString), 'yyyy-MM-dd');
  } catch {
    return isoString;
  }
}

export function formatHumanDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEE, MMM d');
  } catch {
    return dateStr;
  }
}

export function getTodayIsoDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
}

/**
 * Checks if two intervals [start1, end1] and [start2, end2] overlap
 */
export function hasOverlap(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date
): boolean {
  const sA = typeof startA === 'string' ? parseISO(startA).getTime() : startA.getTime();
  const eA = typeof endA === 'string' ? parseISO(endA).getTime() : endA.getTime();
  const sB = typeof startB === 'string' ? parseISO(startB).getTime() : startB.getTime();
  const eB = typeof endB === 'string' ? parseISO(endB).getTime() : endB.getTime();

  return sA < eB && sB < eA;
}

/**
 * Validates whether a time block falls within working hours
 */
export function isWithinWorkingHours(
  startIso: string,
  endIso: string,
  startHHMM: string, // e.g. "09:00"
  endHHMM: string    // e.g. "18:00"
): boolean {
  try {
    const sDate = parseISO(startIso);
    const eDate = parseISO(endIso);

    const [startH, startM] = startHHMM.split(':').map(Number);
    const [endH, endM] = endHHMM.split(':').map(Number);

    const sMinutes = sDate.getHours() * 60 + sDate.getMinutes();
    const eMinutes = eDate.getHours() * 60 + eDate.getMinutes();

    const minMinutes = startH * 60 + startM;
    const maxMinutes = endH * 60 + endM;

    return sMinutes >= minMinutes && eMinutes <= maxMinutes;
  } catch {
    return true;
  }
}

/**
 * Calculates current and longest streaks for a habit log array (dates in 'YYYY-MM-DD')
 */
export function calculateHabitStreaks(logs: string[]): {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  totalCompletions: number;
} {
  if (!logs || logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, completedToday: false, totalCompletions: 0 };
  }

  const todayStr = getTodayIsoDate();
  const completedToday = logs.includes(todayStr);

  // Deduplicate and sort descending
  const sortedDates = Array.from(new Set(logs)).sort().reverse();
  const totalCompletions = sortedDates.length;

  let currentStreak = 0;
  let checkDate = new Date();

  // If not completed today, check if yesterday was completed
  if (!completedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (sortedDates.includes(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Longest streak
  const chronological = Array.from(new Set(logs)).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of chronological) {
    const currDate = parseISO(dateStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = differenceInDays(currDate, prevDate);
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = currDate;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    completedToday,
    totalCompletions,
  };
}

/**
 * Returns array of YYYY-MM-DD for the current week (Sun-Sat or Mon-Sun)
 */
export function getCurrentWeekDays(): { dateStr: string; dayName: string; dayNumber: number }[] {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return days.map((d) => ({
    dateStr: format(d, 'yyyy-MM-dd'),
    dayName: format(d, 'EEE'),
    dayNumber: d.getDate(),
  }));
}
