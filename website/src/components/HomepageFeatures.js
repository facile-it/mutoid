import clsx from 'clsx'
import React from 'react'
import styles from './HomepageFeatures.module.css'

const FeatureList = [
    {
        title: 'Reactive',
        img: 'https://raw.githubusercontent.com/ReactiveX/rxjs/master/docs_app/assets/Rx_Logo_S.png',
        description: (
            <>
                We like reactive programming, <b>RxJs</b> particularly: composing asynchronous code is gonna be easier
            </>
        ),
    },
    {
        title: 'Functional',
        img: 'https://raw.githubusercontent.com/gcanti/fp-ts/master/docs/fp-ts-logo.png',
        description: (
            <>
                The whole library uses <b>fp-ts</b> modules and it is compatible with them
            </>
        ),
    },
    {
        title: 'Static typing',
        img: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg',
        description: <>We believe that the best way to govern the complexity of the domain is to explicit it</>,
    },
]

function Feature({ img, title, description }) {
    return (
        <div className={clsx('col col--4')}>
            <div className="text--center">
                <img className={styles.dependencyLogo} src={img} />
            </div>
            <div className="text--center padding-horiz--md">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    )
}

export default function HomepageFeatures() {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    )
}
