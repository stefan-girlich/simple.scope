/* TODO __dirname points to the file location and therefore requires 
stepping up ("../") to the directory where the data can be found - 
there's gotta be a cooler solution!
*/




var restify = require('restify'),
	fs = require('fs');

// configuration
var cfg = {
	port: 1338,
	storagePath: './userdata/storage.json',
};


var server = restify.createServer();
	server.use(restify.bodyParser());

// serve base HTML file
server.get('/', function(req, res, next) {
	var fileContent = fs.readFileSync(__dirname + '/../index.htm', 'utf8');
	res.setHeader('Content-Type', 'text/html');
	res.writeHead(200, {
		'Content-Type': 'text/html'
	});
	res.write(fileContent);
	res.end();
});


// define REST API
server.get('/api/storage', getData);
server.post('/api/storage', postData);

// serve static resources
server.get(/.*/, restify.serveStatic({
  directory: __dirname + '/../'
}));



// start server
server.listen(cfg.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});

/** TODO DOC */
function postData(req, res, next) {

	var postData = req.body;
	
	try {
		JSON.parse(req.body);
	} catch(e) {
		res.writeHead(400, {'Content-Type': 'text/plain'});
		res.end('The sent data is not a valid JSON, error message: ' + e.message);
		return;
	}


	fs.writeFile(cfg.storagePath, req.body, function(err) {

		// TODO check e.g. file permission and provide corresponding err messages

		if(err) {
			res.writeHead(500, {'Content-Type': 'text/plain'});
			res.end('Saving data failed due to an internal server error: ' + err);
		}else {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(postData);
		}
	});
}

/** TODO DOC */
function getData(req, res, next) {

	fs.readFile(cfg.storagePath, 'utf8', function(err, data) {

		if(err) {

			// TODO fire different error response (403?) in case 
			// file is not readable at all

			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end();

		}else {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(data);
		}
	});
}