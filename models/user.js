import mongoose from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

const schema = mongoose.Schema({
    username: { type: String, default: null },
    email: { type: String, unique: true },
    password: { type: String },
    token: { type: String },
    isAdmin: { type: Boolean, default: false },
    auth0UserId: { type: String },
    data: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Data' }],
    salidas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Salidas' }],
    salidasConfirm: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Salidas' }],

    beneficios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beneficios' }],
})
schema.plugin(uniqueValidator)
export default mongoose.model('users', schema)
