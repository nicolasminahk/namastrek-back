import mongoose from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

const schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        minlength: 5,
        required: true,
    },
})
schema.plugin(uniqueValidator)
export default mongoose.model('Tips', schema)
