/*global module */
module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    vexflowrepo: 'git@github.com:0xfe/vexflow.git',
    vextabrepo: 'git@github.com:0xfe/vextab.git',
    vexdir: 'components',
    tabdir: '<%= vexdir %>/vextab',
    flowdir: '<%= vexdir %>/vexflow',
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

      vextabInstallNpm: {
        options: {
          stdout: true
        },
        command: 'npm install jison coffee-script; mkdir -p <%= tabdir %>/node_modules/.bin; <%= fixVexTabNpmCoffee %>; <%= fixVexTabNpmJison %>'
      },


      getVex: {
        options: {
          stdout: true
        },
        command: 'mkdir <%= vexdir %>; cd <%= vexdir %>; git clone <%= vexflowrepo %>; git clone <%= vextabrepo %>;'
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
  // grunt.loadNpmTasks('grunt-bower-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');


  grunt.registerTask('buildVextab', ['shell:vextabInstallNpm', 'shell:buildVextab']);
  grunt.registerTask('initcomponents', ['shell:bowerInstall', 'shell:getVex', 'shell:buildVexflow', 'buildVextab']);

  grunt.registerTask('updateVextab', ['shell:updateVextab', 'buildVextab']);
  grunt.registerTask('updateVexflow', ['shell:updateVexflow', 'shell:buildVexflow']);
  grunt.registerTask('updateVex', ['updatevextab', 'updatevexflow']);

  grunt.registerTask('test', ['jshint', 'qunit']);

  grunt.registerTask('default', ['shell:bowerGetComponents', 'concat', 'uglify', 'cssmin']);

};