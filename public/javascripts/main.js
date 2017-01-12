//selects
var select_unidad = $('#select_unidad');
var select_pae = $('#select_pae');
var select_indicador = $('#select_indicador');

var ficha = $('#ficha');
var tabla_ind = $('#tabla_indicador');
var map_pagination = $('#anios');

select_unidad.change(function () {
    select_pae.load('/select-pae', { unidad : $(this).val() }, function () {
        select_indicador.load('/select-ficha', { id_pae : $(this).val() }, function () {
            //Intenta cargar la ficha de un indicador
            ficha.load('/ficha', {id_ficha: select_indicador.val()});
            tabla_ind.load('/tabla-indicador', {id_ficha: select_indicador.val()});
            map_pagination.html('');
            map_pagination.load('/anios', { id : select_indicador.val() });

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
        map_pagination.load('/anios', { id : select_indicador.val() });
    });
});

// Actualiza la ficha al cambiar la opción de indicador
select_indicador.change(function () {
    //Intenta cargar la ficha de un indicador
    ficha.load('/ficha',{ id_ficha: $(this).val()});
    tabla_ind.load('/tabla-indicador',{ id_ficha: $(this).val()});
    map_pagination.html('');
    map_pagination.load('/anios', { id : select_indicador.val() });

    function color( val ) {
        switch ( val ){
            case 0:
                return '#a65fc6';
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
                return '#18f7b0';
                break;
        }

        return 'grey';
    }

    $.post('/colores', { id : select_indicador.val() }, function(data){
        for (var i=0; i< data.length; i++){
            karen(data[i].id, color (data[i].color ));
        }
    });


});


function karen (i, color) {

    cartodb.createLayer(map, {
        user_name: 'karennz23',
        type: 'cartodb',
        sublayers: [
            {
                sql: "SELECT * FROM entidades where cov_id="+i,
                cartocss: '#entidades {polygon-fill: '+color+';}'
            }
        ]
    }).addTo(map)
}


