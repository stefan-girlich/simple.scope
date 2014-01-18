var http = require('http'),
	fs = require('fs'),
	url = require('url');


var cfg = {
	'catSavePathTpl': './data/storage.%%CAT%%.json',
};

var util = {
	getSavePath: function(category) {
		return cfg.catSavePathTpl.replace('%%CAT%%', category);
	}
};

http.createServer(function(req, res) {


	// catch favicon request
	if(req.url === '/favicon.ico') {
		res.writeHead(200, {'Content-Type':'image/x-icon'});
		res.end();
		return;
	}


	// catch static file request
	var filePath = __dirname + req.url;
	if(fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
		var fileContent = fs.readFileSync(__dirname + req.url, 'utf8');
		var contentType = 'text/plain', fileEnding = filePath.split('.').pop();
		if(fileEnding === 'js') {
			contentType = 'application/javascript'
		}
		res.writeHead(200, {'Content-Type' : contentType});
		res.end(fileContent);
		return;
	}



	var query = url.parse(req.url, true).query;

	if(req.method === 'GET') {

		// serve basic HTML
		// TODO better solution/routing/filtering
		if(Object.keys(query).length <= 0) {


			console.log('---> ' + req.url);

			// serve UI
			fs.readFile('daytracker.htm', 'utf8', function(err, data) {

				if(err) {
					res.writeHead(404, {'Content-Type': 'text/plain'});
					res.end('file not found :(...\n');
				}else {
					res.writeHead(200, {'Content-Type': 'text/html'});
					res.end(data);
				}
			});
			return;	
		}else {	// API request, serve data
			if(query.category) {
				fs.readFile(util.getSavePath(query.category), 'utf8', function(err, data) {
					if(err) {
						console.log(err)
						console.log('HERE')
						// TODO research error list!
						if(err.errno === 34) {	// file does not exist, assume no record for query
							console.log('file does not exist, assume no record for query "'+query.category+'"');
							res.writeHead(200, {'Content-Type': 'application/json'});
							res.end('{}');
							return;
						}
						res.writeHead(404, {'Content-Type': 'text/plain'});
						res.end(err.message);

					}else {	// no error, record found

						if(query.timestamp) {	// get only one record
							var dataAll = JSON.parse(data),
								dayKey = query.timestamp,
								dayVal = dataAll[dayKey] ? dataAll[dayKey] : 0,
								obj = {};
								console.log(dayVal)
								obj[dayKey] = dayVal;
							data = JSON.stringify(obj);
						}

						res.writeHead(200, {'Content-Type': 'application/json'});
						res.end(data);
					}
				});
			}else {
				console.log('unimpl route taken!');
			}
		}
	}else if(req.method === 'POST') {

		fs.writeFile(util.getSavePath(query.category), query.data, function(err) {
			if(err) {
				res.writeHead(501, {'Content-Type': 'text/plain'});
				res.end()
			}else {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end('save successful.')
			}
		});

		return;
	}

	

	
	


}).listen(1337, '127.0.0.1')
;console.log('cause im feeling like I am running')