var CourseView = function (store) {

    this.initialize = function () {
        this.el = $('<div/>');
    };

    this.render = function () {
        return this;
    };

    this.initialize();

};

Handlebars.registerHelper('fileList', function (items, options) {
    var div = $('<div/>');
    var ul = $('<ul class="list"></ul>');
    
    for (var i=0, l=items.length; i<l; i++) {
        
        var id = items[i].id,
            name = items[i].name,
            courseId = items[i].courseId,
            icon = '',
            type = (items[i].ext == undefined) ? 'folder' : 'file';
        
        if (items[i].sync) {
            if (items[i].downloaded)
                icon = '<div class="icon check big"></div>';
            else
                icon = '<div class="icon loading big"></div>';
        } else {
            icon = '<div type="'+type+'" code="'+id+'" class="icon download big"></div>';
        }
        
        if (items[i].ext == undefined) {
            var li = $('<li>'+ icon +'<a code="'+id+'" class="icon stack big">' +
                      options.fn(items[i]) +
                      '</a></li>');
            ul.append(li);
        } else
            ul.append('<li>'+ icon +'<div code="'+id+'" class="icon paper big">' + options.fn(items[i]) + '.' + items[i].ext + '</div></li>');
    }
    
    div.append(ul);
    return div.html();
});

CourseView.template = Handlebars.compile($("#course-tpl").html());
