import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import * as React from 'react'
import { Observable, of } from 'rxjs'
import * as MS from '../../src/state'

declare module '../../src/state/stores' {
    interface Stores {
        session: 'parseEnv'
    }
}

// -------------------------------------------------------------------------------------
// Model
// -------------------------------------------------------------------------------------

export interface AccessTokenBrand {
    readonly AccessToken: unique symbol
}

export const AccessToken = t.brand(
    t.string,
    (n): n is t.Branded<string, AccessTokenBrand> => n.length > 1 && n[0] === 'x',
    'AccessToken'
)

export type AccessToken = t.TypeOf<typeof AccessToken>

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
          accessToken: AccessToken
          env: appEnv
      }
    | {
          status: 'error'
          message: string
      }

type SessionStoreOpaque = ReturnType<typeof sessionStore>
export interface SessionStore extends SessionStoreOpaque {}

// -------------------------------------------------------------------------------------
// Constructor
// -------------------------------------------------------------------------------------

const stateInit: SessionState = { status: 'init' }

export const sessionStore = () => MS.ctor<'session', SessionState>({ name: 'session', initState: stateInit })

// -------------------------------------------------------------------------------------
// Context
// -------------------------------------------------------------------------------------

export const SessionStoreContext = React.createContext(sessionStore())

export const useSessionStore = () => {
    return React.useContext(SessionStoreContext)
}

// -------------------------------------------------------------------------------------
// Mutation
// -------------------------------------------------------------------------------------

type optional = string | undefined
type SessionStateInit = Extract<SessionState, { status: 'init' }>

export const parseEnvMutation = () =>
    MS.ctorPartialMutation(
        'parseEnv' as const,
        (s: SessionState): s is SessionStateInit => s.status === 'init',
        (confEnv: optional, confAccessToken: optional, confUserName: optional) =>
            (s): Observable<SessionState> =>
                of(
                    pipe(
                        appEnv.decode(confEnv),
                        E.map(env => (accessToken: AccessToken) => ({ ...s, env, accessToken })),
                        E.ap(AccessToken.decode(confAccessToken)),
                        E.map(
                            sp =>
                                (userName: string): Extract<SessionState, { status: 'done' }> => ({
                                    ...sp,
                                    userName,
                                    status: 'done' as const,
                                })
                        ),
                        E.ap(t.string.decode(confUserName)),
                        E.getOrElseW(
                            (): Extract<SessionState, { status: 'error' }> => ({
                                status: 'error',
                                message: 'env error',
                            })
                        )
                    )
                )
    )
