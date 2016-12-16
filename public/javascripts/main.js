$('#unidad').change(function () {
   var value = $(this).val();
    $('#pae').html('');
    $('#div_pae').load('/paes', { unidad : value }, function () {
        var pae = $('#pae').val();
        $('#div_indicador').load('/fichas', { id_pae : pae });


        $('#ficha').load('/ficha', {id_ficha: $('#indicador').val()});

        $('#pae').change(function () {
            var pae = $(this).val();
            $('#div_indicador').load('/fichas', {id_pae: pae}, function () {
                $('#ficha').load('/ficha', {id_ficha: $('#indicador').val()});
            });
        });




    });
});

