UploadableModel = {
    options: {}
};

UploadableModel.makeUploadable = function (model, type, options) {
    if (model.appendSchema && type) {
        UploadableModel.options[type] = options || {};
        model.appendSchema(uploadableSchema);
        LinkableModel.registerLinkableType(model, type);
        _.extend(model.prototype, uploadableMethods);
    } else {
        throw new Meteor.Error("makeUploadableFailed", "Could not make model uploadable. Please make sure you passed in a model and type");
    }
};


var uploadableMethods = {
    /**
     * Get the files for a model that is able to be uploaded on
     * @param   {Number}       limit     The maximum number of records to return
     * @param   {Number}       skip      The number of records to skip
     * @param   {String}       sortBy    The field on which to sort
     * @param   {Number}       sortOrder The order in which to sort. 1 for ascending and -1 for descending
     * @returns {Mongo.Cursor} A cursor that returns file instances
     */
    files: function (sortBy, sortOrder) {
        var options = {};

        if (sortBy && sortOrder) {
            options.sort = {};
            options.sort[sortBy] = sortOrder;
        }

        return File.collection.find({linkedObjectId: this._id}, options).fetch();
    },

    /**
     * Get the currently uploading files for a model that is able to be uploaded on
     * @param   {Number}       limit     The maximum number of records to return
     * @param   {Number}       skip      The number of records to skip
     * @param   {String}       sortBy    The field on which to sort
     * @param   {Number}       sortOrder The order in which to sort. 1 for ascending and -1 for descending
     * @returns {Mongo.Cursor} A cursor that returns file instances
     */
    fileUploads: function (sortBy, sortOrder) {
        var options = {};

        if (sortBy && sortOrder) {
            options.sort = {};
            options.sort[sortBy] = sortOrder;
        }

        return FileUpload.collection.find({linkedObjectId: this._id}, options).fetch();
    },

    /**
     * Get the images for a model that is able to be uploaded on
     * @param   {Number}       limit     The maximum number of records to return
     * @param   {Number}       skip      The number of records to skip
     * @param   {String}       sortBy    The field on which to sort
     * @param   {Number}       sortOrder The order in which to sort. 1 for ascending and -1 for descending
     * @returns {Mongo.Cursor} A cursor that returns file instances
     */
    images: function (sortBy, sortOrder) {
        var options = {};

        if (sortBy && sortOrder) {
            options.sort = {};
            options.sort[sortBy] = sortOrder;
        }

        return File.collection.find({linkedObjectId: this._id, isImage: true}, options).fetch();
    },

    /**
     * The number of files on the uploadable object
     * @returns {Number} The number of files
     */
    fileCount: function () {
        //Necessary  for backwards compatibility with old files
        return _.isArray(this._fileCount) ? this._fileCount.length : this._fileCount || 0;
    }
};

//create a schema which can be attached to other uploadable types
var uploadableSchema = new SimpleSchema({
    "_fileCount": {
        type: Number,
        defaultValue: 0,
        custom: SimpleSchema.denyUntrusted
    }
});