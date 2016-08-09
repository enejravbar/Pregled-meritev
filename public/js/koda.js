$(document).ready(function(){
	var socket = io.connect('192.168.10.50:443');
	poslusajSocket(socket);
});


function poslusajSocket(socket){
	socket.on('meritev', function(sporocilo) {
        
        $("#trenutnaTemperatura").html(sporocilo.temperatura);
        $("#trenutnaVlaga").html(sporocilo.vlaga);
    })
}
