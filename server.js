const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3500;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const users = require('./routes/users');
const system = require('./routes/system');
const servidor = require('./routes/server');

process.stdin.setEncoding('ascii');
process.stdout.setEncoding('ascii');

app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.use('/', users);
app.use('/', system);
app.use('/', servidor);

app.listen(PORT, () => console.log(`Server iniciado na porta ${PORT}`));