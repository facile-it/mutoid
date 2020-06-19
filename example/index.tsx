import * as C from 'fp-ts/lib/Console'
import * as MS from '../src/state'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as T from 'fp-ts/lib/Task'
import { Subject } from 'rxjs'
import { fetchQuote, fetchQuoteWithDelay, fetchQuoteWithParams, quoteResource } from './resources/quoteResource'
import {
    fetchQuoteMutation,
    fetchQuoteMutationWithDelay,
    fetchQuoteMutationWithParams,
    resetQuoteMutation,
} from './stores/quoteMutations'
import { pipe } from 'fp-ts/lib/pipeable'
import { quoteStore } from './stores/quoteStore'
import { resourceFold } from '../src/http'
import { sessionStore } from './stores/sessionStore'
import { useMutation, useResourceFetcher, useSelector } from '../src/react'

const Name: React.FC = () => <>{useSelector(sessionStore, s => s.userName)}</>

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
    const fetchQuoteRunner = useMutation(quoteStore, fetchQuoteMutation)

    React.useEffect(() => {
        fetchQuoteRunner()
    }, [fetchQuoteRunner])

    React.useEffect(() => {
        pipe(
            MS.toTask(quoteStore),
            T.chain(qs =>
                pipe(
                    MS.toTask(sessionStore),
                    T.map((ss): [typeof qs, typeof ss] => [qs, ss])
                )
            ),
            T.map(
                ([qs, ss]) =>
                    `Ciao ${ss.userName}, app loaded. Lo stato delle quote in questo momento è: ${qs.quote.tag}`
            ),
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
    const fetchQuoteRunner = useMutation(quoteStore, fetchQuoteMutationWithParams)
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
    const fetchQuoteRunner = useMutation(quoteStore, fetchQuoteMutationWithDelay, notifier.current)

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
    const [quote, quoteFetcher] = useResourceFetcher(fetchQuote)

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
    const [quote, quoteFetcher] = useResourceFetcher(fetchQuoteWithParams)

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
    const [quote, quoteFetcher] = useResourceFetcher(fetchQuoteWithDelay, notifier.current)

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

ReactDOM.render(
    <>
        <h1>
            Hello <Name />
        </h1>
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
    </>,
    document.getElementById('root')
)
