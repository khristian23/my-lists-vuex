/* eslint-disable jest/expect-expect */
import List from 'src/storage/List'
import ListItem from 'src/storage/ListItem'
import Profile from 'src/storage/Profile'
import assert from 'assert'

describe('Objects', function () {
    describe('List Class', function () {
        it('should produce a new object for Firebase', function () {
            const timestamp = (new Date()).getTime()
            const list = new List({
                id: 1001,
                name: 'to firebase name',
                description: 'to firebase description',
                type: 'my Type',
                subtype: 'my Subtype',
                modifiedAt: timestamp
            })
            const actualFirebaseObject = JSON.stringify(list.toFirebaseObject())
            const expectedFirebaseObject = JSON.stringify({
                name: 'to firebase name',
                description: 'to firebase description',
                priority: 0,
                type: 'my Type',
                subtype: 'my Subtype',
                modifiedAt: timestamp
            })

            assert.deepStrictEqual(actualFirebaseObject, expectedFirebaseObject)
        })

        it('should produce an existent object for Firebase', function () {
            const timestamp = (new Date()).getTime()
            const list = new List({
                id: 1001,
                firebaseId: 9992,
                name: 'to firebase name',
                description: 'to firebase description',
                type: 'my Type',
                subtype: 'my Subtype',
                modifiedAt: timestamp
            })
            const actualFirebaseObject = JSON.stringify(list.toFirebaseObject())
            const expectedFirebaseObject = JSON.stringify({
                id: 9992,
                name: 'to firebase name',
                description: 'to firebase description',
                priority: 0,
                type: 'my Type',
                subtype: 'my Subtype',
                modifiedAt: timestamp
            })

            assert.deepStrictEqual(actualFirebaseObject, expectedFirebaseObject)
        })

        it('should produce the right object for Local', function () {
            const timestamp = (new Date()).getTime()
            const list = new List({
                id: 1001,
                name: 'to name',
                description: 'to description',
                type: 'my Type',
                subtype: 'my Subtype',
                modifiedAt: timestamp,
                userId: 'Christian'
            })
            const actualObject = JSON.stringify(list.toObject())
            const expectedObject = JSON.stringify({
                id: 1001,
                name: 'to name',
                description: 'to description',
                priority: 0,
                type: 'my Type',
                subtype: 'my Subtype',
                modifiedAt: timestamp,
                syncStatus: '',
                firebaseId: '',
                userId: 'Christian'
            })

            assert.deepStrictEqual(actualObject, expectedObject)
        })
    })

    describe('ListItem Class', function () {
        it('should produce the right new object for Firebase', function () {
            const timestamp = (new Date()).getTime()
            const listItem = new ListItem({
                id: 1001,
                name: 'to firebase name',
                modifiedAt: timestamp,
                status: 'Pending'
            })
            const actualFirebaseObject = JSON.stringify(listItem.toFirebaseObject())
            const expectedFirebaseObject = JSON.stringify({
                name: 'to firebase name',
                priority: 0,
                modifiedAt: timestamp,
                status: 'Pending',
                notes: ''
            })

            assert.deepStrictEqual(actualFirebaseObject, expectedFirebaseObject)
        })

        it('should produce the right existent object for Firebase', function () {
            const timestamp = (new Date()).getTime()
            const listItem = new ListItem({
                id: 1001,
                firebaseId: 9999,
                name: 'to firebase name',
                modifiedAt: timestamp,
                status: 'Pending'
            })
            const actualFirebaseObject = JSON.stringify(listItem.toFirebaseObject())
            const expectedFirebaseObject = JSON.stringify({
                id: 9999,
                name: 'to firebase name',
                priority: 0,
                modifiedAt: timestamp,
                status: 'Pending',
                notes: ''
            })

            assert.deepStrictEqual(actualFirebaseObject, expectedFirebaseObject)
        })

        it('should produce the right object for Local', function () {
            const timestamp = (new Date()).getTime()
            const listItem = new ListItem({
                id: 1001,
                listId: 250,
                name: 'to name',
                modifiedAt: timestamp,
                userId: 'Christian',
                status: 'Done'
            })
            const actualObject = JSON.stringify(listItem.toObject())
            const expectedObject = JSON.stringify({
                id: 1001,
                listId: 250,
                name: 'to name',
                priority: 0,
                modifiedAt: timestamp,
                status: 'Done',
                notes: '',
                syncStatus: '',
                firebaseId: '',
                userId: 'Christian'
            })

            assert.deepStrictEqual(actualObject, expectedObject)
        })
    })

    describe('Profile Class', function () {
        it('should produce the right object for Local', function () {
            const timestamp = (new Date()).getTime()
            const profile = new Profile({
                name: 'to name',
                email: 'the_email@sap.com',
                lastSyncTime: timestamp,
                userId: 'Christian'
            })
            const actualObject = JSON.stringify(profile.toObject())
            const expectedObject = JSON.stringify({
                userId: 'Christian',
                name: 'to name',
                email: 'the_email@sap.com',
                syncOnStartup: true,
                lastSyncTime: timestamp
            })

            assert.deepStrictEqual(actualObject, expectedObject)
        })
    })
})
