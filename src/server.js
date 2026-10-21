'use strict';
const app = require('./app');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
app.listen(port, host, (error) => {
  if (error) {
    console.error(`Cannot start security lab: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Security lab: http://${host}:${port}`);
});
