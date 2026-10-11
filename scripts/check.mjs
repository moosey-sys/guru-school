import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
for (const directory of ['api','lib','scripts']) {
 for(const file of readdirSync(directory).filter(name=>/\.(js|mjs)$/.test(name))) {
  const result=spawnSync(process.execPath,['--check',`${directory}/${file}`],{stdio:'inherit'});if(result.status)process.exit(result.status);
 }
}
