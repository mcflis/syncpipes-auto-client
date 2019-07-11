import * as winston from 'winston';
const { format } = winston;
const { combine, label, colorize, printf } = format;

const isProd = process.env.NODE_ENV === 'production';

function prodFormat() {
  const replaceError = ({ label, level, message, stack }: any) => ({ label, level, message, stack });
  const replacer = (key: any, value: any) => (value instanceof Error ? replaceError(value) : value);
  return combine(label({ label: 'syncpipes-auto-client' }), format.json({ replacer }));
}

function devFormat() {
  const formatMessage = (info: any) => `${info.level} ${info.message}`;
  const formatError = (info: any) => `${info.level} ${info.message}\n\n${info.stack}\n`;
  const format = (info: any) => (info instanceof Error ? formatError(info) : formatMessage(info));
  return combine(colorize(), printf(format));
}

export const logger = winston.createLogger({
  level: 'debug',
  format: isProd ? prodFormat() : devFormat(),
  exitOnError: true,
});

if (!isProd) {
  logger.add(new winston.transports.Console());
} else {
  logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'app.log' }));
}
