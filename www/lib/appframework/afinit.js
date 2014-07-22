var webRoot = "./";
$.ui.autoLaunch = false; //By default, it is set to true and you're app will run right away.  We set it to false to show a splashscreen
/* This function runs when the body is loaded.*/
var init = function () {
        $.ui.backButtonText = "Back";// We override the back button text to always say "Back"
        window.setTimeout(function () {
            $.ui.launch();
        }, 1500);//We wait 1.5 seconds to call $.ui.launch after DOMContentLoaded fires
    };
document.addEventListener("DOMContentLoaded", init, false);
$.ui.ready(function () {
    $.ui.removeFooterMenu();
    new FastClick(document.body);
});

String.prototype.format = function (args) {
    var str = this;
    return str.replace(String.prototype.format.regex, function(item) {
        var intVal = parseInt(item.substring(1, item.length - 1));
        var replace;
        if (intVal >= 0) {
            replace = args[intVal];
        } else if (intVal === -1) {
            replace = "{";
        } else if (intVal === -2) {
            replace = "}";
        } else {
            replace = "";
        }
        return replace;
    });
};
String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");