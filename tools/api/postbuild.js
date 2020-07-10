const path = require('path');
const fs = require('fs');
const dotEnv = require('dotenv');

const rootDir = `${path.join(__dirname, '../../')}`
const envFilePath = `${rootDir}.env`;

fs.stat(envFilePath, (err, stats) => {
  if (err) {
    throw err;
  }

  dotEnv.config({ path: envFilePath });
});
