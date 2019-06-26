/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync, spawn } = require('child_process');
const { version } = require('./package.json');
const repoName = execSync('basename -s .git `git config --get remote.origin.url`')
  .toString()
  .trim();
const tag = `${process.env.DOCKER_ACC}/${repoName}:${version}`;
const command = 'docker';
const params = ['build', '-t', tag, '.'];

const Reset = '\x1b[0m';
const Bright = '\x1b[1m';
const FgGreen = '\x1b[32m';
const FgYellow = '\x1b[33m';
const FgCyan = '\x1b[36m';

console.log(`${Bright}${FgYellow}${command} ${params.join(' ')}${Reset}`);
const docker = spawn(command, params, { stdio: 'inherit' });
docker.on('exit', code => {
  console.info(`
${Bright}${FgCyan}${command} finished with code ${code}${Reset}`);
  if (code !== 0) {
    process.exit(code);
  }
  console.info(`
${Bright}${FgYellow}Push the created image to your docker hub:${Reset}
${Bright}>>>${Reset} ${Bright}${FgGreen}sudo ${command} ${Reset}push ${tag}

${Bright}${FgYellow}Save the created image to a tar archive:${Reset}
${Bright}>>>${Reset} ${Bright}${FgGreen}${command} ${Reset}save --output ${tag}.tar ${tag}`);
});
