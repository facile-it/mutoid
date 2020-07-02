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

// constructor

export const sessionStore = MS.ctor<SessionState>(() => ({ name: 'session', initState: { status: 'init' } }))

// mutation

type optional = string | undefined
type SessionStateInit = Extract<SessionState, { status: 'init' }>

export const parseEnvMutation = () =>
    MS.ctorPartialMutation(
        'parseEnvMutation' as const,
        (confEnv: optional, confApiKey: optional, confUserName: optional) => (
            s: SessionStateInit
        ): Observable<SessionState> =>
            of(
                pipe(
                    appEnv.decode(confEnv),
                    E.map(env => (apiKey: ApiKey) => ({ ...s, env, apiKey: apiKey })),
                    E.ap(ApiKey.decode(confApiKey)),
                    E.map(sp => (userName: string): Extract<SessionState, { status: 'done' }> => ({
                        ...sp,
                        userName,
                        status: 'done' as const,
                    })),
                    E.ap(t.string.decode(confUserName)),
                    E.getOrElseW(
                        (): Extract<SessionState, { status: 'error' }> => ({
                            status: 'error',
                            message: 'env error',
                        })
                    )
                )
            ),
        (s: SessionState): s is SessionStateInit => s.status === 'init'
    )
