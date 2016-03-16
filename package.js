Package.describe({
    name: "coniel:uploadable",
    summary: "A package for uploading files and linking them to other models",
    version: "0.0.2",
    git: "https://github.com/coniel/meteor-uploadable.git"
});

Package.onUse(function (api) {
    api.versionsFrom("1.2");

    api.use([
        "coniel:base-model@0.3.0",
        "coniel:can@0.1.0",
        "coniel:linkable-model@0.0.1",
        "mdg:validated-method@1.0.1",
        "didericis:callpromise-mixin@0.0.1",
        "tunifight:loggedin-mixin@0.1.0",
        "ecmascript",
        "es5-shim"
    ]);

    api.imply("coniel:can");

    api.addFiles("common/file-model.js");
    api.addFiles("common/file-upload.js");
    api.addFiles("common/uploadable-model.js");

    api.export(["File", "FileUpload", "UploadableModel"]);
});
