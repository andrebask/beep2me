var LocalStorageStore = function(successCallback, errorCallback) {
    
    window.localStorage.clear();
    
    var elementList = function (elementType) {
        var key;
        var elements = [];
        var ls = window.localStorage;
        for (key in ls) {
            if (key.indexOf(elementType) != -1) {
                //console.log(JSON.stringify(ls[key]));
                elements.push(JSON.parse(ls[key]));
            }
        }
        return elements;        
    };    
    
    this.courseList = function () {
        return elementList('course');        
    };
    
    this.fileList = function () {
        return elementList('file');       
    };
    
    this.folderList = function () {
        return elementList('folder');       
    };
    
    this.courseListByYear = function (year) {
        var courses= this.courseList();
        var result = courses.filter(function(e) {return (e.year == year)});
        return result;
    };
    
    this.fileListByCourse = function (courseId) {
        var files = this.fileList();
        var result = files.filter(function(e) {return (e.courseId == courseId)});
        return result;
    };
    
    this.folderListByCourse = function (courseId) {
        var folders = this.folderList();
        var result = folders.filter(function(e) {return (e.courseId == courseId)});
        return result;
    };
    
    this.fileListByFolder = function (folderId) {
        var files = this.fileList();
        var result = files.filter(function(e) {return (e.folderId == folderId)});
        return result;
    };
    
    this.folderListByFolder = function (folderId) {
        var folders = this.folderList();
        var result = folders.filter(function(e) {return (e.folderId == folderId)});
        return result;
    };  
    
    this.courseById = function (courseId) {
        try {
            var course = JSON.parse(window.localStorage.getItem("course." + folderId));
            return course;
        } catch (e) { return undefined}
    };    
    
    this.folderById = function (folderId) {
        try {        
            var folder = JSON.parse(window.localStorage.getItem("folder." + folderId));
            return folder;
        } catch (e) { return undefined}        
    };
    
    this.fileById = function (fileId) {
        try {        
            var file = JSON.parse(window.localStorage.getItem("file." + fileId));
            return file;
        } catch (e) { return undefined}        
    };

    this.chewCoursesRawData = function (rawData) {
        var chewed=[];
        for (i in rawData) {
            var c=rawData[i];
            if (c.classPK===c.creatorUserId) {continue;}
            var ch={};
            ch.id=c.groupId;
            ch.name=c.name;
            /* RegEx /(\[(.*)\])(-| - )([^\[\]]*)(.*)?/g :
            (\[(.*)\])  :la prima parentesi quadra
            (-| - )     :seguita da trattino
            ([^\[\]]*)  :il nome del corso (che non contiene parentesi quadre)
            (.*)?       :la terminazione (che invece puo contenere quadre)
            */
            ch.nick=c.name.replace(/(\[(.*)\])(-| - )([^\[\]]*)(.*)?/g,"$4");
            ch.year=c.name.replace(/(\[(20..)(-..)?\])(-| - )([^\[\]]*)(.*)?/g,"$2");
            //console.log(JSON.stringify(ch));
            chewed.push(ch);
            };
        return  chewed;
    };
    
    this.storeCourse = function (course) {
        window.localStorage.setItem("course." + course.id, JSON.stringify(course));
    };    
    
    this.storeCourses = function (courses) {
        for (i in courses) 
            this.storeCourse(courses[i]);
    };
    
    this.storeFolder = function (folder) {
        window.localStorage.setItem("folder." + folder.id, JSON.stringify(folder));
    };
    
    this.storeFolders = function (folders) {
        for (i in folders) 
            this.storeFolder(folders[i]);
    };
    
    this.storeFile = function (file) {
        console.log('storing file ' + file.name);
        window.localStorage.setItem("file." + file.id, JSON.stringify(file));
    };
    
    this.storeFiles = function (files) {
        for (i in files) 
            this.storeFile(files[i]);
    };   
    
    this.isFolderSynced = function (folderId) {
        f = this.folderById(folderId)
        if (f == undefined)
            return false;
        else if (f.sync != undefined)
            return f.sync;
        return false;
    };
    
    this.isFileSynced = function (fileId) {
        f = this.fileById(fileId)
        if (f == undefined)
            return false;
        else if (f.sync != undefined)
            return f.sync;
        return false;
    };
    
    this.isFolderDownloaded = function (folderId) {
        f = this.folderById(folderId)
        if (f == undefined)
            return false;
        else if (f.downloaded != undefined)
            return f.downloaded;
        return false;
    };
    
    this.isFileDownloaded = function (fileId) {
        f = this.fileById(fileId)
        if (f == undefined)
            return false;
        else if (f.downloaded != undefined)
            return f.downloaded;
        return false;
    };    
    
    this.isFileUpToDate = function (fileId) {
        return false;
        if(this.fileById(fileId))
           return this.fileById(fileId).upToDate;
        return false;
    };
    
    this.isFolderUpToDate = function (folderId) {
        return false;
        files = this.fileListByFolder(folderId);
        for (i in files) {
            if (!this.isFileUpToDate(files[i]))
                return false;
        }
        if (files.length == 0)
            return false   
        return true;
    };
    
    this.isCourseUpToDate = function (courseId) {
        return false;
        var files = this.fileListByCourse(courseId);
        for (i in files)
            if (!files[i].upToDate)
                return false;
        var folders = this.folderListByCourse(courseId);
        for (i in folders)
            if (!folders[i].upToDate)
                return false;      
        if (files.length == 0)
            return false
        return true;
    };   
    
    this.isAllUpToDate = function () {
        courses = this.courseList();
        for (i in courses) {
            if (!this.isCourseUpToDate(courses[i]))
                return false;
        }
        if (courses.length == 0)
            return false   
        return true;
    };    
    
    var callLater = function(callback, data) {
        if (callback) {
            setTimeout(function() {
                callback(data);
            });
        }
    };
    
    var refreshUpToDate = function () {
        var key;
        for (key in window.localStorage) {
            if (key.indexOf('file') != -1) {
                RESTclient.updateUpToDate(key.replace('file.',''), 'file');
            } else if (key.indexOf('folder') != -1) {
                RESTclient.updateUpToDate(key.replace('folder.',''), 'folder');
            }
        }
    };

    callLater(successCallback);
    
    setInterval(function () { 
        refreshUpToDate();    
    }, 300000);

}
