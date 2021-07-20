import { statusPredicate, StatusServerError } from '../../src/http/statusCode'

describe('statusCode', () => {
    test('statusPredicate', () => {
        expect(statusPredicate(StatusServerError)(500)).toStrictEqual(true)
        expect(statusPredicate(StatusServerError)(400)).toStrictEqual(false)
    })
})
