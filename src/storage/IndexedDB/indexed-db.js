import { model } from './db-model'

const DB_NAME = 'my-lists'
const DB_VERSION = 3
let DB

export default {

    async getDb () {
        return new Promise((resolve, reject) => {
            if (DB) {
                return resolve(DB)
            }
            const request = window.indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = e => {
                reject(e)
            }

            request.onsuccess = e => {
                DB = e.target.result
                resolve(DB)
            }

            request.onupgradeneeded = e => {
                const db = e.target.result
                const tables = model.tables

                Object.keys(tables).forEach(tableName => {
                    if (!db.objectStoreNames.contains(tableName)) {
                        const store = db.createObjectStore(tableName, tables[tableName].config)
                        tables[tableName].indexes.forEach(index => {
                            store.createIndex(index, index, { unique: false })
                        })
                    }
                })
            }
        })
    },

    async getObjects (table) {
        const db = await this.getDb()

        return new Promise(resolve => {
            const trans = db.transaction([table], 'readonly')

            trans.oncomplete = () => {
                resolve(objects)
            }

            const store = trans.objectStore(table)
            const objects = []

            store.openCursor().onsuccess = e => {
                const cursor = e.target.result
                if (cursor) {
                    objects.push(cursor.value)
                    cursor.continue()
                }
            }
        })
    },

    async getObjectsBy (table, options) {
        const db = await this.getDb()

        if (!options) {
            return this.getObjects(table)
        }

        return new Promise(resolve => {
            const trans = db.transaction([table], 'readonly')
            const store = trans.objectStore(table)

            const field = Object.keys(options)[0]
            let value = options[field]

            if (field === store.keyPath) {
                if (store.autoIncrement) {
                    value = parseInt(value, 10)
                }
                const request = store.get(value)
                request.onsuccess = () => {
                    resolve([request.result])
                }
            } else {
                const range = IDBKeyRange.only(value)
                const objects = []
                const index = store.index(field)

                trans.oncomplete = () => {
                    resolve(objects)
                }

                index.openCursor(range).onsuccess = e => {
                    const cursor = e.target.result
                    if (cursor) {
                        objects.push(cursor.value)
                        cursor.continue()
                    }
                }
            }
        })
    },

    async addObject (table, object) {
        const db = await this.getDb()

        return new Promise((resolve, reject) => {
            const trans = db.transaction([table], 'readwrite')
            const store = trans.objectStore(table)
            const request = store.add(object)
            request.onsuccess = r => {
                resolve(r.target.result)
            }
            request.onerror = r => {
                console.error(r)
                reject(object)
            }
        }).catch(e => {
            throw new Error(`Error getting table ${table} - ${e.message}`)
        })
    },

    async updateObject (table, object) {
        const db = await this.getDb()

        return new Promise((resolve, reject) => {
            const trans = db.transaction([table], 'readwrite')
            const store = trans.objectStore(table)
            const request = store.get(object[store.keyPath])

            request.onsuccess = () => {
                const data = Object.assign({}, request.result, object)
                const updateRequest = store.put(data)
                updateRequest.onsuccess = () => {
                    resolve(data)
                }
                updateRequest.onerror = e => {
                    reject(e)
                }
            }
            request.onerror = e => {
                reject(e)
            }
        })
    },

    async updateObjects (table, objects) {
        const db = await this.getDb()

        return new Promise((resolve, reject) => {
            const trans = db.transaction([table], 'readwrite')
            const store = trans.objectStore(table)

            trans.oncomplete = () => {
                resolve(objects)
            }

            objects.forEach(object => {
                const request = store.get(object[store.keyPath])

                request.onsuccess = (r) => {
                    const data = Object.assign({}, r.target.result, object)
                    store.put(data).onerror = (e) => {
                        reject(e)
                    }
                }
            })
        })
    },

    async deleteObjectsBy (table, options) {
        const db = await this.getDb()

        return new Promise((resolve, reject) => {
            const trans = db.transaction([table], 'readwrite')
            trans.oncomplete = () => {
                resolve()
            }
            trans.onerror = (e) => {
                reject(e)
            }

            const store = trans.objectStore(table)
            const field = Object.keys(options)[0]
            const value = options[field]

            if (field === store.keyPath) {
                store.delete(value)
            } else {
                const index = store.index(field)
                const range = IDBKeyRange.only(value)

                index.openKeyCursor(range).onsuccess = e => {
                    const cursor = e.target.result
                    if (cursor) {
                        store.delete(cursor.primaryKey)
                        cursor.continue()
                    }
                }
            }
        })
    }
}
