import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(path.join(__dirname, '..', rel), 'utf8');

describe('nginx site', () => {
  const conf = read('deploy/nginx/nestcalc.rokimania.com.conf');

  it('serves the right domain and proxies to the app', () => {
    expect(conf).toContain('server_name nestcalc.rokimania.com;');
    expect(conf).toContain('proxy_pass http://127.0.0.1:3001;');
  });

  it('protects the app with basic auth', () => {
    expect(conf).toContain('auth_basic_user_file /etc/nginx/.htpasswd-nestcalc;');
  });

  it('exempts only the installability files from auth', () => {
    const match = conf.match(/location ~ \^\/\(([^)]*)\)\$ \{([^}]*)\}/);
    expect(match, 'public-files location block').not.toBeNull();
    const [, paths, body] = match!;
    for (const p of ['manifest\\.webmanifest', 'sw\\.js', 'offline\\.html', 'icons/']) {
      expect(paths).toContain(p);
    }
    expect(body).toContain('auth_basic off;');
    // exactly one exemption in the whole file
    expect(conf.match(/auth_basic off;/g)).toHaveLength(1);
  });
});

describe('systemd unit', () => {
  const unit = read('deploy/nestcalc.service');

  it('keeps data outside the deployed app dir and binds to localhost', () => {
    expect(unit).toContain('Environment=NESTCALC_DATA_DIR=/var/www/nestcalc/prod/data');
    expect(unit).toContain('Environment=HOSTNAME=127.0.0.1');
    expect(unit).toContain('Environment=PORT=3001');
    expect(unit).toContain('WorkingDirectory=/var/www/nestcalc/prod/app');
  });
});
