const arg = require('arg');
const downloader = require('./index');

const args = arg({
    '--url': String,
    '--process': Number,
    '--path': String,
    '--name': String,
    '--deleteTemp': Boolean
});

if (!args['--url']) {
    throw new Error('您要下载哪个文件? 请以--url告诉我.');
}

downloader.download({
    url: args['--url'],
    processNum: args['--process'] || 4, // 同时开启的线程数,线程不宜开的过多，否则容易造成资源无法正常下载的情况。
    filePath: args['--path'] || 'video', // 所存放的文件夹
    fileName: args['--name'] || 'video', // 视频资源的文件名
    deleteTemp: args['--deleteTemp'] || true // 是否删除临时文件
});