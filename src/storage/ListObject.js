import BaseObject from './BaseObject'

class ListObject extends BaseObject {
    constructor (data) {
        super(data)

        this._name = data.name
        this._priority = data.priority || 0
        this._owner = data.owner
        this._modifiedAt = data.modifiedAt
        this._changedBy = data.changedBy
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

    set modifiedAt (modifiedAt) {
        this._modifiedAt = modifiedAt
    }

    get modifiedAt () {
        return this._modifiedAt
    }

    set changedBy (changedBy) {
        this._changedBy = changedBy
    }

    get changedBy () {
        return this._changedBy
    }

    set onwer (owner) {
        this._owner = owner
    }

    get owner () {
        return this._owner
    }

    set isShared (isShared) {
        this._isShared = isShared
    }

    get isShared () {
        return this._isShared
    }
}

export default ListObject
