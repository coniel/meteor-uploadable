/**
 * A model for a file which can be linked to many other database objects
 * @class File
 */
File = BaseModel.extendAndSetupCollection("files", {userId: true, softRemovable: true});
LinkableModel.makeLinkable(File);

File.getExtension = function (fileName) {
    var a = fileName.split(".");
    if( a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
        return "";
    }
    return a.pop();
};

/**
 * The user that made the file
 * @returns {User} A User instance representing the uploader.
 */
File.prototype.user = function () {
    return Meteor.users.findOne(this.userId);
};

// Append linkable schema first because we want to modify it
File.appendSchema(LinkableModel.LinkableSchema);

//create the schema
File.appendSchema({
    name: {
        type: String,
        max: 300
    },
    filename: {
        type: String,
        max: 300
    },
    type: {
        type: String,
        max: 50
    },
    isImage: {
        type: Boolean
    },
    size: {
        type: Number
    },
    uploading: {
        type: Boolean,
        optional: true
    }
});

File.meteorMethods({
    insert: new ValidatedMethod({
        name: 'files.insert',
        mixins: [CallPromiseMixin, LoggedInMixin],
        validate: new SimpleSchema({
            doc: {
                type: Object
            },
            'doc.name': File.getSchemaKey('name'),
            'doc.filename': File.getSchemaKey('filename'),
            'doc.type': File.getSchemaKey('type'),
            'doc.linkedObjectId': File.getSchemaKey('linkedObjectId'),
            'doc.linkedObjectType': File.getSchemaKey('linkedObjectType'),
            'doc.isImage': File.getSchemaKey('isImage'),
            'doc.size': File.getSchemaKey('size'),
            'doc.uploading': File.getSchemaKey('uploading'),
            'doc._likeCount': {
                type: Number,
                optional: true
            },
            'doc._commentCount': {
                type: Number,
                optional: true
            }
        }).validator(),
        checkLoggedInError: {
            error: 'notLogged',
            message: 'You need to be logged in to call this method',//Optional
            reason: 'You need to login' //Optional
        },
        run({doc}) {
            console.log(doc);
            // Set userId of to current user
            doc.userId = this.userId;
            var file = new File(doc);
            // Get the parent object
            var parent = file.linkedObject();

            if (!parent) {
                throw new Meteor.Error("noLinkedObject");
            }

            // object type and id to validate against
            var checkOnType = file.linkedObjectType;
            var checkOnId = parent;
            var checkType = "file";

            if (parent.linkedObjectType && parent.linkedObjectId) {
                // If the linked object has a prent, validate against the parent
                checkOnType = parent.linkedObjectType;
                checkOnId = parent.linkedObjectId;

                // Add the linked objects parent as a grandparent
                doc.parentLinkedObjectType = checkOnType;
                doc.parentLinkedObjectId = checkOnId;
            }

            var authorizationLevel = UploadableModel.options[doc.linkedObjectType].authorizationLevel;
            if (authorizationLevel) {
                var checkValues = file.authorizationCheckValues(authorizationLevel);
                checkType = checkValues.checkType;
                checkOnType = checkValues.checkOnType;
                checkOnId = checkValues.checkOnId;
            }

            if (Can.createIn(checkType, doc, checkOnType, checkOnId)) {
                return File.collection.insert(doc, (error, result) => {
                    var collection = LinkableModel.getCollectionForRegisteredType(file.linkedObjectType);

                    if (collection) {
                        collection.update(file.linkedObjectId, {$inc:{_fileCount:1}});
                    }
                });
            }
        }
    }),
    update: new ValidatedMethod({
        name: 'files.update',
        mixins: [CallPromiseMixin, LoggedInMixin],
        validate: new SimpleSchema({
            _id: File.getSchemaKey("_id"),
            doc: {
                type: Object
            },
            'doc.name': File.getSchemaKeyAsOptional('name')
        }).validator(),
        checkLoggedInError: {
            error: 'notLogged',
            message: 'You need to be logged in to call this method',//Optional
            reason: 'You need to login' //Optional
        },
        run({_id, doc}) {
            var file = File.collection.findOne({_id: _id});
            // Get the parent object
            var parent = file.linkedObject();

            var checkOnType = file.parentLinkedObjectType || file.linkedObjectType;
            var checkOnId = file.parentLinkedObjectId || file.linkedObjectId;
            var checkType = "file";

            var authorizationLevel = UploadableModel.options[file.linkedObjectType].authorizationLevel;
            if (authorizationLevel) {
                var checkValues = file.authorizationCheckValues(authorizationLevel);
                checkType = checkValues.checkType;
                checkOnType = checkValues.checkOnType;
                checkOnId = checkValues.checkOnId;
            }

            if (Can.updateIn(checkType, file, checkOnType, checkOnId)) {
                console.log("can updayte");
                return File.collection.update({_id: _id}, {$set: doc});
            } else {
                console.log("cant update");
            }
        }
    }),
    remove: new ValidatedMethod({
        name: 'files.remove',
        mixins: [CallPromiseMixin, LoggedInMixin],
        validate: File.getSubSchema(["_id"], null, true),
        checkLoggedInError: {
            error: 'notLogged',
            message: 'You need to be logged in to call this method',//Optional
            reason: 'You need to login' //Optional
        },
        run({_id}) {
            var file = File.collection.findOne({_id: _id});

            var checkOnType = file.parentLinkedObjectType || file.linkedObjectType;
            var checkOnId = file.parentLinkedObjectId || file.linkedObjectId;
            var checkType = "file";

            var authorizationLevel = UploadableModel.options[file.linkedObjectType].authorizationLevel;
            if (authorizationLevel) {
                var checkValues = file.authorizationCheckValues(authorizationLevel);
                checkType = checkValues.checkType;
                checkOnType = checkValues.checkOnType;
                checkOnId = checkValues.checkOnId;
            }

            if (Can.removeIn(checkType, file, checkOnType, checkOnId)) {
                return File.collection.softRemove({_id: _id}, function (error, result) {
                    if (!error) {
                        //when a file is deleted, update the file count for the object being fileed on
                        var collection = LinkableModel.getCollectionForRegisteredType(file.linkedObjectType);
                        if (collection) {
                            collection.update(file.linkedObjectId, {$inc:{_fileCount:-1}});
                        }
                    }
                });
            }
        }
    })
});

Can.registerCollection("file", File.collection);