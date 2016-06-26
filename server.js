var formidable = require("formidable");
var util = require("util");
var express = require('express');
var expressSession = require('express-session');
var path = require('path');
var bodyParser= require('body-parser')

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


streznik.use(bodyParser.text());
streznik.use(
  expressSession({
    secret: '1234567890QWERTY', // Skrivni ključ za podpisovanje piškotkov
    saveUninitialized: true,    // Novo sejo shranimo
    resave: false,              // Ne zahtevamo ponovnega shranjevanja
    cookie: {
      maxAge: 3600000           // Seja poteče po 60min neaktivnosti
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
	odgovor.sendFile(path.join(__dirname, 'public/', 'login.html'));
})

streznik.post("/checkLogin", function(zahteva, odgovor){
	
	console.log("body "+util.inspect(zahteva.body));
	console.log("username "+zahteva.body.username);

	var form = new formidable.IncomingForm();

	form.parse(zahteva, function(napaka, polja, datoteke){
		console.log("Uporabniski podatki so: "+util.inspect(polja));
	});
		//console.log(util.inspect(polja));
		
		/*var uporabniskiPodatki=JSON.parse(polja);
		console.log("Uporabniski podatki so: "+ util.inspect(uporabniskiPodatki));
		
		if(geslo=="ravbarenej"){
		zahteva.session.uporabnik=uporabniskoIme;
		odgovor.redirect("/");
		}else{
			odgovor.send(false);
		}*/
	
	
})

streznik.get("*", function(zahteva, odgovor){
	if(!zahteva.session.uporabnik){
		odgovor.redirect("/login");
	}else{
		odgovor.redirect("/");
	}
})
