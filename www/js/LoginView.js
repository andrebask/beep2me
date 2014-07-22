var LoginView = function(store) {

    this.initialize = function() {
        this.el = $('<div/>');
    };

    this.render = function() {
        this.el.html(LoginView.template());
        return this;
    };

    this.initialize();

};

LoginView.template = Handlebars.compile($("#login-tpl").html());
