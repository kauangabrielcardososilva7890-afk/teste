const fs = require('fs');
try{ fs.rmSync('dist', { recursive: true, force: true }); }catch(e){}
