import * as C from 'fp-ts/Console'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import { identity } from 'fp-ts/function'
import { pipe } from 'fp-ts/pipeable'
import { PathReporter } from 'io-ts/PathReporter'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Subject } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import * as RES from '../src/http/Resource'
import * as MR from '../src/react'
import * as MS from '../src/state'
import { fetchQuote, fetchQuoteWithDelay, fetchQuoteWithParams, quoteResource } from './resources/quoteResource'
import {
    quoteStore,
    fetchQuoteMutation,
    fetchQuoteMutationWithDelay,
    fetchQuoteMutationWithParams,
    resetQuoteMutation,
} from './stores/quoteStore'
import { sessionStore, parseEnvMutation } from './stores/sessionStore'

const resourceDeps = {
    ajax: ajax,
    store: sessionStore,
}

const renderQuote = (quote: quoteResource): React.ReactChild => {
    return pipe(
        quote,
        RES.resourceFold({
            onDone: r => {
                switch (r.status) {
                    case 200:
                        return r.payload[0]
                    case 400:
                        return `Client error ${r.payload}`
                }
            },
            onInit: () => 'Quote loading init...',
            onSubmitted: () => 'Quote loading submitted...',
            onFail: e => {
                switch (e.type) {
                    case 'decodeError': {
                        return `Error ${e.type} - ${PathReporter.report(E.left(e.detail)).join(', ')}`
                    }
                    case 'appError':
                        return `Error ${e.type} - ${e.detail}`
                    case 'networkError':
                        return `Error ${e.type} - ${e.detail.message}`
                    case 'unexpectedResponse':
                        return `Error ${e.type} - ${e.detail.status}`
                    case 'unknownError':
                        return `Error ${e.type}`
                }
            },
        })
    )
}

const QuoteFromState: React.FC = () => {
    const quote = MR.useSelector(quoteStore, s => s.quote)
    const fetchQuoteRunner = MR.useMutation(quoteStore, fetchQuoteMutation, { deps: resourceDeps })

    React.useEffect(() => {
        fetchQuoteRunner()
    }, [fetchQuoteRunner])

    React.useEffect(() => {
        pipe(
            MS.toTask(quoteStore),
            T.map(qs => `App loaded. Lo stato delle quote in questo momento è: ${qs.quote._tag}`),
            T.chainIOK(C.log)
        )()
    }, [])

    return (
        <>
            <h2>Resource from quoteStore</h2>
            <em>{renderQuote(quote)}</em>
            <br />
            <br />
            <button type="button" onClick={fetchQuoteRunner} disabled={quote._tag !== 'done'}>
                Fetch new quote and update state
            </button>
        </>
    )
}

const QuoteFromStateWithParams: React.FC = () => {
    const quote = MR.useSelector(quoteStore, s => s.quote)
    const fetchQuoteRunner = MR.useMutation(quoteStore, fetchQuoteMutationWithParams, { deps: { ajax: ajax } })
    const resetQuoteRunner = MR.useMutation(quoteStore, resetQuoteMutation)

    React.useEffect(() => {
        fetchQuoteRunner(1, 'useDispatch')
    }, [fetchQuoteRunner])

    return (
        <>
            <h2>Resource from quoteStore with params</h2>
            <em>{renderQuote(quote)}</em>
            <br />
            <br />
            <button type="button" onClick={() => fetchQuoteRunner(1, 'useDispatch')} disabled={quote._tag !== 'done'}>
                Fetch new quote and update state
            </button>{' '}
            <button type="button" onClick={resetQuoteRunner}>
                Reset to init
            </button>
        </>
    )
}

const QuoteFromStateWithDelay: React.FC = () => {
    const quote = MR.useSelector(quoteStore, s => s.quote)
    const notifier = React.useRef(new Subject<number>())
    const fetchQuoteRunner = MR.useMutation(quoteStore, fetchQuoteMutationWithDelay, {
        notifierTakeUntil: notifier.current,
        deps: resourceDeps,
    })

    React.useEffect(() => {
        fetchQuoteRunner()
    }, [fetchQuoteRunner])

    return (
        <>
            <h2>Resource from quoteStore with delay (5s)</h2>
            <em>{renderQuote(quote)}</em>
            <br />
            <br />
            <button
                type="button"
                onClick={() => {
                    notifier.current.next(1)
                    fetchQuoteRunner()
                }}
            >
                Fetch new quote and take latest
            </button>{' '}
            <button
                type="button"
                onClick={() => {
                    notifier.current.next(1)
                }}
            >
                Force stop {'->'} still submitted
            </button>
        </>
    )
}

const QuoteWithHook: React.FC = () => {
    const [quote, quoteFetcher] = MR.useResourceFetcher(fetchQuote(resourceDeps), {
        mapAcknowledged: c => {
            switch (c._tag) {
                case 'fail':
                    return { _tag: 'fail' as const, payload: 'error' }
                case 'done': {
                    switch (c.data.status) {
                        case 200:
                            return { _tag: 'success' as const, payload: c.data.payload[0] }
                        case 400:
                            return { _tag: 'badRequest' as const, payload: 'bad' }
                    }
                }
            }
        },
    })

    React.useEffect(() => {
        quoteFetcher()
    }, [quoteFetcher])

    const render = () => {
        switch (quote._tag) {
            case 'badRequest':
            case 'fail':
            case 'success':
                return quote.payload
            case 'submitted':
            case 'init':
                return 'Quote loading...'
        }
    }

    return (
        <>
            <h2>Resource with hook</h2>
            <em>{render()}</em>
            <br />
            <br />
            <button type="button" onClick={quoteFetcher}>
                Fetch new quote
            </button>
        </>
    )
}

const QuoteWithHookWithParams: React.FC = () => {
    const [quote, quoteFetcher] = MR.useResourceFetcher(fetchQuoteWithParams({ ajax: ajax }))

    React.useEffect(() => {
        quoteFetcher(1, 'useResourceFetcher')
    }, [quoteFetcher])

    return (
        <>
            <h2>Resource with hook with params</h2>
            <em>
                {pipe(
                    quote,
                    RES.resourceFold({
                        onDone: r => {
                            switch (r.status) {
                                case 200:
                                    return r.payload[0]
                                case 400:
                                    return `Client error ${r.payload}`
                            }
                        },
                        onInit: () => 'Quote loading init...',
                        onSubmitted: () => 'Quote loading submitted...',
                        onFail: e => `Error ${e.type}`,
                    })
                )}
            </em>
            <br />
            <br />
            <button
                type="button"
                onClick={() => quoteFetcher(1, 'useResourceFetcher')}
                disabled={quote._tag !== 'done'}
            >
                Fetch new quote
            </button>
        </>
    )
}

const QuoteWithHookWithDelay: React.FC = () => {
    const notifier = React.useRef(new Subject<number>())

    const fetch = fetchQuoteWithDelay(resourceDeps)

    const [quote, quoteFetcher] = MR.useResourceFetcher(fetch, {
        notifierTakeUntil: notifier.current,
    })

    React.useEffect(() => {
        quoteFetcher()
    }, [quoteFetcher])

    return (
        <>
            <h2>Resource with hook with delay (5s)</h2>
            <em>{renderQuote(quote)}</em>
            <br />
            <br />
            <button
                type="button"
                onClick={() => {
                    notifier.current.next(1)
                    quoteFetcher()
                }}
            >
                Fetch new quote and take latest
            </button>{' '}
            <button
                type="button"
                onClick={() => {
                    notifier.current.next(1)
                }}
            >
                Force stop {'->'} still submitted
            </button>
        </>
    )
}

const App: React.FC<{ name: string }> = props => {
    React.useEffect(() => {
        // eslint-disable-next-line no-console
        const sub = quoteStore().notifier$.subscribe(console.log)

        return () => sub.unsubscribe()
    }, [])

    return (
        <>
            <h1>Hello {props.name}</h1>
            <div>
                <QuoteFromState />
            </div>
            <div>
                <QuoteFromStateWithParams />
            </div>
            <div>
                <QuoteFromStateWithDelay />
            </div>
            <div>
                <QuoteWithHook />
            </div>
            <div>
                <QuoteWithHookWithParams />
            </div>
            <div>
                <QuoteWithHookWithDelay />
            </div>
        </>
    )
}

declare const ENV: string | undefined
declare const APIKEY: string | undefined
declare const USERNAME: string | undefined

const AppInitializer: React.FC = () => {
    const sessionState = MR.useSelector(sessionStore, identity)
    const parseEnv = MR.useMutation(sessionStore, parseEnvMutation)

    React.useEffect(() => {
        parseEnv(ENV, APIKEY, USERNAME)
    }, [parseEnv])

    React.useEffect(() => {
        // eslint-disable-next-line no-console
        const sub = sessionStore().notifier$.subscribe(console.log)

        return () => sub.unsubscribe()
    }, [])

    switch (sessionState.status) {
        case 'init':
            return <h1>loading ...</h1>
        case 'error':
            return <h1>Error {sessionState.message}</h1>
        case 'done':
            return <App name={sessionState.userName} />
    }
}

ReactDOM.render(
    <React.StrictMode>
        <AppInitializer />
    </React.StrictMode>,
    document.getElementById('root')
)
