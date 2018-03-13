const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/pachong');

let db = mongoose.connection;

db.on('error',console.log.bind(console,'connection errror;'));

db.once('open',function () {
    console.log('we are connected!');
});

let itemSchema = mongoose.Schema({
    name:String,
    number:Number,
    baikeUrl:String,
});

let Item = mongoose.model('Item',itemSchema);

module.exports = Item;
