function sleep(milliseconds) {
    var start = new Date().getTime();
    while ((new Date().getTime() - start) < milliseconds) {
        // Do nothing
    }
}

var app = {

    showAlert: function (message, title) {
        if (navigator.notification) {
            navigator.notification.alert(message, null, title, 'OK');
        } else {
            alert(title ? (title + ": " + message) : message);
        }
    },

    registerEvents: function() {
        
    },

    route: function() {
        
        if (this.loggedIn) {
            //this.homePage = new HomeView(this.store).render();
            this.slidePage('#courses');
            setTimeout(function () {
                $.ui.clearHistory();
            }, 150);            
        } else if (!this.loginPage) {
            this.loginPage = new LoginView(this.store).render();
            $('#login').html(this.loginPage.el.html());
            this.slidePage('#login');
        } else {
            var cPersona = document.getElementsByName('user')[0].value;
            var password = document.getElementsByName('pwd')[0].value;            
            this.loadingPage = new LoadingView(this.store).render();
            $('#loading').html(this.loadingPage.el.html());
            this.slidePage('#loading');
            setTimeout(function () {
                if (RESTclient.auth(cPersona, password)){
                    app.loggedIn = true;
                    RESTclient.getCourses();
                }
            }, 150);
            //this.loggedIn = true; // only for testing, to be removed
        }
        return;
    },

    initialize: function() {
        var self = this;
        this.loggedIn = false;
        this.loginPage = false; //if true is only for testing
        this.registerEvents();
        this.store = new LocalStorageStore(function() {
            self.route();
        });
    },
    
    slidePage: function (pageHash) {
    	link = $('<a id="nextpage" href="'+ pageHash +'" style="display: hidden;">');
        $('#afui').append(link);
        $('#nextpage').click();
        $('#nextpage').remove();
        this.currentPage = pageHash;    		       
        return;
    },
    
    loadNextLevel: function (courseId, folderId, folderName) {
        var id = JSON.stringify(folderId);
        if ($('#'+id).length == 0) {
            console.log('call loadNextLevel');
            RESTclient.getFolderFiles(courseId, folderId, folderName);
        }
        $.ui.loadContent(id, null, null, 'slide');
    },
    
    openFile: function (fileId) {
        console.log('openFile');
        var file = this.store.fileById(fileId);
        console.log(JSON.stringify(file));
        if (file != undefined && file.downloaded)
            window.plugins.fileOpener.open('file:///sdcard/Beep2Me/'+ file.name + '_' + fileId +'.'+ file.ext);
    }

};

app.initialize();
