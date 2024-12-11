const express = require('express')
const connect = require('./config/db')
connect()
const userModel = require('./models/user.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const app = express()
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


app.get('/', isLoggedIn, async (req, res) => {

    const user = await userModel.findOne({ email: req.user.email })

    const users = await userModel.find({
        _id: {
            $ne: user._id
        }
    })

    res.render('index', {
        user,
        users
    })
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.post('/register', async (req, res) => {

    const {email,password} = req.body;
    const hashed = await bcrypt.hash(password,10);

    const user = new userModel({
        email,
        password:hashed
    })
    await user.save();

    const token = jwt.sign({email:user.email},'secret')
    res.cookie('token',token)
    res.redirect('/')

})


app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', async (req, res) => {

    const {email,password} = req.body;
    const user = await userModel.findOne({email})

    if(!user) return res.redirect('/login')

    const match = await bcrypt.compare(password,user.password)

    if(!match) return res.redirect('/login')
    
        const token = jwt.sign({ email: user.email }, "secret")
        res.cookie('token', token)
        res.redirect('/')
})

function isLoggedIn(req, res, next) {
    const token = req.cookies.token
    if (!token) return res.redirect('/login')
    jwt.verify(token, 'secret', (err, user) => {
        if (err) return res.redirect('/login')
        req.user = user
        next()
    })
}

const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', socket => {
    console.log('User connected')

    socket.on('join', async (userID) => {
        await userModel.findByIdAndUpdate(userID, { socketId: socket.id });
    });

    socket.on('message', async (incomingMessage) => {
        const { receiverID, message: messageText } = incomingMessage;
        // Retrieve the user document for the message's intended recipient
        const recipientUser = await userModel.findOne({ _id: receiverID });
        // Emit the message to the recipient's associated socket ID
        socket.to(recipientUser.socketId).emit('message', messageText);
    });
    
    
    
    

});

server.listen(3000, () => {
    console.log('Server is running on port 3000')
});