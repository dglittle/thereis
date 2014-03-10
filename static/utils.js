
tau = Math.PI * 2

///

function error(msg) {
    alert((msg || 'Oops. Not sure what happened.') + '\n\n' +
        'Please try refreshing the page.')
}

g_rpc_version = $.cookie('rpc_version')
g_rpc_token = $.cookie('rpc_token')
g_rpc_timer = null
g_rpc = []

function rpc(func, arg, cb) {
    if (typeof(arg) == 'function') return rpc(func, null, arg)
    g_rpc.push({
        payload : { func : func, arg : arg },
        cb : cb
    })
    if (g_rpc_timer) clearTimeout(g_rpc_timer)
    g_rpc_timer = setTimeout(function () {
        g_rpc_timer = null
        var save_rpc = g_rpc
        g_rpc = []
        $.ajax({
            url : '/rpc/' + g_rpc_version + '/' + g_rpc_token,
            type : 'post',
            data : _.json(_.map(save_rpc, function (e) { return e.payload })),
            success : function (r) {
                _.each(r, function (r, i) {
                    if (save_rpc[i].cb)
                        save_rpc[i].cb(r)
                })
            },
            error : function (s) {
                onError(s.responseText)
            }
        })
    }, 0)
}

///

function grid(rows) {
    var t = []
    t.push('<table style="width:100%;height:100%">')
    _.each(rows, function (row, y) {
        t.push('<tr height="33.33%">')
        _.each(row, function (cell, x) {
            var c = 'x' + x + 'y' + y
            t.push('<td class="' + c + '" width="33.33%"/>')
        })
        t.push('</tr>')
    })
    t.push('</table>')
    t = $(t.join(''))

    _.each(rows, function (row, y) {
        _.each(row, function (cell, x) {
            var c = 'x' + x + 'y' + y
            t.find('.' + c).append(cell)
        })
    })

    return t
}

function center(me) {
    var t = $('<table style="width:100%;height:100%"><tr><td valign="center" align="center"></td></tr></table>')
    t.find('td').append(me)
    return t
}

$.fn.myAppend = function (args) {
    for (var i = 0; i < arguments.length; i++) {
        var a = arguments[i]
        if (a instanceof Array)
            $.fn.myAppend.apply(this, a)
        else
            this.append(a)
    }
    return this
}

function cssMap(s) {
    var m = {}
    _.each(s.split(';'), function (s) {
        var a = s.split(':')
        if (a[0])
            m[_.trim(a[0])] = _.trim(a[1])
    })
    return m
}

$.fn.myCss = function (s) {
    return this.css(cssMap(s))
}

$.fn.myHover = function (s, that) {
    var that = that || this
    var m = cssMap(s)
    var old = _.map(m, function (v, k) {
        return that.css(k)
    })
    this.hover(function () {
        that.css(m)
    }, function () {
        that.css(old)
    })
    return this
}

$.fn.addLabel = function (d) {
    if (typeof(d) == "string") d = $('<span/>').text(d)
        
    var id = _.randomString(10, /[a-z]/)
    this.attr('id', id)
    this.after($('<label for="' + id + '"/>').append(d))
    return this
}


function rotate(me, amount) {
    var s = 'rotate(' + amount + 'deg)'
    me.css({
        '-ms-transform' : s,
        '-moz-transform' : s,
        '-webkit-transform' : s,
        '-o-transform' : s
    })
    return me
}

jQuery.fn.extend({
    rotate : function (amount) {
        return this.each(function () {
            rotate($(this), amount)
        })
    }
})

function createThrobber() {
    var d = $('<div/>').text('.')
    var start = _.time()
    var i = setInterval(function () {
        if ($.contains(document.documentElement, d[0])) {
            d.rotate(Math.round((_.time() - start) / 1000 * 360 * 2 % 360))
        } else
            clearInterval(i)
    }, 30)
    return d;
}
