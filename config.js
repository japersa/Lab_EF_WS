module.exports = {
    root:__dirname,
    secret: 'labeduardofernandez&nativapps',
    database: 'mongodb://localhost:27017/EduFerTest',
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