// Get today's date in ISO format (YYYY-MM-DD)
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Get date N days ago
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Calculate streak from check-ins
export function calculateStreak(checkins: Array<{ check_date: string; completed: boolean }>): number {
  if (checkins.length === 0) return 0;

  // Sort by date descending
  const sorted = [...checkins].sort((a, b) => b.check_date.localeCompare(a.check_date));

  let streak = 0;
  let currentDate = new Date();

  for (const checkin of sorted) {
    const checkinDate = new Date(checkin.check_date);
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - streak);

    // Normalize to just date (ignore time)
    const checkinDateStr = checkinDate.toISOString().split('T')[0];
    const expectedDateStr = expectedDate.toISOString().split('T')[0];

    if (checkinDateStr === expectedDateStr && checkin.completed) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Format time as HH:MM AM/PM
export function formatTime(hour: number, minute: number = 0): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

// Check if a date is today
export function isToday(dateString: string): boolean {
  return dateString === getTodayDate();
}

// Get start of current week (Monday)
export function getWeekStart(): string {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  date.setDate(diff);
  return date.toISOString().split('T')[0];
}

// Get start of current month
export function getMonthStart(): string {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

// Generate random invite code (6 characters)
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
