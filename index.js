const express = require('express');
const app = express();
app.use(express.json());

const entries = {
    pk1: { text: 'hello', flag: false, parent: null },
    pk2: { text: 'hello2', flag: true, parent: null },
    pk3: { text: 'hello3', flag: true, parent: 'pk1' }
};

let maxKey = 3;
const createKey = () => {
    return `pk${++maxKey}`;
};

// define routes
app.get('/', function (req, res) {
    res.setHeader('Content-Type' , 'text/plain');
    res.send('Hello World!' + new Date());
});

app.get('/entry', function (req, res) {
    const list = {};
    // TODO refactor using underscore/lodash '.each()'
    Object.keys(entries).map((key) => {
        if(entries[key].parent === null) {
            list[key] = entries[key];
        }
    });
    res.setHeader('Content-Type' , 'application/json');
    res.send(JSON.stringify(list));
});

app.get('/entry/:key', function (req, res) {
    res.setHeader('Content-Type' , 'application/json');
    res.send(JSON.stringify(entries[req.params.key]));
});

app.post('/entry', function (req, res) {
    try {
        // check parameters
        const newEntry = req.body;
        if (typeof newEntry.parent === 'undefined') {
            newEntry.parent = null;
        }
        else if(typeof entries[newEntry.parent] === 'undefined') {
            throw { type: 'invalid parameters', message: 'provided parent does not exist' };
        }

        // create entry
        const key = createKey();
        entries[key] = {
            text: newEntry.text,
            flag: newEntry.flag,
            parent: newEntry.parent
        };

        // send response
        res.setHeader('Content-Type' , 'application/json');
        res.send(JSON.stringify(entries[key]));
        console.log(`create entry '${key}'`);
    }
    catch(err){
        res.status(500).send({ error: err.type, message: err.message });
    }
});

// start server
app.listen(8080, function (err) {
    if (err) console.log('error: ' + err);
    else console.log('Running on port 8080!');
});

// catch error for bad json format thrown by express.json() middleware
// https://stackoverflow.com/a/58136032/1745341
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        let message = 'Bad request';
        if (err.type === 'entity.parse.failed') {
            let data = req.body || req.query;
            try {
                JSON.parse(data); // <-- reproduce error in order to catch it
            } catch (error) {
                // get the first line of error which is "SyntaxError: Unexpected string in JSON at position 59"
                message = error.toString().split('\n')[0];
            }
        }
        return res.status(400).send({ error: err.type, message: message });
    }
    next();
});
