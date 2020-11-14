import ListObject from './ListObject'

class ListItem extends ListObject {
    constructor (data) {
        super(data)

        this._listId = data.listId
        this._status = data.status
    }

    get listId () {
        return this._listId
    }

    set listId (listId) {
        this._listId = listId
    }

    set status (status) {
        this._status = status
    }

    get status () {
        return this._status
    }

    toFirebaseObject () {
        const keys = ['id', 'name', 'priority', 'modifiedAt', 'status']
        const firebaseObject = this._createObject(keys)
        firebaseObject.id = this._firebaseId
        return firebaseObject
    }

    toObject () {
        const keys = ['id', 'listId', 'name', 'priority', 'modifiedAt', 'status',
            'syncStatus', 'firebaseId', 'userId']
        return this._createObject(keys)
    }

    clone () {
        return new ListItem(this.toObject())
    }
}

export default ListItem
