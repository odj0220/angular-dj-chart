var obj = require('./angular.json');
var exec = require('child_process').execSync;

const projects = Object.keys(obj.projects).filter(p => p.indexOf('wise-web-framework') < 0);

projects.forEach(lib => {

  const version = require(`./projects/${lib}/package.json`).version;
  const uploadRepository = `https://github.com/odj0220/${lib}`;
  const runExec = `git subtree push --prefix dist/${lib} ${uploadRepository} master`;

  console.log(`upload ${lib}: ${version}`);
  exec(runExec);
});
