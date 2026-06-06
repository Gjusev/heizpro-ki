import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    neu: 'bg-blue-100 text-blue-800',
    kontaktiert: 'bg-yellow-100 text-yellow-800',
    interessiert: 'bg-orange-100 text-orange-800',
    termin_gebucht: 'bg-green-100 text-green-800',
    angebot_gesendet: 'bg-purple-100 text-purple-800',
    gewonnen: 'bg-emerald-100 text-emerald-800',
    verloren: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    neu: 'Neu',
    kontaktiert: 'Kontaktiert',
    interessiert: 'Interessiert',
    termin_gebucht: 'Termin',
    angebot_gesendet: 'Angebot',
    gewonnen: 'Gewonnen',
    verloren: 'Verloren',
  };
  return labels[status] || status;
}

export function getOutcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    termin_gebucht: 'Termin gebucht',
    interesse: 'Interesse',
    kein_interesse: 'Kein Interesse',
    rueckruf: 'Rückruf',
    nicht_erreicht: 'Nicht erreicht',
    widerspruch: 'Widerspruch',
  };
  return labels[outcome] || outcome;
}

export function getMoodEmoji(mood?: string): string {
  const emojis: Record<string, string> = {
    positiv: '😊',
    neutral: '😐',
    negativ: '😟',
  };
  return mood ? emojis[mood] || '' : '';
}
