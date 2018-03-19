const redis = require('redis');

class RedisSaver {
    constructor(client) {
        this.client = client;
    }

    saveData(data) {
        clearData('items', this.client);
        clearData('combinedItems', this.client);
        saveSingleData(data, 'items', this.client);
        savecombineData(data, 'items', this.client);
        savecombineData(data, 'combinedItems', this.client);
    }
}

function savecombineData(data, name, client) {
    for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
            client.rpush(name, data[i][0] + '&' + data[j][0], redis.print);
        }
    }
}

function saveSingleData(data, name, client) {
    for (let i = 0; i < data.length; i++) {
        client.rpush(name, data[i][0], redis.print);
    }
}

function clearData(name, client) {
    client.ltrim(name, 1, 0, redis.print);
}

module.exports = RedisSaver;