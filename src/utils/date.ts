export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

export const formatMessageDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Format time as HH:MM AM/PM
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Format date as MM/DD/YY
  const dateString = date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  });

  // Check if message is from today
  if (date.toDateString() === today.toDateString()) {
    return timeString;
  }

  // Check if message is from yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return 'yesterday';
  }

  // For older messages, show the date
  return dateString;
};

export const formatLastSeen = (lastSeen: string): string => {
  try {
    const date = new Date(lastSeen);
    if (isNaN(date.getTime())) {
      return 'offline';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Format time consistently
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // If less than 30 seconds, show online
    if (diffInSeconds < 30) {
      return 'online';
    }

    // If today
    if (isSameDay(date, now)) {
      return `last seen today at ${timeString}`;
    }

    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(date, yesterday)) {
      return `last seen yesterday at ${timeString}`;
    }

    // If within last 7 days
    if (diffInSeconds < 604800) {
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      return `last seen ${weekday} at ${timeString}`;
    }

    // For older dates
    const dateString = date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `last seen ${dateString} at ${timeString}`;
  } catch {
    return 'offline';
  }
};