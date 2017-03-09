var map;
var states;
var jurisdictions;
var selected_year;
var years_data;
var geojson_states;
var geojson_jurisdictions;
var dashboard_rendered;

//selects
var select_unidad       = $( '#select_unidad' );
var select_pae          = $( '#select_pae' );
var select_indicador    = $( '#select_indicador' );

var ficha               = $( '#ficha' );
var tabla_ind           = $( '#tabla_indicador' );
var map_pagination      = $( '#anios' );

function select_unidad_cb () {
    select_pae.load( '/select-pae', {
        unidad  : $( this ).val()
    }, _paeSelected );
};

function color( val ) {
    switch ( val ){
        case 0:
            return '#484848';
            break;
        case 1:
            return '#E24A4A';
            break;
        case 2:
            return '#FFD200';
            break;
        case 3:
            return '#07C2A7';
            break;
        case 4:
            return '#FF864E';
            break;
        case 5:
            return '#2658A8';
            break;
    }

    return '#edeff2';
}

select_unidad.change( select_unidad_cb );

select_pae.change( _paeSelected );

select_indicador.change( _setPagination );

function _loadIndicatorData () {
    var indicator   = select_indicador.val();

    ficha.load( '/ficha', {
        id_ficha    : indicator
    });
    tabla_ind.load( '/tabla-indicador', {
        id_ficha    : indicator,
        year        : selected_year
    });

    $( '#indicators-table__container' ).slideUp();
    $( '.btn-see-all' ).fadeIn();
    $( '.btn-hide-all' ).fadeOut();
    _setBarChart( select_indicador.val() );
    _setLineChart( select_indicador.val() );

    if ( indicator == 159 ) {
        $( '#dashboard-container' ).fadeIn();

        if ( !dashboard_rendered ) {
            _draw_dashboard();
        }
    } else {
        $( '#dashboard-container' ).fadeOut();
    }
}

function _paeSelected () {
    select_indicador.load( '/select-ficha', {
        id_pae  : select_pae.val()
    }, _setPagination );
}

function _setBarChart ( id_ficha ) {
    var margin  = {
            top     : 20,
            right   : 20,
            bottom  : 30,
            left    : 40
        },
        width   = 1000 - margin.left - margin.right,
        height  = 500 - margin.top - margin.bottom;

    var x       = d3.scale.ordinal()
        .rangeRoundBands( [0, width], .1, 1 );

    var y       = d3.scale.linear()
        .range( [height, 0] );

    var xAxis   = d3.svg.axis()
        .scale( x )
        .orient( "bottom" );

    var yAxis   = d3.svg.axis()
        .scale( y )
        .orient( "left" );

    var current = $( '#g1 svg' );
    if ( current.length ) {
        current.remove();
    }

    var svg     = d3.select( "#g1" ).append( "svg" )
        .attr( "width", width + margin.left + margin.right )
        .attr( "height", height + margin.top + margin.bottom )
        .append( "g" )
        .attr( "transform", "translate(" +  margin.left + "," + margin.top + ")");

    var url     = '/miipps/' + id_ficha +'/' + selected_year;

    d3.json( url, function ( error, data ) {
        console.log( data );
        data.forEach(function( d ) {
            d.valor = +d.valor;
        });

        x.domain( data.map( function ( d ) {
            return d.entidad;
        }));
        y.domain( [0, d3.max( data, function ( d ) {
            return d.valor;
        })]);

        svg.append( "g" )
            .attr( "class", "x axis")
            .attr( "transform", "translate(0," + height + ")" )
            .call( xAxis );

        svg.append( "g" )
            .attr( "class", "y axis" )
            .call( yAxis )
            .append( "text" )
            .attr( "transform", "rotate( -90 )" )
            .attr( "y", 6 )
            .attr( "dy", ".71em" )
            .style( "text-anchor", "end" )
            .text( "Desempeño" );

        svg.selectAll( ".bar" )
            .data( data )
            .enter().append( "rect" )
            .style( 'fill', function ( d ) {
                return color( d.color )
            })
            .attr( "class", "bar" )
            .attr( "x", function( d ) {
                return x( d.entidad );
            })
            .attr( "width", x.rangeBand() )
            .attr( "y", function( d ) {
                return y( d.valor );
            })
            .attr( "height", function( d ) {
                return height - y(d.valor);
            });

        d3.select( "input" ).on( "change", change );

        var sortTimeout = setTimeout( function() {
            d3.select( "input" ).property( "checked", true ).each( change );
        }, 2000);

        function change() {
            clearTimeout(sortTimeout);

            // Copy-on-write since tweens are evaluated after a delay.
            var x0 = x.domain(data.sort(this.checked
                ? function(a, b) { return a.valor - b.valor; }
                : function(a, b) { return d3.ascending(a.entidad, b.entidad); })
                .map(function(d) { return d.entidad; }))
                .copy();

            svg.selectAll(".bar")
                .sort(function(a, b) { return x0(a.entidad) - x0(b.entidad); });

            var transition = svg.transition().duration(750),
                delay = function(d, i) { return i * 50; };

            transition.selectAll(".bar")
                .delay(delay)
                .attr("x", function(d) { return x0(d.entidad); });

            transition.select(".x.axis")
                .call(xAxis)
                .selectAll("g")
                .delay(delay);
        }
    });
}

function _setLineChart ( id_ficha ) {
    // Set the dimensions of the canvas / graph
    var margin  = {
            top     : 30,
            right   : 20,
            bottom  : 50,
            left    : 50
        },
        width   = 1000 - margin.left - margin.right,
        height  = 500 - margin.top - margin.bottom;

    // Parse the date / time
   //var  parseDate   = d3.time.format( "%Y" ).parse;

    // Set the ranges
    var x           = d3.time.scale().range( [0, width] );
    var y           = d3.scale.linear().range( [height, 0] );

    // Define the axes
    var xAxis       = d3.svg.axis().scale( x )
        .orient( "bottom" );
 
    var yAxis       = d3.svg.axis().scale( y )
        .orient( "left" ).ticks( 5 );

    // Define the line
    var priceline   = d3.svg.line()
        .x( function ( d ) {
            return x( d.anio );
        })
        .y( function ( d ) {
            return y( d.valor );
        });

    var current = $( '#lines svg' );
    if ( current.length ) {
        current.remove();
    }

    // Adds the svg canvas
    var svg         = d3.select( "#lines" )
        .append( "svg" )
            .attr( "width", width + margin.left + margin.right )
            .attr( "height", height + margin.top + margin.bottom )
        .append( "g" )
            .attr( "transform", "translate(" + margin.left + "," + margin.top + ")" );

    // Get the data
    d3.json( '/miipps/' + id_ficha, function( error, data ) {
        var years       = _.countBy( data, 'anio' );
        // Nest the entries by entidad
        var dataNest    = d3.nest()
            .key( function( d ) {
                return d.entidad;
            })
            .entries( data );

        _.each( dataNest, function ( d ) {
            if ( d.values.length != years.length ) {
                for ( var key in years ) {
                    if ( !_.findWhere( d.values, { anio : parseInt( key ) } ) ) {
                        d.values.push({
                            anio    : key,
                            entidad : parseInt( d.key ),
                            valor   : 0
                        });
                    }
                }
            }

            d.values    = _.sortBy( d.values, 'anio' );
        });

        var color       = d3.scale.category10();

        data.forEach( function ( d ) {
            d.anio  = +d.anio;
            d.valor = +d.valor;
        });

        // Scale the range of the data
        x.domain( d3.extent( data, function ( d ) {
            return d.anio;
        }));
        y.domain( [0, d3.max( data, function ( d ) {
            return d.valor;
        })]);

        dataNest.forEach( function ( d, i ) {
            svg.append( "path" )
                .attr( "class", "line" )
                .style( "stroke", "#ddd" )
                .attr( "d", priceline( d.values ) )
                .on( "mouseover", function () {
                    $( this ).attr( "style", "stroke: #ff0000;" );
                })
                .on( "mouseout", function () {
                    $( this ).attr( "style", "stroke: #ddd;" );
                });
        });

        // Add the X Axis
        svg.append( "g" )
            .attr( "class", "x axis" )
            .attr( "transform", "translate(0," + height + ")" )
            .call( xAxis );

        // Add the Y Axis
        svg.append( "g" )
            .attr( "class", "y axis" )
            .call( yAxis );
    });
}

function _setPagination () {
    map_pagination.html( '' );
    map_pagination.load( '/anios', {
        id : select_indicador.val()
    }, function () {
        $( '.pagination' ).find( 'li' ).click( function ( e ) {
            e.preventDefault();
            $( '.pagination li' ).removeClass( 'active' );
            var pag_el  = $( this );
            pag_el.addClass( 'active' );

            $.post( '/colores', {
                id      : pag_el.data( 'id_ficha' ),
                anio    : pag_el.data( 'anio' )
            }, function( data ){
                years_data      = data;
                selected_year   = pag_el.data( 'anio' );

                draw_states();
                _loadIndicatorData();
            });
        });

        var items   = $( '.pagination li' );
        $( items.get( items.length - 2 ) ).click();
    });
}

function _onFeature ( feature, drawnLayer ) {
    var el      = _.findWhere( years_data, {
            nombre  : feature.properties.NOM_ENT
        }),
        popupEl = $( '#map-popup' );


    drawnLayer.setStyle({
        color       : '#333333',
        opacity     : 1,
        weight      : 1,
        fillColor   : ( el && el.color !== undefined ) ? color( el.color ) : color( -1 ),
        fillOpacity : 1
    });

    if ( el ) {
        feature.properties.indicator    = el.vali;
    }

    ( function ( layer, feature ) {
        layer.on( 'mouseover', function ( e ) {
            popupEl.stop().css({
                left    : e.originalEvent.clientX + 50,
                top     : e.originalEvent.clientY + 150
            }).fadeIn();

            $( '.data-state', popupEl ).html( feature.properties.NOM_ENT );
            $( '.data-year', popupEl ).html( selected_year );
            $( '.data-indicator', popupEl ).html( feature.properties.indicator || 'No hay datos' );
        });

        layer.on( 'mouseout', function () {
            popupEl.stop().fadeOut();
        });

        layer.on( 'click', function ( e ) {
            $.get( '/jurisdictions', {
                id      : select_indicador.val(),
                entity  : parseInt( feature.properties.CVE_ENT ),
                anio    : selected_year
            }, function ( data ) {
                _draw_jurisdictions( data, feature.properties.NOM_ENT, e.latlng );
            });
        });
    })( drawnLayer, feature );
}

function _draw_jurisdictions ( data, entity, latlng ) {
    var selected_jurisdictions  = _.filter( jurisdictions.features, function ( f ) {
        return f.properties.nom_ent == entity;
    });

    if ( geojson_jurisdictions ) {
        map.removeLayer( geojson_jurisdictions );
    }

    geojson_jurisdictions   = L.geoJson( selected_jurisdictions, {
        onEachFeature   : function ( feature, layer ) {
            var el  = _.findWhere( data, {
                id  : feature.properties.clave_juri
            });

            layer.setStyle({
                color       : '#ffffff',
                opacity     : 1,
                weight      : 1,
                fillColor   : ( el && el.color !== undefined ) ? color( el.color ) : color( -1 ),
                fillOpacity : 1
            });
        }
    });

    geojson_jurisdictions.addTo( map );
}

function _draw_dashboard () {
    function dashboard(id, fData){
        var barColor = 'steelblue';
        function segColor(c){ return {bajo_2500:"#807dba", normal_3500:"#e08214",alto_mas:"#41ab5d",alto_4000:"#42a1f4"}[c]; }

        // Calcula el total por estado.
        fData.forEach(function(d){d.total=d.freq.bajo_2500+d.freq.normal_3500+d.freq.alto_4000+d.freq.alto_mas;});

        // function to handle histogram.
        function histoGram(fD){
            var hG={},    hGDim = {t: 60, r: 0, b: 30, l: 0};
            hGDim.w = 500 - hGDim.l - hGDim.r,
                hGDim.h = 300 - hGDim.t - hGDim.b;

            //create svg for histogram.
            var hGsvg = d3.select(id).append("svg")
                .attr("width", hGDim.w + hGDim.l + hGDim.r)
                .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
                .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

            // create function for x-axis mapping.
            var x = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1)
                .domain(fD.map(function(d) { return d[0]; }));

            // Add x-axis to the histogram svg.
            hGsvg.append("g").attr("class", "x axis")
                .attr("transform", "translate(0," + hGDim.h + ")")
                .call(d3.svg.axis().scale(x).orient("bottom"));

            // Create function for y-axis map.
            var y = d3.scale.linear().range([hGDim.h, 0])
                .domain([0, d3.max(fD, function(d) { return d[1]; })]);

            // Create bars for histogram to contain rectangles and freq labels.
            var bars = hGsvg.selectAll(".bar").data(fD).enter()
                .append("g").attr("class", "bar");

            //create the rectangles.
            bars.append("rect")
                .attr("x", function(d) { return x(d[0]); })
                .attr("y", function(d) { return y(d[1]); })
                .attr("width", x.rangeBand())
                .attr("height", function(d) { return hGDim.h - y(d[1]); })
                .attr('fill',barColor)
                .on("mouseover",mouseover)// mouseover is defined below.
                .on("mouseout",mouseout);// mouseout is defined below.

            //Create the frequency labels above the rectangles.
            bars.append("text").text(function(d){ return d3.format(",")(d[1])})
                .attr("x", function(d) { return x(d[0])+x.rangeBand()/2; })
                .attr("y", function(d) { return y(d[1])-5; })
                .attr("text-anchor", "middle");

            function mouseover(d){  // utility function to be called on mouseover.
                // Fitro para escolaridad seleccionada.
                var st = fData.filter(function(s){ return s.escolaridad == d[0];})[0],
                    nD = d3.keys(st.freq).map(function(s){ return {type:s, freq:st.freq[s]};});

                // call update functions of pie-chart and legend.
                pC.update(nD);
                leg.update(nD);
            }

            function mouseout(d){    // utility function to be called on mouseout.
                // reset the pie-chart and legend.
                pC.update(tF);
                leg.update(tF);
            }

            // create function to update the bars. This will be used by pie-chart.
            hG.update = function(nD, color){
                // update the domain of the y-axis map to reflect change in frequencies.
                y.domain([0, d3.max(nD, function(d) { return d[1]; })]);

                // Attach the new data to the bars.
                var bars = hGsvg.selectAll(".bar").data(nD);

                // transition the height and color of rectangles.
                bars.select("rect").transition().duration(500)
                    .attr("y", function(d) {return y(d[1]); })
                    .attr("height", function(d) { return hGDim.h - y(d[1]); })
                    .attr("fill", color);

                // transition the frequency labels location and change value.
                bars.select("text").transition().duration(500)
                    .text(function(d){ return d3.format(",")(d[1])})
                    .attr("y", function(d) {return y(d[1])-5; });
            }
            return hG;
        }

        // function to handle pieChart.
        function pieChart(pD){
            var pC ={},    pieDim ={w:250, h: 250};
            pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;

            // create svg for pie chart.
            var piesvg = d3.select(id).append("svg")
                .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
                .attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");

            // create function to draw the arcs of the pie slices.
            var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);

            // create a function to compute the pie slice angles.
            var pie = d3.layout.pie().sort(null).value(function(d) { return d.freq; });

            // Draw the pie slices.
            piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
                .each(function(d) { this._current = d; })
                .style("fill", function(d) { return segColor(d.data.type); })
                .on("mouseover",mouseover).on("mouseout",mouseout);

            // create function to update pie-chart. This will be used by histogram.
            pC.update = function(nD){
                piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                    .attrTween("d", arcTween);
            }
            // Utility function to be called on mouseover a pie slice.
            function mouseover(d){
                // call the update function of histogram with new data.
                hG.update(fData.map(function(v){
                    return [v.escolaridad,v.freq[d.data.type]];}),segColor(d.data.type));
            }
            //Utility function to be called on mouseout a pie slice.
            function mouseout(d){
                // call the update function of histogram with all data.
                hG.update(fData.map(function(v){
                    return [v.escolaridad,v.total];}), barColor);
            }
            // Animating the pie-slice requiring a custom function which specifies
            // how the intermediate paths should be drawn.
            function arcTween(a) {
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function(t) { return arc(i(t));    };
            }
            return pC;
        }

        // function to handle legend.
        function legend(lD){
            var leg = {};

            // create table for legend.
            var legend = d3.select(id).append("table").attr('class','legend');

            // create one row per segment.
            var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");

            // create the first column for each segment.
            tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
                .attr("width", '16').attr("height", '16')
                .attr("fill",function(d){ return segColor(d.type); });

            // create the second column for each segment.
            tr.append("td").text(function(d){ return d.type;});

            // create the third column for each segment.
            tr.append("td").attr("class",'legendFreq')
                .text(function(d){ return d3.format(",")(d.freq);});

            // create the fourth column for each segment.
            tr.append("td").attr("class",'legendPerc')
                .text(function(d){ return getLegend(d,lD);});

            // Utility function to be used to update the legend.
            leg.update = function(nD){
                // update the data attached to the row elements.
                var l = legend.select("tbody").selectAll("tr").data(nD);

                // update the frequencies.
                l.select(".legendFreq").text(function(d){ return d3.format(",")(d.freq);});

                // update the percentage column.
                l.select(".legendPerc").text(function(d){ return getLegend(d,nD);});
            }

            function getLegend(d,aD){ // Utility function to compute percentage.
                return d3.format("%")(d.freq/d3.sum(aD.map(function(v){ return v.freq; })));
            }

            return leg;
        }

        // calculate total frequency by segment for all escolaridad.
        var tF = ['bajo_2500','normal_3500','alto_4000','alto_mas'].map(function(d){
            return {type:d, freq: d3.sum(fData.map(function(t){ return t.freq[d];}))};
        });

        // calculate total frequency by escolaridad for all segment.
        var sF = fData.map(function(d){return [d.escolaridad,d.total];});

        var hG = histoGram(sF), // create the histogram.
            pC = pieChart(tF), // create the pie-chart.
            leg= legend(tF);  // create the legend.

        dashboard_rendered  = true;
    }

    var freqData=[
        {escolaridad:'Ninguna',freq:{bajo_2500:2689, normal_3500:33520,alto_4000:8394, alto_mas:1495}}
        ,{escolaridad:'PI',freq:{bajo_2500:4621, normal_3500:54991,alto_4000:14403, alto_mas:2480}}
        ,{escolaridad:'Primaria',freq:{bajo_2500:12909, normal_3500:159101,alto_4000:42258, alto_mas:6979}}
        ,{escolaridad:'SI',freq:{bajo_2500:7093, normal_3500:83013,alto_4000:20448, alto_mas:3113}}
        ,{escolaridad:'Secundaria',freq:{bajo_2500:37573, normal_3500:452480,alto_4000:122742, alto_mas:19338}}
        ,{escolaridad:'BI',freq:{bajo_2500:25602, normal_3500:108763,alto_4000:27059, alto_mas:3954}}
        ,{escolaridad:'Bachillerato',freq:{bajo_2500:18337, normal_3500:306737,alto_4000:83949, alto_mas:12806}}
        ,{escolaridad:'GI',freq:{bajo_2500:43, normal_3500:18920,alto_4000:5249, alto_mas:787}}
        ,{escolaridad:'Grado',freq:{bajo_2500:1624, normal_3500:193216,alto_4000:52594, alto_mas:7714}}
        ,{escolaridad:'PosI',freq:{bajo_2500:128, normal_3500:426,alto_4000:83, alto_mas:16}}
        ,{escolaridad:'Posgrado',freq:{bajo_2500:1699, normal_3500:12899,alto_4000:2947, alto_mas:371}}
    ];

    dashboard('#dashboard',freqData);
}

function draw_states () {
    if ( geojson_states ) {
        map.removeLayer( geojson_states );
    }

    geojson_states  = L.geoJson( states, {
        onEachFeature   : function ( feature, layer ) {
            _onFeature( feature, layer );
        }
    });

    geojson_states.addTo( map );
}

function main() {
    $.get( '/data/states_topo.json', function ( data ) {
        states  = topojson.feature( data, data.objects.states );
    });

    $.get( '/data/jurisdictions.json', function ( data ) {
        jurisdictions   = data;
    });

    map   = L.map( 'map', {
        minZoom         : 5,
        maxZoom         : 7,
        scrollWheelZoom : false
    }).setView( [ 24.127, -102 ], 5 );
    L.tileLayer( 'http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
        attribution     : 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo( map );

    // Select the first item in the `Unidad Administrativa` dropdown
    $( 'option', select_unidad ).each( function () {
        if ( this.value ) {
            select_unidad.val( this.value );
            select_unidad_cb.apply( select_unidad[0] );
            return false;
        }
    });
}

$( '.btn-see-all' ).click( function ( e ) {
    e.preventDefault();

    $( '#indicators-table__container' ).slideDown();
    $( '.btn-see-all' ).fadeOut();
    $( '.btn-hide-all' ).fadeIn();

    return false;
});

$( '.btn-hide-all' ).click( function ( e ) {
    e.preventDefault();

    $( '#indicators-table__container' ).slideUp();
    $( '.btn-see-all' ).fadeIn();
    $( '.btn-hide-all' ).fadeOut();

    return false;
});

$( document ).ready( main );