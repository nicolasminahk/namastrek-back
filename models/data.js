import mongoose from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

const schema = mongoose.Schema({
    name: {
        type: String,
        // required: true,
    },
    adress: {
        type: String,
        // minlength: 5,
        // required: true,
    },
    phone: {
        type: String,
        // required: true,
    },
    profession: {
        type: String,
    },
    obraSocial: {
        type: String,
    },
    alergiaMedicamentos: {
        type: String,
        // required: true,
    },
    alergiaAlimentos: {
        type: String,
        // required: true,
    },
    tipoSangre: {
        type: String,
        // required: true,
    },
    fechaDeNacimiento: {
        type: String,
        // required: true,
    },
    dni: {
        type: String,
        // required: true,
    },
    email: {
        type: String,
    },
    auth0UserId: { type: String },
})
schema.plugin(uniqueValidator)
export default mongoose.model('Data', schema)
