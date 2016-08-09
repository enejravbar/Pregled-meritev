var timer;
$(document).ready(function() {
  validacijaUporabnika();
});


function validacijaUporabnika() {
	console.log("v funkciji");
	$("#gumb-prijava").click(function(){

		clearTimeout(timer);
		$("#prijava-obvestilo-okvir").css({display: ""});

		var username = $("#username").val();
		var password = $("#password").val();
		var uporabniskiPodatki ={
			username : username,
			password : password
		}
		console.log(JSON.stringify(uporabniskiPodatki));

	    $.ajax({
		    type: "POST",
		    url: "/checkLogin",
		    dataType: 'json',
		    contentType: 'application/json', 
		    async: true,
		    data: JSON.stringify(uporabniskiPodatki),

		    success: function (odgovor){
		    	odgovor=JSON.parse(odgovor);	
		    	if(odgovor.pravilno){
		    		$("#prijava-obvestilo-okvir").css({
                    "display": "inline-block"
	                });
	                $("#prijava-obvestilo-okvir").attr({
	                    "class": "alert alert-success fade-in"
	                });
	                $("#prijava-obvestilo").html("Prijava uspešna!");
	                timer = setTimeout(function() {
	                    $("#prijava-obvestilo-okvir").hide('slow');
	                }, 4000);
	                window.location.replace("/");
		    	}else{
		    		$("#prijava-obvestilo-okvir").css({
                    "display": "inline-block"
	                });
	                $("#prijava-obvestilo-okvir").attr({
	                    "class": "alert alert-danger fade-in"
	                });
	                $("#prijava-obvestilo").html("Uporabniško ime ali geslo ni pravilno!");
	                timer = setTimeout(function() {
	                    $("#prijava-obvestilo-okvir").hide('slow');
	                }, 4000);
		    	}


		    }
		});
	});
	

}