import { scryptSync, randomBytes } from 'node:crypto';
import { stdin, stdout } from 'node:process';

function readHiddenPassword() {
if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
  throw new Error('Run this command in an interactive terminal so the password can be entered without echo.');
}
stdout.write('Admin password (12+ characters): ');
stdin.setRawMode(true);
stdin.setEncoding('utf8');
stdin.resume();
return new Promise((resolve, reject) => {
  let password = '';
  let finished = false;
  const finish = (error) => {
    if (finished) return;
    finished = true;
    stdin.off('data', onData);
    stdin.setRawMode(false);
    stdout.write('\n');
    if (error) reject(error);
    else resolve(password);
  };
  const onData = (input) => {
    for (const character of input) {
      if (character === '\u0003' || character === '\u0004') {
        finish(new Error('Password entry cancelled.'));
        break;
      } else if (character === '\r' || character === '\n') {
        finish();
        break;
      } else if (character === '\u007f' || character === '\b') {
        password = password.slice(0, -1);
      } else if (character >= ' ') {
        password += character;
      }
    }
  };
  stdin.on('data', onData);
});
}

try {
  const password = await readHiddenPassword();
  if (password.length < 12) throw new Error('The admin password must be at least 12 characters.');
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  console.log(`OCTO_ADMIN_PASSWORD_HASH=scrypt$${salt}$${hash}`);
} finally {
  if (stdin.isTTY && typeof stdin.setRawMode === 'function') stdin.setRawMode(false);
}
