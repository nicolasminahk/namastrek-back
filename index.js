import { gql, UserInputError } from 'apollo-server'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import './db.js'
import Person from './models/person.js'
import Salidas from './models/salidas.js'
import Beneficios from './models/beneficios.js'
import Tips from './models/tips.js'
import User from './models/user.js'
import Data from './models/data.js'
// import fs from 'fs'
// import os from 'os'
// import jsonexport from 'jsonexport'
// import FileSaver from 'file-saver'

import { ApolloError } from 'apollo-server'
import jwt from 'jsonwebtoken'
import jwt_decode from 'jwt-decode'
import mongoose from 'mongoose'

const typeDefs = gql`
    scalar Upload
    enum YesNo {
        YES
        NO
    }

    type Person {
        name: String!
        phone: String
        street: String!
        city: String!
        id: ID!
        alergias: [String]!
        tipoDeSangre: String!
        salidas: String!
    }

    type Data {
        name: String
        adress: String
        phone: String
        profession: String
        obraSocial: String
        _id: ID!
        alergiaMedicamentos: String
        alergiaAlimentos: String
        tipoSangre: String
        email: String
        auth0UserId: String!
    }

    type User {
        username: String
        email: String
        password: String
        token: String
        isAdmin: Boolean
        salidas: [String!]!
        beneficios: [String!]!
        data: [Data!]
        auth0UserId: String!
        _id: String!
    }

    type Salidas {
        name: String!
        id: ID!
        description: String!
        date: String!
        price: String!
        image: String
        duration: String!
        users: [String!]!
        createdAt: String
        updateAt: String
    }

    type Beneficios {
        name: String
        id: ID!
        description: String
        date: String
        users: [String!]
    }

    type Tips {
        name: String!
        id: ID!
        description: String!
    }

    type Query {
        personCount: Int!
        allPersons(salidas: YesNo): [Person]!
        findPerson(name: String!): Person
        salidas: String!
        salida(_id: ID!): Salidas
        allSalidas: [Salidas]!
        allBeneficios: [Beneficios]!
        allTips: [Tips]!
        allData: [Data]!
        user(id: ID!): User
        allUsers: [User]!
        protectedQuery(id: ID!): User
        findSalidasByAuth0UserId(auth0UserId: String!): [Salidas!]!
        findUsersOnSalida(salidaId: String!): [Data!]!
        findDataByAuth0UserId(auth0UserId: String!): Data!
        findBenefitByAuth0UserId(auth0UserId: String!): [Beneficios!]!
    }

    type Mutation {
        addPerson(name: String!, phone: String, street: String!, city: String!): Person
        addTips(name: String!, description: String!): Tips
        addSalidas(
            name: String!
            description: String!
            date: String!
            price: String!
            image: String!
            duration: String!
        ): Salidas
        addBeneficios(name: String!, description: String!, date: String!): Beneficios
        editNumber(name: String!, phone: String!): Person
        deleteTips(id: String!): Tips
        deleteBeneficios(id: ID!): Beneficios
        deleteSalidas(id: ID!): Salidas
        protectedMutation(id: ID!): User
        addPersonExit(salida: String!, auth0UserId: String!): Salidas
        addPersonBenefit(benefit: String!, auth0UserId: String!): User
        createUser(id: String!, email: String!): User
        addDataToUser(data: DataInput!, auth0UserId: String!): Data!
        removePersonExit(salida: String!, auth0UserId: String!): Salidas
    }

    input DataInput {
        name: String
        adress: String
        phone: String
        profession: String
        obraSocial: String
        alergiaMedicamentos: String
        alergiaAlimentos: String
        tipoSangre: String
        email: String
        auth0UserId: String
    }
`

const resolvers = {
    Query: {
        __type() {
            throw new Error('You cannot make introspection')
        },
        __schema() {
            throw new Error('You cannot make introspection')
        },
        personCount: () => Person.collection.countDocuments(),
        allPersons: async (root, args) => {
            return Person.find({})
        },

        findPerson: async (root, args) => {
            const { name } = args
            return Person.findOne({ name })
        },
        salidas: () => User.salidas,
        allSalidas: async (root, args, ctx) => {
            console.log(ctx.token)
            return Salidas.find({})
        },
        allBeneficios: async (root, args) => {
            return Beneficios.find({})
        },
        allTips: async (root, args) => {
            return Tips.find({})
        },
        allUsers: async (root, args) => {
            const all = await User.find({})
            return all
        },
        allData: async (root, args) => {
            const all = await Data.find({})
            return all
        },
        user: (_, { ID }) => User.findById(ID),
        salida: async (_, { _id }) => {
            return await Salidas.findById(_id)
        },
        protectedQuery: async (parent, args, context) => {
            // Retrieve the authenticated user's Auth0 user IDß
            const auth0UserId = context.user.sub

            // Query the MongoDB database for the corresponding user entity
            const user = await User.findOne({ auth0UserId })

            // Do something with the user entity, e.g. return it as part of the query response
            return user
        },
        // findSalidasByAuth0UserId: async (root, args) => {
        //     const auth0UserId = args
        //     // Busca todas las salidas que contengan el auth0UserId en el arreglo de users
        //     const salidas = await Salidas.find({ users: auth0UserId })
        //     return salidas
        // },
        findSalidasByAuth0UserId: async (root, { auth0UserId }) => {
            // Busca todas las salidas que contengan el auth0UserId en el arreglo de users
            const salidas = await Salidas.find({ users: auth0UserId })
            return salidas
        },
        // findBenefitByAuth0UserId: async (root, { auth0UserId }) => {
        //     // Busca todas los beneficios que contengan el auth0UserId en el arreglo de users

        //     const benefit = await Beneficios.find({ users: auth0UserId })
        //     console.log('findBenefitByAuth0UserId', benefit)
        //     return benefit
        // },
        // findBenefitByAuth0UserId: async (root, { auth0UserId }) => {
        //     // Busca todas los beneficios que contengan el auth0UserId en el arreglo de users
        //     const beneficios = await Beneficios.find({ users: auth0UserId })
        //     console.log('benefit', beneficios)
        //     // Devuelve los campos de cada beneficio
        //     return beneficios.map((beneficio) => ({
        //         name: beneficio.name,
        //         description: beneficio.description,
        //         date: beneficio.date,
        //     }))
        // },
        findBenefitByAuth0UserId: async (root, { auth0UserId }) => {
            try {
                const beneficios = await Beneficios.find({ users: auth0UserId })
                console.log('benefit', beneficios)
                return beneficios
            } catch (error) {
                console.error(error)
                throw error
            }
        },
        findDataByAuth0UserId: async (root, { auth0UserId }) => {
            const user = await Data.find({ auth0UserId: auth0UserId })
            console.log('user find', { user })
            return user[0]
        },
        findUsersOnSalida: async (_, { salidaId }) => {
            const salida = await Salidas.findById(salidaId)
            console.log('findUsersOnSalida', salida.users)

            if (!salida) {
                throw new Error('Salida not found')
            }
            const users = await User.find({ auth0UserId: { $in: salida.users } })
                .populate({
                    path: 'data',
                    select: 'name adress phone profession obraSocial alergiaMedicamentos alergiaAlimentos tipoSangre ',
                    options: { lean: true },
                })
                .lean()
            if (users && users.length > 0) {
                const userData = users[0].data
                if (userData && userData.length > 0) {
                    console.log(userData)
                    return userData
                } else {
                    return []
                }
            } else {
                return []
            }
        },
        // findUsersOnSalida: async (_, { salidaId }) => {
        //     const salida = await Salidas.findById(salidaId)
        //     console.log('findUsersOnSalida', salida.users)

        //     if (!salida) {
        //         throw new Error('Salida not found')
        //     }
        //     const users = await User.find({ auth0UserId: { $in: salida.users } })
        //         .populate({
        //             path: 'data',
        //             select: 'name adress phone profession obraSocial alergiaMedicamentos alergiaAlimentos tipoSangre',
        //             options: { lean: true },
        //         })
        //         .lean()
        //     if (users && users.length > 0) {
        //         const userData = users[0].data
        //         if (userData && userData.length > 0) {
        //             console.log(userData)

        //             // Convertir la data de los usuarios en un archivo CSV
        //             jsonexport(userData, function (err, csv) {
        //                 if (err) {
        //                     console.log(err)
        //                     throw new Error('Error al exportar la data a CSV')
        //                 }
        //                 console.log(csv)

        //                 // Crear un objeto blob a partir del archivo CSV y guardarlo
        //                 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
        //                 FileSaver.saveAs(blob, 'usuarios-data.csv')
        //             })

        //             // Devolver la data de los usuarios como respuesta a la consulta
        //             return userData
        //         } else {
        //             return []
        //         }
        //     } else {
        //         return []
        //     }
        // },
    },
    Mutation: {
        addPerson: (root, args) => {
            const person = new Person({ ...args })
            return person.save()
        },
        // FIND AND CREATE USER
        createUser: async (root, args) => {
            const user = await User.findOne({ auth0UserId: args.id })
            if (user) return user
            console.log('create')

            const newUser = new User({ auth0UserId: args.id, email: args.email })
            return await newUser.save()
        },
        addSalidas: async (root, args) => {
            const { name, description, date, price, duration, image } = args
            console.log({ args })
            const imageBuffer = Buffer.from(image, 'base64')
            const imageBase64 = imageBuffer.toString('base64')
            const salidas = new Salidas({
                name,
                description,
                date,
                price,
                duration,
                image: imageBase64,
            })
            return await salidas.save()
        },
        addBeneficios: async (root, args) => {
            const beneficios = new Beneficios({ ...args })
            return await beneficios.save()
        },
        addTips: async (root, args) => {
            const tips = new Tips({ ...args })
            return await tips.save()
        },
        editNumber: async (root, args) => {
            const person = await Person.findOne({ name: args.name })
            if (!person) return

            person.phone = args.phone
            try {
                return person.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }
            return person
        },
        deleteTips: async (root, args) => {
            // const tips = await Tips.findOne({ name: args.name })
            console.log({ args })
            return await Tips.deleteOne({ _id: args.id })
        },
        deleteBeneficios: async (root, args) => {
            // const beneficio = await Beneficios.findOne({ name: args.name })
            return await Beneficios.deleteOne({ _id: args.id })
        },
        deleteSalidas: async (root, args) => {
            return await Salidas.deleteOne({ _id: args.id })
        },
        protectedMutation: async (parent, args, context) => {
            // Retrieve the authenticated user's Auth0 user ID
            const auth0UserId = context.user.sub

            // Query the MongoDB database for the corresponding user entity
            const user = await User.findOne({ auth0UserId })

            // Do something with the user entity, e.g. update it with the mutation input
            user.name = args.name
            await user.save()

            // Return the updated user entity as part of the mutation response
            return user
        },
        // addPersonExit: async (root, { salida, auth0UserId }) => {
        //     console.log('salida', { salida, auth0UserId })

        //     // Busca la salida por su id
        //     const salidaEncontrada = await Salidas.findById(salida)
        //     console.log(salidaEncontrada)
        //     if (!salidaEncontrada) {
        //         throw new Error('Salida not found') // Puedes personalizar el mensaje de error
        //     }
        //     console.log('salida Usuarios', salidaEncontrada.users)
        //     // Hace un push del auth0UserId al array de usuarios
        //     salidaEncontrada.users.push(auth0UserId)

        //     // Guarda los cambios en la salida
        //     const updatedSalida = await salidaEncontrada.save().catch((error) => {
        //         console.error('Failed to save updated Salida:', error)
        //         throw new Error('Failed to update Salida') // Puedes personalizar el mensaje de error
        //     })
        //     console.log('salida actualizada', updatedSalida) // Verifica que el campo "name" tenga un valor válido
        //     if (!updatedSalida.name) {
        //         throw new Error('Failed to update Salida') // Puedes personalizar el mensaje de error
        //     }

        //     return updatedSalida
        // },
        addPersonExit: async (root, { salida, auth0UserId }) => {
            console.log('salida', { salida, auth0UserId })

            // Busca la salida por su id
            const salidaEncontrada = await Salidas.findById(salida)
            console.log(salidaEncontrada)
            if (!salidaEncontrada) {
                throw new Error('Salida not found') // Puedes personalizar el mensaje de error
            }
            console.log('salida Usuarios', salidaEncontrada.users)

            // Busca al usuario por su auth0UserId
            const user = await User.findOne({ auth0UserId })
            if (!user) {
                throw new Error('User not found') // Puedes personalizar el mensaje de error
            }
            console.log('user', user)

            // Hace un push del auth0UserId al array de usuarios en salida
            salidaEncontrada.users.push(auth0UserId)

            // Hace un push de la salida al arreglo de salidas del usuario
            user.salidas.push(salida)

            // Guarda los cambios en la salida y el usuario
            const updatedSalida = await salidaEncontrada.save().catch((error) => {
                console.error('Failed to save updated Salida:', error)
                throw new Error('Failed to update Salida') // Puedes personalizar el mensaje de error
            })
            console.log('salida actualizada', updatedSalida) // Verifica que el campo "name" tenga un valor válido

            const updatedUser = await user.save().catch((error) => {
                console.error('Failed to save updated User:', error)
                throw new Error('Failed to update User') // Puedes personalizar el mensaje de error
            })
            console.log('user actualizado', updatedUser) // Verifica que el campo "auth0UserId" tenga un valor válido

            if (!updatedSalida.name) {
                throw new Error('Failed to update Salida') // Puedes personalizar el mensaje de error
            }

            return updatedSalida
        },

        // addPersonBenefit: async (root, { benefit, auth0UserId }) => {
        //     // Busca la salida por su id
        //     const benefitEncontrado = await Beneficios.findById(benefit)
        //     console.log(benefitEncontrado)
        //     if (!benefitEncontrado) {
        //         throw new Error('Benefit not found') // Puedes personalizar el mensaje de error
        //     }
        //     console.log('Beneficio', benefitEncontrado)

        //     // Busca el usuario por su id
        //     const user = await User.findOne({ auth0UserId })
        //     console.log('User', user)

        //     // Verifica si el usuario ya tiene dos o más elementos en el arreglo de salidas
        //     if (user.salidas.length >= 2) {
        //         // Hace un push del beneficio al arreglo de beneficios del usuario
        //         user.beneficios.push(benefitEncontrado)
        //         // Guarda los cambios en la base de datos
        //         await user.save()
        //         return user
        //     } else {
        //         throw new Error('User does not have enough salidas') // Puedes personalizar el mensaje de error
        //     }
        // },
        addPersonBenefit: async (root, { benefit, auth0UserId }) => {
            const benefitEncontrado = await Beneficios.findById(benefit)
            if (!benefitEncontrado) {
                throw new Error('Benefit not found') // Puedes personalizar el mensaje de error
            }

            const user = await User.findOne({ auth0UserId })
            if (!user) {
                throw new Error('User not found') // Puedes personalizar el mensaje de error
            }
            console.log(user)

            if (user.salidas.length >= 2) {
                // Hace un push del beneficio al arreglo de beneficios del usuario
                user.beneficios.push(benefitEncontrado)

                // Hace un push del usuario al arreglo de usuarios del beneficio
                if (benefitEncontrado) {
                    benefitEncontrado.users.push(auth0UserId)
                }

                // Guarda los cambios en la base de datos
                await user.save()
                await benefitEncontrado.save()

                return user
            } else {
                throw new Error('User does not have enough salidas') // Puedes personalizar el mensaje de error
            }
        },

        addDataToUser: async (_, { data, auth0UserId }) => {
            console.log({ data, auth0UserId })
            console.log('1')
            const user = await User.findOne({ auth0UserId: auth0UserId })
            console.log('usser', { user })

            if (!user) {
                throw new Error('User not found')
            }
            if (user.data.length > 0) {
                throw new Error('User already has data stored')
            }

            // Crea un nuevo documento de Data con la data proporcionada
            const newData = new Data(data)
            await newData.save()

            // Agrega el ID del nuevo documento de Data al arreglo data del usuario
            user.data.push(newData)
            await user.save()

            return newData
        },
        //Debería haber un create data antes de sumarlo al usuario
        //Add Data of Person, osea crear un tabla de data con sus datos y vincularlos a una persona
        removePersonExit: async (root, { salida, auth0UserId }) => {
            console.log('salida', { salida, auth0UserId })

            // Busca la salida por su id
            const salidaEncontrada = await Salidas.findById(salida)
            console.log(salidaEncontrada)
            if (!salidaEncontrada) {
                throw new Error('Salida not found') // Puedes personalizar el mensaje de error
            }

            // Usa el método pull de Mongoose para eliminar el ID del usuario del array de users
            salidaEncontrada.users.pull(auth0UserId)

            // Guarda los cambios en la salida
            const updatedSalida = await salidaEncontrada.save().catch((error) => {
                console.error('Failed to save updated Salida:', error)
                throw new Error('Failed to update Salida') // Puedes personalizar el mensaje de error
            })
            console.log('salida actualizada', updatedSalida) // Verifica que el campo "name" tenga un valor válido
            if (!updatedSalida.name) {
                throw new Error('Failed to update Salida') // Puedes personalizar el mensaje de error
            }

            return updatedSalida
        },
    },
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
})

const port = process.env.PORT || 4000

const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(port) },
    // context: async ({ req, res }) => {
    //     // Get the user token from the headers.
    //     const token = req.headers.authorization || ''

    //     // Try to retrieve a user with the token
    //     const payload = await jwt_decode(token.split(' ')[1])
    //     const user = await User.findOne({ auth0UserId: payload._id })
    //     // Libreria JWT para verificar, JWD.verify ( el token y el secreto)
    //     // console.log(payload)
    //     // Add the user to the context
    //     return { token: user }
    //     //return {user}
    // },
})

// const { url } = await startStandaloneServer(server, {
//     // Note: This example uses the `req` argument to access headers,
//     // but the arguments received by `context` vary by integration.
//     // This means they vary for Express, Fastify, Lambda, etc.

//     // For `startStandaloneServer`, the `req` and `res` objects are
//     // `http.IncomingMessage` and `http.ServerResponse` types.
//     listen: { port: 4000 },

// })

console.log(`🚀  Server ready at: ${url}`)
