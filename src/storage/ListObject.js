import Consts from 'src/util/constants'

class ListObject {
    constructor (data) {
        this._id = data.id
        this._name = data.name
        this._priority = data.priority || 0
        this._userId = data.userId
        this._modifiedAt = data.modifiedAt
        this._syncStatus = data.syncStatus
        this._firebaseId = data.firebaseId
        this._localId = data.localId
    }

    get id () {
        return this._id
    }

    set id (id) {
        this._id = id
    }

    get name () {
        return this._name
    }

    set name (name) {
        this._name = name
    }

    get priority () {
        return this._priority
    }

    set priority (priority) {
        this._priority = priority
    }

    get firebaseId () {
        return this._firebaseId
    }

    set firebaseId (firebaseId) {
        this._firebaseId = firebaseId
    }

    set localId (localId) {
        this._localId = localId
    }

    get localId () {
        return this._localId
    }

    set syncStatus (syncStatus) {
        this._syncStatus = syncStatus
    }

    get syncStatus () {
        return this._syncStatus
    }

    set modifiedAt (modifiedAt) {
        this._modifiedAt = modifiedAt
    }

    get modifiedAt () {
        return this._modifiedAt
    }

    set userId (userId) {
        this._userId = userId
    }

    get userId () {
        return this._userId
    }

    flagAsNew () {
        this._syncStatus = Consts.changeStatus.new
        this._modifiedAt = new Date().getTime()
    }

    flagAsModified () {
        this._syncStatus = Consts.changeStatus.changed
        this._modifiedAt = new Date().getTime()
    }

    flagAsDeleted () {
        this._syncStatus = Consts.changeStatus.deleted
        this._modifiedAt = new Date().getTime()
    }

    _createObject (keys) {
        return keys.reduce((object, property) => {
            if (ListObject.prototype.hasOwnProperty.call(this, '_' + property)) {
                object[property] = typeof this['_' + property] === 'undefined' ? '' : this['_' + property]
            }
            return object
        }, {})
    }

    clone () {
        throw Error('Implement Clone method')
    }
}

export default ListObject
