var HomeView = function (store) {

    this.initialize = function () {
        this.el = $('#courses');
    };

    this.render = function () {
        return this;
    };

    this.initialize();

};

Handlebars.registerHelper('courseList', function (items, options) {
    var out = $('<div/>');
    
    for (var i=0, l=items.length; i<l; i++) {
        var id = items[i].id,
            name = items[i].name,
            li = $('<li/>');
        li.append('<a href="#'+id+'" >' +
                   options.fn(items[i]) +
                   '</a>');
    	out.append(li);
    }
    
    return out.html();
});

HomeView.template = Handlebars.compile($("#home-tpl").html());
