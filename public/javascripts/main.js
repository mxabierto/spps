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
});