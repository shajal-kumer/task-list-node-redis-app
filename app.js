const express = require("express")
const bodyParse = require("body-parser")
const logger = require("morgan")
const redis = require("redis")
const path = require("path")

const app = express();

// create client 
const client = redis.createClient();

client.on("connect", () => {
    console.log('Redis server connected');
    
})

// view wngine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParse.json());
app.use(bodyParse.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, 'public')))


app.get('/', (req, res) => {
    const title = 'Task List App';

    client.lrange("my-tasks", 0,-1, (err, reply) => {
        client.hgetall('call', (err, call) => {
            res.render('index', {
                title: title,
                tasks: reply,
                call: call
            })
        })
    })
})

app.post("/task/add", (req, res) => {
    const task = req.body.task;
    client.rpush("my-tasks", task, (err, reply) => {
        if(err) {
            console.log(err);            
        }
        console.log('Task added');
        res.redirect('/')
    })
})

app.post('/task/delete', (req, res) => {
    const tasksToDelete = req.body.tasks;
    // client.lrem("my-tasks", -1, tasksToDelete, (err, reply) => {
    //     if(err) {
    //         console.log(err);            
    //     } else {
    //         console.log('Task deleted');
    //     }
    // res.redirect('/')
    // })
    
        client.lrange("my-tasks", 0, -1, (err, tasks) => {
            for (let i = 0; i < tasks.length; i++) {
                if (tasksToDelete.indexOf(tasks[i]) > -1) {
                    client.lrem("my-tasks", 0, tasks[i], (err, res) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Resposne: ',res);
                        }
                    })
                }
            }
            res.redirect('/');
    })
})

app.post('/call/add', (req, res) => {
    const newCall = {
        name: req.body.name,
        company: req.body.company,
        phone: req.body.phone,
        time: req.body.time,
    }

    client.hmset('call', ['name', newCall.name, 'company', newCall.company, 'phone', newCall.phone, 'time', newCall.time], (err, reply) => {
        if(err) {
            console.log(err);
        } else {
            console.log(reply);
            res.redirect('/')
        }
    })
})

app.listen(3000);
console.log('Server started on port 3000');
module.exports = app;
