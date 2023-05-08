import mongoose from 'mongoose'

const MONGODB_URI = `mongodb+srv://Nicolas:Nicolas4234121@cluster-namastrek.x7tkfuc.mongodb.net/?retryWrites=true&w=majority`
mongoose.set('strictQuery', true)
mongoose
    .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // useFindAndModify: false,
        // useCreateIndex: true,
    })
    .then(() => {
        console.log('Connected to  MongoDB')
    })
    .catch((error) => {
        console.log('Error connected to mongoDB ', error.message)
    })
