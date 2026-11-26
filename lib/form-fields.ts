const fieldHints: Array<[RegExp, string]> = [
  [/notification type|alerts/i, "events"],
  [/chat id/i, "chatId"],
  [/title/i, "title"],
  [/date and time|new date|slot|appointment start/i, "time"],
  [/date/i, "date"],
  [/weekday|start time|end time|before end|working hours|whole-hour|half-hour/i, "startTime"],
  [/phone/i, "phone"],
  [/password/i, "password"],
  [/username/i, "username"],
  [/proof|pdf/i, "file"],
  [/bank/i, "bankAccountId"],
  [/amount|payment method|balance/i, "paidAmount"],
  [/permission/i, "permissions"],
  [/sender name/i, "senderName"],
  [/identifier/i, "identifierId"],
  [/token|afro/i, "apiToken"],
  [/name/i, "name"],
];

export function fieldForMessage(message: string) {
  return fieldHints.find(([pattern]) => pattern.test(message))?.[1];
}

export function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    events: "Alerts",
    chatId: "Chat id",
    title: "Public title",
    time: "Time",
    date: "Date",
    startTime: "Hours",
    phone: "Phone",
    password: "Password",
    username: "Username",
    file: "File",
    bankAccountId: "Bank account",
    paidAmount: "Amount",
    permissions: "Permissions",
    senderName: "Sender name",
    identifierId: "Account id",
    apiToken: "API key",
    name: "Name",
  };
  if (labels[field]) return labels[field];
  const words = field.replace(/([A-Z])/g, " $1").replace(/[_-]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Form";
}
