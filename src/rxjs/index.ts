import * as E from 'fp-ts/lib/Either'
import { IO } from 'fp-ts/lib/IO'
import { identity } from 'fp-ts/lib/function'
import { MonoTypeOperatorFunction, OperatorFunction, Observable, Observer } from 'rxjs'
import { tap, map } from 'rxjs/operators'

// operators

const runIOL = <T, R>(c: (t: T) => IO<R>) => (t: T): R => c(t)()

export const chainFirstIO = <T, R>(e: (t: T) => IO<R>): MonoTypeOperatorFunction<T> => source =>
    source.pipe(tap(runIOL(e)))

export const chainIOK = <T, R>(e: (t: T) => IO<R>): OperatorFunction<T, R> => source => source.pipe(map(runIOL(e)))

export const runIO = <T extends IO<R>, R = T extends IO<infer S> ? S : never>(): OperatorFunction<T, R> => source =>
    source.pipe(map((f): R => f()))

export const extractE = <
    T extends E.Either<E, R>,
    E = T extends E.Either<unknown, infer S> ? S : never,
    R = T extends E.Either<infer S, unknown> ? S : never
>(): OperatorFunction<T, E | R> => source => source.pipe(map(E.getOrElse<E, E | R>(identity)))

// constructors

export const fromIO = <R>(i: IO<R>) =>
    new Observable((observer: Observer<R>) => {
        observer.next(i())
        observer.complete()
    })
