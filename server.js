var formidable = require("formidable");
var util = require("util");
var express = require('express');
var expressSession = require('express-session');
var path = require('path');
var bodyParser= require('body-parser')
var crypto = require('crypto');

//var senzorLib = require('node-dht-sensor');

var streznik = express();

var fs = require('fs');
var http = require('http');
var https = require('https');

var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};
// your express configuration here

var httpServer = http.createServer(streznik);
var httpsServer = https.createServer(credentials, streznik);

httpServer.listen(80, function(){
	console.log("Streznik posluša na vratih 80.");
});
httpsServer.listen(443,function(){
	console.log("Streznik posluša na vratih 443.");
});


streznik.use(express.static('public'));

//  // Skrivni ključ za podpisovanje piškotkov
streznik.use(bodyParser.json());
streznik.use(
  expressSession({
    secret: '1234567890QWERTY',
    saveUninitialized: true,    // Novo sejo shranimo
    resave: false,              // Ne zahtevamo ponovnega shranjevanja
    cookie: {
      maxAge: 3600000           // Seja poteče po 60min neaktivnosti v ms
    }
  })
);

// preusmeritev na HTTPS----------------------------------------

streznik.use(function(req, res, next) {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
})

//--------------------------------------------------------------

streznik.get("/", function(zahteva, odgovor){

	if(!zahteva.session.uporabnik){
		console.log("Uporabnik")
		odgovor.redirect("/login");
	}else{
		odgovor.sendFile(path.join(__dirname, 'public', 'stran.html'));
		
	}
	
})

streznik.get("/login", function(zahteva, odgovor){
	console.log("Zahteva na login ima sessionID="+zahteva.sessionID);
	odgovor.sendFile(path.join(__dirname, 'public', 'login.html'));
})

streznik.get("/nastavitve", function(zahteva, odgovor){
	//console.log("Zahteva na login ima sessionID="+zahteva.sessionID);
	odgovor.sendFile(path.join(__dirname, 'public', 'nastavitve.html'));
})

streznik.get("/odjava", function(zahteva, odgovor){
	zahteva.session.uporabnik=null;
	odgovor.redirect("/");
})

streznik.post("/checkLogin", function(zahteva, odgovor){
	
	var uporabniskoIme = zahteva.body.username;
	var geslo = zahteva.body.password;

	var gesloHash=ustvariHash(geslo);
	console.log("Hash: " + gesloHash);
	// dostop do uporabniških podatkov zahteva.body.username in zahteva.body.password
	
	console.log("username "+zahteva.body.username + "\npassword "+zahteva.body.password);
	zahteva.session.uporabnik=uporabniskoIme;
	var ajaxOdgovor={
		pravilno : true,
		preusmeritev : "/"
	}

      	odgovor.json(JSON.stringify(ajaxOdgovor));
})

streznik.post("/konfiguracija", function(zahteva, odgovor){
	var konfiguracija = zahteva.body;
	console.log(konfiguracija);
	
	fs.writeFile("config/config", JSON.stringify(konfiguracija), function(err,data){
		if(!err){
			console.log("Konfiguracijska datoteka uspešno zapisana!");
			preberiKonfiguracijskoDatoteko();
			odgovor.json({uspeh : true});
		}else{
			console.log("NAPAKA! Pri pisanju konfiguracijske datoteke!");
			console.log(err);
			odgovor.json({uspeh : false});
		}
	});

})

streznik.post("/pridobiKonfiguracijo", function(zahteva, odgovor){
	
	odgovor.json( JSON.stringify(preberiKonfiguracijskoDatoteko()) ); 
})

streznik.get("*", function(zahteva, odgovor){
	if(!zahteva.session.uporabnik){
		odgovor.redirect("/login");
	}else{
		odgovor.redirect("/");
	}
})

function ustvariHash(besedilo){
	var hash = crypto.createHash('sha256').update(besedilo).digest("hex");
	return hash;
}

function primerjajDvaHasha(hash1,hash2){
	if(hash1==hash2){
		return true;
	}
	return false;
}

/*
function inicializirajSenzor(){
	return sensorLib.initialize(22, 4);
}

function pridobiMeritev(){
	var readout = senzorLib.read();
	var meritev={
		temperatura : readout.temperature.toFixed(2),
		vlaga : readout.humidity.toFixed(2) 
	}
	return meritev;
}*/

function preberiKonfiguracijskoDatoteko(){
	var konfiguracija = JSON.parse(fs.readFileSync('config/config').toString());
	console.log(konfiguracija);
	return konfiguracija;
}

	/*var konfiguracija = {
	
		senzor:	{
			statusSenzorja : "0",
			mejnaTemperatura : "27",
			intervalBranjaSenzorja : "10"
		},

		podatkovnaBaza: {
			ipNaslov : "", 
			uporabniskoIme : "",
			geslo : "",
			statusAvtomatskegaBrisanja : "0",
			starostZapisov :	""
		},

		obvescanje: {
			intervalPosiljanjaEMAIL: "5",
			intervalPosiljanjaSMS : "5",
			smtpIP : "",
			smtpVrata : "25",
			emailNaslovi : ["enej.ravbar@siol.net"],
			SMSUporabniskoIme : "enej",
			SMSGeslo : "geslo",
			telefonskeStevilke : ["031754700"]
		}
	};*/