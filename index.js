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
        const products = await db.product.findAll({
            include: [
                {
                    model: db.productPrice,
                    as : 'productPrice',
                }
            ],
            where: {
                state : true
            }
        });
        
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
        const product = await db.product.findOne({
            include: [
                {
                    model: db.productPrice,
                    as : 'productPrice',
                }
            ],
            where:{id: id}
        });
                
        var price = 0;
        for(var j = 0; j < product.productPrice.length; j++){
            console.log(new Date(Date.now()))
            console.log(product.productPrice[j].beginDate);
            console.log(product.productPrice[j].endDate);

            if(((product.productPrice[j].beginDate) <= (new Date(Date.now())))  && ((product.productPrice[j].endDate) >= (new Date(Date.now())))){
                console.log('Đúng');

                price = product.productPrice[j].price;
                break;
            }else
            {
                console.log('Sai')
            }
        }

        if(!product){
            res.status(400).json({
                message: "Cant get product's list"
            })
        }

        // res.send(product);
        res.status(200).json({
            message: "Get product's list successfully!",
            product,
            price
        })
    } catch (error) {
        console.log(error);
    }
})

app.post('/product-edit/:id', async (req, res, next)=>{
    const body = req.body;
    const id = req.params.id;

    var product = await db.product.update(body, { where: {id : id}});
  
    if(product == false){
        res.send("Lỗi");
    }
    res.status(200).json({
        message: "Cập nhật sản phẩm thành công!",
        product
    })
})

app.post('/product-delete/:id', async (req, res, next)=>{
    const body = req.body;
    const id = req.params.id;

    var product = await db.product.update(body, { where: {id : id}});
  
    if(product == false){
        res.send("Lỗi");
    }
    res.status(200).json({
        message: "Xóa mềm sản phẩm thành công!",
        product
    })
})

app.post('/product-create', async (req, res, next)=>{
    try {
        let info = {
            name: req.body.name,
            species: req.body.species,
            description: req.body.description,
            weight: req.body.weight,
            birthDate: Date(Date.now()),
            stock: req.body.stock,
            state: true,
            imgUrl: req.body.imgUrl
        }

        var product = await db.product.create(info);
        
        if(product == false){
            res.send("Lỗi");
        }

        let inforr = {
            price: req.body.price,
            beginDate: req.body.beginDate,
            endDate: req.body.endDate,
            product_id: product.id
        }

        var od = await db.productPrice.create(inforr);

        if(!od){
            res.status(403).json({
                message: "Lỗi tạo giá sản phẩm"
            })
            return;
        }
        res.status(200).json({
            message: "Thêm đơn đặt thành công!",
            product
        })
    } catch (error) {
        console.log(error);
    }
})


app.get('/productPrice-list/:id', async (req, res)=>{
    try {
        const productPrices = await db.productPrice.findAll({
            include: [
                {
                    model: db.product,
                    as : 'product',
                }
            ],
            where: {
                product_id : req.params.id
            }
        });
        
        if(!productPrices){
            res.status(400).json({
                message: "Cant get product's list"
            })
        }

        res.send(productPrices);
        // res.status(200).json({
        //     // message: "Get product's list successfully!",
        //     products
        // })
    } catch (error) {
        console.log(error);
    }
})

app.post('/productPrice-create', async (req, res)=>{
    try {
        let info = {
            price : req.body.price,
            beginDate:  req.body.beginDate,
            endDate:  req.body.endDate,
            product_id:  req.body.product_id
        }

        var productPrice = await db.productPrice.create(info);
        
        if(!productPrice){
            res.send("Lỗi tạo giá SP");
        }

        res.status(200).json({
            message: "Thêm giá sản phẩm thành công!",
            productPrice
        })
    } catch (error) {
        console.log(error);
    }
})

app.post('/order-add', middlewareController.verifyToken, async (req, res)=>{
    try {
        let info = {
            totalPrice : 0,
            date : Date(Date.now()),
            customer_id: req.body.customer_id,
            user_id: req.body.user_id,
            address: req.body.address,
            state: req.body.state
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
       
        
        if(req.body.user_id){
            var rev = await db.revenue.findOne({where: {user_id: req.body.user_id}})

            const addRevenue = {
                total: rev.total + (req.body.price * req.body.quantity)
            }

            console.log("Total: " +addRevenue.total);
            await db.revenue.update(addRevenue, {where: {user_id: req.body.user_id}})
        }

        var product = await db.product.findOne({where: {id: req.body.product_id}});

        var stockAfter = product.stock - 1;
        const bodyy = {
            stock: stockAfter
        }

        await db.product.update(bodyy, { where: {id: req.body.product_id}});

        res.status(200).json({
            message: "Thêm đơn đặt thành công!",
            order
        })
    } catch (error) {
        console.log(error);
    }
})

app.get('/order-confirm/:id', async (req, res, next)=>{
    try {
        let info = {
            state: true
        }

        var id = req.params.id;

        var order = await db.order.update(info, {where: { id: id}});
        
        if(order == false){
            res.send("Lỗi");
            return;
        }

        res.status(200).json({
            message: "Xác nhận đơn đặt thành công!",
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

app.get('/user-list/:id', async (req, res)=>{
    try {
        const users = await db.user.findAll({
            include: [
                {
                    model: db.revenue,
                    as : 'revenue',
                }
            ],
            where: {
                manager: req.params.id,
                state : true
            }
        });
        
        if(!users){
            res.status(400).json({
                message: "Cant get product's list"
            })
        }

        res.send(users);
    } catch (error) {
        console.log(error);
    }
})

app.get('/user-delete/:id', async (req, res, next)=>{
    try {
        let info = {
            state: false
        }

        var id = req.params.id;

        var user = await db.user.update(info, {where: { id: id}});
        
        if(!user){
            res.send("Lỗi xóa người dùng");
            return
        }

        res.status(200).json({
            message: "Xóa người dùng thành công!",
            user
        })
    } catch (error) {
        console.log(error);
    }
})

app.post("/user-create", async(req, res)=>{
    try {
        // get data from body
        const { firstName, lastName, email, password, inviter, manager, state, role_id} = req.body;

        // all the data should exists
        if(!(firstName && lastName && email && password)){
            res.status(400).send('All field are compulsory')
        }

        var u = await db.user.findOne({ where: { email: email} })
        if(u){
            res.status(401).send('User already exists with this email')
            return;
        }

        // ecrypt the password
        const myEnPassword = await bcrypt.hash(password, 10);

        // save the user in DB
        const user = await db.user.create({
            firstName,
            lastName,
            email,
            password: myEnPassword,
            inviter,
            manager, state,
            role_id
        })

        console.log("USER ID mới: " + user.id);

        let rev_body = {
            total: 0,
            user_id: user.id
        }
        await db.revenue.create(rev_body);

        res.status(201).json({
            message: 'Create user successfully!',
            user
        })
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

app.get('/user/order-lastId', async (req, res)=>{
    try {
        const orders = await db.order.findAll({});
        
        if (!orders) {
            res.status(404).json({ 
                message: "Cant get order's list"
             });
            // stop further execution in this callback
            return;
        }

        var lastId = 0;
        for( var i = 0; i < orders.length; i++){
            lastId = orders[i].id;
            console.log(lastId);
        }

        res.status(200).json({
            lastId,
            orders
        })
    } catch (error) {
        console.log(error);
    }
})

app.get('/user-revenue/:id', async (req, res)=>{
    try {
        const rev = await db.revenue.findOne({
            where: {
                user_id : req.params.id
            }
        });
        
        if(!rev){
            res.status(400).json({
                message: "Cant get product's list"
            })
            return;
        }

        res.send(rev);
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