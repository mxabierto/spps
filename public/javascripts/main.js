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

select_indicador.change( _indicatorSelected );

function _indicatorSelected () {
    ficha.load( '/ficha', {
        id_ficha    : select_indicador.val()
    });
    tabla_ind.load( '/tabla-indicador', {
        id_ficha    : select_indicador.val()
    });

    _setPagination();
}

function _paeSelected () {
    select_indicador.load( '/select-ficha', {
        id_pae  : select_pae.val()
    }, _indicatorSelected );
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
        feature.properties.indicator    = el.color;
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
        maxZoom         : 6,
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