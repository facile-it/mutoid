import { IO } from 'fp-ts/lib/IO'
import { MonoTypeOperatorFunction, OperatorFunction } from 'rxjs'
import { tap, map } from 'rxjs/operators'

const runIO = <T, R>(c: (t: T) => IO<R>) => (t: T): R => c(t)()

export const chainFirstIO = <T, R>(e: (t: T) => IO<R>): MonoTypeOperatorFunction<T> => source =>
    source.pipe(tap(runIO(e)))

export const mapIO = <T, R>(e: (t: T) => IO<R>): OperatorFunction<T, R> => source => source.pipe(map(runIO(e)))
