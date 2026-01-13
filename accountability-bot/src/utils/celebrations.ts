// Celebration messages and animations for milestones

import { ranks, seasons } from './visuals.js';

export interface Milestone {
  type: 'rank' | 'streak' | 'special';
  days: number;
  title: string;
  message: string;
  animation: string;
}

// Check if user just hit a milestone
export function checkMilestone(previousStreak: number, currentStreak: number): Milestone | null {
  // Rank-based milestones
  for (const rank of ranks) {
    if (currentStreak >= rank.minDays && previousStreak < rank.minDays) {
      return {
        type: 'rank',
        days: rank.minDays,
        title: `${rank.emoji} ${rank.name} Achieved!`,
        message: getRankAchievementMessage(rank.name, rank.emoji),
        animation: getRankAnimation(rank.emoji),
      };
    }
  }

  // Season transitions
  for (const season of seasons) {
    if (currentStreak >= season.minDays && previousStreak < season.minDays) {
      return {
        type: 'special',
        days: season.minDays,
        title: `${season.emoji} ${season.name} Season!`,
        message: getSeasonMessage(season.name, season.emoji, season.kanji),
        animation: getSeasonAnimation(season.emoji),
      };
    }
  }

  // Special streak milestones (that don't align with ranks)
  const specialMilestones = [1, 3, 10, 30, 60, 180, 270, 500, 1000];
  for (const milestone of specialMilestones) {
    if (currentStreak === milestone && !ranks.some((r) => r.minDays === milestone)) {
      return {
        type: 'streak',
        days: milestone,
        title: `🔥 ${milestone}-Day Streak!`,
        message: getStreakMessage(milestone),
        animation: getStreakAnimation(milestone),
      };
    }
  }

  return null;
}

// Rank achievement messages
function getRankAchievementMessage(rankName: string, emoji: string): string {
  const messages: Record<string, string> = {
    'White Belt': `
Welcome to your journey! ${emoji}

The white belt represents a blank canvas - your potential waiting to be realized.

"A journey of a thousand miles begins with a single step."
    `,
    'Yellow Belt': `
You've earned your Yellow Belt! ${emoji}

7 days of consistency shows commitment. The foundation is being built!

"塵も積もれば山となる"
(Even dust, when piled up, becomes a mountain)
    `,
    'Orange Belt': `
Orange Belt unlocked! ${emoji}

21 days! You're building real habits now. The momentum is growing!

"継続は力なり"
(Continuation is power)
    `,
    'Green Belt': `
Green Belt achieved! ${emoji}

50 days of dedication! You're now a true practitioner.

"習うより慣れろ"
(Practice makes perfect)
    `,
    'Blue Belt': `
Blue Belt mastery! ${emoji}

100 days! You've proven yourself as an expert in consistency.

"石の上にも三年"
(Perseverance and patience lead to success)
    `,
    'Brown Belt': `
Brown Belt earned! ${emoji}

200 days of unwavering commitment. You're approaching mastery!

"名人は人を謗らず"
(A master does not criticize others)
    `,
    'Black Belt': `
BLACK BELT SENSEI! ${emoji}

365+ days! You are a master of Kaizen. An inspiration to all!

"七転び八起き"
(Fall seven times, stand up eight)

You are now a SENSEI 🥋
    `,
  };

  return messages[rankName] || `Congratulations on achieving ${rankName}!`;
}

// Season transition messages
function getSeasonMessage(seasonName: string, emoji: string, kanji: string): string {
  const messages: Record<string, string> = {
    Spring: `
${emoji} Spring has arrived! (${kanji})

New beginnings bloom. Your journey is just starting, and already you're growing!

Like cherry blossoms, you're showing the beauty of fresh starts.
    `,
    Summer: `
${emoji} Welcome to Summer! (${kanji})

8 days! Your growth is thriving like summer's lush greenery.

The momentum is building. Feel the energy!
    `,
    Autumn: `
${emoji} Autumn's Harvest! (${kanji})

31 days of consistent effort! You're reaping what you've sown.

The fruits of your labor are showing. Beautiful consistency!
    `,
    Winter: `
${emoji} Winter's Resilience! (${kanji})

90 days! Like winter's steadfast strength, you've proven unshakeable.

Only the truly committed reach this season. Respect!
    `,
  };

  return messages[seasonName] || `Welcome to ${seasonName}!`;
}

// Streak-specific messages
function getStreakMessage(days: number): string {
  if (days === 1) {
    return `
🎉 Your first check-in! 🎉

Every master was once a beginner.
Every expert was once a novice.

You've taken the first step. That's what counts!
    `;
  }

  if (days === 3) {
    return `
🌟 3-day streak! 🌟

Three days in a row! The habit is forming.

"千里の道も一歩から"
(A journey of a thousand miles begins with a single step)
    `;
  }

  if (days === 10) {
    return `
💫 10-day streak! 💫

Double digits! You're building something real here.

The compound effect is starting to work its magic!
    `;
  }

  if (days === 30) {
    return `
🌠 One month streak! 🌠

30 consecutive days! This is no longer just motivation.
This is DISCIPLINE.

You're in the top 5% of people who start something!
    `;
  }

  if (days === 60) {
    return `
✨ 60-day streak! ✨

Two months of unwavering commitment!

You've proven that you're not just trying - you're DOING.
    `;
  }

  if (days === 180) {
    return `
🌟 Half-year milestone! 🌟

180 days! Six months of pure dedication!

You're an inspiration. This is mastery in action!
    `;
  }

  if (days === 270) {
    return `
💎 9-month diamond! 💎

270 days of consistency!

Most people quit by day 30. You're still here. Legendary!
    `;
  }

  if (days === 500) {
    return `
👑 500-DAY LEGEND! 👑

FIVE HUNDRED CONSECUTIVE DAYS!

You are in elite company. Fewer than 0.1% reach this level.

You are a LIVING EXAMPLE of Kaizen!
    `;
  }

  if (days === 1000) {
    return `
🏆 1000 DAYS - IMMORTAL STATUS 🏆

ONE THOUSAND DAYS!

There are no words. You have transcended.

You ARE Kaizen personified. 改善
    `;
  }

  return `${days}-day streak! Keep the fire burning! 🔥`;
}

// Animations
function getRankAnimation(emoji: string): string {
  return `
✨ ✨ ✨ ✨ ✨
  ${emoji} ${emoji} ${emoji}
✨ ✨ ✨ ✨ ✨
  `;
}

function getSeasonAnimation(emoji: string): string {
  return `
${emoji} ${emoji} ${emoji} ${emoji} ${emoji}
${emoji}           ${emoji}
${emoji}           ${emoji}
${emoji} ${emoji} ${emoji} ${emoji} ${emoji}
  `;
}

function getStreakAnimation(days: number): string {
  if (days >= 100) {
    return `
🔥 🔥 🔥 🔥 🔥
🔥 🌟 🌟 🌟 🔥
🔥 🌟 ⚡ 🌟 🔥
🔥 🌟 🌟 🌟 🔥
🔥 🔥 🔥 🔥 🔥
    `;
  }

  if (days >= 30) {
    return `
✨ ✨ ✨ ✨ ✨
  🔥 🔥 🔥
  🔥 🔥 🔥
✨ ✨ ✨ ✨ ✨
    `;
  }

  return `
  ✨ 🔥 ✨
  🔥 🔥 🔥
  ✨ 🔥 ✨
  `;
}

// Format celebration message
export function formatCelebration(milestone: Milestone): string {
  let message = milestone.animation + '\n';
  message += milestone.title + '\n';
  message += '━━━━━━━━━━━━━━━━━━━━━\n';
  message += milestone.message;
  return message;
}
