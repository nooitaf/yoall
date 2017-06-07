
var TIMER = null
var TIMER_INTERVAL = 30000
var DATA_CURRENT = {}
var DATA_PREPARE = {}
var MAX_REQUESTED = 10

Meteor.startup(function() {
  console.log('yobit parser started.' + new Date())
  TIMER = Meteor.setInterval(function(){
  	Meteor.call('fetch')
  }, TIMER_INTERVAL)
});

Router.route( "/", function() {
  this.response.statusCode = 200;
  this.response.end( JSON.stringify(DATA_CURRENT, null, 2) );
}, { where: "server" });

Meteor.methods({
	fetch: function(){
		HTTP.get('https://yobit.net/api/3/info', function(error, result){
			if (!error) {
				var content = JSON.parse(result.content)
				// get data calls
				var pairs = _.keys(content.pairs)
				// console.log(pairs.length + ' calls')
				// create string chunks
				var longpairs = []
				var longpair = []
				_.each(pairs, function(pair){
					longpair.push(pair)
					if (longpair.length === MAX_REQUESTED) {
						longpairs.push(longpair.join('-'))
						longpair = []
					}
				})
				// get the rest
				if (longpair.length) {
					longpairs.push(longpair.join('-'))
				}

				DATA_PREPARE = {}
				// console.log(longpairs.length + ' chunk calls')
				_.each(longpairs, function(longstring){
          // go easy on them and the host
          Meteor.setTimeout(function(){
            // console.time('fetch')
            HTTP.get('https://yobit.net/api/3/ticker/' + longstring, function(e,r){
              if (!e){
                // console.timeEnd('fetch')
                var c = JSON.parse(r.content)
                _.each(_.keys(c), function(key){
                  DATA_PREPARE[key] = c[key]
                })
                if (_.keys(DATA_PREPARE).length === pairs.length) {
                  DATA_CURRENT = DATA_PREPARE
                  console.log('data updated: ', new Date().getTime())
                }
              }
            })
          }, Math.round(Math.random()*(TIMER_INTERVAL/2)))
				})
			}
		})
	}
})
