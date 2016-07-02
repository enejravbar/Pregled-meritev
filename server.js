var formidable = require("formidable");
var util = require("util");
var express = require('express');
var expressSession = require('express-session');
var path = require('path');
var bodyParser= require('body-parser')
var crypto = require('crypto');

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
		odgovor.redirect("/login");
	}else{
		odgovor.sendFile(path.join(__dirname, 'public', 'stran.html'));
		
	}
	
})

streznik.get("/login", function(zahteva, odgovor){
	console.log("Zahteva na login ima sessionID="+zahteva.sessionID);
	odgovor.sendFile(path.join(__dirname, 'public', 'login.html'));
})

streznik.post("/checkLogin", function(zahteva, odgovor){
	
	var uporabniskoIme = zahteva.body.username;
	var geslo = zahteva.body.password;

	var gesloHash=ustvariHash(geslo);
	console.log("Hash: " + gesloHash);
	// dostop do uporabniških podatkov zahteva.body.username in zahteva.body.password
	
	console.log("username "+zahteva.body.username + "\npassword "+zahteva.body.password);

	var ajaxOdgovor={
		pravilno : true,
		preusmeritev : "/login"
	}

      	odgovor.json(JSON.stringify(ajaxOdgovor));
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