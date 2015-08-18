var newButton, openButton, saveButton, runButton, exportButton;
var editor;
var menu;
var fileEntry;
var hasWriteAccess;
var pwd;

var gui = require("nw.gui");
var fs = require("fs");
var clipboard = gui.Clipboard.get();
var exec = require('child_process').exec;
var path = require('path');

function handleDocumentChange(title) {
  var mode = "javascript";
  var modeName = "JavaScript";
  if (title) {
    title = title.match(/[^/]+$/)[0];
    document.getElementById("title").innerHTML = title;
    document.title = title;
    if (title.match(/.json$/)) {
      mode = {name: "javascript", json: true};
      modeName = "JavaScript (JSON)";
    } else if (title.match(/.html$/)) {
      mode = "htmlmixed";
      modeName = "HTML";
    } else if (title.match(/.css$/)) {
      mode = "css";
      modeName = "CSS";
    }
  } else {
    document.getElementById("title").innerHTML = "[no document loaded]";
  }
  editor.setOption("mode", mode);
  document.getElementById("mode").innerHTML = modeName;
}

function newFile() {
  fileEntry = null;
  hasWriteAccess = false;
  handleDocumentChange(null);
}

function setFile(theFileEntry, isWritable) {
  fileEntry = theFileEntry;
  hasWriteAccess = isWritable;
}

function readFileIntoEditor(theFileEntry) {
  fs.readFile(theFileEntry, function (err, data) {
    if (err) {
      console.log("Read failed: " + err);
    }
	 pwd = path.dirname(theFileEntry);
    handleDocumentChange(theFileEntry);
    editor.setValue(String(data));
  });
}

function writeEditorToFile(theFileEntry) {
  var str = editor.getValue();
  fs.writeFile(theFileEntry, editor.getValue(), function (err) {
    if (err) {
      console.log("Write failed: " + err);
      return;
    }

    handleDocumentChange(theFileEntry);
    console.log("Write completed.");
  });
}

var onChosenFileToOpen = function(theFileEntry) {
  setFile(theFileEntry, false);
  readFileIntoEditor(theFileEntry);
};

var onChosenFileToSave = function(theFileEntry) {
  setFile(theFileEntry, true);
  writeEditorToFile(theFileEntry);
};

function handleNewButton() {
  if (false) {
    newFile();
    editor.setValue("");
  } else {
    var x = window.screenX + 10;
    var y = window.screenY + 10;
    window.open('main.html', '_blank', 'screenX=' + x + ',screenY=' + y);
  }
}

function handleOpenButton() {
  $("#openFile").trigger("click");
}

function handleSaveButton() {
  if (fileEntry && hasWriteAccess) {
    writeEditorToFile(fileEntry);
  } else {
    $("#saveFile").trigger("click");
  }
}

function handleRunButton() {

if (fs.existsSync( pwd+"/package.json")) {
    	exec( 'nw "'+ pwd +'"', function(error, stdout, stderr) {
		if (error !== null) {
			alert('exec error: ' + error);
		}

		});
	}
	else{
		alert("No package.json in the directory");
	}
	
}

function handleExportButton() {
	
		$("#export").attr("disabled", "disabled");

	
		var archiver = require('archiver');
		
		var nwPathFile = pwd +'.nw';
		
		var output = fs.createWriteStream( nwPathFile );
		var archive = archiver('zip');

		output.on('close', function () {
			console.log(archive.pointer() + ' total bytes');
			console.log('archiver has been finalized and the output file descriptor has closed.');
		});

		archive.on('error', function(err){
			throw err;
		});

		archive.pipe(output);
		archive.bulk([
			{ expand: true, cwd: pwd , src: ['**'], dest: ''}
		]);
		archive.finalize();
	
		alert("nw file export to " + nwPathFile );
	
		$("#export").removeAttr("disabled");
}


function initContextMenu() {
  menu = new gui.Menu();
  menu.append(new gui.MenuItem({
    label: 'Copy',
    click: function() {
      clipboard.set(editor.getSelection());
    }
  }));
  menu.append(new gui.MenuItem({
    label: 'Cut',
    click: function() {
      clipboard.set(editor.getSelection());
      editor.replaceSelection('');
    }
  }));
  menu.append(new gui.MenuItem({
    label: 'Paste',
    click: function() {
      editor.replaceSelection(clipboard.get());
    }
  }));

  document.getElementById("editor").addEventListener('contextmenu',
                                                     function(ev) { 
    ev.preventDefault();
    menu.popup(ev.x, ev.y);
    return false;
  });
}


onload = function() {
  initContextMenu();

  newButton = document.getElementById("new");
  openButton = document.getElementById("open");
  saveButton = document.getElementById("save");
	runButton = document.getElementById("run");
	exportButton = document.getElementById("export");

  newButton.addEventListener("click", handleNewButton);
  openButton.addEventListener("click", handleOpenButton);
  saveButton.addEventListener("click", handleSaveButton);
	runButton.addEventListener("click", handleRunButton);
	exportButton.addEventListener("click", handleExportButton);

  $("#saveFile").change(function(evt) {
    onChosenFileToSave($(this).val());
  });
  $("#openFile").change(function(evt) {
    onChosenFileToOpen($(this).val());
  });

  editor = CodeMirror(
    document.getElementById("editor"),
    {
      mode: {name: "javascript", json: true },
      lineNumbers: true,
      theme: "lesser-dark",
      extraKeys: {
        "Cmd-S": function(instance) { handleSaveButton() },
        "Ctrl-S": function(instance) { handleSaveButton() },
      }
    });


  newFile();
  onresize();

  gui.Window.get().show();

};

onresize = function() {
  var container = document.getElementById('editor');
  var containerWidth = container.offsetWidth;
  var containerHeight = container.offsetHeight;

  var scrollerElement = editor.getScrollerElement();
  scrollerElement.style.width = containerWidth + 'px';
  scrollerElement.style.height = containerHeight + 'px';

  editor.refresh();
}
