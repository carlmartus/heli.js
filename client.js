/**
 * Heli copter client
 * Martin, Filip, Oskar
 */


var frontex, contex, canvas, backvas;
var mode;
var env, envIndex, envCount, envProg;
var randw, randz;

var imgHeli1, imgHeli2, imgHeliDead;
var meHeli;
//var heliAlive, heliX, heliRad, heliY, heliV, heliA;

var socket, sockOn = false;
var clientList;

var PROG = 4;

function drawStatus()
{
	contex.fillStyle = "#99f";
	contex.fillRect(0, 0, canvas.width, canvas.height);
}

function getRandom()
{
	randz = 36969 * (randz & 65535) + (randz >> 16);
	randw = 1800  * (randz & 65535) + (randw >> 16);
	return Math.abs((randz << 16) + (randw & 65535));
}

function Helicopter(owner)
{
	this.owner = owner;
	this.x = 40;
	this.y = 120;
	this.v = -4;
	this.a  = 1;
	this.alive = true;
}

function EnvBlock()
{
	this.tp = 40 + getRandom() % 40;
	this.bt = 220 - getRandom() % 40;
	this.width = 10 + getRandom() % 5;
}

function loadImage(fileName)
{
	var img = new Image();
	img.src = fileName;
	return img;
}

function genNew()
{
}

function getHeli(ip)
{
	for (var i=0; i<clientList.length; i++) {
		if (clientList[i].owner == ip) {
			return clientList[i];
		}
	}
	return 0;
}

function setup()
{
	mode = 2;
	canvas = document.getElementById("canvas");
	backvas = document.getElementById("backvas");
	frontex = canvas.getContext("2d");
	contex = backvas.getContext("2d");

	imgHeli1 = loadImage("heli1.png");
	imgHeli2 = loadImage("heli2.png");
	imgHeliDead = loadImage("helidead.png");

	document.onmousedown = holdDown;
	document.onmouseup = holdUp;
	document.onkeydown = holdDown;
	document.onkeyup = holdUp;

	meHeli = new Helicopter(0);
	heliRad = 4;

	envCount = 200;
	envIndex = 0;
	envProg = 0.0;
	env = new Array(envCount);
	
	randw = 10;
	randz = 20;

	for (var i=0; i<envCount; i++) {
		env[i] = new EnvBlock();
		if (i % 15 == 5) {
			env[i].bt = 140;
		}
	}

	clientList = new Array();

	drawStatus();
	setInterval(frame, 50);
	setInterval(netsend, 150);

	// Network
	socket = new io.Socket(null);
	socket.connect();
	socket.on('connect', function () {
			//console.log("Net : Connected!");
			greet = { msg : 'GREET' };
			socket.send(greet);
			sockOn = true;
			});

	socket.on('message', function (json) {
			switch (json.msg) {
			case 'GREET' :
			var cl = getHeli(json.owner);
			if (cl == 0) {
				cl = new Helicopter(json.owner);
				clientList.push(cl);
			}
			cl.alive = true;
			//console.log("New client " + json.owner);
			break;

			case 'WHERE' :
			var cl = getHeli(json.owner);
			cl.alive = true;
			cl.v = json.v;
			cl.y = json.y;
			cl.a = json.a;
			break;

			case 'DEAD' :
			var cl = getHeli(json.owner);
			cl.alive = false;
			break;
			}
			});

	socket.on('disconnect', function () {
			//console.log("Net : Disconnect!");
			sockOn = false;
			var cl = getHeli(json.owner);
			cl.alive = false;
			});
}

function flip()
{
	var imageData = contex.getImageData(0, 0, canvas.width, canvas.height);
	frontex.putImageData(imageData, 0, 0);
}

function holdDown(ev)
{
	meHeli.a = -1;
}

function holdUp(ev)
{
	meHeli.a = 1;
}

function frameStatus()
{
	//console.log("Status");
}

function drawHeli(heli)
{
	var spriteX = heli.x-heliRad, spriteY = heli.y-heliRad;
	if (meHeli.alive == false) {
		contex.drawImage(imgHeliDead, spriteX, spriteY);
	} else if (meHeli.a > 0) {
		contex.drawImage(imgHeli1, spriteX, spriteY);
	} else {
		contex.drawImage(imgHeli2, spriteX, spriteY);
	}
}

function drawGame()
{
	contex.fillStyle = "#99f";
	contex.fillRect(0, 0, canvas.width, canvas.height);

	contex.fillStyle = "#000";
	var x = -envProg;
	var i = 0, j;
	while (x < 320) {
		j = (envIndex + i++) % envCount;
		contex.fillRect(x, 0, env[j].width, env[j].tp);
		contex.fillRect(x, env[j].bt, env[j].width, canvas.height-env[j].bt);
		x += env[j].width;
	}

	// Rita helikopter
	if (meHeli.x > 0) {
		drawHeli(meHeli);
	}

	for (var i=0; i<clientList.length; i++) {
		if (clientList[i].alive) {
			drawHeli(clientList[i]);
		}
	}
}

function heliCrash()
{
	//console.log("Heli dead");
	meHeli.alive = false;

	var ded = { msg:'DEAD' };
	socket.send(ded);
}

function checkCollision()
{
	var x = -envProg, i = 0, j = envIndex;
	while (x <= meHeli.x) {
		x += env[j].width
		j = (j + i) % envCount;
		i++;
	}
	j--;

	if (meHeli.y < env[i].tp) {
		heliCrash();
	} else if (meHeli.y > env[i].bt) {
		heliCrash();
	}
}


var tmp = true;
function frameGame()
{
	// Flytta helikoptern
	if (meHeli.alive) {
		meHeli.v += meHeli.a;
		meHeli.y += meHeli.v;

		checkCollision();
	}

	if (meHeli.alive == false && meHeli.x > 0) {
		meHeli.x -= PROG;
	}

	envProg += PROG;
	while (envProg >= env[envIndex].wi) {
		envProg -= env[envIndex].wi;
		envIndex = (envIndex + 1) % envCount;
	}

	drawGame();
	flip();
}

function frame()
{
	switch (mode) {
		default :
		case 1 : frameStatus(); break;
		case 2 : frameGame(); break;
	}
}

function netsend()
{
	if (sockOn && meHeli.alive) {
		var where = { msg:'WHERE', v:meHeli.v, a:meHeli.a, y:meHeli.y };
		socket.send(where);
	}
}

