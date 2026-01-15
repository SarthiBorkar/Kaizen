import { InlineKeyboard } from 'grammy';

// Onboarding: Reminder time selection
export function reminderTimeKeyboard() {
  return new InlineKeyboard()
    .text('8:00 AM', 'reminder_8')
    .row()
    .text('6:00 PM', 'reminder_18')
    .row()
    .text('8:00 PM', 'reminder_20')
    .row()
    .text('10:00 PM', 'reminder_22');
}

// Check-in: Enhanced options
export function checkinKeyboard(groupId: number) {
  return new InlineKeyboard()
    .text('🎉 Crushed it!', `checkin_crushed_${groupId}`)
    .row()
    .text('✅ Completed', `checkin_yes_${groupId}`)
    .row()
    .text('💪 Partial', `checkin_partial_${groupId}`)
    .row()
    .text('❌ Missed', `checkin_no_${groupId}`);
}

// Simple Yes/No for reminders (keep this for backward compatibility)
export function simpleCheckinKeyboard(groupId: number) {
  return new InlineKeyboard()
    .text('✅ Yes, I did it!', `checkin_yes_${groupId}`)
    .row()
    .text('❌ No, I missed it', `checkin_no_${groupId}`);
}

// View: Select time period
export function viewPeriodKeyboard(groupId: number) {
  return new InlineKeyboard()
    .text('Last 7 days', `view_7_${groupId}`)
    .text('Last 30 days', `view_30_${groupId}`)
    .row()
    .text('This week', `view_week_${groupId}`)
    .text('This month', `view_month_${groupId}`);
}

// Group selection keyboard (when user has multiple groups)
export function groupSelectionKeyboard(groups: Array<{ id: number; name: string }>) {
  const keyboard = new InlineKeyboard();

  for (const group of groups) {
    keyboard.text(group.name, `select_group_${group.id}`).row();
  }

  return keyboard;
}

// Main menu keyboard
export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text('✓ Check In', 'menu_checkin')
    .text('📊 View', 'menu_view')
    .row()
    .text('📈 Stats', 'menu_stats')
    .text('💬 Quote', 'menu_quote')
    .row()
    .text('👥 Groups', 'menu_groups')
    .text('❓ Help', 'menu_help');
}
