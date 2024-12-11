const mongoose = require('mongoose');

function connect() {
    mongoose.connect('mongodb://0.0.0.0/CHAT_APP').then(() => {
        console.log('Connected to MongoDB')
    }).catch((err) => {
        console.log(err)
    })
}

module.exports = connect;   