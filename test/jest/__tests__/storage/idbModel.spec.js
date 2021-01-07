/* eslint-disable jest/expect-expect */
import { model } from 'src/storage/IndexedDB/db-model'
import idb from 'src/storage/IndexedDB/indexed-db'
import assert from 'assert'
import { assertThrowsAsync } from '../util/helpers'
import 'fake-indexeddb/auto'

describe('IDB Model', () => {
    const USER_ID = 'Test'

    it('should throw exception when adding object to non-existent table', async () => {
        await assertThrowsAsync(async () => {
            await idb.addObject('non-existent-table', { id: 123 })
        })
    })

    it('should create an entry for each table', async () => {
        const tables = Object.keys(model.tables)

        for (const tableName of tables) {
            const definition = model.tables[tableName]
            const fields = definition.indexes

            const object = fields.reduce((result, field) => {
                result[field] = field
                return result
            }, {})

            object.userId = USER_ID

            await idb.addObject(tableName, object)
        }

        for (const tableName of tables) {
            const objects = await idb.getObjectsBy(tableName, { userId: USER_ID })
            const savedObject = objects[0]
            assert.strictEqual(savedObject.userId, USER_ID, `entry found for ${tableName}`)
            assert.ok(Object.keys(savedObject).length > 1, 'Fields for indexes exist')
        }
    })

    it('should delete created entries', async () => {
        const tables = Object.keys(model.tables)

        for (const tableName of tables) {
            await idb.deleteObjectsBy(tableName, { userId: USER_ID })
        }

        for (const tableName of tables) {
            const deletedObject = await idb.getObjectsBy(tableName, { userId: USER_ID })
            assert.ok(!deletedObject[0])
        }
        // Promise.all(tables.map(tableName => {
        //     return idb.deleteObjectsBy(tableName, { userId: USER_ID })
        // }))
        //     .then(() => {
        //         return Promise.all(tables.map(tableName => {
        //             return idb.getObjectsBy(tableName, { userId: USER_ID })
        //                 .then(deletedObject => {
        //                     assert.ok(!deletedObject[0])
        //                 })
        //         }))
        //     })
        //     .then(() => {
        //         done()
        //     })
    })
})
