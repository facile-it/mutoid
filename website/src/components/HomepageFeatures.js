import clsx from 'clsx'
import React from 'react'
import styles from './HomepageFeatures.module.css'

const FeatureList = [
    {
        title: 'Functional',
        img: 'https://raw.githubusercontent.com/gcanti/fp-ts/master/docs/fp-ts-logo.png',
        description: (
            <>
                The whole library uses <b>fp-ts</b> modules and it is combinable with them
            </>
        ),
    },
    {
        title: 'Reactive',
        img: 'https://raw.githubusercontent.com/ReactiveX/rxjs/master/docs_app/assets/Rx_Logo_S.png',
        description: (
            <>
                Reactive programming, <b>RxJs</b> particularly: asynchronous code is gonna be easier
            </>
        ),
    },
    {
        title: 'Static typing',
        img: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg',
        description: (
            <>
                The best way to govern the complexity of the domain is to explicit it and <b>TypeScript</b> can help
            </>
        ),
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
