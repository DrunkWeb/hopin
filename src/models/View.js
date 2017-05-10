const fs = require('fs-promise');
const path = require('path');
const yamlFront = require('yaml-front-matter');

// const HopinError = require('../models/HopinError');

class View {
  constructor(input) {
    this._templatePath = input.templatePath;
    this._staticPath = input.staticPath;
    this._additionalStyles = input.styles;
    this._additionalScripts = input.scripts;
    this._data = input.data;
  }

  getViewDetails() {
    return this._readTemplate()
    .then((templateDetails) => {
      if (!templateDetails) {
        templateDetails = {};
      }

      const inlineStyles = [];
      const remoteStyles = [];

      if (templateDetails.styles) {
        templateDetails.styles.forEach((stylesheet) => {
          const stylesheetPath = path.parse(stylesheet);
          if (stylesheetPath.name.endsWith('-inline')) {
            inlineStyles.push(stylesheet);
          } else {
            remoteStyles.push(stylesheet);
          }
        });
      }

      if (this._additionalStyles) {
        this._additionalStyles.forEach((stylesheet) => {
          const stylesheetPath = path.parse(stylesheet);
          if (stylesheetPath.name.endsWith('-inline')) {
            inlineStyles.push(stylesheet);
          } else {
            remoteStyles.push(stylesheet);
          }
        });
      }

      const asyncScripts = [];
      const syncScripts = [];

      if (templateDetails.scripts) {
        templateDetails.scripts.forEach((script) => {
          const scriptPath = path.parse(script);
          if (scriptPath.name.endsWith('-sync')) {
            syncScripts.push(script);
          } else {
            asyncScripts.push(script);
          }
        });
      }

      if (this._additionalScripts) {
        this._additionalScripts.forEach((script) => {
          const scriptPath = path.parse(script);
          if (scriptPath.name.endsWith('-sync')) {
            syncScripts.push(script);
          } else {
            asyncScripts.push(script);
          }
        });
      }

      const cssFileReads = inlineStyles.map((inlineStyle) => {
        return fs.readFile(path.join(this._staticPath, inlineStyle))
        .then((fileBuffer) => {
          return fileBuffer.toString();
        });
      });

      const partialPaths = templateDetails.partials || [];
      const partialFileReads = partialPaths.map((partialPath) => {
        return fs.readFile(path.join(this._templatePath, partialPath))
        .then((fileBuffer) => {
          return {
            path: partialPath,
            content: fileBuffer.toString(),
          };
        });
      });

      const partialFilters = Promise.all(partialFileReads)
      .then((allPartials) => {
        const allPartialDetails = {};
        allPartials.forEach((partialDetail) => {
          allPartialDetails[partialDetail.path] = partialDetail.content;
        });
        return allPartialDetails;
      });

      return Promise.all([
        Promise.all(cssFileReads),
        partialFilters,
      ])
      .then((results) => {
        const inlineStyles = results[0];
        const partials = results[1];
        // This is the template with yaml front matter parsed out
        // Template content will be in '__content'
        return {
          template: templateDetails.__content || '{{{content}}}',
          partials,
          styles: {
            inline: inlineStyles,
            remote: remoteStyles,
          },
          scripts: {
            sync: syncScripts,
            async: asyncScripts,
          },
          data: this._data,
        };
      });
    });
  }

  _readTemplate() {
    if (!this._templatePath) {
      return Promise.resolve(null);
    }

    return fs.readFile(this._templatePath)
    .then((fileContentBuffer) => fileContentBuffer.toString())
    .then((fileContent) => {
      return yamlFront.loadFront(fileContent);
    });
  }
}

module.exports = View;
