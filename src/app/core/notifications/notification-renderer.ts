export function renderNotificationText(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      return tokens[key] ?? '';
    }
    return match;
  });
}
