/*** Note! This is a client only collection! ***/

/**
 * @summary Represents a FileUpload
 * @class FileUpload
 * @param {Object} document An object representing an fileUpload
 */
FileUpload = {
    collection: new Mongo.Collection(null),
    uploads: {}
};

FileUpload.isImage = function(file) {
    var a = file.type.split("/");
    if( a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
        return false;
    } else {
        return a[0] === "image" && file.name.split('.').pop() !== 'svg';
    }
};

FileUpload.generateTempName = function(length) {
    var string = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for( var i=0; i < length; i++ )
        string += possible.charAt(Math.floor(Math.random() * possible.length));

    return string;
};

FileUpload.upload = function(linkedObject, files, directive, callbacks) {
    var self = this;

    _.each(files, function(file) {

        var upload = new Slingshot.Upload(directive, {foo: "foo"});

        if (file) {

            var isImage = FileUpload.isImage(file);

            if (isImage) {
                upload = new Slingshot.Upload("image", {foo: "foo"});
            }

            var _id = uuid.v1();

            upload.send(file, function (error, url) {
                if (error) {
                    file.url = url;
                    if (callbacks.onUploadError) {
                        callbacks.onUploadError(error, file);
                    }
                } else {
                    var key = _.findWhere(upload.instructions.postData, {name: "key"}).value;

                    var insertFile = {
                        filename: key,
                        isImage: isImage,
                        name: upload.file.name,
                        type: upload.file.type,
                        size: upload.file.size
                    };

                    FileUpload.collection.update({_id: _id}, {$set: {filename: key}});

                    linkedObject.addFile(insertFile).then((result) => {
                        insertFile._id = result;
                        insertFile.tempId = _id;
                        console.log(insertFile);
                        if (callbacks.onUploadSuccess) {
                            callbacks.onUploadSuccess(insertFile);
                        }
                    });
                }
            });

            FileUpload.uploads[_id] = upload;
            console.log(upload);

            var uploadDoc = {
                _id: _id,
                isImage: upload.isImage(),
                name: upload.file.name,
                type: upload.file.type,
                size: upload.file.size,
                linkedObjectId: linkedObject._id,
                objectType: linkedObject._objectType,
                url: upload.url(upload.isImage()),
                progress: 0,
                createdAt: new Date()
            };

            FileUpload.collection.insert(uploadDoc);

            if (callbacks.onUploadStart) {
                callbacks.onUploadStart(uploadDoc);
            }

            Tracker.autorun(function (c) {
                FileUpload.collection.update({_id: _id}, {$set: {progress: Math.floor(upload.progress() * 100)}});
                if (upload.progress() === 1) {
                    c.stop();
                }
            });

            // Generate temporary random filename
            file.filename = FileUpload.generateTempName(20);
        }
    });
};