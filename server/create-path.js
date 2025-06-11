const path = require('path');

const createPath = (page) => path.resolve(__dirname, '../client/views', `${page}.ejs`);

module.exports = createPath;