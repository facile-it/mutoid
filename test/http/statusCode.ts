import { statusPredicate, StatusServerError } from '../../src/http/statusCode'

describe('statusCode', () => {
    test('statusCode', () => {
        expect(statusPredicate(StatusServerError)(500)).toStrictEqual(true)
        expect(statusPredicate(StatusServerError)(400)).toStrictEqual(false)
    })
})
