const {body} = require('express-validator');

const create = () =>[
    body('firstName').notEmpty().withMessage('Không để trống firstName'),
    body('lastName').notEmpty().withMessage('Không để trống lasstName'),
    body('email').isEmail().withMessage('Phải đúng định dạng email').notEmpty().withMessage('Không để trống email')
]

module.exports = {
    create
}