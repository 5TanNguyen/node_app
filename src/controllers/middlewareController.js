const jwt = require('jsonwebtoken');

const middlewareController = {
    // verifyToken
    verifyToken: (req, res, next) =>{
        const token = req.headers.token;
        if(token){
            const accessToken = token.split(" ")[1];
            jwt.verify(accessToken, 'shhhhh', (err, customer)=>{
                if(err){
                    res.status(403).json("Token is not valid");
                }
                req.customer = customer;
                next();
            });
        }else{
            res.status(401).json("You're not authenticated");
        }
    }
}

module.exports = middlewareController;