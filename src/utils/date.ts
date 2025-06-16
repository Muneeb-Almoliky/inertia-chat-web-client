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