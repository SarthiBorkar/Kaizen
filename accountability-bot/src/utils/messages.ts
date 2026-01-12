// Welcome and onboarding messages
export const WELCOME_MESSAGE = `
Welcome to Kaizen! 🎯

Kaizen means "continuous improvement" - and that's exactly what we're here for.

Research shows that when you commit to a goal in a group, your success rate jumps from 10% to 95%. Let's make it happen!

I'll help you:
✓ Set your daily commitment
✓ Check in every day
✓ Stay accountable with your group
✓ Track your progress

Ready to start?
`;

export const COMMITMENT_PROMPT = `
What's your daily commitment?

Make it simple and specific:
✓ "Exercise for 30 minutes"
✓ "Write 500 words"
✓ "No social media before noon"
✓ "Meditate for 10 minutes"

What will you commit to doing every day?
`;

export const REMINDER_TIME_PROMPT = `
When should I remind you to check in?

Pick a time that works best for you:
`;

export const ONBOARDING_COMPLETE = (commitment: string, reminderHour: number) => `
Perfect! You're all set up! 🎉

Your commitment: "${commitment}"
Daily reminder: ${formatHour(reminderHour)}

Now, let's get you into a group! You can:
1️⃣ Create a new group: /creategroup
2️⃣ Join an existing group: /joingroup

Social accountability is the secret sauce - don't skip this step!
`;

// Check-in messages
export const CHECKIN_PROMPT = (commitment: string) => `
Time to check in! 📝

Did you complete your commitment today?
"${commitment}"
`;

export const CHECKIN_SUCCESS = `
Awesome! Way to go! 🎉

Your streak continues. Keep up the great work!
`;

export const CHECKIN_MISSED = `
No worries - tomorrow is a fresh start! 💪

Remember: Progress, not perfection. You've got this!
`;

export const ALREADY_CHECKED_IN = `
You've already checked in today! ✓

Come back tomorrow to keep your streak going.
`;

// Group messages
export const GROUP_CREATED = (inviteCode: string) => `
Group created! 🎊

Share this invite code with your accountability partners:
\`${inviteCode}\`

They can join by using: /joingroup ${inviteCode}

The more people in your group, the stronger the accountability!
`;

export const GROUP_JOINED = (groupName: string) => `
Welcome to ${groupName}! 👋

You're now part of an accountability group.

Your daily check-ins will be visible to everyone here, creating that powerful social accountability that drives results.

Start your first check-in: /checkin
`;

// Stats and progress messages
export const NO_CHECKINS_YET = `
No check-ins yet!

Start building your streak today: /checkin
`;

export const STATS_MESSAGE = (stats: {
  totalDays: number;
  completedDays: number;
  successRate: number;
  currentStreak: number;
  lastCheckin: string;
}) => `
📊 Your Statistics

Total days tracked: ${stats.totalDays}
Days completed: ${stats.completedDays}
Success rate: ${stats.successRate}%
Current streak: ${stats.currentStreak} days 🔥

Last check-in: ${stats.lastCheckin}

${stats.successRate >= 80 ? 'Outstanding! 🌟' : stats.successRate >= 60 ? 'Great progress! Keep it up! 💪' : 'Every day is progress. Keep going! 🎯'}
`;

// Helper messages
export const NO_GROUPS = `
You're not in any groups yet!

Create one: /creategroup
Join one: /joingroup <code>
`;

export const MULTIPLE_GROUPS_SELECT = `
You're in multiple groups! Which one?
`;

// Error messages
export const ERROR_GENERIC = `
Oops! Something went wrong. Please try again.

If the problem persists, contact support.
`;

export const ERROR_NO_COMMITMENT = `
You haven't set your commitment yet!

Start with: /start
`;

// Helper functions
function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatStreak(days: number): string {
  if (days === 0) return 'Start your streak today!';
  if (days === 1) return '1 day 🔥';
  return `${days} days 🔥`;
}
