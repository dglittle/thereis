
var _ = require('gl519')
require('./server_utils.js')

_.run(function () {
    defaultEnv("PORT", 5000)
    defaultEnv("NODE_ENV", "production")
    defaultEnv("MONGOHQ_URL", "mongodb://localhost:27017/thereis")
    defaultEnv("SESSION_SECRET", "super_secret")

    var db = require('mongojs')(process.env.MONGOHQ_URL)
    var express = require('express')
    var app = express()
    var rpc_version = 1
    var rpc = {}

    rpc.getUser = function (arg, req) {
        var q = { _id : arg }
        var u = _.p(db.collection('users').findOne(q, _.p()))
        if (!u) {
            u = q
            _.p(db.collection('users').insert(u, _.p()))
        }
        return u
    }

    rpc.saveButtons = function (arg, req) {
        _.p(db.collection('users').update({ _id : arg.user }, { $set : { buttons : arg.buttons } }, _.p()))
    }

    rpc.saveCloud = function (arg, req) {
        _.p(db.collection('clouds').insert({ user : arg.user, counts : arg.counts }, _.p()))
    }

    rpc.getClouds = function (arg, req) {
        return _.p(db.collection('clouds').find({ user : arg }).sort({ _id : -1 }).limit(10, _.p()))
    }

    createServer(express, app, db,
        process.env.PORT, process.env.SESSION_SECRET,
        rpc_version, rpc)

})
