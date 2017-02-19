var map ;
function main() {
    cartodb.createVis('map', 'https://karennz23.carto.com/api/v2/viz/2101ccca-eca3-11e6-977d-0e3ff518bd15/viz.json', {
        shareable: true,
        title: false,
        description: true,
        search: true,
        tiles_loader: true,
        center_lat: 24,
        center_lon: -99,
        zoom: 5,
        position: 'center'

    }).done(function (vis, layers) {
        map = vis.getNativeMap();
    }).error(function (error) {
        console.log(err);
    });
      /*  .done(function(vis, layers) {        https://karennz23.carto.com/builder/731e06d0-d629-11e6-902c-0ecd1babdde5/embed<--Mapa de estados
            // layer 0 is the base layer, layer 1 is cartodb layer
            // setInteraction is disabled by default
            layers[1].setInteraction(true);
            layers[1].on('featureOver', function(e, latlng, pos, data) {
                cartodb.log.log(e, latlng, pos, data);
            })

            // getting the native map to work with it
            var map = vis.getNativeMap();

            //creating sublayers
            cartodb.createLayer(map, {
                user_name: 'karennz23',
                type: 'cartodb',
                sublayers: [
                    {
                        sql: "SELECT * FROM entidades where cov_id=2",
                        cartocss: '#entidades {polygon-fill: #ff2200;}'
                    },
                    {
                        sql: "SELECT * FROM entidades where cov_id=3",
                        cartocss: '#entidades {polygon-fill: #00d667;}'
                    }
                ]
            }).addTo(map)


        })
        .error(function(err) {
            console.log(err);
        });*/

}
window.onload = main;


//selects
var select_unidad = $('#select_unidad');
var select_pae = $('#select_pae');
var select_indicador = $('#select_indicador');

var ficha = $('#ficha');
var tabla_ind = $('#tabla_indicador');
var map_pagination = $('#anios');

function color( val ) {
    switch ( val ){
        case 0:
            return '#343538';//'#a65fc6';
            break;
        case 1:
            return '#ff6363 ';
            break;
        case 2:
            return '#fff547';
            break;
        case 3:
            return '#00d667';
            break;
        case 4:
            return '#ffb351';
            break;
        case 5:
            return '#42a1f4';
            break;
    }

    return '#edeff2';//'grey';
}

select_unidad.change(function () {
    select_pae.load('/select-pae', { unidad : $(this).val() }, function () {
        select_indicador.load('/select-ficha', { id_pae : $(this).val() }, function () {
            //Intenta cargar la ficha de un indicador
            ficha.load('/ficha', {id_ficha: select_indicador.val()});
            tabla_ind.load('/tabla-indicador', {id_ficha: select_indicador.val()});
            map_pagination.html('');
            map_pagination.load('/anios', { id : select_indicador.val() },function () {
                //eventos
                $('.pagination').find('li').click(function () {
                    //alert( $(this).data('id_ficha'));
                    $.post('/colores', { id : $(this).data('id_ficha'), anio: $(this).data('anio') }, function(data){
                        for (var i=0; i< data.length; i++){
                            pintar(data[i].id, color (data[i].color ));
                        }
                    });
                });
            });

        });
    });
});

//Evento para cargar el listado de indicadores
select_pae.change(function () {
    //Carga el listado de indicadores en el el select
    select_indicador.load('/select-ficha', { id_pae: $(this).val() }, function () {
        //Intenta cargar la ficha de un indicador
        ficha.load('/ficha', {id_ficha: select_indicador.val()});
        tabla_ind.load('/tabla-indicador', {id_ficha: select_indicador.val()});
        map_pagination.html('');
        map_pagination.load('/anios', { id : select_indicador.val() },function () {
            //eventos
            $('.pagination').find('li').click(function () {
                //alert( $(this).data('id_ficha'));
                $.post('/colores', { id : $(this).data('id_ficha'), anio: $(this).data('anio') }, function(data){
                    for (var i=0; i< data.length; i++){
                        pintar(data[i].id, color (data[i].color ));
                    }
                });
            });
        });

    });
});

// Actualiza la ficha al cambiar la opción de indicador
select_indicador.change(function () {
    //Intenta cargar la ficha de un indicador
    ficha.load('/ficha',{ id_ficha: $(this).val()});
    tabla_ind.load('/tabla-indicador',{ id_ficha: $(this).val()});
    map_pagination.html('');
    map_pagination.load('/anios', { id : select_indicador.val() },function () {
        //eventos
        $('.pagination').find('li').click(function () {
            //alert( $(this).data('id_ficha'));
            $.post('/colores', { id : $(this).data('id_ficha'), anio: $(this).data('anio') }, function(data){
                for (var i=0; i< data.length; i++){
                    pintar(data[i].id, color (data[i].color ));
                }
            });
        });
    });

});

/*Pintar estados*/

function pintar (i, color) {
//clear map

    cartodb.createLayer(map, {
        user_name: 'karennz23',
        type: 'cartodb',
        sublayers: [
            {
                sql: "SELECT cartodb_id,the_geom_webmercator FROM entidades where cov_id="+i,
                cartocss: '#entidades {polygon-fill: '+color+'; ::outline {line-width: 2;line-opacity: 0.5;}}'
            }
        ]
    }).addTo(map)
}
/*Pintar jurisdicciones*/
/*
 function  pintar(i, color) {
 //clear map

 cartodb.createLayer(map, {
 user_name: 'karennz23',
 type: 'cartodb',
 sublayers: [
 {
 sql: "SELECT cartodb_id,the_geom_webmercator FROM js_prueba where clave_juri="+i,
 cartocss: '#js_prueba {polygon-fill: '+color+';::outline {line-width: 1;line-opacity: 0.5;}}'
 }
 ]
 }).addTo(map)
 }*/
/*Pintar municipios*//*
function pintar (i, color) {
//clear map

    cartodb.createLayer(map, {
        user_name: 'karennz23',
        type: 'cartodb',
        sublayers: [
            {
                sql: "SELECT * FROM municipal_juris where cvegeo="+i,
                cartocss: '#municipal_juris {polygon-fill: '+color+';line-width: 2;line-opacity: 0.5;}'
            }
        ]
    }).addTo(map)
}*/