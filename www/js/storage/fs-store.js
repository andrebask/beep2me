var FileSystemStore; 

document.addEventListener("deviceready", function () {
    var createError = function () { alert('Impossible to access Beep2Me directory'); };
    FileSystemStore = function () {
    
        this.createDir = function (dirname) {

            var createError = function (error) {
               alert(error.code);
            };

            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                function(fileSys) {
                    fileSys.root.getDirectory(dirname, {create: true,
                                                     exclusive: false},
                                                        function(directory) {
                                                            console.log("Directory has been created");
                                                        }, createError);
                }, createError);
        }

    };
    var fs = new FileSystemStore();
    fs.createDir('Beep2Me');   
    app.fs = fs;
}, false);