import * as C from 'fp-ts/lib/Console'
import * as T from 'fp-ts/lib/Task'
import { identity } from 'fp-ts/lib/function'
import { pipe } from 'fp-ts/lib/pipeable'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Subject } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { resourceFold } from '../src/http'
import { useMutation, useResourceFetcher, useSelector } from '../src/react'
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
    return resourceFold(quote)({
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
        onfail: e => `Error ${e.error.type}`,
    })
}

const QuoteFromState: React.FC = () => {
    const quote = useSelector(quoteStore, s => s.quote)
    const fetchQuoteRunner = useMutation(quoteStore, fetchQuoteMutation, { deps: resourceDeps })

    React.useEffect(() => {
        fetchQuoteRunner()
    }, [fetchQuoteRunner])

    React.useEffect(() => {
        pipe(
            MS.toTask(quoteStore),
            T.map(qs => `App loaded. Lo stato delle quote in questo momento è: ${qs.quote.tag}`),
            T.chainIOK(C.log)
        )()
    }, [])

    return (
        <>
            <h2>Resource from quoteStore</h2>
            <em>{renderQuote(quote)}</em>
            <br />
            <br />
            <button onClick={fetchQuoteRunner} disabled={quote.tag !== 'done'}>
                Fetch new quote and update state
            </button>
        </>
    )
}

const QuoteFromStateWithParams: React.FC = () => {
    const quote = useSelector(quoteStore, s => s.quote)
    const fetchQuoteRunner = useMutation(quoteStore, fetchQuoteMutationWithParams, { deps: { ajax: ajax } })
    const resetQuoteRunner = useMutation(quoteStore, resetQuoteMutation)

    React.useEffect(() => {
        fetchQuoteRunner(1, 'useDispatch')
    }, [fetchQuoteRunner])

    return (
        <>
            <h2>Resource from quoteStore with params</h2>
            <em>{renderQuote(quote)}</em>
            <br />
            <br />
            <button onClick={() => fetchQuoteRunner(1, 'useDispatch')} disabled={quote.tag !== 'done'}>
                Fetch new quote and update state
            </button>{' '}
            <button onClick={resetQuoteRunner}>Reset to init</button>
        </>
    )
}

const QuoteFromStateWithDelay: React.FC = () => {
    const quote = useSelector(quoteStore, s => s.quote)
    const notifier = React.useRef(new Subject<number>())
    const fetchQuoteRunner = useMutation(quoteStore, fetchQuoteMutationWithDelay, {
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
                onClick={() => {
                    notifier.current.next(1)
                    fetchQuoteRunner()
                }}
            >
                Fetch new quote and take latest
            </button>{' '}
            <button
                onClick={() => {
                    notifier.current.next(1)
                }}
            >
                Froce stop {'->'} still submitted
            </button>
        </>
    )
}

const QuoteWithHook: React.FC = () => {
    const [quote, quoteFetcher] = useResourceFetcher(fetchQuote(resourceDeps))

    React.useEffect(() => {
        quoteFetcher()
    }, [quoteFetcher])

    return (
        <>
            <h2>Resource with hook</h2>
            <em>{renderQuote(quote)}</em>
            <br />
            <br />
            <button onClick={quoteFetcher} disabled={quote.tag !== 'done'}>
                Fetch new quote
            </button>
        </>
    )
}

const QuoteWithHookWithParams: React.FC = () => {
    const [quote, quoteFetcher] = useResourceFetcher(fetchQuoteWithParams({ ajax: ajax }))

    React.useEffect(() => {
        quoteFetcher(1, 'useResourceFetcher')
    }, [quoteFetcher])

    return (
        <>
            <h2>Resource with hook with params</h2>
            <em>{renderQuote(quote)}</em>
            <br />
            <br />
            <button onClick={() => quoteFetcher(1, 'useResourceFetcher')} disabled={quote.tag !== 'done'}>
                Fetch new quote
            </button>
        </>
    )
}

const QuoteWithHookWithDelay: React.FC = () => {
    const notifier = React.useRef(new Subject<number>())
    const [quote, quoteFetcher] = useResourceFetcher(fetchQuoteWithDelay(resourceDeps), notifier.current)

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
                onClick={() => {
                    notifier.current.next(1)
                    quoteFetcher()
                }}
            >
                Fetch new quote and take latest
            </button>{' '}
            <button
                onClick={() => {
                    notifier.current.next(1)
                }}
            >
                Froce stop {'->'} still submitted
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
    const sessionState = useSelector(sessionStore, identity)
    const parseEnv = useMutation(sessionStore, parseEnvMutation)

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
