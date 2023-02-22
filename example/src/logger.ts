import * as R from 'fp-ts/Reader'

export interface LoggerDeps {
    logger: typeof console
}

export function withLogger<T>(run: (d: LoggerDeps) => T): R.Reader<LoggerDeps, T> {
    return R.asks<LoggerDeps, T>(run)
}

export function logError<E extends { error: string }>(e: E): R.Reader<LoggerDeps, E> {
    return withLogger(d => {
        const { error, ...context } = e
        d.logger.error(error, context)

        return e
    })
}
