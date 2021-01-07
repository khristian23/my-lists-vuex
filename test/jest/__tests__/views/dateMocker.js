const realDate = Date
let currentDate

export default {
    mock () {
        currentDate = new Date()

        global.Date = class extends Date {
            constructor(date) {
                if (date) {
                    return super(date)
                }

                return currentDate
            }
        };
    },

    getCurrentDate () {
        return currentDate
    },

    restore () {
        global.Date = realDate
    }
}