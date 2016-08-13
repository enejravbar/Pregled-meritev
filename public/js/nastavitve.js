
var timer,timer1,timer2;

$(document).ready(function() {
	$('#pojavnoOkno-testAplikacija').modal('show');
  pridobiStrezniskoKonfiguracijo();

   
  spremeniKategorijoNastavitev();

  posredujNastavitveStrezniku();

  gumbRocnoBrisanje();
  izbrisiVseZapise();

  dodajanjeEmailov();
  brisanjeEmailov();

  dodajanjeTelefonskihSt();
  brisanjeTelefonskihSt();
});

function spremeniKategorijoNastavitev(){
	$(".kategorija").click(function(){
		$(".kategorija").css({"background-color" : "#333"});
		$(this).css({"background-color" : "#111"});
		
		if($(this).attr("id")== "senzor-Gumb"){
			$(".nastavitev").css({"display" : "none"});
			$("#senzor").css({"display" : ""});
		}
		if($(this).attr("id")== "podBaza-Gumb"){
			$(".nastavitev").css({"display" : "none"});
			$("#podatkovnaBaza").css({"display" : ""});
		}
		if($(this).attr("id")== "obvescanje-Gumb"){
			$(".nastavitev").css({"display" : "none"});
			$("#obvescanje").css({"display" : ""});
		}
		if($(this).attr("id")== "registracija-Gumb"){
			$(".nastavitev").css({"display" : "none"});
			$("#registracija").css({"display" : ""});
		}
		if($(this).attr("id")== "logDatoteka-Gumb"){
			$(".nastavitev").css({"display" : "none"});
			$("#logDatoteka").css({"display" : ""});
		}
	});
} 

function pridobiStrezniskoKonfiguracijo(){
	$.ajax({
	    type: "POST",
	    url: "/pridobiKonfiguracijo",
	    dataType: 'json',
	    contentType: 'application/json', 
	    async: true,
	    data: null,

	    success: function (odgovor){
          	var konfiguracija=JSON.parse(odgovor);  
	        prikaziTrenutnoKonfiguracijo(konfiguracija);
	        setTimeout(function(){
			  	$('#pojavnoOkno-testAplikacija').modal('hide');
			},300);
	    }
	});
}

function prikaziTrenutnoKonfiguracijo(konfiguracija){
	var senzor = konfiguracija.senzor;
	var podatkovnaBaza = konfiguracija.podatkovnaBaza;
	var obvescanje = konfiguracija.obvescanje;
	
	if(senzor.statusSenzorja==1){
		$("#statusSenzor").prop("checked",true);
	}else{
		$("#statusSenzor").prop("checked",false);
	}

	$("#mejnaTemperatura option").each(function(){
		if($(this).val()==senzor.mejnaTemperatura){
			$(this).prop("selected",true);
		}
	});

	$("#intervalBranjaSenzorja option").each(function(){
		if($(this).val()==senzor.intervalBranjaSenzorja/1000){
			$(this).prop("selected",true);
		}
	});

	$("#ip-naslov").val(podatkovnaBaza.ipNaslov);
	$("#uporabnisko-ime").val(podatkovnaBaza.uporabniskoIme);

	$("#geslo").val(podatkovnaBaza.geslo);
	$("#imePodBaze").val(podatkovnaBaza.imePodBaze);
	//var avtomatskoPisanjeInterval = $("#avtomatskoPisanje-interval option:selected").val();

	$("#avtomatskoPisanje-interval option").each(function(){
		if($(this).val()==podatkovnaBaza.avtomatskoPisanjeInterval/(1000*60)){
			$(this).prop("selected",true);
		}
	});

	if(podatkovnaBaza.statusAvtomatskegaPisanja==1){
		$("#statusAvtomatskegaPisanja").prop("checked",true);
	}else{
		$("#statusAvtomatskegaPisanja").prop("checked",false);
	}

	if(podatkovnaBaza.statusAvtomatskegaBrisanja==1){
		$("#statusAvtomatskegaBrisanja").prop("checked",true);
	}else{
		$("#statusAvtomatskegaBrisanja").prop("checked",false);
	}

	$("#select-avtomatskoBrisanje option").each(function(){
		if($(this).val()==podatkovnaBaza.starostZapisov){
			$(this).prop("selected",true);
		}
	});

	if(obvescanje.statusEmailObvescanja==1){
		$("#statusEmailObvescanja").prop("checked",true);
	}else{
		$("#statusEmailObvescanja").prop("checked",false);
	}

	if(obvescanje.statusSMSObvescanja==1){
		$("#statusSMSObvescanja").prop("checked",true);
	}else{
		$("#statusSMSObvescanja").prop("checked",false);
	}

	$("#interval-posiljanja-emailov option").each(function(){
		if($(this).val()==obvescanje.intervalPosiljanjaEMAIL/60000){
			$(this).prop("selected",true);
		}
	});

	$("#interval-posiljanja-smsjev option").each(function(){
		if($(this).val()==obvescanje.intervalPosiljanjaSMS/60000){
			$(this).prop("selected",true);
		}
	});

	$("#smtp-ip-naslov").val(obvescanje.smtpIP);
	$("#vrata").val(obvescanje.smtpVrata);

	$("#seznam-emailov").html();

	for(var i=0; i<obvescanje.emailNaslovi.length; i++){
		var html =	"<tr>"+
                      "<td>"+ obvescanje.emailNaslovi[i] +"</td>"+
                      "<td>"+
                         "<button type=\"submit\" class=\"btn btn-danger btn-sm\" style=\"display:inline; float:right;\">Odstrani</button>" +
                      "</td>"+
                   	"</tr>";
		$("#seznam-emailov").append(html);
	}

	$("#seznam-telSt").html();

	for(var i=0; i<obvescanje.telefonskeStevilke.length; i++){
		var html= "<tr>"+
                      "<td>"+ obvescanje.telefonskeStevilke[i] +"</td>"+
                      "<td>"+
                         "<button type=\"submit\" class=\"btn btn-danger btn-sm\" style=\"display:inline; float:right;\">Odstrani</button>" +
                      "</td>"+
                   "</tr>";

		$("#seznam-telSt").append(html);

	}

	$("#SMS-uporabniskoIme").val(obvescanje.SMSUporabniskoIme);
	$("#SMS-geslo").val(obvescanje.SMSGeslo);

}

function izbrisiVseZapise(){
	$("#gumb-izbrisiVse").click(function(){
		$.ajax({
		    type: "POST",
		    url: "/izbrisiVseZapise",
		    dataType: 'json',
		    contentType: 'application/json', 
		    async: true,
		    data: null,

		    success: function (odgovor){
	          	if(odgovor.uspeh){

			            clearTimeout(timer1);
			            $("#podBaza-okvir").attr({"class" : "fade-in obvestilo bg-success"});
						$("#podBaza-okvir").css({
						"display" : "inline"
						});
						$("#podBaza-okvir").html("Zapisi so bilo uspešno izbrisani!");

						timer1 = setTimeout(function() {
			            $("#podBaza-okvir").hide('slow');
			        	}, 4000);
		            }else{
		            	clearTimeout(timer1);
			            $("#podBaza-okvir").attr({"class" : "fade-in obvestilo bg-danger"});
						$("#podBaza-okvir").css({
						"display" : ""
						});
						$("#podBaza-okvir").html(odgovor.sporocilo);

						timer1 = setTimeout(function() {
			            $("#podBaza-okvir").hide('slow');
			        	}, 4000);
		            }
		    }
		});
	})
}

function gumbRocnoBrisanje(){
	var stDni;
	$("#gumb-rocnoBrisanje").click(function(){
		$("#select-rocnoBrisanje option").each(function(){
			if($(this).prop("selected")){
				stDni = $(this).val();
				console.log("Izbrano je bilo " + stDni +" stevilo dni");
				brisanjeZapisov(stDni);
			}
		});
	});
}

/*function avtomatskoBrisanjeZapisov(){
	brisanjeZapisov(konfiguracija.podatkovnaBaza.starostZapisov);
	setInterval(function(){
		brisanjeZapisov(konfiguracija.podatkovnaBaza.starostZapisov);
	}, (5*60*1000));	
}*/

function brisanjeZapisov(stDni){
	$.ajax({
	    type: "POST",
	    url: "/brisanjeZapisov",
	    dataType: 'json',
	    contentType: 'application/json', 
	    async: true,
	    data: JSON.stringify({stDni:stDni}),

	    success: function (odgovor){
	    	if(odgovor.uspeh){

	            clearTimeout(timer2);
	            $("#podBaza-okvir").attr({"class" : "fade-in obvestilo bg-success"});
				$("#podBaza-okvir").css({
				"display" : "inline"
				});
				$("#podBaza-okvir").html("Zapisi so bilo uspešno izbrisani!");

				timer2 = setTimeout(function() {
	            $("#podBaza-okvir").hide('slow');
	        	}, 4000);
	        }else{
	        	clearTimeout(timer2);
	            $("#podBaza-okvir").attr({"class" : "fade-in obvestilo bg-danger"});
				$("#podBaza-okvir").css({
				"display" : ""
				});
				$("#podBaza-okvir").html(odgovor.sporocilo);

				timer2 = setTimeout(function() {
	            $("#podBaza-okvir").hide('slow');
	        	}, 4000);
	        }
	    },
	    error: function (napaka){
	    	
	    }	
	});
}

function pridobiNastavitve(){
	

		console.log("Zaznan klik");
		// senzor
		var statusSenzorja="0"; 
		if($("#statusSenzor").prop("checked")){
			statusSenzorja="1";
		}

		var	mejnaTemperatura =$("#mejnaTemperatura option:selected").val(); 
		var	intervalBranjaSenzorja=$("#intervalBranjaSenzorja option:selected").val();

		// podatkovna baza
		var	ipNaslov = $("#ip-naslov").val();
		var	uporabniskoIme = $("#uporabnisko-ime").val();
		var	geslo = $("#geslo").val();
		var imePodBaze = $("#imePodBaze").val();

		var avtomatskoPisanjeInterval = $("#avtomatskoPisanje-interval option:selected").val();

		var statusAvtomatskegaPisanja =0;
		if($("#statusAvtomatskegaPisanja").prop("checked")){
			statusAvtomatskegaPisanja=1;
		} 

		var statusAvtomatskegaBrisanja = 0;
		if($("#statusAvtomatskegaBrisanja").prop("checked")){
			statusAvtomatskegaBrisanja=1;
		}
		var starostZapisov =$("#select-avtomatskoBrisanje option:selected").val(); 

		// obveščanje

		var statusEmailObvescanja = 0;
		if($("#statusEmailObvescanja").prop("checked")){
			statusEmailObvescanja=1;
		}

		var statusSMSObvescanja = 0;
		if($("#statusSMSObvescanja").prop("checked")){
			statusSMSObvescanja=1;
		}

		var	intervalPosiljanjaEMAIL = $("#interval-posiljanja-emailov option:selected").val(); ;
		var	intervalPosiljanjaSMS = $("#interval-posiljanja-smsjev option:selected").val(); ;

		var	smtpIP = $("#smtp-ip-naslov").val();
		var	smtpVrata = $("#vrata").val();
		var	emailNaslovi=pridobiEmailNaslove();

		var	SMSUporabniskoIme = $("#SMS-uporabniskoIme").val();
		var	SMSGeslo = $("#SMS-geslo").val();
		var	telefonskeStevilke=pridobiTelefonskeStevilke();
		
		var konfiguracija = {
		
			senzor:	{
				statusSenzorja : statusSenzorja,
				mejnaTemperatura : mejnaTemperatura,
				intervalBranjaSenzorja : intervalBranjaSenzorja*1000
			},

			podatkovnaBaza: {
				ipNaslov : ipNaslov, 
				uporabniskoIme : uporabniskoIme,
				geslo : geslo,
				imePodBaze : imePodBaze,
				statusAvtomatskegaPisanja : statusAvtomatskegaPisanja,
				avtomatskoPisanjeInterval : avtomatskoPisanjeInterval*60*1000,
				statusAvtomatskegaBrisanja : statusAvtomatskegaBrisanja,
				starostZapisov : starostZapisov

			},

			obvescanje: {
				statusEmailObvescanja : statusEmailObvescanja,
				statusSMSObvescanja : statusSMSObvescanja,
				intervalPosiljanjaEMAIL: intervalPosiljanjaEMAIL*60000,
				intervalPosiljanjaSMS : intervalPosiljanjaSMS*60000,
				smtpIP : smtpIP,
				smtpVrata : smtpVrata,
				emailNaslovi : emailNaslovi,
				SMSUporabniskoIme : SMSUporabniskoIme,
				SMSGeslo : SMSGeslo,
				telefonskeStevilke : telefonskeStevilke
			}
		};

		console.log(konfiguracija);
	
		return konfiguracija;
}

function posredujNastavitveStrezniku(){
	$("#gumb-shraniNastavitve").click(function(){
		var konfiguracija=pridobiNastavitve();
		console.log(JSON.stringify(konfiguracija));
		$.ajax({
			    type: "POST",
			    url: "/konfiguracija",
			    dataType: 'json',
			    contentType: 'application/json', 
			    async: true,
			    data: JSON.stringify(konfiguracija),

			    success: function (odgovor){
		          	
		          	console.log("Sporocilo je: "+odgovor);
			        if(odgovor.uspeh){
			        	
			        	
			            clearTimeout(timer);
			            $("#gumbShrani-okvir").attr({"class" : "fade-in obvestilo bg-success"});
						$("#gumbShrani-okvir").css({
						"display" : "inline"
						});
						$("#gumbShrani-okvir").html("Nastavitve uspešno shranjene!");

						timer = setTimeout(function() {
			            $("#gumbShrani-okvir").hide('slow');
			        	}, 4000);
		            }else{
		            	clearTimeout(timer);
			            $("#gumbShrani-okvir").attr({"class" : "fade-in obvestilo bg-danger"});
						$("#gumbShrani-okvir").css({
						"display" : ""
						});
						$("#gumbShrani-okvir").html("Napaka! Nastavitve niso uspešno shranjene!");

						timer = setTimeout(function() {
			            $("#gumbShrani-okvir").hide('slow');
			        	}, 4000);
		            }

			    },
			    error: function (napaka){
			    	
			    }	
			});
	});
}

function dodajanjeEmailov(){

	$("#dodajEmail").click(function(){
		if($("#emailNaslov").val()==""){
			return;
		}

		var html= "<tr>"+
                      "<td>"+ $("#emailNaslov").val() +"</td>"+
                      "<td>"+
                         "<button type=\"submit\" class=\"btn btn-danger btn-sm\" style=\"display:inline; float:right;\">Odstrani</button>" +
                      "</td>"+
                   "</tr>";

		$("#seznam-emailov").append(html);
	});	
}

function brisanjeEmailov(){
	$(document).on("click", "#seznam-emailov button", function(){
		$(this).parent().parent().remove();
	});
} 

function dodajanjeTelefonskihSt(){
	$("#dodajTelSt").click(function(){
		if($("#telefonska-stevilka").val()==""){
			return;
		}

		var html= "<tr>"+
                      "<td>"+ $("#telefonska-stevilka").val() +"</td>"+
                      "<td>"+
                         "<button type=\"submit\" class=\"btn btn-danger btn-sm\" style=\"display:inline; float:right;\">Odstrani</button>" +
                      "</td>"+
                   "</tr>";

		$("#seznam-telSt").append(html);
	});	
}

function brisanjeTelefonskihSt(){
	$(document).on("click", "#seznam-telSt button", function(){
		$(this).parent().parent().remove();
	});
} 

function pridobiEmailNaslove(){
	var tabelaEmailov = [];
	var stevec=0;
	$("#seznam-emailov td").each(function(){
		if(stevec%2==0){
			tabelaEmailov.push($(this).text());	
		}
		stevec++;
	})
	//console.log(tabelaEmailov);
	return tabelaEmailov;
}

function pridobiTelefonskeStevilke(){
	var tabelaTelSt = [];
	var stevec=0;
	$("#seznam-telSt td").each(function(){
		if(stevec%2==0){
			tabelaTelSt.push($(this).text());	
		}
		stevec++;
	})
	//console.log(tabelaTelSt);
	return tabelaTelSt;
}