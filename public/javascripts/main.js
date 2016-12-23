var div_ficha=$('#ficha');

$('#unidad').change(function () {
    var unidad = $(this).val();

    $('#div_pae').load('/paes', { unidad : unidad }, function () {
        var id_pae = $('#pae').val();
        $('#div_indicador').load('/fichas', { id_pae : id_pae }, function () {
            //Intenta cargar la ficha de un indicador
            div_ficha.load('/ficha', {id_ficha: $('#indicador').val()});
            $('#tabla_indicador').load('/tabla-indicador', {id_ficha: $('#indicador').val()});


            // Actualiza la ficha al cambiar la opción de indicador
            $('#indicador').change(function () {
                div_ficha.load('/ficha',{ id_ficha: $(this).val()});
                $('#tabla_indicador').load('/tabla-indicador',{ id_ficha: $(this).val()});
            });
        });

        //Evento para cargar el listado de indicadores
        $('#pae').change(function () {
            var pae = $(this).val();

            //Carga el listado de indicadores en el el select
            $('#div_indicador').load('/fichas', {id_pae: pae}, function () {
                div_ficha.load('/ficha', {id_ficha: $('#indicador').val()});
                $('#tabla_indicador').load('/tabla-indicador', {id_ficha: $('#indicador').val()});

                // Actualiza la ficha al cambiar la opción de indicador
                $('#indicador').change(function () {
                    div_ficha.load('/ficha',{ id_ficha: $(this).val()});
                    $('#tabla_indicador').load('/tabla-indicador',{ id_ficha: $(this).val()});
                });
            });
        });
    });
});



