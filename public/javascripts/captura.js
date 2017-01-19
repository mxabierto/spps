
var indicador = $("[name='id_ficha']");
var entidad = $("[name='entidad']");
var anio = $("[name='anio']");

obtenerDatos( indicador.val(), entidad.val(), anio.val());

indicador.change(function () {
    obtenerDatos( indicador.val(), entidad.val(), anio.val());
});

entidad.change(function () {
    obtenerDatos( indicador.val(), entidad.val(), anio.val());
});

anio.change(function () {
    obtenerDatos( indicador.val(), entidad.val(), anio.val());
});

anio.keyup(function () {
    obtenerDatos( indicador.val(), entidad.val(), anio.val());
});

function obtenerDatos( ind, ent, anio) {
    $.post('/indicador',{ id_ficha: ind, entidad: ent, anio: anio }, function (data) {
        $("[name='numerador']").val( data.numerador );
        $("[name='denominador']").val( data.denominador );
        $("[name='valor']").val( data.valor );
    });
}


$('#captura').submit(function (e) {

    $.post('/captura/guardar', $(this).serializeArray(), function (data) {
        alert(data.message);
    });

    location.reload();

    e.preventDefault();
});