
const downloader = require('./index');

downloader.download({
    url: 'https://www.hkg.haokan333.com/201903/07/qM3F7ntN/800kb/hls/index.m3u8',
    processNum: 4, // 同时开启的线程数,线程不宜开的过多，否则容易造成资源无法正常下载的情况。
    filePath: 'video', // 所存放的文件夹
    fileName: 'test', // 视频资源的文件名,
    deleteTemp: false // 执行完毕后不删除临时文件
});