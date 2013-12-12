
var _ = require('gl519')

defaultEnv = function (key, val) {
    if (!process.env[key])
        process.env[key] = val
}

process.on('uncaughtException', function (err) {
    try {
        console.log(err)
        console.log(err.stack)
    } catch (e) {}
})

dbEval = function (db, func) {
    return _.p(db.runCommand({
        eval : '' + func,
        args : _.toArray(arguments).slice(2),
        nolock : true
    }, _.p())).retval
}

///

// api at: http://docs.amazonwebservices.com/AWSMechTurk/2012-03-25/AWSMturkAPI/Welcome.html?r=5777
mturkRequest = function (id, secret, sandbox, params) {
    function sign(text, secret) {
        return require('crypto').createHmac('sha1', secret).update(text).digest('base64')
    }
    if (!params) params = {}
    _.ensure(params, 'Service', 'AWSMechanicalTurkRequester')
    _.ensure(params, 'AWSAccessKeyId', id)
    _.ensure(params, 'Version', '2012-03-25')
    _.ensure(params, 'Timestamp', new Date().toISOString().replace(/\.\d+/, ''))
    _.ensure(params, 'Signature', sign(params.Service + params.Operation + params.Timestamp, secret))
    
    var url = sandbox ? "https://mechanicalturk.sandbox.amazonaws.com" : "https://mechanicalturk.amazonaws.com"
    
    return _.wget(url, params)
}

///

createServer = function (express, app, db, port, session_secret, rpc_version, rpc) {

    _.serveOnExpress(express, app)

    app.use(express.cookieParser())
    app.use(function (req, res, next) {
        _.run(function () {
            req.body = _.consume(req)
            next()
        })
    })

    var MongoStore = require('connect-mongo')(express)
    app.use(express.session({
        secret : session_secret,
        cookie : { maxAge : 10 * 365 * 24 * 60 * 60 * 1000 },
        store : new MongoStore({ db : _.p(db.open(_.p())) })
    }))

    app.use(function (req, res, next) {
        if (!req.session.user)
            req.session.user = _.randomString(10, /[a-z]/)
        req.user = req.session.user
        next()
    })

    app.use('/static', express.static('./static'))
    app.get('/', function (req, res) {
        res.cookie('rpc_version', rpc_version, { httpOnly: false})
        res.cookie('rpc_token', _.randomString(10), { httpOnly: false})
        res.sendfile('./index.html')
    })

    app.all(/\/rpc(\/([^\/]+)\/([^\/]+))?/, function (req, res, next) {
        _.run(function () {
            try {
                if (req.params[0]) {
                    if (rpc_version != req.params[1])
                        throw new Error('version mismatch')
                    if (!req.cookies.rpc_token || req.cookies.rpc_token != req.params[2])
                        throw new Error('token mismatch')
                    var runFunc = function (input) {
                        return rpc[input.func](input.arg, req, res)
                    }
                } else {
                    var runFunc = function (input) {
                        return rpc[input.func](input.arg)
                    }
                }
                var input = _.unJson(req.method.match(/post/i) ? req.body : _.unescapeUrl(req.url.match(/\?(.*)/)[1]))
                if (input instanceof Array)
                    var output = _.map(input, runFunc)
                else
                    var output = runFunc(input)
                var body = _.json(output) || "null"
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': Buffer.byteLength(body)
                })
                res.end(body)
            } catch (e) {
                next(e)
            }
        })
    })

    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }))

    app.listen(port, function() {
        console.log("go to http://localhost:" + port)
    })
}
