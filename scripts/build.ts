import * as E from 'fp-ts/Either'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as A from 'fp-ts/ReadonlyArray'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import * as path from 'path'
import { FileSystem, fileSystem } from './FileSystem'
import { run } from './run'

type Build<A> = RTE.ReaderTaskEither<FileSystem, Error, A>

const OUTPUT_FOLDER = 'dist'
const PKG = 'package.json'

const copyPackageJson: Build<void> = C =>
    pipe(
        C.readFile(PKG),
        TE.chain(s => TE.fromEither(E.parseJSON(s, E.toError))),
        TE.map(v => {
            const clone = Object.assign({}, v as any)

            delete clone.scripts
            delete clone.devDependencies

            return clone
        }),
        TE.chain(json => C.writeFile(path.join(OUTPUT_FOLDER, PKG), JSON.stringify(json, null, 2)))
    )

const FILES: ReadonlyArray<string> = ['README.md', 'CHANGELOG.md']

const copyFiles: Build<ReadonlyArray<void>> = C =>
    pipe(
        FILES,
        A.traverse(TE.taskEither)(from => C.copyFile(from, path.resolve(OUTPUT_FOLDER, from)))
    )

const main: Build<unknown> = pipe(
    copyPackageJson,
    RTE.chain(() => copyFiles)
)

run(
    main({
        ...fileSystem,
    })
)
