// Visual progress displays with ASCII art and emojis

interface CheckinData {
  check_date: string;
  completed: boolean;
}

// Generate ASCII calendar view for the current month
export function generateMonthlyCalendar(checkins: CheckinData[]): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Get month name
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month];

  // Create a map of dates to completion status
  const checkinMap = new Map<string, boolean>();
  checkins.forEach((c) => {
    checkinMap.set(c.check_date, c.completed);
  });

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let calendar = `📅 ${monthName} ${year}\n\n`;
  calendar += 'Mo Tu We Th Fr Sa Su\n';

  // Add padding for first week
  let dayCount = 1;
  let line = '';

  // Adjust for Monday start (0=Sun, 1=Mon, ..., 6=Sat)
  const mondayFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < mondayFirstDay; i++) {
    line += '   ';
  }

  // Fill in the days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date();
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isFuture = new Date(dateStr) > today;

    let dayStr = String(day).padStart(2, ' ');

    if (isFuture) {
      dayStr = '  ·'; // Future days
    } else if (checkinMap.has(dateStr)) {
      dayStr = checkinMap.get(dateStr) ? ' ✓' : ' ✗';
    } else if (!isToday) {
      dayStr = ' ○'; // No check-in recorded
    } else {
      dayStr = ` ${day}`; // Today (not checked in yet)
    }

    line += dayStr;

    if ((mondayFirstDay + day) % 7 === 0) {
      calendar += line + '\n';
      line = '';
    } else {
      line += ' ';
    }
  }

  if (line.trim()) {
    calendar += line + '\n';
  }

  calendar += '\n✓ = Done  ✗ = Missed  ○ = No data  · = Future';

  return calendar;
}

// Generate weekly streak visualization
export function generateWeeklyStreak(checkins: CheckinData[], days: number = 7): string {
  const today = new Date();
  const streakDays: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const checkin = checkins.find((c) => c.check_date === dateStr);

    if (checkin) {
      streakDays.push(checkin.completed ? '✅' : '❌');
    } else {
      streakDays.push('⬜');
    }
  }

  // Format in rows of 7
  let visual = '📊 Your Journey:\n\n';
  for (let i = 0; i < streakDays.length; i += 7) {
    visual += streakDays.slice(i, i + 7).join('') + '\n';
  }

  return visual;
}

// Generate progress bar
export function generateProgressBar(completed: number, total: number, length: number = 20): string {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${Math.round(percentage)}%`;
}

// Get rank/belt based on streak
export interface Rank {
  name: string;
  emoji: string;
  minDays: number;
  color: string;
}

export const ranks: Rank[] = [
  { name: 'White Belt', emoji: '🤍', minDays: 0, color: 'Beginner' },
  { name: 'Yellow Belt', emoji: '🟡', minDays: 7, color: 'Novice' },
  { name: 'Orange Belt', emoji: '🟠', minDays: 21, color: 'Apprentice' },
  { name: 'Green Belt', emoji: '🟢', minDays: 50, color: 'Practitioner' },
  { name: 'Blue Belt', emoji: '🔵', minDays: 100, color: 'Expert' },
  { name: 'Brown Belt', emoji: '🟤', minDays: 200, color: 'Master' },
  { name: 'Black Belt', emoji: '⚫', minDays: 365, color: 'Sensei' },
];

export function getRankForStreak(streak: number): Rank {
  // Find the highest rank the user has achieved
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (streak >= ranks[i].minDays) {
      return ranks[i];
    }
  }
  return ranks[0];
}

export function getNextRank(currentStreak: number): { rank: Rank; daysUntil: number } | null {
  for (const rank of ranks) {
    if (currentStreak < rank.minDays) {
      return {
        rank,
        daysUntil: rank.minDays - currentStreak,
      };
    }
  }
  return null; // Already at max rank
}

// Get season based on streak
export interface Season {
  name: string;
  emoji: string;
  minDays: number;
  kanji: string;
}

export const seasons: Season[] = [
  { name: 'Spring', emoji: '🌸', minDays: 0, kanji: '春' },
  { name: 'Summer', emoji: '🌿', minDays: 8, kanji: '夏' },
  { name: 'Autumn', emoji: '🍂', minDays: 31, kanji: '秋' },
  { name: 'Winter', emoji: '❄️', minDays: 90, kanji: '冬' },
];

export function getSeasonForStreak(streak: number): Season {
  for (let i = seasons.length - 1; i >= 0; i--) {
    if (streak >= seasons[i].minDays) {
      return seasons[i];
    }
  }
  return seasons[0];
}

// Format streak with fire emoji
export function formatStreakDisplay(streak: number): string {
  if (streak === 0) return '🌱 Start your journey today!';
  if (streak === 1) return '🔥 1 day streak!';
  if (streak < 7) return `🔥 ${streak} days streak!`;
  if (streak < 30) return `🔥🔥 ${streak} days streak!`;
  if (streak < 100) return `🔥🔥🔥 ${streak} days streak!`;
  return `🔥🔥🔥🔥 ${streak} days streak! Legendary!`;
}

// Generate rank card
export function generateRankCard(streak: number, totalDays: number, completedDays: number): string {
  const rank = getRankForStreak(streak);
  const nextRank = getNextRank(streak);
  const season = getSeasonForStreak(streak);
  const successRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  let card = '═══════════════════════\n';
  card += `     ${rank.emoji} ${rank.name.toUpperCase()} ${rank.emoji}\n`;
  card += '═══════════════════════\n\n';
  card += `${season.emoji} Season: ${season.name} (${season.kanji})\n`;
  card += `🔥 Current Streak: ${streak} days\n`;
  card += `📊 Success Rate: ${successRate}%\n`;
  card += `📈 Total Days: ${totalDays}\n`;

  if (nextRank) {
    card += `\n🎯 Next Rank: ${nextRank.rank.emoji} ${nextRank.rank.name}\n`;
    card += `   ${generateProgressBar(streak, nextRank.rank.minDays, 15)}\n`;
    card += `   ${nextRank.daysUntil} days to go!`;
  } else {
    card += '\n\n👑 MAX RANK ACHIEVED! 👑\n';
    card += '   You are a true Sensei!';
  }

  return card;
}
