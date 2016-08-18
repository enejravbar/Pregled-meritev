var kontrola=0;

$(document).ready(function(){
    $('#pojavnoOkno-testAplikacija').modal('show');
	var socket = io.connect('temperaturaPivka:443');
	poslusajSocket(socket);

    $("#temperatura-starostMeritev").change(function(){
         posodobiGrafe();
    });

    posodobiGrafe();
    setInterval(function(){
        posodobiGrafe();
    },5000);
	
});


function poslusajSocket(socket){
	var kontrola = 0;
	socket.on('meritev', function(sporocilo) {
        
        $("#trenutnaTemperatura").html(sporocilo.temperatura);
        $("#trenutnaVlaga").html(sporocilo.vlaga);
    })
    	
}

function posodobiGrafe(){
    
    var starostMeritev = $("#temperatura-starostMeritev option:selected").val();
    $.ajax({
        type: "POST",
        url: "/pridobiMeritveIzBaze",
        dataType: 'json',
        contentType: 'application/json', 
        async: true,
        data: JSON.stringify({starostMeritev:starostMeritev}),

        success: function (odgovor){
            if(odgovor.uspeh){
                sporocilo = regulirajSteviloPodatkov(odgovor.podatki,20);
                var tabelaDatumov = vrniTabeloDatumov(sporocilo);
                var tabelaTemperatur  = vrniTabeloTemperatur(sporocilo);
                var tabelaVlage  = vrniTabeloVlage(sporocilo);
                if(kontrola==0){
                    izrisGrafaTemperatura(tabelaDatumov, tabelaTemperatur,true);
                    izrisGrafaVlaga(tabelaDatumov, tabelaVlage,true);
                    setTimeout(function(){
                        $('#pojavnoOkno-testAplikacija').modal('hide');
                    },200);
                    kontrola=1;
                }else{
                    izrisGrafaTemperatura(tabelaDatumov, tabelaTemperatur,false);
                    izrisGrafaVlaga(tabelaDatumov, tabelaVlage,false);
                }
                
            }
        },
        error: function (napaka){
            
        }   
    });

    
}

function regulirajSteviloPodatkov(tabelaMeritev,omejitev){
	var tabela = [];
	if(tabelaMeritev.length>omejitev && tabelaMeritev.length !=0 ){
		var interval = parseInt(tabelaMeritev.length / omejitev);
		var stMeritev = 0;
		for(var i= tabelaMeritev.length-1; i>=0; i=i-interval){
			if(stMeritev==omejitev){

				break;
			}else{
				tabela.push(tabelaMeritev[i]);
				stMeritev++;
			}
		}
		console.log("regulirano: " +tabela[0]);
		return obrniVrstniRedElementovVTabeli(tabela);
	}else{
		return tabelaMeritev;
	}
}

function obrniVrstniRedElementovVTabeli(tabela){
	var temp;
	for(var i=0; i<tabela.length; i++){
		if(tabela.length-1-i == i){
			break;
		}
		temp=tabela[i];
		tabela[i]=tabela[tabela.length-1-i];
		tabela[tabela.length-1-i]=temp;
		if(tabela.length-1-2*i==1){
			break;
		}
	}
	return tabela;
}

function vrniTabeloDatumov(sporocilo){
	var tabela=[];
	var datum="";
	for(var i=0; i<sporocilo.length; i++){
		datum= sporocilo[i].datum;
		var noviDatum = "";
		var tempTabela = datum.split("T");
		for(var j=0; j<tempTabela.length; j++){
			if(j==0){
				var tempTabela2= tempTabela[0].split("-");
				noviDatum+=tempTabela2[2]+"-"+tempTabela2[1]+"-"+tempTabela2[0]+" ";
			}else{
				var tabelaDelovUre=tempTabela[1].substring(0,8).split(":");  
                noviDatum += popraviUro(tabelaDelovUre[0]) + ":"+ tabelaDelovUre[1];
			}
		}

		tabela.push(noviDatum);
	}
	console.log(tabela);
	return tabela;
}

function popraviUro(ura){
    console.log(ura);
    if(ura.charAt(0)=="0"){
        ura = ura.substring(1,2);
    }
    console.log("Ura po modifikaciji: "+ ura);
    ura=parseInt(ura);
    if(ura==22){
        ura=0;
    }
    if(ura==23){
        ura=1;
    }
    if(ura != 22 && ura !=23 ){
        ura+=2;
    }
    if(ura<10){
        ura="0"+ura.toString();
    }
    return ura;
}

function vrniTabeloTemperatur(sporocilo){
	var tabela=[];
	for(var i=0; i<sporocilo.length; i++){
		tabela.push(sporocilo[i].temperatura);
	}
	console.log(tabela);
	return tabela;
}

function vrniTabeloVlage(sporocilo){
	var tabela=[];
	for(var i=0; i<sporocilo.length; i++){
		tabela.push(sporocilo[i].vlaga);
	}
	console.log(tabela);
	return tabela;
}

function izrisGrafaTemperatura(tabelaDatumov,tabelaTemperatur,animacija){

    $('#temperatura-graf').highcharts({
        chart:{
            type: 'area'

        },
        title: {
            text: '' 
        },
        xAxis: {
            categories: tabelaDatumov,
            labels: {
                rotation: -45
            }
        },
        yAxis: {
            allowDecimals: true,
            title: {
                text: ''
            },
            plotLines: [{
                value: 0,
                width: 1,
                
            }]
        },
        tooltip: {
            valueSuffix: '°C'
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [{
            name: 'Temperatura',
            showInLegend:false,
            data: tabelaTemperatur,
            animation: animacija
        }]
    });

}

function izrisGrafaVlaga(tabelaDatumov,tabelaVlage,animacija){

    $('#vlaga-graf').highcharts({
        chart:{
            type: 'area'
            
        },
        title: {
            text: '' 
        },
        xAxis: {
            categories: tabelaDatumov,
            labels: {
                rotation: -45
            }
        },
        yAxis: {
            allowDecimals: true,
            title: {
                text: ''
            },
            plotLines: [{
                value: 0,
                width: 1,
                
            }]
        },
        tooltip: {
            valueSuffix: '°C'
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [{
            name: 'Temperatura',
            showInLegend:false,
            data: tabelaVlage,
            animation: animacija
        }]
    });
    
}

