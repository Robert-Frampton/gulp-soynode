'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var soynode = require('../index');
var path = require('path');

module.exports = {
  testCompileTemplatesGlobpath: function(test) {
    gulp.src(['test/assets/**/*.soy', '!test/assets/foo/soyweb.soy', '!test/assets/partial/*.soy', '!test/assets/static/*.soy', '!test/assets/invalid.soy'])
      .pipe(soynode())
      .pipe(gutil.buffer(function(err, files) {
        test.equal(files.length, 4);
        assertFilepath(test, files[0], 'valid.soy');
        assertFilepath(test, files[1], 'valid.soy.js');
        assertFilepath(test, files[2], 'foo/valid.soy');
        assertFilepath(test, files[3], 'foo/valid.soy.js');
        assertFilesize(test, files[0], 96);
        assertFilesize(test, files[1], 597);
        assertFilesize(test, files[2], 95);
        assertFilesize(test, files[3], 591);
        test.done();
      }));
  },

  testCompileTemplatesFullpath: function(test) {
    gulp.src([__dirname + '/assets/valid.soy', __dirname + '/assets/foo/valid.soy'])
      .pipe(soynode())
      .pipe(gutil.buffer(function(err, files) {
        test.equal(files.length, 4);
        assertFilepath(test, files[0], 'valid.soy');
        assertFilepath(test, files[1], 'valid.soy.js');
        assertFilepath(test, files[2], 'valid.soy');
        assertFilepath(test, files[3], 'valid.soy.js');
        assertFilesize(test, files[0], 96);
        assertFilesize(test, files[1], 597);
        assertFilesize(test, files[2], 95);
        assertFilesize(test, files[3], 591);
        test.done();
      }));
  },

  testCompileTemplatesMixedpath: function(test) {
    gulp.src(['test/assets/valid.soy', '!test/assets/static/static.soy', __dirname + '/assets/foo/valid.soy'])
      .pipe(soynode())
      .pipe(gutil.buffer(function(err, files) {
        test.equal(files.length, 4);
        assertFilepath(test, files[0], 'valid.soy');
        assertFilepath(test, files[1], 'valid.soy.js');
        assertFilepath(test, files[2], 'valid.soy');
        assertFilepath(test, files[3], 'valid.soy.js');
        assertFilesize(test, files[0], 96);
        assertFilesize(test, files[1], 597);
        assertFilesize(test, files[2], 95);
        assertFilesize(test, files[3], 591);
        test.done();
      }));
  },

  testCompileTemplatesSoyWeb: function(test) {
    gulp.src(['test/assets/static/soyweb.soy', 'test/assets/foo/soyweb.soy'])
      .pipe(soynode({
        renderSoyWeb: true
      }))
      .pipe(gutil.buffer(function(err, files) {
        test.equal(files.length, 2);
        assertFilepath(test, files[0], 'soyweb.html');
        assertFilepath(test, files[1], 'soyweb.html');
        assertFilesize(test, files[0], 520);
        assertFilesize(test, files[1], 520);
        test.done();
      }));
  },

  testCompileInvalidTemplatesSoyWeb: function(test) {
    gulp.src(['test/assets/partial/invalid.soy'])
      .pipe(soynode({
        renderSoyWeb: true
      }))
      .on('error', function(err) {
        test.notEqual(-1, err.message.indexOf('invalid is not defined'));
        test.done();
      });
  },

  testCompileTemplatesSoyWebWithData: function(test) {
    gulp.src(['test/assets/static/soyweb.soy', 'test/assets/foo/soyweb.soy'])
      .pipe(soynode({
        renderSoyWeb: true,
        renderSoyWebContext: {
          title: 'Test Title'
        }
      }))
      .pipe(gutil.buffer(function(err, files) {
        test.equal(files.length, 2);

        assertFilepath(test, files[0], 'soyweb.html');
        var content = files[0].contents.toString();
        test.notEqual(-1, content.indexOf('<h1>Test Title</h1>'));

        assertFilepath(test, files[1], 'soyweb.html');
        content = files[1].contents.toString();
        test.notEqual(-1, content.indexOf('<h1>Test Title</h1>'));
        test.done();
      }));
  },

  testCompileTemplatesSoyWebWithDataFromFunction: function(test) {
    gulp.src(['test/assets/static/soyweb.soy', 'test/assets/foo/soyweb.soy'])
      .pipe(soynode({
        renderSoyWeb: true,
        renderSoyWebContext: function(file) {
          var title = 'Test Title 1';
          if (file.path === path.resolve('test/assets/foo/soyweb.soy')) {
            title = 'Test Title 2';
          }
          return {
            title: title
          };
        }
      }))
      .pipe(gutil.buffer(function(err, files) {
        test.equal(files.length, 2);

        assertFilepath(test, files[0], 'soyweb.html');
        var content = files[0].contents.toString();
        test.notEqual(-1, content.indexOf('<h1>Test Title 1</h1>'));

        assertFilepath(test, files[1], 'soyweb.html');
        content = files[1].contents.toString();
        test.notEqual(-1, content.indexOf('<h1>Test Title 2</h1>'));
        test.done();
      }));
  },

  testNonSoyExtension: function(test) {
    gulp.src(['test/assets/foo/valid.html'])
      .pipe(soynode())
      .pipe(gutil.buffer(function(err, files) {
        test.equal(files.length, 2);
        assertFilepath(test, files[0], 'valid.html');
        assertFilepath(test, files[1], 'valid.html.js');
        assertFilesize(test, files[0], 99);
        assertFilesize(test, files[1], 616);
        test.done();
      }));
  },

  testCompileTranslatedTemplatesSoyWeb: function(test) {
    gulp.src(['test/assets/static/soyweb.soy', 'test/assets/foo/soyweb.soy'])
      .pipe(soynode({
        locales: ['pt-BR'],
        messageFilePathFormat: 'test/assets/translations/translations_pt-BR.xlf',
        renderSoyWeb: true
      }))
      .pipe(gutil.buffer(function(err, files) {
        test.equal(files.length, 2);
        assertFilepath(test, files[0], 'soyweb.html');
        assertFilepath(test, files[1], 'soyweb.html');
        assertFilesize(test, files[0], 531);
        assertFilesize(test, files[1], 520);
        test.done();
      }));
  },

  testMessageExtraction: function(test) {
    gulp.src(['test/assets/valid.soy'])
      .pipe(soynode.lang())
      .pipe(gutil.buffer(function(err, files) {
        test.equal(files.length, 1);
        test.equal(path.extname(files[0].path), '.xlf');
        test.done();
      }));
  },

  testPartialSoyTemplate: function(test) {
    gulp.src(['test/assets/partial/soyweb.soy', 'test/assets/partial/partial.soy'])
      .pipe(soynode({
        renderSoyWeb: true
      }))
      .pipe(gutil.buffer(function(err, files) {
        assertFilepath(test, files[0], 'soyweb.html');
        assertFilepath(test, files[1], 'partial.soy');
        assertFilepath(test, files[2], 'partial.soy.js');
        assertFilesize(test, files[0], 520);
        test.done();
      }));
  }
};

function assertFilepath(test, file, expected) {
  test.equal(path.relative(file.base, file.path), expected);
}

function assertFilesize(test, file, expected) {
  test.equal(file.contents.length, expected);
}
