const express = require('express');
require('./src/config/connect-db');
const bodyparser = require('body-parser');
const cors = require('cors');
const app = express();
const rout = require('./src/routes/router');
const db = require('./src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


// adding socket.io configuration
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server, {
    cors:{
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

const middlewareController = require('./src/controllers/middlewareController');

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(cookieParser())

app.post("/register", async(req, res)=>{
    try {
        // get data from body
        const { firstName, lastName, email, password, phone} = req.body;

        // all the data should exists
        if(!(firstName && lastName && email && password)){
            res.status(400).send('All field are compulsory')
        }

        var u = await db.customer.findOne({ where: { email: email} })
        if(u){
            res.status(401).send('Customer already exists with this emils')
            return;
        }

        // ecrypt the password
        const myEnPassword = await bcrypt.hash(password, 10);

        // save the user in DB
        const customer = await db.customer.create({
            firstName,
            lastName,
            email,
            password: myEnPassword,
            phone
        })

        // generate a token for customer and send it
        const token = jwt.sign(
            {id: customer._id, email},
            'shhhh', // process.env.jwtsecret
            {
                expiresIn: "2h"
            }
        );

        customer.token = token
        customer.password = undefined

        

        res.status(201).json({
            message: 'Register successfully!',
            customer
        })
    } catch (error) {
        console.log(error);
    }
})

app.post('/login', async (req, res)=>{
    try {
        // get all data from frontend
        const {email, password} = req.body;

        //validation
        if(!(email && password)){
            res.status(400).send('send all data');
        }

        // find user in DB
        const customer = await db.customer.findOne({where: {email: email}})

        // assignment - if user is not there, then what ?

        // match the password
        if(customer && (await bcrypt.compare(password, customer.password))){
            const token = jwt.sign(
                {
                    id: customer.id,
                    email: customer.email,
                    name: customer.firstName
                },
                'shhhhh', //process.env.jwtsecret
                {
                    expiresIn: "2h"
                }
            );

            customer.token = token
            customer.password = undefined

            // cookie section
            const options = {
                expires: new Date(Date.now() + 3 * 23 * 60 * 60 * 1000),
                httpOnly: true
            };

            // const {password, ...orthers} = customer._doc;
            res.status(200).cookie("token", token, options).json({
                success: true,
                token,
                // ...orthers
                customer
            })
        }
        // send a token
    } catch (error) {
        console.log(error);
    }
})

app.get('/product-list', async (req, res)=>{
    try {
        const products = await db.product.findAll({});
        
        if(!products){
            res.status(400).json({
                message: "Cant get product's list"
            })
        }

        res.send(products);
        // res.status(200).json({
        //     // message: "Get product's list successfully!",
        //     products
        // })
    } catch (error) {
        console.log(error);
    }
})

app.get('/product-detail/:id', async (req, res)=>{
    try {
        var id = req.params.id;
        const product = await db.product.findOne({where:{id: id}});
        
        if(!product){
            res.status(400).json({
                message: "Cant get product's list"
            })
        }

        res.send(product);
        // res.status(200).json({
        //     // message: "Get product's list successfully!",
        //     products
        // })
    } catch (error) {
        console.log(error);
    }
})

app.post('/order-add', async (req, res)=>{
    try {
        let info = {
            totalPrice : 0,
            date : Date(Date.now()),
            customer_id: req.body.customer_id,
            user_id: req.body.user_id,
            address: req.body.address
        }

        var order = await db.order.create(info);
        
        if(order == false){
            res.send("Lỗi");
        }

        console.log(order.id);

        let inforr = {
            quantity: req.body.quantity,
            price: req.body.price,
            order_id: order.id,
            customer_id: req.body.customer_id,
            product_id: req.body.product_id
        }

        var od = await db.orderDetail.create(inforr);

        const body = {
            totalPrice : od.price * od.quantity
        }

        var updateOrder = await db.order.update(body, { where: {id : order.id}});
        res.status(200).json({
            message: "Thêm đơn đặt thành công!",
            order
        })
    } catch (error) {
        console.log(error);
    }
})

// NHÂN VIÊN
app.post('/user/login', async (req, res)=>{
    try {
        // get all data from frontend
        const {email, password} = req.body;

        //validation
        if(!(email && password)){
            res.status(400).send('send all data');
        }

        // find user in DB
        const user = await db.user.findOne({
            include: [{
                model: db.role,
                as : 'role',
            }],
            where: {email: email}})

        // assignment - if user is not there, then what ?

        // match the password
        if(user && (await bcrypt.compare(password, user.password))){
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    name: user.firstName,
                    role: user.role_id
                },
                'shhhhh', //process.env.jwtsecret
                {
                    expiresIn: "2h"
                }
            );

            user.token = token
            user.password = undefined

            // cookie section
            const options = {
                expires: new Date(Date.now() + 3 * 23 * 60 * 60 * 1000),
                httpOnly: true
            };

            // const {password, ...orthers} = customer._doc;
            res.status(200).cookie("token", token, options).json({
                success: true,
                token,
                // ...orthers
                user
            })
        }
        // send a token
    } catch (error) {
        console.log(error);
    }
})

app.get('/user/order-list', async (req, res)=>{
    try {
        const orders = await db.order.findAll({
            include: [
                {
                    model: db.user,
                    as : 'user',
                },
                {
                    model: db.customer,
                    as : 'customer',
                }
            ]
        });
        
        if (!orders) {
            res.status(404).json({ 
                message: "Cant get order's list"
             });
            // stop further execution in this callback
            return;
        }

        res.send(orders);
        // res.status(200).json({
        //     orders
        // })

    } catch (error) {
        console.log(error);
    }
})

app.use(rout);
// app.listen(5005, ()=>{
//     console.log("Chạy thành công!");
// })


app.post("/send-message", async(req, res)=>{
    try {
        // get data from body
        const { room, author, message, time} = req.body;

        // all the data should exists
        // if(!(room && author && message && time)){
        //     res.status(400).send('All field are compulsory')
        // }

        // save the user in DB
        const customer = await db.message.create({
            room,
            author,
            message,
            time
        })

        res.status(201).json({
            message: 'Send successfully!',
            customer
        })
    } catch (error) {
        console.log(error);
    }
})

app.get('/message-list', async (req, res)=>{
    try {
        const messages = await db.message.findAll({});
        
        if (!messages) {
            res.status(404).json({ 
                message: "Cant get order's list"
             });
            return;
        }

        res.send(messages);

    } catch (error) {
        console.log(error);
    }
})

io.on("connection", (socket)=>{
    console.log(`USER CONNECTED: ${socket.id}`);

    socket.on("join_room", (data)=>{
        socket.join(data);
        console.log(`User with ID: ${socket.id} joined room: ${data}`)
    })

    socket.on("send_message", async (data)=>{
        console.log("Server + ");
        console.log(data);
        socket.to(data.room).emit("receive_message", data);
        // socket.to(data.room).emit("receive_message",
        // await db.message.findAll({})
        // );
    });

    socket.on("send_order", async (data)=>{
        console.log("Server + ");
        console.log(data);
        socket.to(data.room).emit("receive_order", data);
        // socket.to(data.room).emit("receive_message",
        // await db.message.findAll({})
        // );
    });

    socket.on("disconnect", ()=>{
        console.log("USER DISCONNECTED", socket.id)
    })
})          

server.listen(5005, ()=>{
    console.log("Chạy thành công!");
})