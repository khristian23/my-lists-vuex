export const model = {

    tables: {
        list: {
            config: {
                autoIncrement: true,
                keyPath: 'id'
            },
            indexes: [
                'name',
                'firebaseId',
                'description',
                'type',
                'subtype',
                'status',
                'modifiedAt',
                'userId'
            ]
        },
        item: {
            config: {
                autoIncrement: true,
                keyPath: 'id'
            },
            indexes: [
                'listId',
                'firebaseId',
                'name',
                'priority',
                'status',
                'modifiedAt',
                'userId'
            ]
        },
        profile: {
            config: {
                keyPath: 'userId'
            },
            indexes: [
                'name',
                'email',
                'syncOnStartup',
                'lastSyncTime'
            ]
        }
    }
}
