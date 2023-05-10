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
        date: {
            default: Date.now,
            type: String,
            // required: true,
        },
        vencimiento: {
            type: String,
        },
        users: [{ type: String, ref: 'User' }],
    },
    { timestamps: true }
)
schema.plugin(uniqueValidator)
export default mongoose.model('Beneficios', schema)

//HOOK DE FECHA DE VENCIMINETO
//PRESAVE
