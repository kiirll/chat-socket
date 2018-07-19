const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const message = new Schema(
    {
        text : {
            type: String
        },
        author: {
            type: String
        },
        chat:{
            type: Schema.Types.ObjectId,
            ref: 'chat'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('messaage', message);