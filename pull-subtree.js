var obj = require('./angular.json');
var exec = require('child_process').execSync;

const projects = Object.keys(obj.projects).filter(p => p.indexOf('dj-angular-libraries') < 0);

projects.forEach(lib => {

  const version = require(`./projects/${lib}/package.json`).version;
  const uploadRepository = `https://github.com/odj0220/${lib}`;
  const runExec = `git subtree pull --prefix dist/${lib} ${uploadRepository} master`;

  console.log(`pull ${lib}: ${version}`);
  exec(runExec);
});
