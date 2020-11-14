import ListObject from './ListObject'

class Profile extends ListObject {
    constructor (data) {
        super(data)
        this._userId = data.userId
        this._name = data.name
        this._email = data.email
        this._syncOnStartup = data.syncOnStartup
        this._lastSyncTime = data.lastSyncTime
    }

    get userId () {
        return this._userId
    }

    set userId (userId) {
        this._userId = userId
    }

    get name () {
        return this._name
    }

    set name (name) {
        this._name = name
    }

    get email () {
        return this._email
    }

    set email (email) {
        this._email = email
    }

    get syncOnStartup () {
        return this._syncOnStartup
    }

    set syncOnStartup (syncOnStartup) {
        this._syncOnStartup = syncOnStartup
    }

    get lastSyncTime () {
        return this._lastSyncTime
    }

    set lastSyncTime (lastSyncTime) {
        this._lastSyncTime = lastSyncTime
    }

    toObject () {
        const keys = ['userId', 'name', 'email', 'syncOnStartup', 'lastSyncTime']
        return this._createObject(keys)
    }
}

export default Profile
