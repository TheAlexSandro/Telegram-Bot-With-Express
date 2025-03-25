import express from 'express';
import bodyParser from 'body-parser';
import { welcome, webhook } from './api/server';

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', welcome);
app.post('/webhook', webhook);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});