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
import ExcelJS from 'exceljs'
import fs from 'fs'
import { ApolloError } from 'apollo-server'
import jwt from 'jsonwebtoken'
import jwt_decode from 'jwt-decode'
import mongoose from 'mongoose'
import path from 'path'
import os from 'os'

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
        fechaDeNacimiento: String
        dni: String
        auth0UserId: String!
    }

    type User {
        username: String
        email: String
        password: String
        token: String
        isAdmin: Boolean
        salidas: [String!]!
        salidasConfirm: [String!]!
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
        linkImage: String
        users: [String!]!
        usersConfirm: [String!]!
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
            linkImage: String!
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
        confirmUsers(salidaId: String!, auth0UserId: String!): Salidas
        findUsersOnSalidaInExcel(salidaId: String!): ExcelFile
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
        dni: String
        fechaDeNacimiento: String
        auth0UserId: String
    }

    type UserConfirmation {
        user: User!
        data: UserData!
    }

    type UserData {
        name: String
        fechaDeNacimiento: String
        dni: String
    }
    type ExcelFile {
        filename: String!
        buffer: String!
        mimetype: String!
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

        findSalidasByAuth0UserId: async (root, { auth0UserId }) => {
            // Busca todas las salidas que contengan el auth0UserId en el arreglo de users o usersConfirm
            const salidas = await Salidas.find({
                $or: [{ users: auth0UserId }, { usersConfirm: auth0UserId }],
            })
            return salidas
        },
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

            if (!salida) {
                throw new Error('Salida not found')
            }

            const auth0UserIds = salida.users

            const users = await User.find({ auth0UserId: { $in: auth0UserIds } })
                .populate({
                    path: 'data',
                    select: 'name',
                    options: { lean: true },
                })
                .lean()

            console.log('USERS', users)

            const populatedUsers = users.map((user) => {
                console.log(user.data)
                const name = user.data.length > 0 ? user.data[0].name : null
                return { ...user, name, auth0UserId: user.auth0UserId }
            })

            console.log('POPULATED USERS', populatedUsers)

            return populatedUsers
        },
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
            const { name, description, date, price, duration, image, linkImage } = args
            console.log({ args })
            const imageBuffer = Buffer.from(image, 'base64')
            const imageBase64 = imageBuffer.toString('base64')
            const salidas = new Salidas({
                name,
                description,
                date,
                price,
                duration,
                linkImage,
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
        addPersonExit: async (root, { salida, auth0UserId }) => {
            // Busca la salida por su id
            const salidaEncontrada = await Salidas.findById(salida)
            if (!salidaEncontrada) {
                throw new Error('Salida not found') // Puedes personalizar el mensaje de error
            }

            // Verifica si el usuario ya está agregado a la salida
            if (salidaEncontrada.users.includes(auth0UserId)) {
                throw new Error('User already added to the Salida') // Puedes personalizar el mensaje de error
            }

            // Busca al usuario por su auth0UserId
            const user = await User.findOne({ auth0UserId })
            if (!user) {
                throw new Error('User not found') // Puedes personalizar el mensaje de error
            }
            console.log('user SALIDA', user)

            // Verifica si la salida ya está en el arreglo de salidas del usuario
            if (user.salidas?.includes(salida)) {
                if (!salidaEncontrada.users.includes(auth0UserId)) {
                    salidaEncontrada.users.push(auth0UserId)
                    console.log('USUARIOS DE LA SALIDA', salidaEncontrada.users)
                }
            }

            // // Hace un push del auth0UserId al array de usuarios en salida
            salidaEncontrada.users.push(auth0UserId)
            // console.log('users después del push:', salidaEncontrada.users)

            // Hace un push de la salida al arreglo de salidas del usuario
            user.salidas.push(salida)
            console.log('SALIDAS DEL USUARIO', user.salidas)

            await salidaEncontrada.save()
            await user.save()
            return salidaEncontrada
        },
        confirmUsers: async (_, { salidaId, auth0UserId }) => {
            const salida = await Salidas.findById(salidaId)
            const user = await User.findOne({ auth0UserId })

            if (!user) {
                throw new Error('User not found')
            }

            if (!salida) {
                throw new Error('Salida not found')
            }

            // Verificar si el auth0UserId ya existe en usersConfirm
            if (!salida.usersConfirm.includes(auth0UserId)) {
                salida.usersConfirm.push(auth0UserId)
            }

            // Verificar si la salidaId ya existe en salidasConfirm
            if (!user.salidasConfirm.includes(salidaId)) {
                user.salidasConfirm.push(salidaId)
            }

            await user.save()
            await salida.save()

            return salida
        },

        findUsersOnSalidaInExcel: async (_, { salidaId }) => {
            const salida = await Salidas.findById(salidaId)

            if (!salida) {
                throw new Error('Salida not found')
            }

            const auth0UserIds = salida.usersConfirm

            const users = await User.find({ auth0UserId: { $in: auth0UserIds } })
                .populate({
                    path: 'data',
                    select: 'name fechaDeNacimiento dni',
                    options: { lean: true },
                })
                .lean()

            console.log('USERS', users)

            if (!users || users.length === 0) {
                throw new Error('No users found on this salida')
            }

            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet('Users')

            worksheet.columns = [
                { header: 'Nombre', key: 'name', width: 20 },
                { header: 'Fecha de Nacimiento', key: 'fechaDeNacimiento', width: 20 },
                { header: 'DNI', key: 'dni', width: 15 },
            ]

            for (const user of users) {
                const userData = await Data.findOne({ _id: { $in: user.data } }).lean()
                const name = userData.name || ''
                const fechaDeNacimiento = userData ? userData.fechaDeNacimiento || '' : ''
                const dni = userData ? userData.dni || '' : ''

                worksheet.addRow({ name, fechaDeNacimiento, dni })
            }

            const tempFilePath = path.join(os.tmpdir(), `users-on-salida-${salidaId}.xlsx`)

            await workbook.xlsx.writeFile(tempFilePath)

            const fileData = fs.readFileSync(tempFilePath)
            const bufferBase64 = fileData.toString('base64')

            const filename = `users-on-salida-${salidaId}.xlsx`
            const mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

            return {
                filename,
                buffer: bufferBase64,
                mimetype,
            }
        },

        addPersonBenefit: async (root, { benefit, auth0UserId }) => {
            const benefitEncontrado = await Beneficios.findById(benefit)
            if (!benefitEncontrado) {
                throw new Error('Benefit not found') // Puedes personalizar el mensaje de error
            }

            const user = await User.findOne({ auth0UserId })
            if (!user) {
                throw new Error('User not found') // Puedes personalizar el mensaje de error
            }
            console.log('USER BENEFIT', user)
            console.log('Beneficio', benefitEncontrado)

            // Verifica si el beneficio ya está en el arreglo de beneficios del usuario
            if (user.beneficios.includes(benefitEncontrado._id)) {
                throw new Error('Benefit already added to the User') // Puedes personalizar el mensaje de error
            }

            if (user.salidas.length >= 2) {
                // Hace un push del beneficio al arreglo de beneficios del usuario
                user.beneficios.push(benefitEncontrado._id)

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
            salidaEncontrada.usersConfirm.pull(auth0UserId)

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
