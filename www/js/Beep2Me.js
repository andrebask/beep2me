
var RESTclient = {

    SAMLdata: {},
    SAMLTarget: " ",
    client: new XMLHttpRequest(),
    
    escapeHtml: function (str) {
        return escape(str).replace(/%(..)/g, "&#x$1;");
    },
    
    unescapeHtml: function (value) {
        return $('<div/>').html(value).text();
    },
    
    parseSAMLForm: function (html) {
    
        relayState = html.split("<input type=\"hidden\" name=\"RelayState\" value=\"")[1].split("\"/>")[0];
        SAMLResponse = html.split("<input type=\"hidden\" name=\"SAMLResponse\" value=\"")[1].split("\"/>")[0];
        return {
            "RelayState": this.unescapeHtml(relayState),
            "SAMLResponse": SAMLResponse
        };
    },
    
    parseSAMLTarget: function (html) {
        return this.unescapeHtml(html.split("<form action=\"")[1].split("\" method=\"post\">")[0]);
    },
    
    auth: function (login, password) {

    	var data;
    	var cli = this.client;
        var passwordExpired  = false;
        var success = false;

        cli.withCredentialts = true;
        
        cli.open('GET', 'https://beep.metid.polimi.it', false);
        cli.send();
        
        cli.open('GET', 'https://beep.metid.polimi.it/polimi/login', false);
        cli.send();
        
        cli.onreadystatechange = function () {
            if (cli.readyState === 4) {
            if (cli.status === 200) {
                data = cli.status + " " + cli.statusText + "\n" + cli.responseText;
                try {
                    RESTclient.SAMLTarget = RESTclient.parseSAMLTarget(cli.responseText);
                    RESTclient.SAMLdata = RESTclient.parseSAMLForm(cli.responseText);
                    success = true;
                } catch (e) {
                    if (cli.responseText.indexOf('Per proseguire premere \'Continua\'') != -1) {
                        passwordExpired = true;
                    } else {
                    	//alert(e.message);
                    }
                }
            } else {
                data = cli.status + " " + cli.statusText + "\n" + cli.responseText;
            	success = false;
            }
            //alert(data);
            }
        };
        
        cli.open('POST', 'https://aunicalogin.polimi.it/aunicalogin/aunicalogin/controller/IdentificazioneUnica.do?&jaf_currentWFID=main', false);
        cli.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        cli.send('login=' + login + '&password=' + password + '&evn_conferma%3Devento=Conferma');
        
        if (passwordExpired) {
            cli.open('POST', 'https://aunicalogin.polimi.it/aunicalogin/aunicalogin/controller/PWDinScadenza.do?jaf_currentWFID=main', false);
            cli.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            cli.send('evn_continua%3Devento=Continua');            
        }
        
        cli.open('POST', this.SAMLTarget, false);
        var datastr = 'RelayState=' + escape(this.SAMLdata.RelayState) + '&SAMLResponse=' + encodeURIComponent(this.SAMLdata.SAMLResponse);
        cli.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        cli.send(datastr);
        
        console.log("authentication complete");
        return success;

    },

    query: function (queryUrl, handler, isAsyncronous) {
        
        if(typeof(isAsyncronous)==='undefined') isAsyncronous = true;

        var cli = this.client;
    
        cli.onreadystatechange = function () {
            if (cli.readyState === 4) {
            if (cli.status === 200) {
                data = $.parseJSON(cli.responseText);
                handler(data);
            } else {
                data = cli.status + " " + cli.statusText + "\n" + cli.responseText;
                alert(data);
            }
            }
        };
        cli.open('GET', queryUrl, isAsyncronous);
        cli.send();

    },

    getCourses: function () {
        var courseList = [];
        
        var renderCourses = function () {
            $('#courseList').html(HomeView.template({courses: courseList.reverse()}));
            $('#courseList').on('click', 'a', function () {
                var id = $(this).attr('href').replace('#', ''),  
                    name = $(this).text();
                console.log(id);
                console.log($(this));
                app.loadNextLevel(id, 0, name);                
            });            
            for (i in courseList) {
                RESTclient.getFolderFiles(courseList[i].id, 0, courseList[i].name)
            }     
        }
        
        var handler = function (data) {
            var data = app.store.chewCoursesRawData(data);
            for (i in data) {
                courseList.push({name: data[i].nick,
                                 professor: "",
                                 id: data[i].id,
                                 year: data[i].year,
                                 upToDate: true});
            }
            renderCourses();
            app.store.storeCourses(courseList);
        }
        
        if (app.store.isAllUpToDate()){
            courseList = app.store.courseList();
            renderCourses();
        } else {
            this.query('https://beep.metid.polimi.it/api/secure/jsonws/group/get-user-sites', handler, false);
        }
        app.route();
    },
    
    getFolderFiles: function (courseId, folderId, folderName) {
        var fileList = [];
        
        var renderFolderFiles = function () {
            var panel_html = CourseView.template({files: fileList});
            //console.log(JSON.stringify(panel_html));
            var panel_id = JSON.stringify((folderId == 0) ? courseId : folderId);
            $.ui.addContentDiv(panel_id, panel_html, folderName);             
            $('#' + panel_id).on('click', '.icon.download.big', function () {
                var id = $(this).attr('code');
                var type = $(this).attr('type');
                if(type == 'file') {
                    var self = $(this);
                    RESTclient.downloadFile(id, function (p) {
                        console.log('file download callback');
                        self.toggleClass('loading');
                        self.toggleClass('check');                        
                    }, null);
                    var f = app.store.fileById(id);
                    f.sync = true;
                    app.store.storeFile(f);
                    $(this).toggleClass('download');
                    $(this).toggleClass('loading');
                } else if (type == 'folder') {
                    var self = $(this);
                    RESTclient.downloadFolder(id, function () {
                        console.log('folder download callback');
                        self.toggleClass('loading');
                        self.toggleClass('check');
                    });
                    var f = app.store.folderById(id);
                    f.sync = true;
                    app.store.storeFolder(f);
                    var fls = app.store.fileListByFolder(id);
                    for (i in fls) {
                        f = fls[i];
                        f.sync = true;
                        app.store.storeFile(f);
                    }
                    $(this).toggleClass('download');
                    $(this).toggleClass('loading');              
                }
            });
            $('#' + panel_id).on('click', '.icon.stack.big', function () {
                var id = $(this).attr('code'),  
                    name = $(this).text();
                app.loadNextLevel(courseId, id, name);
            });
            $('#' + panel_id).on('click', '.icon.paper.big', function () {
                app.openFile($(this).attr('code'));                                          
            });           
        };
        
        var folderHandler = function (data) {
            for (i in data) {
                if (data[i] != 0 && i > 0) 
                    fileList.push({name: RESTclient.getFolderName(data[i]),
                                     id: data[i],
                               courseId: courseId,
                               folderId: folderId,
                               upToDate: true,
                           modifiedDate: RESTclient.getFolderModDate(data[i]),                                   
                                   sync: app.store.isFolderSynced(data[i]),
                             downloaded: app.store.isFolderDownloaded(data[i])});
            }
            app.store.storeFolders(fileList);
        };
    
        var upToDate;
        if (folderId == 0) {
            upToDate = app.store.isCourseUpToDate(courseId);
            console.log(upToDate);
            if (upToDate)
                fileList = app.store.folderListByCourse(courseId).concat(app.store.fileListByCourse(courseId));           
        } else {
            upToDate = app.store.isFolderUpToDate(folderId);
            if (upToDate)
                fileList = app.store.folderListByFolder(folderId).concat(app.store.fileListByFolder(folderId));     
        } 
        
        if (!upToDate)
            this.query('https://beep.metid.polimi.it/api/secure/jsonws/dlfolder/get-folder-ids?groupId='+ 
                       courseId +'&folderId=' + folderId, folderHandler, false);    
        
        var fileHandler = function (data) {
            var files = [];
            for (i in data) {
                files.push({name: data[i].title,
                                 id: data[i].fileEntryId,
                                ext: data[i].extension,
                           courseId: courseId,
                           folderId: folderId,
                           upToDate: true,
                       modifiedDate: data[i].modifiedDate,
                                url: 'https://beep.metid.polimi.it/documents/'
                                     .concat(courseId).concat('/')
                                     .concat(data[i].uuid),
                               sync: app.store.isFileSynced(data[i]),
                         downloaded: app.store.isFileDownloaded(data[i])});
                    
            }
            fileList = fileList.concat(files);
            renderFolderFiles();  
            app.store.storeFiles(files);
        };
        
        if (!upToDate)
            this.query('https://beep.metid.polimi.it/api/secure/jsonws/dlfolder/get-file-entries-and-file-shortcuts?groupId=' + 
                       courseId + '&folderId=' + folderId + '&status=0&start=0&end=1000', fileHandler, false);   
        else
            renderFolderFiles();
        
    },
    
    getFolderName: function (folderId) {
        var folderName = '';
        var handler = function (data) {
            folderName = data.name;
        }        
        this.query('https://beep.metid.polimi.it/api/secure/jsonws/dlfolder/get-folder?folderId=' + folderId, handler, false);
        return folderName;
    },
    
    getFolderModDate: function (folderId) {
        var date = '';
        var handler = function (data) {
            date = data.modifiedDate;
        }        
        this.query('https://beep.metid.polimi.it/api/secure/jsonws/dlfolder/get-folder?folderId=' + folderId, handler, false);
        return date;        
    },
    
    updateUpToDate: function (id, type) {
        var url;
        if (type == 'file')
            url = 'https://beep.metid.polimi.it/api/secure/jsonws/dlfileentry/get-file-entry?fileEntryId=' + id;
        else if (type == 'folder')
            url = 'https://beep.metid.polimi.it/api/secure/jsonws/dlfolder/get-folder?folderId=' + id;
        
        var handler = function (data) {
            var obj;
            obj = (type == 'file') ? app.store.fileById(id) : app.store.folderById(id); 
            obj.upToDate = (data.modifiedDate <= obj.modifiedDate);
            (type == 'file') ? app.store.storeFile(obj) : app.store.storeFolder(obj); 
        }        
        this.query(url, handler);
    },
    
    downloadFile: function (fileId, successCallback, param) {
        var file = app.store.fileById(fileId);
        var remoteFile = encodeURI(file.url);
        var localFileName = file.name + '_' + fileId +'.'+ file.ext;
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
            fileSystem.root.getDirectory(
                'Beep2Me', 
                {create: true, exclusive: false}, 
                function(dirEntry) {
                    dirEntry.getFile(localFileName, 
                                     { create: true, exclusive: false },
                                    function (fileEntry) {
                                        var localPath = fileEntry.toURL();
                                        console.log(localPath);
                                        var ft = new FileTransfer();
                                        ft.download(remoteFile,
                                            localPath, function(entry) {
                                                console.log("download complete: " + entry.toURI());
                                                file.downloaded = true;
                                                app.store.storeFile(file);
                                                if (successCallback != undefined)
                                                    successCallback(param);
                                        }, failFT);                                        
                                    }, failGF);
            }, failGF);
        }, failFS);

        function failFT(error) {
            console.log('File transfer error ' + error.code);
            switch (error.code) {
                case FileTransferError.FILE_NOT_FOUND_ERR:
                    console.log('FILE_NOT_FOUND_ERR');
                    break;
                case FileTransferError.INVALID_URL_ERR:
                    console.log('INVALID_URL_ERR');
                    break;
                case FileTransferError.CONNECTION_ERR:
                    console.log('CONNECTION_ERR');
                    break;
                case FileTransferError.ABORT_ERR:
                    console.log('ABORT_ERR');
                    break;
            }            
        }      
        function failGF(error) {
            console.log('Get file error ' + error.code);
            switch (error.code) {
                case FileError.NOT_FOUND_ERR:
                    console.log('NOT_FOUND_ERR');
                    break;
                case FileError.SECURITY_ERR:
                    console.log('SECURITY_ERR');
                    break;
                case FileError.ABORT_ERR:
                    console.log('ABORT_ERR');
                    break;
                case FileError.NOT_READABLE_ERR:
                    console.log('NOT_READABLE_ERR');
                    break;
                case FileError.ENCODING_ERR:
                    console.log('ENCODING_ERR');
                    break;
                case FileError.NO_MODIFICATION_ALLOWED_ERR:
                    console.log('NO_MODIFICATION_ALLOWED_ERR');
                    break;
                case FileError.INVALID_STATE_ERR:
                    console.log('INVALID_STATE_ERR');
                    break;
                case FileError.SYNTAX_ERR:
                    console.log('SYNTAX_ERR');
                    break;
                case FileError.INVALID_MODIFICATION_ERR:
                    console.log('INVALID_MODIFICATION_ERR');
                    break;
                case FileError.QUOTA_EXCEEDED_ERR:
                    console.log('QUOTA_EXCEEDED_ERR');
                    break;
                case FileError.TYPE_MISMATCH_ERR:
                    console.log('TYPE_MISMATCH_ERR');
                    break;
                case FileError.PATH_EXISTS_ERR:
                    console.log('PATH_EXISTS_ERR');
                    break;
            }
        }
        function failFS(error) {
            console.log('File system error ' + error.code);
        }
    },

    downloadFolder: function (folderId, callback) {
        var files = app.store.fileListByFolder(folderId);
        var f = files[files.length - 1];
        for (i in files) {
            if (f != undefined && lastid == undefined)
                var lastid = f.id;            
            console.log(i);
            this.downloadFile(files[i].id, function (file) {
                var f = app.store.fileById(file.id);
                f.downloaded = true;
                app.store.storeFile(f);
                console.log('id: ' + file.id + ', lastid: ' + lastid);
                if (file.id == lastid) {
                    var f = app.store.folderById(file.folderId);
                    f.downloaded = true;
                    app.store.storeFolder(f);
                    callback();
                }
            }, files[i]);
        }
    }    

};
