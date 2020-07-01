import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import * as t from 'io-ts'
import { Observable, of } from 'rxjs'
import * as MS from '../../src/state'

// type

interface ApiKeyBrand {
    readonly ApiKey: unique symbol
}

export const ApiKey = t.brand(
    t.string,
    (n): n is t.Branded<string, ApiKeyBrand> => n.length > 1 && n[0] === 'x',
    'ApiKey'
)

export type ApiKey = t.TypeOf<typeof ApiKey>

const appEnv = t.keyof({
    dev: true,
    prod: true,
})

type appEnv = t.TypeOf<typeof appEnv>

export type SessionState =
    | { status: 'init' }
    | {
          status: 'done'
          userName: string
          apiKey: ApiKey
          env: appEnv
      }
    | {
          status: 'error'
          message: string
      }

// cons

export const sessionStore = MS.of<SessionState>(() => ({ name: 'session', initState: { status: 'init' } }))

// mutation

type optional = string | undefined

export const parseEnvMutation = (confEnv: optional, confApiKey: optional, confUserName: optional) => (
    s: SessionState
): Observable<SessionState> => {
    if (s.status !== 'init') {
        return of(s)
    }

    return of(
        pipe(
            appEnv.decode(confEnv),
            E.map(env => (apiKey: ApiKey) => ({ env, apiKey: apiKey })),
            E.ap(ApiKey.decode(confApiKey)),
            E.map(sp => (userName: string): Extract<SessionState, { status: 'done' }> => ({
                ...sp,
                userName,
                status: 'done' as const,
            })),
            E.ap(t.string.decode(confUserName)),
            E.getOrElseW((): Extract<SessionState, { status: 'error' }> => ({ status: 'error', message: 'env erro' }))
        )
    )
}
