var http = require('http');
var fs = require('fs');
var io = require('socket.io');

function httpRespond(req, res)
{
	var path = __dirname;
	if (req.url == "/") {
		path += "/index.html";
	} else {
		path += req.url;
	}

	var contType = "text/html";
	var extArray = path.split('.');
	if (extArray.length > 1) {
		switch (extArray[extArray.length-1]) {
			case 'ico' :	contType = "image/x-icon"; break;
			case 'js' :	contType = "text/javascript"; break;
			case 'png' :	contType = "image/png"; break;
			default:
			case 'html' :	contType = "text/html"; break;
		}
	}

	//console.log(path + " - " + contType);
	fs.readFile(path, function (err, data) {
			if (err) {
				res.writeHead(404, {"Content-Type": contType });
				res.end("404");
			} else {
				res.writeHead(200, {"Content-Type": contType});
				res.write(data, 'utf8');
				res.end();
			}
			});
}

server = http.createServer(httpRespond);
server.listen(8080);

function Client(ip)
{
	this.ip = ip;
	this.online = false;
	this.v = 0;
	this.a = 0;
	this.y = 160;
}

var clientId = 0;
var clients = new Array();

function sockcon(client)
{
	console.log('Ny klient!');

	var ip = client.request.client.remoteAddress;
	var id = clientId++;

	for (var i=0; i<clients.length; i++) {
		var pak = { msg:'GREET', owner:ip };
		client.send(pak);
	}

	clients.push(new Client(ip));


	client.on('message', function(json) {

			switch (json.msg) {
			case 'GREET' :
			console.log("Greetings! " + ip);
			clients[id].online = true;

			json.owner = ip;
			client.broadcast(json);
			break;

			case 'WHERE' :
			clients[id].v = json.v;
			clients[id].a = json.a;
			clients[id].y = json.y;
			//console.log("Where " + json.owner);

			json.owner = ip;
			client.broadcast(json);
			break;

			case 'DEAD' :
			clients[id].online = false;
			//console.log("Heli dead " + json.owner);

			json.owner = ip;
			client.broadcast(json);
			break;

			default :
			console.log("UNDEFINED PACKET! Hackers detected!");
			break;
			}

			});

	client.on('disconnect', function(){
			console.log('Hejdå!');
			});
}

var io = io.listen(server);
io.on('connection', sockcon);

