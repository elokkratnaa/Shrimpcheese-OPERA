export const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

export const logger = {
  info: (message: string) => console.log(`${COLORS.cyan}[INFO] ${message}${COLORS.reset}`),
  success: (message: string) => console.log(`${COLORS.green}[SUCCESS] ${message}${COLORS.reset}`),
  warn: (message: string) => console.log(`${COLORS.yellow}[WARN] ${message}${COLORS.reset}`),
  error: (message: string, error?: any) => console.error(`${COLORS.red}[ERROR] ${message}${COLORS.reset}`, error),
};
