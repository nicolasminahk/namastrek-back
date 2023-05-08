import { ApolloError } from 'apollo-server'
import User from '../models/user'
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// RECORDAR .ENV DE LA PALABRA CLAVE

module.exports = {
    Mutation: {
        async registerUser(_, { registerInput: { username, email, password } }) {
            const oldUser = await User.findOne({ email })

            if (oldUser) {
                throw new ApolloError('El mail ya esta registrado' + email, 'USER_ALREDY_EXIST')
            }

            var encryptedPassword = await bcrypt.hash(password, 10)

            const newUser = new User({
                username: username,
                email: email.toLowerCase(),
                password: encryptedPassword,
            })

            const token = jwt.sign({ user_id: newUser._id, email }, 'STRING_SECRET', {
                expiresIn: '24h',
            })

            newUser.token = token

            const res = await newUser.save()
            return {
                id: res.id,
                ...res._doc,
            }
        },

        async loginUser(_, { loginInput: email, password }) {
            const user = await User.findOne({ email })

            if (user && (await bcrypt.compare(password, user.password))) {
                const token = jwt.sign({ user_id: newUser._id, email }, 'STRING_SECRET', {
                    expiresIn: '24h',
                })
                user.token = token

                return {
                    id: user.id,
                    ...user._doc,
                }
            } else {
                throw new ApolloError('Contraseña Incorrecta', 'INCORRECT_PASSWORD')
            }
        },
    },
    Query: {
        user: (_, { ID }) => User.findById(ID),
    },
}
