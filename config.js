module.exports = {
    root:__dirname,
    secret: 'labedufer&Ws/2019.$-',
    //database: 'mongodb://127.0.0.1:27017/labedufer_ws',
    database: 'mongodb://labedufer:Ws/2019.$-@localhost:27017/labedufer_ws?authSource=labedufer_ws',
    userProperty: 'claims',
    smtpConfig: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use SSL
        auth: {
            user: 'noreplyeduardofernandez@gmail.com',
            pass: 'N0r3LF3!z'
        }
    }
};
