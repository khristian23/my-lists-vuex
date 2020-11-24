class BaseObject {
    constructor (data) {
        this._id = data.id
    }

    get id () {
        return this._id
    }

    set id (id) {
        this._id = id
    }

    _createObject (keys) {
        return keys.reduce((object, property) => {
            if (BaseObject.prototype.hasOwnProperty.call(this, '_' + property)) {
                object[property] = typeof this['_' + property] === 'undefined' ? '' : this['_' + property]
            }
            return object
        }, {})
    }

    clone () {
        throw Error('Implement Clone method')
    }
}

export default BaseObject
