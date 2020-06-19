import * as D from 'io-ts/lib/Decoder'
import * as MS from '../../src/state'
import * as O from 'fp-ts/lib/Option'

interface TokenBrand {
    readonly Token: unique symbol
}

export type Token = string & TokenBrand

export const Token: D.Decoder<Token> = D.refinement(D.string, (n): n is Token => n.length > 1 && n[0] == 'x', 'Token')

export interface sessionState {
    userName: string
    token: O.Option<Token>
}

const sessionState: sessionState = {
    userName: 'Marco',
    token: O.fromEither(Token.decode('xx')),
}

export const sessionStore = MS.of(sessionState)
