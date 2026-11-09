export const money = (value: number) => new Intl.NumberFormat("ru-RU", {
  style: "currency", currency: "RUB", minimumFractionDigits: 2,
}).format(value);
export const calendarDate = (value: string) => value.split("-").reverse().join(".");
export const dateTime = (value: string) => new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "short", timeStyle: "short",
}).format(new Date(value));
