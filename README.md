Uploadable
==========

A package enabling the upload and linking of files to models. For example a post
in a feed could files attached to it. This package takes care of uploading
(using [edgee:slingshot](<https://atmospherejs.com/edgee/slingshot>)),
authorising (using [coniel:can](<https://atmospherejs.com/coniel/can>)) and
linking the file to a model simply by passing in an instance of the model.

UploadableModel
---------------

UploadableModel is used to add uploading capabilities to a model that is built
on the `coniel:base-model` class. To make a model uploadable just call
`UploadableModel.makeUploadable(Model, "typeAsString", options)` passing in a
model class, a string that will be used to tag the comment records for later
retrieval and optional options.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ javascript
var Post = BaseModel.extendAndSetupCollection("posts");

UploadableModel.makeUploadable(Post, "post");
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This will add the following methods to the prototype of the model.

**files(sortKey, sortOrder)** - returns an array of files that are linked to
this instance of a model.

**images(sortKey, sortOrder)** - returns an array of files which are images that
are linked to this instance of a model.

**fileUploads(sortKey, sortOrder)** - returns an array of edge:slingshot upload
objects that are linked with this instance of a model.

**fileCount()** - returns the number of files for this instance of a model.

FileUpload
----------

The FileUpload class handles the actual uploading. It uses [edgee:slingshot] to
perform the upload so you will need to configure it first (check out the
slingshot docs on how to do that).

To upload a file and attach it to a model instance, call `FileUpload(model,
files, slingshotDirectiveName, callbacks);`

**model** - the model to which you want to link the file(s).

**files** - an array of files (e.g. taken from a file input on change:
event.target.files).

**slingshotDirectiveName** - the slingshot directive used to enforce rules (such
as file type and max size) on the file upload. These are defined when
configuring slingshot (check the slingshot docs).

**callbacks** - an object containing callback methods to call at different
stages of the upload (see example below).

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ javascript
var post = Meteor.posts.findOne();

var callbacks = {
    onUploadSuccess: (file) => {
        console.log('upload succeeded');
    },
    onUploadStart: (file) => {
        console.log('upload started');
    },
    onUploadError: (error, file) => {
        console.log('upload failed');
    }
}; 

FileUpload.upload(post, files, "image", callbacks); 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

File - Extends [LinkableModel](<https://github.com/coniel/meteor-linkable-model>) - Implements UploadableModel
--------------------------------------------------------------------------------------------------------------

A file is a record of a an uploaded file containing meta data such as its size,
mime type, original name...

### Instance Methods

**user()** - Returns an instance of the user that uploaded the file.
