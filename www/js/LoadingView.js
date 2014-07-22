var LoadingView = function(store) {

    this.initialize = function() {
        this.el = $('<div/>');
    };

    this.render = function() {
        this.el.html(LoadingView.template());
        return this;
    };

    this.initialize();

};

LoadingView.template = Handlebars.compile($("#loading-tpl").html());
