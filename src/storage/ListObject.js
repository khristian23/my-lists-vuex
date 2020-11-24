import Consts from 'src/util/constants'
import BaseObject from './BaseObject'

class ListObject extends BaseObject {
    constructor (data) {
        super(data)

        this._name = data.name
        this._priority = data.priority || 0
        this._userId = data.userId
        this._modifiedAt = data.modifiedAt
        this._syncStatus = data.syncStatus
        this._firebaseId = data.firebaseId
        this._localId = data.localId
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
}

export default ListObject
