google.load("visualization", "1", {
    packages: ["corechart"]
});

google.charts.load('current', {
    'packages': ['corechart']
});


$(document).ready(function() {
  narisiGrafTemperature();
  narisiGrafVlage();
  //narisiGrafPovprecneTemperature();
});

$(window).resize(function() {
  narisiGrafTemperature();
  narisiGrafVlage();
  //narisiGrafPovprecneTemperature();
});

function narisiGrafTemperature() {
    //console.log(podatki);
    var data = google.visualization.arrayToDataTable([
          ['Datum', 'Temperatura'],
          ['2013',  23],
          ['2014',  22.5],
          ['2015',  27.5],
          ['2016',  23.8]
        ]);

    var options = {
        title: 'Temperaturni graf',

        hAxis: {
            title: 'Datum',
            height:100,
            direction: -1,
            slantedText: true,
            slantedTextAngle: 60, // here you can even use 180
            titleTextStyle: {
                color: '#333'
            }
        },
        vAxis: {
            minValue: 0
        },
        /*chartArea:{left:100,top:100, bottom:50}*/
        chartArea: {
            left:50,
            top: 40,
            bottom: 80,
            right:10
        }
    };

    var chart = new google.visualization.AreaChart(document.getElementById('temperatura-graf'));
    chart.draw(data, options);
}

function narisiGrafVlage() {
    //console.log(podatki);
    var data = google.visualization.arrayToDataTable([
          ['Datum', 'Vlaga'],
          ['2013',  23],
          ['2014',  43.5],
          ['2015',  33.5],
          ['2016',  55.8]
        ]);

    var options = {
        title: 'Graf vlage',
        hAxis: {
            title: 'Datum',
            height:100,
            direction: -1,
            slantedText: true,
            slantedTextAngle: 60, // here you can even use 180

            titleTextStyle: {
                color: '#333'
            }
        },
        vAxis: {
            minValue: 0
        },
        /*chartArea:{left:100,top:100, bottom:50}*/
        chartArea: {
            left:50,
            top: 40,
            bottom: 80,
            right:10
        }
    };

    var chart = new google.visualization.AreaChart(document.getElementById('vlaga-graf'));
    chart.draw(data, options);
}
