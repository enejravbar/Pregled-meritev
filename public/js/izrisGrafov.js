$(document).ready(function(){
    izrisGrafaTemperatura();
    izrisGrafaVlaga();
});

function izrisGrafaTemperatura(){

    $('#temperatura-graf').highcharts({
        chart:{
            type: 'area'
        },
        title: {
            text: '' 
        },
        xAxis: {
            categories: ['Januar', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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
            data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
        }]
    });

}

function izrisGrafaVlaga(){

    $('#vlaga-graf').highcharts({
        chart:{
            type: 'area'
        },
        title: {
            text: '' 
        },
        xAxis: {
            categories: ['Januar', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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
            data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
        }]
    });
    
}

