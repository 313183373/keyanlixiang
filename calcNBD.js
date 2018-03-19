const Item = require('./lib/item');
const redis = require('redis');
const async = require('async');
const xlsx = require('node-xlsx');
const fs = require('fs');

const client = redis.createClient();

const M = 25270000000;

client.on('error', function (err) {
    console.error("Error " + err);
});

client.lrange('combinedItems', 0, -1, function (err, items) {
    let cnt = 0;
    if (err) throw err;
    async.mapLimit(items,10, async function (item) {
        cnt++;
        let [name1, name2] = item.split('&');
        let item1 = await Item.findOne({name: name1});
        let item2 = await Item.findOne({name: name2});
        let item3 = await Item.findOne({name: name1 + "&" + name2});
        let nbd = calcNBD(item1.number, item2.number, item3.number);
        item = name1 + " " + name2;
        console.log(cnt + ":" + item + ">>>" + nbd);
        cnt --;
        return [item,nbd];
    }, function (err, result) {
        if (err) throw err;
        let buffer = xlsx.build([{
            name:'sheet1',
            data:result,
        }]);
        fs.writeFileSync('nbdx.xlsx',buffer,{flag:'w'});
        console.log('saved');
    })
});

function calcNBD(x, y, xy) {
    x = Math.log(x);
    y = Math.log(y);
    xy = Math.log(xy);
    return (Math.max(x, y) - xy) / (Math.log(M) - Math.min(x, y));
}