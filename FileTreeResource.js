import {FileMatchResource} from "@token-ring/filesystem";

/**
 * Class representing a file tree context extending DirectoryService.
 */
export default class FileTreeResource extends FileMatchResource {
 name = "FileTreeService";
 description = "Provides FileTree functionality";
 /**
  * Properties for the constructor.
  * @type {Object}
  */
 static constructorProperties = {
  items: {
   type: "array",
   description: "Files to insert into the chat memory",
   items: {
    type: "object",
    properties: {
     path: {
      type: "string",
      required: true,
      description: "Path to directory or file to insert into the chat memory"
     },
     ignore: {
      type: "string",
      description: "A .gitignore/node-glob ignore style list of files to ignore"
     },
    }
   }
  },
 };

 /**
  * Create a FileTreeResource instance.
  * @param {Object} params
  * @param {Array} params.items - Files to insert into the chat memory.
  */
 constructor(params ) {
  super(params);
 }

};
