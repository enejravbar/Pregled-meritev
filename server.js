var formidable = require("formidable");
var util = require("util");
var express = require('express');
var expressSession = require('express-session');
var path = require('path');
var bodyParser= require('body-parser')
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var mysql = require('mysql');
var exec = require('child_process').exec;


var senzorLib = require('node-dht-sensor');

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

var konfiguracija;
var trenutnaMeritev; 
var pool;



main();

function main(){
	konfiguracija = preberiKonfiguracijskoDatoteko();

	if(konfiguracija==-1){
		console.log("Napaka na konfiguracijski datoteki!");
		return;
	}else{

		console.log("IP naslov: " + konfiguracija.podatkovnaBaza.ipNaslov);

		pool = mysql.createPool({
		    host: konfiguracija.podatkovnaBaza.ipNaslov,
		    user: konfiguracija.podatkovnaBaza.uporabniskoIme,
		    password: konfiguracija.podatkovnaBaza.geslo,
		    database: 'meritvePivkaPerutninarstvo',
		    charset: 'UTF8_GENERAL_CI'
		});

		

		if(konfiguracija.senzor.statusSenzorja == 1){
			pridobiMeritev(konfiguracija.senzor.intervalBranjaSenzorja);
			
			if(konfiguracija.podatkovnaBaza.statusAvtomatskegaPisanja == 1){
				avtomatskoPisanjeVBazo(konfiguracija.podatkovnaBaza.avtomatskoPisanjeInterval);		
			}else{
				console.log("Avtomatsko pisanje v bazo je IZKLOPLJENO.");
			}

			if(konfiguracija.podatkovnaBaza.statusAvtomatskegaBrisanja == 1){
				avtomatskoBrisanjeZapisov();
			}else{
				console.log("Avtomatsko brisanje zapisov iz baze je IZKLOPLJENO.");
			}

			
			
		}
			
	}

}


// preusmeritev na HTTPS----------------------------------------

streznik.use(function(req, res, next) {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
})

//--------------------------------------------------------------

var io = require('socket.io').listen(httpsServer);

io.sockets.on('connection', function (socket) {

    console.log('Klient povezan!');
    if(trenutnaMeritev!=null){
    	socket.emit('meritev', trenutnaMeritev);
    }  
	setInterval(function(){
		if(trenutnaMeritev!=null){
			socket.emit('meritev', trenutnaMeritev);
		}
	},konfiguracija.senzor.intervalBranjaSenzorja/2);

	/*pridobiMeritveIzBaze(socket);
	setInterval(function(){
		pridobiMeritveIzBaze(socket);
	},10000);*/

});

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

streznik.post("/pridobiMeritveIzBaze", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
        if (!napaka1) {
        	console.log('SELECT datum,temperatura,vlaga FROM meritve WHERE datum > DATE_SUB(NOW(), INTERVAL '+zahteva.body.starostMeritev+' HOUR);');
            connection.query('SELECT datum,temperatura,vlaga FROM meritve WHERE datum > DATE_SUB(NOW(), INTERVAL '+zahteva.body.starostMeritev+' HOUR);', function(napaka2, vrstice) {
                if (!napaka2) {
                	odgovor.json({
                    	uspeh:true,
                    	podatki:vrstice
                    });	
                } else {
                   odgovor.json({
                    	uspeh:false,
                    	odgovor:"Napaka! Pridobivanje meritev iz baze ni bilo uspešno!"
                    });
                }

            });
            connection.release();
        } else {
        	odgovor.json({
            	uspeh:false,
            	odgovor:"Napaka! Pridobivanje meritev iz baze ni bilo uspešno!"
            });
            console.log("Napaka pri branju iz baze!" + napaka1);
        }
    });
})

streznik.post("/izbrisiVseZapise", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
			
	        if (!napaka1) {
	        	console.log('DELETE FROM meritve;');
	            connection.query('DELETE FROM meritve;', function(napaka2, info) {
	                if (!napaka2) {
	                    odgovor.json({
	                    	uspeh:true
	                    });
	                } else {
	                    odgovor.json({
	                    	uspeh:false,
	                    	odgovor:"Napaka! Brisanje zapisov ni bilo uspešno!"
	                    });
	                }

	            });

	            connection.release();

	        } else {
	            odgovor.json({
                	uspeh:false,
                	odgovor:"Napaka pri vzpostavitvi povezave z podatkovno bazo!"
                });
	        }
	    });
})

streznik.post("/brisanjeZapisov", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
			
	        if (!napaka1) {
	        	console.log('DELETE FROM meritve WHERE datum < DATE_SUB(NOW(), INTERVAL '+zahteva.body.stDni + ' DAY);');
	            connection.query('DELETE FROM meritve WHERE datum < DATE_SUB(NOW(), INTERVAL '+zahteva.body.stDni + ' DAY);', function(napaka2, info) {
	                if (!napaka2) {
	                    odgovor.json({
	                    	uspeh:true
	                    });
	                } else {
	                    odgovor.json({
	                    	uspeh:false,
	                    	odgovor:"Napaka! Brisanje zapisov ni bilo uspešno!"
	                    });
	                }

	            });

	            connection.release();

	        } else {
	            odgovor.json({
                	uspeh:false,
                	odgovor:"Napaka pri vzpostavitvi povezave z podatkovno bazo!"
                });
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

function preberiKonfiguracijskoDatoteko(){
	try{
		var konfiguracija = JSON.parse(fs.readFileSync('config/config').toString());
		return konfiguracija;	
	}catch(e){
		console.log(e);
		return -1;
	}
	
}

function inicializirajSenzor(){
	return senzorLib.initialize(22, 4);
}

function pridobiMeritev(interval){
	var kontrola=0;

	if(inicializirajSenzor()){

		var readout = readout = senzorLib.read();
		var novaTemperatura = readout.temperature.toFixed(1);

		if(konfiguracija.obvescanje.statusEmailObvescanja == 1){
			emailObvescanje(konfiguracija.senzor.mejnaTemperatura, 2000); // na 2 sekundi preveri trenutno temperaturo
		}else{
			console.log("Email obveščanje je ONEMOGOČENO!")
		}
		if(konfiguracija.obvescanje.statusSMSObvescanja){
			smsObvescanje(konfiguracija.senzor.mejnaTemperatura, 2000);
		}else{
			console.log("SMS obveščanje je ONEMOGOČENO!")
		}

		if(trenutnaMeritev == null){
			if(novaTemperatura == 0.0){
				console.log("Neveljavna temperatura");
		
			}else{
				trenutnaMeritev={
					temperatura : readout.temperature.toFixed(1),
					vlaga : readout.humidity.toFixed(1) 
				}
				console.log("Meritev temperatura: " + trenutnaMeritev.temperatura + " Meritev vlaga: " + trenutnaMeritev.vlaga);
				
			}
		}else{
			if(Math.abs(novaTemperatura- trenutnaMeritev) >15){
				console.log("Neveljavna temperatura");

			}else{
				trenutnaMeritev={
					temperatura : readout.temperature.toFixed(1),
					vlaga : readout.humidity.toFixed(1) 
				}
				console.log("Meritev temperatura: " + trenutnaMeritev.temperatura + " Meritev vlaga: " + trenutnaMeritev.vlaga);

			}
		}
			
		setInterval(function(){
			preberiSenzor();
		}, interval);

	}
}

function preberiSenzor(){
	
	var readout = readout = senzorLib.read();
	var novaTemperatura = readout.temperature.toFixed(1);

	if(trenutnaMeritev == null){
		if(novaTemperatura == 0.0){
			console.log("Neveljavna temperatura");
		}else{
			trenutnaMeritev={
				temperatura : readout.temperature.toFixed(1),
				vlaga : readout.humidity.toFixed(1) 
			}
			console.log("Meritev temperatura: " + trenutnaMeritev.temperatura + " Meritev vlaga: " + trenutnaMeritev.vlaga);
			
		}
	}else{
		if( (Math.abs(novaTemperatura- trenutnaMeritev) > 15) && novaTemperatura == 0.0 ){
			console.log("Neveljavna temperatura");
		}else{
			trenutnaMeritev={
				temperatura : readout.temperature.toFixed(1),
				vlaga : readout.humidity.toFixed(1) 
			}
			console.log("Meritev temperatura: " + trenutnaMeritev.temperatura + " Meritev vlaga: " + trenutnaMeritev.vlaga);
		}
	}
}


//----------------------- EMAIL-OBVESCANJE -------------------------
function emailObvescanje(mejnaTemperatura, intervalPreverjanja){
	console.log("Zaganjam email obveščanje!");
	
	smtpConfig = {
	    host: konfiguracija.obvescanje.smtpIP,
	    port: konfiguracija.obvescanje.smtpVrata,
	    secure: false,
	};

	var transporter = nodemailer.createTransport(smtpConfig);

	var prvic = true;
	var casZadnjeOdposiljke; 
	var trenutniCas;

	setInterval(function(){
		
		if(trenutnaMeritev != null){
			if(trenutnaMeritev.temperatura > mejnaTemperatura){
				
				if(prvic){
					prvic = false;
					casZadnjeOdposiljke = new Date();
					console.log("casZadnjeOdposiljke = " +casZadnjeOdposiljke);
					posljiEmail(transporter);
				}else{
					trenutniCas= new Date();
					if( (trenutniCas-casZadnjeOdposiljke) >= konfiguracija.obvescanje.intervalPosiljanjaEMAIL){
						posljiEmail(transporter);
						casZadnjeOdposiljke = trenutniCas;
					}
					
				}
				

			}
		}
	}, intervalPreverjanja); // vsake dve sekundi preveri temperaturo*/
}

function posljiEmail(transporter){

	var mailData = {
	    from: 'senzorPivkaPerutninasrtvo@njami.si',
	    to: pridobiSeznamNaslovnikov(),
	    subject: 'Obvestilo o pregrevanju (Pivka Perutninarstvo d.d.)',
	    html: 'Prišlo je do pregrevanja!'
	};

	transporter.sendMail(mailData, function(err){
			if(!err){
				console.log("Email uspešno poslan na naslove " + mailData.to);
			}else{
				console.log("Napaka pri pošiljanju!")
			}
	});
		
}

//----------------------- SMS-OBVESCANJE -------------------------
function smsObvescanje(mejnaTemperatura, intervalPreverjanja){
	console.log("Zaganjam SMS obveščanje!");

	var prvic = true;
	var casZadnjeOdposiljke; 
	var trenutniCas;

	setInterval(function(){
		
		if(trenutnaMeritev != null){
			if(trenutnaMeritev.temperatura > mejnaTemperatura){
				
				if(prvic){
					prvic = false;
					casZadnjeOdposiljke = new Date();
					console.log("casZadnjeOdposiljke = " +casZadnjeOdposiljke);
					posljiSMS();
				}else{
					trenutniCas= new Date();
					if( (trenutniCas-casZadnjeOdposiljke) >= konfiguracija.obvescanje.intervalPosiljanjaSMS){
						posljiSMS();
						casZadnjeOdposiljke = trenutniCas;
					}
					
				}
				

			}
		}
	}, intervalPreverjanja); // vsake dve sekundi preveri temperaturo*/
}

function posljiSMS(){
	// php poslji.php 20.5 zeleznikm murnovapivkap telSt.telSt.telSt

	var cmd = 'php ./SMS-obvescevalec.php ' + trenutnaMeritev.temperatura +" "+ konfiguracija.obvescanje.SMSUporabniskoIme +" "+ konfiguracija.obvescanje.SMSGeslo +" "+ pridobiSeznamTelStevilk();
	console.log(cmd);
	exec(cmd,function(error, stdout, stderr){
		console.log(stdout);
	});
}

function pridobiSeznamTelStevilk(){
	var nizTelSt = "";
	for(var i=0; i<konfiguracija.obvescanje.telefonskeStevilke.length; i++){
		if(i==konfiguracija.obvescanje.telefonskeStevilke.length-1){
			nizTelSt+=konfiguracija.obvescanje.telefonskeStevilke[i];
			break;
		}
		nizTelSt+=konfiguracija.obvescanje.telefonskeStevilke[i]+".";
	}
	return nizTelSt;
}

function zapisiVBazo(){
	
	if(trenutnaMeritev !=null){
		pool.getConnection(function(napaka1, connection) {
			var datum = pridobiTrenutniDatum();
	        if (!napaka1) {
	        	console.log('INSERT INTO meritve (temperatura, vlaga) VALUES (\''+trenutnaMeritev.temperatura+'\',\''+trenutnaMeritev.vlaga+'\');');
	            connection.query('INSERT INTO meritve (temperatura,vlaga) VALUES (\''+trenutnaMeritev.temperatura+'\',\''+trenutnaMeritev.vlaga+'\');', function(napaka2, info) {
	                if (!napaka2) {
	                    console.log("Uspešno zapisano v bazo!");
	                } else {
	                    console.log("Napaka pri pisanju v bazo!"+napaka2);
	                }

	            });

	            connection.release();

	        } else {
	            console.log("Napaka pri pisanju v bazo!" + napaka1);
	        }
	    });
	}	
}

function avtomatskoPisanjeVBazo(interval){
	zapisiVBazo();

	setInterval(function(){
		zapisiVBazo();
	},interval);
}

function avtomatskoBrisanjeZapisov(){
	pool.getConnection(function(napaka1, connection) {
		console.log("Avtomatsko brisanje starih zapisov je OMOGOČENO!");		
        if (!napaka1) {
        	console.log('Avtomatsko brisanje: DELETE FROM meritve WHERE datum < DATE_SUB(NOW(), INTERVAL '+ konfiguracija.podatkovnaBaza.starostZapisov + ' DAY);');
            connection.query('DELETE FROM meritve WHERE datum < DATE_SUB(NOW(), INTERVAL '+konfiguracija.podatkovnaBaza.starostZapisov  + ' DAY);', function(napaka2, info) {

            });

            connection.release();

        } 
    });
	setInterval(function(){
		
		pool.getConnection(function(napaka1, connection) {
				
	        if (!napaka1) {
	        	console.log('Avtomatsko brisanje: DELETE FROM meritve WHERE datum < DATE_SUB(NOW(), INTERVAL '+ konfiguracija.podatkovnaBaza.starostZapisov + ' DAY);');
	            connection.query('DELETE FROM meritve WHERE datum < DATE_SUB(NOW(), INTERVAL '+konfiguracija.podatkovnaBaza.starostZapisov  + ' DAY);', function(napaka2, info) {

	            });

	            connection.release();

	        } 
	    });
	},5*60*1000); // vsakih 5 minut pobrisi stare zapise
		
}

function pridobiTrenutniDatum(){

	// format YYYY-MM-DD HH:MM:SS
	
	var d = new Date();

	var mesec = d.getMonth()+1;
	var dan = d.getDate();
	var ura = d.getHours();
	var minute = d.getMinutes();
	var sekunde = d.getSeconds();

	if(mesec <10){
		mesec="0"+mesec.toString();
	}
	if(dan <10){
		dan="0"+dan.toString();
	}
	if(ura <10){
		ura="0"+ura.toString();
	}
	if(minute <10){
		minute="0"+minute.toString();
	}
	if(sekunde <10){
		sekunde="0"+sekunde.toString();
	}

	var datum = d.getFullYear()+"-"+mesec+"-"+dan+" "+ura+":"+minute+":"+sekunde;
	console.log(datum);

	return datum;
}

	

function pridobiSeznamNaslovnikov(){
	var seznam = "";
	for(var i=0; i<konfiguracija.obvescanje.emailNaslovi.length; i++){
		if(i==konfiguracija.obvescanje.emailNaslovi.length-1){
			seznam+= konfiguracija.obvescanje.emailNaslovi[i];
			break;
		}
		seznam+= konfiguracija.obvescanje.emailNaslovi[i]+",";
	}
	console.log("Seznam prejemnikov: "+ seznam);
	return seznam;
}
