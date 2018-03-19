const xlsx = require('node-xlsx').default;
const mongoose = require('mongoose');
const redis = require('redis');
const request = require('superagent');
const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const Item = require('./lib/item');
const RedisSaver = require('./lib/redisSaver');

const client = redis.createClient();

client.on("error", function (err) {
    console.error("Error " + err);
});


// 从excel中获取数据
// const workSheetsFromFile = xlsx.parse(`${__dirname}/词条.xlsx`);
// const sheet = workSheetsFromFile[0];
// const data = sheet.data;

// 将获取到的词条存取到redis中（包括组合的）
// let redisSaver = new RedisSaver(client);
// redisSaver.saveData(data);


// 从redis中获取所有数据，然后查询结果数，并放到mongdb中
// getAllData();

// fixNullNumber();

// saveDataToExcel('output.xlsx');

function getAllData() {
    client.lrange('items', 0, -1, function (err, items) {
        if (err) throw err;
        let n = 0;
        (async () => {

            // 获取已经获得的词条
            let itemsIHave = await Item.find({});
            itemsIHave = itemsIHave.map(value => value.name);
            console.log('items I have: ' + itemsIHave.length);

            // 获取重复词条数目
            let set = new Set(itemsIHave);
            console.log('repeat items I have: ' + Number(itemsIHave.length - set.size));

            // 滤除重复词条
            console.log('all items: ' + items.length);
            items = items.filter(value => !itemsIHave.includes(value));
            console.log('rest items: ' + items.length);


            // 测试是否真的重复
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
            let yibuCnt = 0;
            async.mapLimit(items, 10, async function (item) {
                yibuCnt++;
                let query = '"' + item.split('&').join('"+"') + '"'; //百度的内容
                let res = await request.get('http://www.baidu.com/s')
                    .query({wd: `${query}`})
                    .catch(function (err) {
                        if (err) console.error('request Error :' + err);
                    });
                if (res && res.text) {
                    n++;
                    let $ = cheerio.load(res.text);
                    let cnt = $('.head_nums_cont_inner .nums').text().replace(/[^0-9]/g, '');
                    let i = new Item({
                        name: item,
                        number: cnt,
                        baikeUrl: undefined
                    });
                    i.save(function (err) {
                        if (err) {
                            console.error(`${item} 存储出错!`);
                            console.error(err);
                        } else {
                            console.log(`${n}:${item}的结果数为:${cnt},并发数为${yibuCnt}`);
                        }
                        yibuCnt--;
                    });
                    return cnt;
                } else {
                    console.log(`${item}没有获取到!`);
                    yibuCnt--;
                }
            }, (err, results) => {
                if (err) throw err;
                console.log(results);
            });
        })();
    });
}

function saveDataToExcel(name) {
    (async () => {
        let itemsIHave = await Item.find({});
        itemsIHave = itemsIHave.map(value => [value.name, value.number]);
        // 导出已有的项目到excel中
        let buffer = xlsx.build([{
            name: 'sheet1',
            data: itemsIHave
        }]);
        fs.writeFileSync(name, buffer, {'flag': 'w'});
        console.log('saved!');
    })();
}

function fixNullNumber() {
    (async () => {
        let items = await Item.find({number: null});
        console.log(`bad items: ${items.length}`);
        async.mapLimit(items, 10, async function (item) {
                let query = '"' + item.name.split('&').join('""') + '"';
                let res = await request.get('http://www.baidu.com/s')
                    .query({wd: query})
                    .catch(function (err) {
                        if (err) console.error('request Error :' + err);
                    });
                if (res && res.text) {
                    let $ = cheerio.load(res.text);
                    let cnt = $('.head_nums_cont_inner .nums').text().replace(/[^0-9]/g, '');
                    Item.update({_id: item._id}, {$set: {number: cnt}}, function (err, result) {
                        if (err) throw err;
                        console.log(`${item.name}更新number为${cnt}`);
                        return cnt;
                    });
                } else {
                    console.log(`${item.name}获取失败!`);
                }
            }, (err, result) => {
                if (err) throw err;
                console.log(result);
            }
        )
    })();
}
