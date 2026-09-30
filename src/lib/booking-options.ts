export const bookingServices = [
  "Corte de cabelo",
  "Barba",
  "Cabelo + barba",
  "Cabelo e barba express",
  "Camuflagem",
  "Platinado",
] as const;

export const bookingProfessionals = ["Santino", "Lucas", "Mateus"] as const;

export const bookingTimes = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"] as const;

export type BookingService = (typeof bookingServices)[number];
export type BookingProfessional = (typeof bookingProfessionals)[number];

export type BookingRequest = {
  service: BookingService;
  date: string;
  time: string;
  professional: BookingProfessional;
  customerName: string;
  customerPhone: string;
  whatsappConsent: boolean;
};

export function isBookableDate(date: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) return false;

  const parsedDate = new Date(`${date}T12:00:00.000Z`);
  return !Number.isNaN(parsedDate.valueOf())
    && parsedDate.toISOString().slice(0, 10) === date
    && parsedDate.getUTCDay() !== 0;
}

export function getSaoPauloDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getSaoPauloTime(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

export function normalizeBrazilianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return /^55\d{10,11}$/.test(phone) ? phone : null;
}

export function formatBookingDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    dateStyle: "full",
  }).format(new Date(`${date}T12:00:00.000Z`));
}