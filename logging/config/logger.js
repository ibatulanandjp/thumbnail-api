const { createLogger, format, transports } = require('winston');
const { combine, timestamp, simple, printf } = format;
require('winston-daily-rotate-file');

// Transport for daily files
const transport = new transports.DailyRotateFile({
    filename: `${__dirname}/../logs/app-%DATE%.log`,
    datePattern: 'DD-MM-YYYY',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d',
});

// Options for logger object
const options = {
    file: {
        level: 'info',
        filename: './logging/logs/combined.log',
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 2,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};

// Format for logger object
const loggerFormat = combine(
    simple(),
    timestamp({
        format: () =>
            new Date().toLocaleString('en-US', {
                timeZone: 'Asia/Tokyo',
            }),
    }),
    printf(
        (info) =>
            `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
    )
);

// Create logger object
const logger = createLogger({
    transports: [
        new transports.File(options.file),
        new transports.Console(options.console),
        transport,
    ],
    format: loggerFormat,
    exitOnError: false,
});

// Logger Stream
logger.stream = {
    write(message) {
        logger.info(message);
    },
};

module.exports = logger;
