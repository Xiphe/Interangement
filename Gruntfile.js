/*global module */
module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    customcomponentsdir: 'components',
    bowerdir: 'bower_components',
    npmdir: 'node_modules',

    vexflowrepo: 'git@github.com:0xfe/vexflow.git',
    vextabrepo: 'git@github.com:0xfe/vextab.git',
    tabdir: '<%= customcomponentsdir %>/vextab',
    flowdir: '<%= customcomponentsdir %>/vexflow',
    minbanner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',

    fixVexTabNpmCoffee: 'ln -s ../../../../node_modules/coffee-script/bin/coffee <%= tabdir %>/node_modules/.bin/coffee',
    fixVexTabNpmJison: 'ln -s ../../../../node_modules/jison/lib/cli.js <%= tabdir %>/node_modules/.bin/jison',


    bower: {
      target: {
        rjsConfig: 'dist/config.js'
      }
    },

    concat: {
      js: {
        options: {
          separator: ';'
        },
        src: [
          '<%= bowerComponents.requirejs %>/require.js',
          '<%= bowerComponents.jquery %>',
          '<%= bowerComponents.underscore %>/underscore.js',
          '<%= bowerComponents.bootstrap[0] %>',
          '<%= bowerComponents.raphael %>/raphael.js',
          '<%= flowdir %>/build/vexflow/*.js',
          '<%= tabdir %>/build/tabdiv-min.js',
          'node_modules/markdown/lib/markdown.js',
          'js/jquery.bridge.js',
          'js/jquery.interangement.js',
          'js/init.js'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      },
      css: {
        src: [
          '<%= bowerComponents.bootstrap[1] %>',
          'css/style.css'
        ],
        dest: 'dist/<%= pkg.name %>.css'
      }
    },

    uglify: {
      options: {
        banner: '<%= minbanner %>'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.js.dest %>'],
        }
      }
    },

    cssmin: {
      options: {
        banner: '<%= minbanner %>'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.css': ['<%= concat.css.dest %>'],
        }
      }
    },

    watch: {
      scripts: {
        files: ['js/*.js', 'css/*.css'],
        tasks: ['shell:bowerGetComponents', 'concat'],
        options: {
          spawn: false,
        },
      },
    },

    shell: {
      removeComponents: {
        options: {
          stdout: true
        },
        command: 'rm -rf <%= customcomponentsdir %>; rm -rf <%= npmdir %>; rm -rf <%= bowerdir %>'
      },
      bowerGetComponents: {
        options: {
          callback: function log(err, stdout, stderr, cb) {
            grunt.config('bowerComponents', JSON.parse(stdout));
            cb();
          }
        },
        command: 'bower list -p'
      },
      bowerInstall: {
        options: {
          stdout: true
        },
        command: 'bower update'
      },
      npmInstall: {
        options: {
          stdout: true
        },
        command: 'npm install'
      },
      getVex: {
        options: {
          stdout: true
        },
        command: 'mkdir <%= customcomponentsdir %>; cd <%= customcomponentsdir %>; git clone <%= vexflowrepo %>; git clone <%= vextabrepo %>;'
      },
      vextabFakeNpm: {
        options: {
          stdout: true
        },
        command: 'npm install jison coffee-script; mkdir -p <%= tabdir %>/node_modules/.bin; <%= fixVexTabNpmCoffee %>; <%= fixVexTabNpmJison %>'
      },
      updateVextab: {
        options: {
          stdout: true
        },
        command: 'cd <%= tabdir %>; git pull;'
      },
      updateVexflow: {
        options: {
          stdout: true
        },
        command: 'cd <%= flowdir %>; git pull;'
      },
      buildVextab: {
        options: {
          stdout: true
        },
        command: 'cd <%= tabdir %>; bundle install; rake;'
      },
      buildVexflow: {
        options: {
          stdout: true
        },
        command: 'cd <%= flowdir %>; bundle install; rake;'
      }
    }
    
  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');


  grunt.registerTask('removeComponents', ['shell:removeComponents']);

  grunt.registerTask('buildVextab', ['shell:vextabFakeNpm', 'shell:buildVextab']);
  grunt.registerTask('updateVextab', ['shell:updateVextab', 'buildVextab']);
  grunt.registerTask('updateVexflow', ['shell:updateVexflow', 'shell:buildVexflow']);
  grunt.registerTask('updateVex', ['updatevextab', 'updatevexflow']);

  grunt.registerTask('bootstrap', ['shell:bowerInstall', 'shell:getVex', 'shell:buildVexflow', 'buildVextab', 'default']);
  grunt.registerTask('reset', ['removeComponents', 'shell:npmInstall', 'bootstrap']);

  grunt.registerTask('default', ['shell:bowerGetComponents', 'concat', 'uglify', 'cssmin']);

};