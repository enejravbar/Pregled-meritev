testAjax();
function testAjax() {

	var uporabniskiPodatki ={
		username : "enej",
		password : "napacnogeslo"
	}
	console.log(JSON.stringify(uporabniskiPodatki));

    $.ajax({
	    type: "POST",
	    url: "/checkLogin",
	    dataType: 'text',
	    async: true,
	    data: JSON.stringify(uporabniskiPodatki),

	    success: function (odgovor){
	    	console.log(odgovor);
	    }
	});

}