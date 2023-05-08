import mongoose from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 5,
    },
    phone: {
        type: String,
        minlength: 5,
    },
    street: {
        type: String,
        required: true,
        minlength: 5,
    },
    city: {
        type: String,
        required: true,
        minlength: 5,
    },
    alergias: {
        type: Array,
    },
    tipoDeSangre: {
        type: String,
    },
})
schema.plugin(uniqueValidator)
export default mongoose.model('Person', schema)

//Boolean inscripto
