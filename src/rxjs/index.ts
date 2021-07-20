import * as E from 'fp-ts/Either'
import type { IO } from 'fp-ts/IO'
import { identity } from 'fp-ts/function'
import { MonoTypeOperatorFunction, OperatorFunction, Observable, Observer } from 'rxjs'
import { tap, map } from 'rxjs/operators'

// operators

/**
 * @deprecated use chainFirst and fromIO from fp-ts-rxjs Observable module
 */
const runIOL = <T, R>(c: (t: T) => IO<R>) => (t: T): R => c(t)()

/**
 * @deprecated use chainFirst and fromIO from fp-ts-rxjs Observable module
 */
export const chainFirstIO = <T, R>(e: (t: T) => IO<R>): MonoTypeOperatorFunction<T> => source =>
    source.pipe(tap(runIOL(e)))

/**
 * @deprecated use chain and fromIO from fp-ts-rxjs Observable module
 */
export const chainIOK = <T, R>(e: (t: T) => IO<R>): OperatorFunction<T, R> => source => source.pipe(map(runIOL(e)))

/**
 * @deprecated use fromIO from fp-ts-rxjs Observable module
 */
export const runIO = <T extends IO<R>, R = T extends IO<infer S> ? S : never>(): OperatorFunction<T, R> => source =>
    source.pipe(map((f): R => f()))

/**
 * @deprecated wait for either toUnion
 */
export const extractE = <
    T extends E.Either<E, R>,
    E = T extends E.Either<unknown, infer S> ? S : never,
    R = T extends E.Either<infer S, unknown> ? S : never
>(): OperatorFunction<T, E | R> => source => source.pipe(map(E.getOrElse<E, E | R>(identity)))

// constructors

/**
 * @deprecated fromIO from fp-ts-rxjs Observable module
 */
export const fromIO = <R>(i: IO<R>) =>
    new Observable((observer: Observer<R>) => {
        observer.next(i())
        observer.complete()
    })
