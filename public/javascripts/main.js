var map;
var states;
var selected_year;
var years_data;
var geojson_states;

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
            return '#565656';
            break;
        case 1:
            return '#ff0000';
            break;
        case 2:
            return '#faff00';
            break;
        case 3:
            return '#28b72d';
            break;
        case 4:
            return '#ffa323';
            break;
        case 5:
            return '#42a1f4';
            break;
    }

    return '#edeff2';
}

select_unidad.change( select_unidad_cb );

select_pae.change( _paeSelected );

select_indicador.change( _setPagination );

function _loadIndicatorData () {
    ficha.load( '/ficha', {
        id_ficha    : select_indicador.val()
    });
    tabla_ind.load( '/tabla-indicador', {
        id_ficha    : select_indicador.val(),
        year        : selected_year
    });

    _setBarChart( select_indicador.val() );
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

function _setPagination () {
    map_pagination.html( '' );
    map_pagination.load( '/anios', {
        id : select_indicador.val()
    }, function () {
        $( '.pagination' ).find( 'li' ).click( function () {
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
        color       : '#ffffff',
        opacity     : 1,
        weight      : 1,
        fillColor   : color( el && el.color || -1 ),
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
            $( '.data-indicator', popupEl ).html( feature.properties.indicator );
        });

        layer.on( 'mouseout', function () {
            popupEl.stop().fadeOut();
        });
    })( drawnLayer, feature );
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

    map   = L.map( 'map', {
        minZoom         : 5,
        maxZoom         : 7,
        scrollWheelZoom : false
    }).setView( [ 24.127, -102 ], 5 );
    L.tileLayer( 'http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution     : 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
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

$( document ).ready( main );