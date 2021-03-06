//# sourceMappingURL=init.map
// Generated by CoffeeScript 1.6.3
/*
	Copyright (c) 2013 - 2014, RKE
*/


(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  codiad.LessCompiler = (function() {
    var ignoreSaveEvent, settings;

    LessCompiler.instance = null;

    settings = null;

    ignoreSaveEvent = false;

    /*
    		basic plugin environment initialization
    */


    function LessCompiler(global, jQuery) {
      this.showDialog = __bind(this.showDialog, this);
      this.getFileNameWithoutExtension = __bind(this.getFileNameWithoutExtension, this);
      this.getBaseDir = __bind(this.getBaseDir, this);
      this.saveFile = __bind(this.saveFile, this);
      this.compileLessAndSave = __bind(this.compileLessAndSave, this);
      this.addOpenHandler = __bind(this.addOpenHandler, this);
      this.addSaveHandler = __bind(this.addSaveHandler, this);
      this.preloadLibrariesAndSettings = __bind(this.preloadLibrariesAndSettings, this);
      this.init = __bind(this.init, this);
      var _this = this;
      this.codiad = global.codiad;
      this.amplify = global.amplify;
      this.jQuery = jQuery;
      this.scripts = document.getElementsByTagName('script');
      this.path = this.scripts[this.scripts.length - 1].src.split('?')[0];
      this.curpath = this.path.split('/').slice(0, -1).join('/') + '/';
      this.workspaceUrl = 'workspace/';
      LessCompiler.instance = this;
      this.jQuery(function() {
        return _this.init();
      });
    }

    /*
    		main plugin initialization
    */


    LessCompiler.prototype.init = function() {
      this.preloadLibrariesAndSettings();
      this.addSaveHandler();
      return this.addOpenHandler();
    };

    /*
    		load less compiler and settings
    */


    LessCompiler.prototype.preloadLibrariesAndSettings = function() {
      var _this = this;
      if (typeof window.Less === 'undefined') {
        this.jQuery.loadScript(this.curpath + "less-1.7.0.min.js");
      }
      if (typeof window.sourceMap === 'undefined') {
        this.jQuery.loadScript(this.curpath + "source-map-0.1.31.js");
      }
      this.jQuery.getJSON(this.curpath + "controller.php?action=load", function(json) {
        return _this.settings = json;
      });
      return this.jQuery.getJSON(this.curpath + "controller.php?action=getWorkspaceUrl", function(json) {
        return _this.workspaceUrl = json.workspaceUrl;
      });
    };

    /*
    		Add new compiler procedure to save handler
    */


    LessCompiler.prototype.addSaveHandler = function() {
      var _this = this;
      return this.amplify.subscribe('active.onSave', function() {
        if (!_this.ignoreSaveEvent) {
          return _this.compileLessAndSave();
        }
      });
    };

    /*
    		Add hotkey binding for manual compiling
    */


    LessCompiler.prototype.addOpenHandler = function() {
      var _this = this;
      return this.amplify.subscribe('active.onOpen', function() {
        var manager;
        manager = _this.codiad.editor.getActive().commands;
        return manager.addCommand({
          name: "Compile Less",
          bindKey: {
            win: "Ctrl-Alt-Y",
            mac: "Command-Alt-Y"
          },
          exec: function() {
            return _this.compileLessAndSave();
          }
        });
      });
    };

    /*
    		compiles Less and saves it to the same name
    		with a different file extension
    */


    LessCompiler.prototype.compileLessAndSave = function() {
      var content, currentFile, exception, ext, fileName, options, parser,
        _this = this;
      if (!this.settings.less.compile_less) {
        return;
      }
      currentFile = this.codiad.active.getPath();
      ext = this.codiad.filemanager.getExtension(currentFile);
      if (ext.toLowerCase() === 'less') {
        content = this.codiad.editor.getContent();
        fileName = this.getFileNameWithoutExtension(currentFile);
        options = this.settings.less;
        options.filename = this.workspaceUrl + currentFile;
        if (this.settings.less.sourceMap) {
          options.sourceMapOutputFilename = this.codiad.filemanager.getShortName(fileName) + "map";
          options.sourceMapURL = options.sourceMapOutputFilename;
          options.sourceMapGenerator = sourceMap.SourceMapGenerator;
          options.writeSourceMap = function(output) {
            return _this.saveFile(fileName + "map", output);
          };
        }
        try {
          parser = new less.Parser(options);
          window.lessoptions = options;
          return parser.parse(content, function(err, tree) {
            if (err) {
              throw err;
            }
            _this.saveFile(fileName + "css", tree.toCSS(options));
            return _this.codiad.message.success('Less compiled successfully.');
          });
        } catch (_error) {
          exception = _error;
          return this.codiad.message.error('Less compilation failed: ' + exception);
        }
      }
    };

    /*
    		saves a file, creates one if it does not exist
    */


    LessCompiler.prototype.saveFile = function(fileName, fileContent) {
      var baseDir, exception, instance,
        _this = this;
      try {
        if (instance = this.codiad.active.sessions[fileName]) {
          instance.setValue(fileContent);
          this.ignoreSaveEvent = true;
          this.codiad.active.save(fileName);
          this.ignoreSaveEvent = false;
          return;
        }
        baseDir = this.getBaseDir(fileName);
        if (!this.codiad.filemanager.getType(fileName)) {
          this.jQuery.ajax({
            url: this.codiad.filemanager.controller + '?action=create&path=' + fileName + '&type=file',
            success: function(data) {
              var createResponse, shortName;
              createResponse = _this.codiad.jsend.parse(data);
              if (createResponse !== 'error') {
                shortName = _this.codiad.filemanager.getShortName(fileName);
                _this.codiad.filemanager.createObject(baseDir, fileName, 'file');
                return _this.amplify.publish('filemanager.onCreate', {
                  createPath: fileName,
                  path: baseDir,
                  shortName: shortName,
                  type: 'file'
                });
              }
            },
            async: false
          });
        }
        return this.codiad.filemanager.saveFile(fileName, fileContent, {
          error: function() {
            return _this.codiad.message.error('Cannot save file.');
          }
        });
      } catch (_error) {
        exception = _error;
        return this.codiad.message.error('Cannot save file: ' + exception);
      }
    };

    /*
    		Get base dir of a path
    */


    LessCompiler.prototype.getBaseDir = function(filepath) {
      return filepath.substring(0, filepath.lastIndexOf("/"));
    };

    /*
    		Get filename without file extension of a file
    */


    LessCompiler.prototype.getFileNameWithoutExtension = function(filepath) {
      return filepath.substr(0, filepath.indexOf(".") + 1);
    };

    /*
           shows settings dialog
    */


    LessCompiler.prototype.showDialog = function() {
      var generateCheckbox, html, label, lessLabels, lessRules, name, value,
        _this = this;
      generateCheckbox = function(name, label, enabled, title) {
        if (enabled == null) {
          enabled = false;
        }
        if (title == null) {
          title = "";
        }
        return "			    <input type=\"checkbox\" id=\"" + name + "\" " + (enabled ? 'checked="checked"' : void 0) + " />\n<label for=\"" + name + "\"  title=\"" + title + "\">" + label + "</label><br />";
      };
      lessLabels = {
        'compile_less': 'Compile Less on save',
        'generate_sourcemap': 'Generate SourceMap on save',
        'enable_header': 'Enable Less header in compiled file',
        'enable_bare': 'Compile without a top-level function wrapper',
        'compress': 'Compress css',
        'ieCompat': 'enable Internet Explorer Compatibility Mode',
        'cleancss': 'Clean CSS',
        'sourceMap': 'generate SourceMap'
      };
      lessRules = (function() {
        var _ref, _results;
        _ref = this.settings.less;
        _results = [];
        for (name in _ref) {
          value = _ref[name];
          label = lessLabels[name];
          if (!label) {
            continue;
          }
          _results.push(generateCheckbox(name, label, value));
        }
        return _results;
      }).call(this);
      html = "<div id=\"less-settings\">\n	            <h2>Less Compiler Settings</h2>\n	            <div id=\"less-container\">\n	        		" + (lessRules.join('')) + "\n	        	</div>\n	        	<button id=\"modal_close\">Save Settings</button>\n        	</div>";
      this.jQuery('#modal-content').append(this.jQuery(html));
      this.jQuery('#modal').show().draggable({
        handle: '#drag-handle'
      });
      settings = this.settings;
      this.jQuery('#modal-content').on('click', 'input', function(target) {
        var isActive;
        name = $(target.currentTarget).attr('id');
        isActive = $(target.currentTarget).prop('checked');
        if (name in settings.less) {
          settings.less[name] = isActive;
        }
        return true;
      });
      return this.jQuery('#modal_close').on('click', function() {
        var json;
        _this.codiad.modal.unload();
        _this.jQuery('#modal-content').off();
        _this.settings = settings;
        json = JSON.stringify(settings);
        return _this.jQuery.post(_this.curpath + "controller.php?action=save", {
          settings: json
        }, function(data) {
          json = JSON.parse(data);
          if (json.status === "error") {
            return _this.codiad.message.error(json.message);
          } else {
            return _this.codiad.message.success(json.message);
          }
        });
      });
    };

    /*
           Static wrapper to call showDialog outside of the object
    */


    LessCompiler.showDialogWrapper = function() {
      return LessCompiler.instance.showDialog();
    };

    return LessCompiler;

  }).call(this);

  new codiad.LessCompiler(this, jQuery);

}).call(this);
