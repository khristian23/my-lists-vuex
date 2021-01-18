import ListObject from './ListObject'

class List extends ListObject {
    constructor (data) {
        super(data)

        this._description = data.description
        this._type = data.type
        this._subtype = data.subtype
        this._listItems = data.listItems || []
        this._sharedWith = data.sharedWith || []
    }

    get description () {
        return this._description
    }

    set description (description) {
        this._description = description
    }

    get type () {
        return this._type
    }

    set type (type) {
        this._type = type
    }

    get subtype () {
        return this._subtype
    }

    set subtype (subtype) {
        this._subtype = subtype
    }

    set listItems (listItems) {
        this._listItems = listItems
    }

    get listItems () {
        return this._listItems
    }

    set sharedWith (sharedWith) {
        this._sharedWith = sharedWith
    }

    get sharedWith () {
        return this._sharedWith
    }

    addListItems (listItems) {
        listItems.forEach(item => this.addListItem(item))
    }

    addListItem (listItem) {
        listItem.listId = this._id
        this._listItems.push(listItem)
    }

    toFirebaseObject () {
        const keys = ['name', 'description', 'type', 'subtype', 'sharedWith', 'modifiedAt', 'changedBy']
        const firebaseObject = this._createObject(keys)
        return firebaseObject
    }

    toObject () {
        const keys = ['id', 'name', 'description', 'priority', 'type', 'subtype', 'modifiedAt',
            'syncStatus', 'firebaseId', 'userId']
        return this._createObject(keys)
    }

    clone () {
        const listClone = new List(this.toObject())
        listClone.listItems = this.listItems.map(item => item.clone())
        return listClone
    }
}

export default List
