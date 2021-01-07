import assert from 'assert'

export const assertThrowsAsync = async (fn, regExp) => {
    let f = () => {}
    try {
        await fn()
    } catch (e) {
        f = () => { throw e }
    } finally {
        assert.throws(f, regExp)
    }
}
