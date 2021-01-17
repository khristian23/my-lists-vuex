import ListObject from './ListObject'

class ListItem extends ListObject {
    constructor (data) {
        super(data)

        this._listId = data.listId
        this._notes = data.notes
        this._status = data.status
    }

    get listId () {
        return this._listId
    }

    set listId (listId) {
        this._listId = listId
    }

    get notes () {
        return this._notes
    }

    set notes (notes) {
        this._notes = notes
    }

    set status (status) {
        this._status = status
    }

    get status () {
        return this._status
    }

    toFirebaseObject () {
        const keys = ['name', 'status', 'notes', 'modifiedAt', 'changedBy']
        const firebaseObject = this._createObject(keys)
        return firebaseObject
    }

    toObject () {
        const keys = ['id', 'listId', 'name', 'priority', 'modifiedAt', 'status',
            'notes', 'syncStatus', 'firebaseId', 'userId']
        return this._createObject(keys)
    }

    clone () {
        return new ListItem(this.toObject())
    }
}

export default ListItem
