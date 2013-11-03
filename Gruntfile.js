/*global module */
module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bower: {
      install: {
        options: {
          targetDir: './lib',
          layout: 'byType',
          install: true,
          verbose: false,
          cleanTargetDir: true,
          cleanBowerDir: true
        }
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'lib/jquery/*.js',
          'lib/underscore/*.js',
          'lib/bootstrap/*.js',
          'lib/vexflow/build/vexflow/*.js',
          'lib/vextab/build/tabdiv-min.js'

        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    shell: {
      getvex: {
        options: {                        // Options
            stdout: true
        },
        command: 'mkdir lib; cd lib; git clone git@github.com:0xfe/vexflow.git; git clone git@github.com:0xfe/vextab.git; cd ..'
      },
      updatevextab: {
        options: {                        // Options
            stdout: true
        },
        command: 'cd lib/vextab; git pull; cd ../..'
      },
      updatevexflow: {
        options: {                        // Options
            stdout: true
        },
        command: 'cd lib/vexflow; git pull; cd ../..'
      },
      buildvextab: {
        options: {                        // Options
            stdout: true
        },
        command: 'cd lib/vextab; bundle install; rake; cd ../..'
      },
      buildvexflow: {
        options: {                        // Options
            stdout: true
        },
        command: 'cd lib/vexflow; bundle install; rake; cd ../..'
      }
    }
    
  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('initcomponents', ['bower:install', 'shell:getvex', 'shell:buildvextab', 'shell:buildvexflow']);

  grunt.registerTask('updatevextab', ['shell:updatevextab', 'shell:buildvextab']);
  grunt.registerTask('updatevexflow', ['shell:updatevexflow', 'shell:buildvexflow']);
  grunt.registerTask('updatevex', ['updatevextab', 'updatevexflow']);

  grunt.registerTask('test', ['jshint', 'qunit']);

  grunt.registerTask('default', ['concat', 'uglify']);

};