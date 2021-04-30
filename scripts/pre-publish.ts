import { left } from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { run } from './run'

const main = left(new Error('"npm publish" can not be run from root, run "npm run release" instead'))

pipe(main, run)
