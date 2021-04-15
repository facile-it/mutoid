import * as C from 'fp-ts/Console'
import * as T from 'fp-ts/Task'
import { identity } from 'fp-ts/function'
import { pipe } from 'fp-ts/function'
import * as React from 'react'
import { Subject } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import * as RES from '../src/http/Resource'
import * as MR from '../src/react'
import * as MS from '../src/state'
import type { ResourceBad } from './resources/fetchBuilder'
import {
    fetchQuoteSeq,
    fetchQuoteSeqPar,
    fetchQuoteWithDelay,
    fetchSimple,
    QuoteResource,
} from './resources/quoteResource'
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
    logger: console,
}

const renderQuoteResource = (quote: QuoteResource): React.ReactChild => {
    return pipe(
        quote,
        RES.map(r => r.payload),
        renderQuotes
    )
}

const renderQuotes = (quote: RES.Resource<ResourceBad, Array<string>>): React.ReactChild => {
    return pipe(
        quote,
        RES.matchD({
            onDone: r => r.join(' || '),
            onInit: () => 'Quote loading init...',
            onSubmitted: () => 'Quote loading submitted...',
            onFail: e => `Error ${e.type}`,
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
            <em>{renderQuoteResource(quote)}</em>
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
    const fetchQuoteRunner = MR.useMutation(quoteStore, fetchQuoteMutationWithParams, { deps: resourceDeps })
    const resetQuoteRunner = MR.useMutation(quoteStore, resetQuoteMutation)

    React.useEffect(() => {
        fetchQuoteRunner(1)
    }, [fetchQuoteRunner])

    return (
        <>
            <h2>Resource from quoteStore with params</h2>
            <em>{renderQuoteResource(quote)}</em>
            <br />
            <br />
            <button type="button" onClick={() => fetchQuoteRunner(1)} disabled={quote._tag !== 'done'}>
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
            <em>{renderQuoteResource(quote)}</em>
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

const QuoteWithHookWithParams: React.FC = () => {
    const [quote, quoteFetcher] = MR.useFetchReaderObservableResource(fetchSimple, { ajax })

    React.useEffect(() => {
        quoteFetcher(1, 'useResourceFetcher')
    }, [quoteFetcher])

    return (
        <>
            <h2>Resource with hook with params</h2>
            <em>
                {pipe(
                    quote,
                    RES.matchD({
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

    const [quote, quoteFetcher] = MR.useFetchReaderObservableResource(fetchQuoteWithDelay, resourceDeps, {
        notifierTakeUntil: notifier.current,
    })

    React.useEffect(() => {
        quoteFetcher()
    }, [quoteFetcher])

    return (
        <>
            <h2>Resource with hook with delay (5s)</h2>
            <em>{renderQuoteResource(quote)}</em>
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

const QuoteWithFetchConcat: React.FC = () => {
    const [quote, quoteFetcher] = MR.useFetchReaderObservableResource(fetchQuoteSeq, resourceDeps)

    React.useEffect(() => {
        quoteFetcher()
    }, [quoteFetcher])

    return (
        <>
            <h2>FetchQuoteConcat</h2>
            <em>{renderQuotes(quote)}</em>
            <br />
            <br />
            <button type="button" onClick={quoteFetcher}>
                Fetch new quote
            </button>
        </>
    )
}

const QuoteWithFetchQuoteSeqPar: React.FC = () => {
    const [quote, quoteFetcher] = MR.useFetchReaderObservableResource(fetchQuoteSeqPar, resourceDeps)

    React.useEffect(() => {
        quoteFetcher()
    }, [quoteFetcher])

    return (
        <>
            <h2>FetchQuoteSeqPar</h2>
            <em>{renderQuotes(quote)}</em>
            <br />
            <br />
            <button type="button" onClick={quoteFetcher}>
                Fetch new quote
            </button>
        </>
    )
}

const App: React.FC<{ name: string }> = props => {
    React.useEffect(() => {
        // eslint-disable-next-line no-console
        const sub = quoteStore.notifier$.subscribe(console.log)

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
                <QuoteWithHookWithParams />
            </div>
            <div>
                <QuoteWithHookWithDelay />
            </div>
            <div>
                <QuoteWithFetchConcat />
            </div>
            <div>
                <QuoteWithFetchQuoteSeqPar />
            </div>
        </>
    )
}

declare const ENV: string | undefined
declare const APIKEY: string | undefined
declare const USERNAME: string | undefined

export const AppInitializer: React.FC = () => {
    const sessionState = MR.useSelector(sessionStore, identity)
    const parseEnv = MR.useMutation(sessionStore, parseEnvMutation)

    React.useEffect(() => {
        parseEnv(ENV, APIKEY, USERNAME)
    }, [parseEnv])

    React.useEffect(() => {
        // eslint-disable-next-line no-console
        const sub = sessionStore.notifier$.subscribe(console.log)

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
