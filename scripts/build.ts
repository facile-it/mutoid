import * as E from 'fp-ts/Either'
import * as J from 'fp-ts/Json'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as A from 'fp-ts/ReadonlyArray'
import * as TE from 'fp-ts/TaskEither'
import { flow, pipe } from 'fp-ts/function'
import * as path from 'path'
import { FileSystem, fileSystem } from './FileSystem'
import { run } from './run'

type Build<A> = RTE.ReaderTaskEither<FileSystem, Error, A>

const OUTPUT_FOLDER = 'dist'
const PKG = 'package.json'

const copyPackageJson: Build<void> = C =>
    pipe(
        C.readFile(PKG),
        TE.chain(flow(J.parse, E.mapLeft(E.toError), TE.fromEither)),
        TE.map(v => {
            const clone = Object.assign({}, v as any)

            delete clone.scripts
            delete clone.devDependencies
            delete clone.engines

            return clone
        }),
        TE.chain(json => C.writeFile(path.join(OUTPUT_FOLDER, PKG), JSON.stringify(json, null, 2)))
    )

const FILES: ReadonlyArray<string> = ['README.md', 'CHANGELOG.md']

const copyFiles: Build<ReadonlyArray<void>> = D =>
    pipe(
        FILES,
        A.traverse(TE.ApplicativePar)(from => D.copyFile(from, path.resolve(OUTPUT_FOLDER, from)))
    )

const cleanStores: Build<void> = D => {
    const fPath = path.resolve(OUTPUT_FOLDER, 'state/stores.d.ts')

    return pipe(
        D.readFile(fPath),
        TE.map(data => data.replace("_S: '_M';", '')),
        TE.chain(data => D.writeFile(fPath, data))
    )
}

const fixState: Build<void> = D => {
    const fPath = path.resolve(OUTPUT_FOLDER, 'state/index.d.ts')

    return pipe(
        D.readFile(fPath),
        TE.map(data => data.replace(/extends "_S"/g, 'extends StoreName')),
        TE.map(data => data.replace(/extends "_M"/g, 'extends AllMutationName')),
        TE.map(data => data.replace('MutationName, StoreName', 'MutationName, StoreName, AllMutationName')),
        TE.chain(data => D.writeFile(fPath, data))
    )
}

const fixReact: Build<void> = D => {
    const fPath = path.resolve(OUTPUT_FOLDER, 'react/useSelector.d.ts')

    return pipe(
        D.readFile(fPath),
        TE.map(data => data.replace(/export declare/g, `import { StoreName } from '../state/stores'\nexport declare`)),
        TE.map(data => data.replace(/extends "_S"/g, 'extends StoreName')),
        TE.chain(data => D.writeFile(fPath, data))
    )
}

const main: Build<unknown> = pipe(
    copyPackageJson,
    RTE.chain(() => copyFiles),
    RTE.chain(() => cleanStores),
    RTE.chain(() => fixState),
    RTE.chain(() => fixReact)
)

pipe(fileSystem, main, run)
