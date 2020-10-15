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

export const copyPackageJson: Build<void> = C =>
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

export const FILES: ReadonlyArray<string> = ['README.md']

export const copyFiles: Build<ReadonlyArray<void>> = C =>
    pipe(
        FILES,
        A.traverse(TE.taskEither)(from => C.copyFile(from, path.resolve(OUTPUT_FOLDER, from)))
    )

const traverse = A.traverse(TE.taskEither)

export const makeModules: Build<void> = FS =>
    pipe(
        FS.glob(`${OUTPUT_FOLDER}/lib/*`),
        TE.map(getModules),
        TE.chain(traverse(makeSingleModule(FS))),
        TE.map(() => undefined)
    )

function getModules(paths: ReadonlyArray<string>): ReadonlyArray<string> {
    return paths.map(filePath => path.basename(filePath)).filter(x => x.match(/index\.?d?.[js|ts]{2}$/) === null)
}

function makeSingleModule(FS: FileSystem): (module: string) => TE.TaskEither<Error, void> {
    return m =>
        pipe(
            FS.mkdir(path.join(OUTPUT_FOLDER, m)),
            TE.chain(() => makePkgJson(m)),
            TE.chain(data => FS.writeFile(path.join(OUTPUT_FOLDER, m, 'package.json'), data))
        )
}

function makePkgJson(module: string): TE.TaskEither<Error, string> {
    return pipe(
        JSON.stringify(
            {
                main: `../lib/${module}/index.js`,
                module: `../es6/${module}/index.js`,
                typings: `../lib/${module}/index.d.ts`,
                sideEffects: false,
            },
            null,
            2
        ),
        TE.right
    )
}

const main: Build<void> = pipe(
    copyPackageJson,
    RTE.chain(() => copyFiles),
    RTE.chain(() => makeModules)
)

run(
    main({
        ...fileSystem,
    })
)
