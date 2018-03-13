const xlsx = require('node-xlsx').default;
const mongoose = require('mongoose');
const redis = require('redis');
const request = require('superagent');
const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const Item = require('./lib/item');

const client = redis.createClient();

client.on("error", function (err) {
    console.error("Error " + err);
});


// 从excel中获取数据
// const workSheetsFromFile = xlsx.parse(`${__dirname}/词条.xlsx`);
// const sheet = workSheetsFromFile[0];
// const data = sheet.data;

// 将获取到的数据存取到redis中（包括组合的）
// saveSingleData(data);
// savecombileData(data);

// 从redis中获取所有数据，然后查询结果数，并放到mongdb中
getAllData();

function saveSingleData(data) {
    for (let i = 0; i < data.length; i++) {
        client.rpush('items', JSON.stringify({name: data[i][0]}), redis.print);
    }
}

function savecombileData(data) {
    for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
            client.rpush('items', JSON.stringify({name: data[i][0] + ' ' + data[j][0]}), redis.print);
        }
    }
}

function getAllData() {
    let lostItems = [];
    client.lrange('items', 0, -1, function (err, items) {
        if (err) throw err;
        let n = 0;
        (async () => {

            let itemsIHave = await Item.find({});
            itemsIHave = itemsIHave.map(value => [value.name]);
            console.log(itemsIHave);
            console.log('Items I have: ' + itemsIHave.length);

            // 导出已有的项目到excel中
            // let buffer = xlsx.build([{
            //     name:'sheet1',
            //     data:itemsIHave
            // }]);
            // fs.writeFileSync('test1.xlsx',buffer,{'flag':'w'});

            // 获取重复词条数目
            // let set = new Set(itemsIHave);
            // console.log('repeat items I have: ' + Number(itemsIHave.length - set.size));

            // 滤除重复词条
            // console.log('All items: ' + items.length);
            // items = items.map(value => JSON.parse(value))
            //     .filter(value => !itemsIHave.includes(value.name));
            // console.log('Filter items:' + items.length);


            // 测试是否真的重复（发现是真的重复了，但是不知道为什么会出现重复词条）
            // let num = 0
            // items.forEach(function (value, index, arr) {
            //     Item.find({name: value.name}, function (err, result) {
            //         if (err) throw err;
            //         if (result) {
            //             num++;
            //             console.log(`${num}:${result}`);
            //         } else console.log(result + '没有重复!');
            //     })
            // })

            // 爬取
            // async.mapLimit(items, 10, async function (item) {
            //     let res = await request.get('http://www.baidu.com/s')
            //         .query({wd: item.name})
            //         .catch(function (err) {
            //             if (err) console.error('request Error :' + err);
            //         });
            //     if (res && res.text) {
            //         n++;
            //         let $ = cheerio.load(res.text);
            //         let cnt = $('.head_nums_cont_inner .nums').text().replace(/[^0-9]/g, '');
            //         let i = new Item({
            //             name: item.name,
            //             number: cnt,
            //             baikeUrl: undefined
            //         });
            //         i.save(function (err) {
            //             if (err) {
            //                 console.error(`${item.name} 存储出错!`);
            //                 console.error(err);
            //             } else {
            //                 console.log(`${n}:${item.name}的结果数为:${cnt}`);
            //             }
            //         });
            //         return cnt;
            //     } else {
            //         console.log(`${item.name}没有获取到!`);
            //         lostItems.push(item);
            //     }
            // }, (err, results) => {
            //     if (err) throw err;
            //     console.log(results);
            // });
        })();
    });
}
