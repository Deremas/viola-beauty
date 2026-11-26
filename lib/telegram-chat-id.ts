/** Telegram user, group, or channel chat id. Groups and channels are negative. */
export function parseTelegramDestinationChatId(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (!/^-?\d{5,20}$/.test(text)) return undefined;
  return text;
}

export function telegramDestinationKind(chatId: string): "Personal" | "Group or channel" {
  return chatId.trim().startsWith("-") ? "Group or channel" : "Personal";
}
