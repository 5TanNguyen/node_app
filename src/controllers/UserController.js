const db = require('../models');

class UserController{
    static async getAllUser(req, res, next){
        var users = await db.user.findAll({
            include: [{
                model: db.product,
                as: 'product'
            }]
        });

        if(users == false){
            res.send("Lỗi");
        }

        res.status(200).json({
            message: "Lấy danh sách người dùng thành công!",
            users
        })
    }

    static async getOneUser(req, res, next){
        var users = await db.user.findOne({
            include: [{
                model: db.product,
                as : 'product',
            }],
            where: { id : req.params.id}});

        res.send(users);
    }

    static async addUser(req, res, next){
        let info = {
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            email : req.body.email,
            inviter: req.body.inviter,
            manager: req.body.manager
        }

        var users = await db.User.create(info);
        
        if(users == false){
            res.send("Lỗi");
        }
        res.status(200).json({
            message: "Thêm người dùng thành công!",
            users
        })
    }

    static async updateUser(req, res, next){
        const body = req.body;
        const id = req.params.id;

        var users = await db.User.update(body, { where: {id : id}});
      
        if(users == false){
            res.send("Lỗi");
        }
        res.status(200).json({
            message: "Cập nhật người dùng thành công!",
            users
        })
    }

    static async deleteUser(req, res, next){
        var users = await db.User.destroy({where: {id : req.params.id}});

        if(users == false){
            res.send("Lỗi");
        }
        res.status(200).json({
            message: "Xóa người dùng thành công!",
            users
        })
    }
}

module.exports = UserController;