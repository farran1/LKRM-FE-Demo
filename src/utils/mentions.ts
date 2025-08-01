// Utility functions for handling @mentions across the platform

export interface Coach {
  id: string;
  name: string;
  role: string;
  initials: string;
  email?: string;
}

export interface Mention {
  id: string;
  userId: string;
  userName: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedContent {
  text: string;
  mentions: Mention[];
  html: string;
}

// Mock coaches data - in a real app this would come from an API
export const COACHES: Coach[] = [
  { id: 'cs', name: 'Coach Smith', role: 'Head Coach', initials: 'CS', email: 'coach.smith@lkrm.com' },
  { id: 'ad', name: 'Assistant Coach Davis', role: 'Assistant Coach', initials: 'AD', email: 'a.davis@lkrm.com' },
  { id: 'cm', name: 'Coach Martinez', role: 'Assistant Coach', initials: 'CM', email: 'c.martinez@lkrm.com' },
  { id: 'aj', name: 'Assistant Coach Johnson', role: 'Assistant Coach', initials: 'AJ', email: 'a.johnson@lkrm.com' },
  { id: 'sl', name: 'Stats Coordinator Lee', role: 'Statistics', initials: 'SL', email: 's.lee@lkrm.com' },
  { id: 'tc', name: 'Team Captain Wilson', role: 'Team Captain', initials: 'TW', email: 't.wilson@lkrm.com' }
];

// Parse text for @mentions
export function parseMentions(text: string): ParsedContent {
  const mentions: Mention[] = [];
  let processedText = text;
  
  // Regex to find @mentions (@ followed by word characters)
  const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionText = match[1];
    const fullMatch = match[0];
    
    // Try to find matching coach
    const coach = findCoachByName(mentionText);
    if (coach) {
      mentions.push({
        id: Date.now().toString() + Math.random(),
        userId: coach.id,
        userName: coach.name,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length
      });
    }
  }
  
  // Create HTML with highlighted mentions
  let html = text;
  mentions
    .sort((a, b) => b.startIndex - a.startIndex) // Process from end to beginning
    .forEach(mention => {
      const beforeMention = html.slice(0, mention.startIndex);
      const afterMention = html.slice(mention.endIndex);
      const mentionHtml = `<span class="mention" data-user-id="${mention.userId}" style="background: rgba(181, 136, 66, 0.2); color: #B58842; padding: 2px 4px; border-radius: 4px; font-weight: 600;">@${mention.userName}</span>`;
      html = beforeMention + mentionHtml + afterMention;
    });
  
  return {
    text: processedText,
    mentions,
    html
  };
}

// Find coach by name (fuzzy matching)
function findCoachByName(searchName: string): Coach | null {
  const normalizedSearch = searchName.toLowerCase().trim();
  
  // Try exact match first
  let coach = COACHES.find(c => 
    c.name.toLowerCase() === normalizedSearch ||
    c.name.toLowerCase().includes(normalizedSearch) ||
    normalizedSearch.includes(c.name.toLowerCase())
  );
  
  if (coach) return coach;
  
  // Try partial matches
  coach = COACHES.find(c => {
    const nameParts = c.name.toLowerCase().split(' ');
    return nameParts.some(part => part.startsWith(normalizedSearch) || normalizedSearch.startsWith(part));
  });
  
  return coach || null;
}

// Get suggestions for @mentions based on input
export function getMentionSuggestions(input: string): Coach[] {
  if (!input || input.length < 1) return COACHES;
  
  const normalizedInput = input.toLowerCase();
  
  return COACHES.filter(coach => 
    coach.name.toLowerCase().includes(normalizedInput) ||
    coach.role.toLowerCase().includes(normalizedInput) ||
    coach.initials.toLowerCase().includes(normalizedInput)
  ).sort((a, b) => {
    // Prioritize exact name matches
    const aNameMatch = a.name.toLowerCase().startsWith(normalizedInput) ? 0 : 1;
    const bNameMatch = b.name.toLowerCase().startsWith(normalizedInput) ? 0 : 1;
    return aNameMatch - bNameMatch;
  });
}

// Create notification for mentioned users
export interface Notification {
  id: string;
  type: 'mention';
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  content: string;
  context: string; // e.g., "in a task note", "in a sticky note"
  contextId: string; // ID of the task, note, etc.
  timestamp: string;
  read: boolean;
}

export function createMentionNotifications(
  content: string,
  mentions: Mention[],
  fromUser: { id: string; name: string },
  context: string,
  contextId: string
): Notification[] {
  return mentions.map(mention => ({
    id: Date.now().toString() + Math.random(),
    type: 'mention' as const,
    fromUserId: fromUser.id,
    fromUserName: fromUser.name,
    toUserId: mention.userId,
    toUserName: mention.userName,
    content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
    context,
    contextId,
    timestamp: new Date().toISOString(),
    read: false
  }));
}

// Create activity entry for mentions
export interface ActivityEntry {
  id: string;
  type: 'mention';
  user: {
    name: string;
    role: string;
    initials: string;
  };
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

export function createMentionActivity(
  fromUser: { name: string; role: string; initials: string },
  mentions: Mention[],
  context: string
): ActivityEntry | null {
  if (mentions.length === 0) return null;
  
  const mentionedNames = mentions.map(m => m.userName).join(', ');
  
  return {
    id: Date.now().toString() + Math.random(),
    type: 'mention',
    user: fromUser,
    action: 'mentioned',
    target: mentionedNames,
    timestamp: 'just now',
    details: `${context} - ${mentions.length} coach${mentions.length > 1 ? 'es' : ''} mentioned`
  };
}

// Notification storage utilities (using localStorage for demo)
const NOTIFICATIONS_KEY = 'lkrm-notifications';

export function saveNotification(notification: Notification): void {
  try {
    const existing = getNotifications();
    existing.unshift(notification);
    // Keep only last 50 notifications
    const limited = existing.slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving notification:', error);
  }
}

export function getNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
}

export function markNotificationAsRead(notificationId: string): void {
  try {
    const notifications = getNotifications();
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter(n => !n.read).length;
} 
 