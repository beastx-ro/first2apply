export function getRelativeTimeString(date: Date, locale: string = 'en') {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / (60 * 60));
  const days = Math.floor(diffInSeconds / (60 * 60 * 24));
  const weeks = Math.floor(diffInSeconds / (60 * 60 * 24 * 7));
  const months = Math.floor(diffInSeconds / (60 * 60 * 24 * 30));
  const years = Math.floor(diffInSeconds / (60 * 60 * 24 * 365));

  if (years >= 1) {
    return rtf.format(-years, 'year');
  } else if (months >= 1) {
    return rtf.format(-months, 'month');
  } else if (weeks >= 1) {
    return rtf.format(-weeks, 'week');
  } else if (days >= 1) {
    return rtf.format(-days, 'day');
  } else if (hours >= 1) {
    return rtf.format(-hours, 'hour');
  } else if (minutes >= 1) {
    return rtf.format(-minutes, 'minute');
  } else {
    return rtf.format(-Math.floor(diffInSeconds), 'second');
  }
}
