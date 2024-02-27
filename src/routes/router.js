const express = require('express');
const router = require('express').Router();
const userController = require('../controllers/UserController');
const validate = require('../middlewares/Validate');
const userValid = require('../validations/user.validation');

router.get('/', ()=>{
    console.log("Xin chào!")
})

router.get('/user-list', userController.getAllUser);
router.post('/user-add', userValid.create(), validate, userController.addUser);
router.get('/user-find/:id', userController.getOneUser);
router.put('/user-update/:id', validate, userController.updateUser);
router.delete('/user-delete/:id', userController.deleteUser);

module.exports = router;