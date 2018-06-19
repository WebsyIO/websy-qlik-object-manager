module.exports = function(grunt) {
  grunt.initConfig({
    includes: {
      main: {
        src: ['websy-qlik-object-manager.js'],
        dest: 'temp/',
        cwd: 'src/js'
      }
    },
    watch: {
      styles: {
        files: ['src/**/*.js','src/less/**/*.less'], // which files to watch
        tasks: ['includes','babel','uglify','copy','less'],
        options: {
          nospawn: true,
          livereload: true
        }
      }
    },
    less:{
      main: {
        options: {
          compress: false,
          yuicompress: false,
          optimization: 2
        },
        files: [
          {"dist/websy-qlik-object-manager.min.css":"src/less/websy-qlik-object-manager.less"}
        ]
      }
    },
    babel: {
  		options: {
  			sourceMap: false,
  			presets: ['babel-preset-es2015']
  		},
  		dist: {
  			files: [
          {
    				'temp/websy-qlik-object-manager-pre.js': 'temp/websy-qlik-object-manager.js'
    			}
        ]
  		}
  	},
    uglify:{
      options : {
        beautify : false,
        mangle   : true,
        compress : true
      },
      build: {
        files: [
          {"dist/websy-qlik-object-manager.min.js":"temp/websy-qlik-object-manager-pre.js"}
        ]
      }
    },
    express: {
			prod: {
				options: {
          port: 4000,
					script: "index.js"
				}
			}
		},
    copy: {
      main: {
        files: [
          { src: ['dist/websy-qlik-object-manager.min.js'], dest: 'examples/resources/websy-qlik-object-manager.min.js'}
        ],
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-includes');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.registerTask('default', ['copy','includes','babel', 'uglify','less','copy','express','watch']);
};
