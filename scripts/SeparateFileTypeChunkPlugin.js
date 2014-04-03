/*
 MIT License http://www.opensource.org/licenses/mit-license.php
 Author Vahe Hovhannisyan @vhpoet
 */
// TODO move this to separate repo
function SeparateFileTypeChunkPlugin(filenameTemplate, entryPoints, fileExtension) {
  if(typeof entryPoints === "number") {
    entryPoints = undefined;
  }
  this.filenameTemplate = filenameTemplate;
  this.entryPoints = entryPoints;
  this.fileExtension = fileExtension;
}
module.exports = SeparateFileTypeChunkPlugin;
SeparateFileTypeChunkPlugin.prototype.apply = function(compiler) {
  var filenameTemplate = this.filenameTemplate;
  var fileExtension = this.fileExtension;
  compiler.plugin("compilation", function(compilation) {
    compilation.plugin("optimize-chunks", function(chunks) {

      var templateChunk = this.addChunk(filenameTemplate);

      chunks.forEach(function(chunk){
        if (chunk === templateChunk) return;

        chunk.modules.slice().forEach(function(module){
          if (module.userRequest && module.userRequest.indexOf('.' + fileExtension) > 0) {
            chunk.removeModule(module);
            templateChunk.addModule(module);
            module.removeChunk(chunk);
            module.addChunk(templateChunk);
          }
        });

        chunk.parents = [templateChunk];
        templateChunk.chunks.push(chunk);
        chunk.entry = false;
      });

      templateChunk.initial = templateChunk.entry = true;
      templateChunk.filenameTemplate = filenameTemplate;
    });
  });
};