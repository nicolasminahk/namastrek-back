import mongoose from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

const schema = mongoose.Schema(
    {
        name: {
            type: String,
            // required: true,
        },
        description: {
            type: String,
            minlength: 5,
            // required: true,
        },
        price: {
            type: String,
            // required: true,
        },
        date: {
            type: String,
            // required: true,
        },
        image: {
            type: String,
        },
        duration: {
            type: String,
        },

        users: [{ type: String, ref: 'User' }],
    },
    { timestamps: true }
)
schema.plugin(uniqueValidator)
export default mongoose.model('Salidas', schema)
