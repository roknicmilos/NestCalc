# Deploying NestCalc

NestCalc is a Next.js app with a server: `app/api/calculator` reads and writes `calculator.json` on disk, so
unlike a static site it needs **Node on the droplet** and a process manager. The build happens on your machine and
only the output is copied to the server.

The build is a Next `standalone` bundle (`.next/standalone`), so the server needs Node itself but no `node_modules`
install and no build step.

## The target

A DigitalOcean droplet (Ubuntu 24.04, hostname `ubuntu-vps-1`) that already serves other sites through nginx with
Certbot-managed TLS:

```bash
ssh digital-ocean
```

`digital-ocean` is an ssh-config alias; the actual host and user live in `~/.ssh/config` so they stay out of this repo:

```
Host digital-ocean
    HostName <droplet-ip>
    User <user>
```

## Server layout

|                      |                                                         |
|----------------------|---------------------------------------------------------|
| App (rsync target)   | `/var/www/nestcalc/prod/app`                            |
| Data (never rsynced) | `/var/www/nestcalc/prod/data` (holds `calculator.json`) |
| Listens on           | `127.0.0.1:3001` (nginx proxies to it)                  |
| systemd unit         | `/etc/systemd/system/nestcalc.service`                  |
| nginx site           | `/etc/nginx/sites-available/nestcalc.rokimania.com`     |
| Basic-auth users     | `/etc/nginx/.htpasswd-nestcalc`                         |
| Subdomain            | `nestcalc.rokimania.com`                                |

The data directory sits **outside** the rsync target on purpose: `rsync --delete` on every deploy would otherwise wipe
it. The app finds it through the `NESTCALC_DATA_DIR` environment variable set in the systemd unit.

## Access control

The API has no authentication of its own, so the whole site is behind nginx HTTP basic auth. The only exemptions are
`/manifest.webmanifest`, `/sw.js`, `/offline.html` and `/icons/*`: Chrome fetches the manifest without credentials, so
protecting it would make the app non-installable. None of those files contains user data.

## First-time setup

1. Point a DNS `A` record for `nestcalc.rokimania.com` at the droplet.

2. Check the prerequisites. Node must be installed (an LTS release, matching the major version you build with), and
   port 3001 must be free:

   ```bash
   ssh digital-ocean 'node -v; which node; ss -ltn | grep 3001 || echo "3001 free"'
   ```

   If Node is missing, install it (for example via NodeSource or `apt`). If `which node` is not `/usr/bin/node`, edit
   `ExecStart` in `deploy/nestcalc.service` before step 5.

3. Create the directories and seed the data **only if it does not exist yet**:

   ```bash
   ssh digital-ocean 'sudo mkdir -p /var/www/nestcalc/prod/app /var/www/nestcalc/prod/data &&
     sudo chown -R $USER:www-data /var/www/nestcalc &&
     sudo chmod -R g+rwX /var/www/nestcalc/prod/data'
   scp data/seeds/calculator.json digital-ocean:/tmp/nestcalc-seed.json
   ssh digital-ocean '[ -e /var/www/nestcalc/prod/data/calculator.json ] ||
     cp /tmp/nestcalc-seed.json /var/www/nestcalc/prod/data/calculator.json;
     rm /tmp/nestcalc-seed.json; sudo chgrp www-data /var/www/nestcalc/prod/data/calculator.json;
     chmod g+rw /var/www/nestcalc/prod/data/calculator.json'
   ```

   The service runs as `www-data` and writes `calculator.json` (plus a temporary file next to it), so `www-data` needs
   write access to the directory.

4. Create the basic-auth password file (install `apache2-utils` first if `htpasswd` is missing):

   ```bash
   ssh -t digital-ocean 'sudo htpasswd -c /etc/nginx/.htpasswd-nestcalc <your-username>'
   ```

5. Install the systemd unit and allow the deploy user to restart it without a password:

   ```bash
   scp deploy/nestcalc.service digital-ocean:/tmp/nestcalc.service
   ssh digital-ocean '
     sudo mv /tmp/nestcalc.service /etc/systemd/system/nestcalc.service &&
     sudo systemctl daemon-reload &&
     sudo systemctl enable nestcalc &&
     echo "$USER ALL=(root) NOPASSWD: /usr/bin/systemctl restart nestcalc" |
       sudo tee /etc/sudoers.d/nestcalc && sudo chmod 440 /etc/sudoers.d/nestcalc && sudo visudo -c
   '
   ```

6. Install the nginx site. As with the sibling sites, Certbot rewrites the file in place to add the TLS block and the
   HTTP→HTTPS redirect:

   ```bash
   scp deploy/nginx/nestcalc.rokimania.com.conf digital-ocean:/tmp/nestcalc.rokimania.com
   ssh digital-ocean '
     sudo mv /tmp/nestcalc.rokimania.com /etc/nginx/sites-available/nestcalc.rokimania.com &&
     sudo ln -s /etc/nginx/sites-available/nestcalc.rokimania.com /etc/nginx/sites-enabled/ &&
     sudo nginx -t && sudo systemctl reload nginx &&
     sudo certbot --nginx -d nestcalc.rokimania.com
   '
   ```

7. Ship the first version (this also starts the service):

   ```bash
   npm run deploy
   ```

## Deploying a new version

```bash
npm run deploy
```

`scripts/deploy.sh` builds the standalone bundle, copies `public/` and `.next/static/` into it (Next does not do this
for you), rsyncs it to `/var/www/nestcalc/prod/app/` with `--delete`, and restarts the service. The local copy of
`data/` that ends up inside the standalone bundle is excluded from the rsync, and the server's data directory is
elsewhere, so deploys never touch your data.

## Backups

All state is one file. Copy it down whenever you like:

```bash
scp digital-ocean:/var/www/nestcalc/prod/data/calculator.json ./calculator.backup.json
```

## Installing on Android

1. Open `https://nestcalc.rokimania.com` in Chrome and sign in with the basic-auth credentials.
2. Chrome menu → **Install app** (or **Add to Home screen**).

The installed app opens fullscreen without the browser UI. It is online-only: with no connection you get a short
"no internet" page, and saving needs a connection.

## Troubleshooting

- **Logs:** `ssh digital-ocean 'journalctl -u nestcalc -n 50 --no-pager'`
- **Site shows 404 / `/api/calculator` returns 404:** the seed step (3) was skipped, so `calculator.json` is missing
  from
  the data directory.
- **502 Bad Gateway:** the service is down; check the logs and `systemctl status nestcalc`.
- **Saving fails with a permission error in the logs:** `www-data` cannot write the data directory; redo the `chown` /
  `chmod` in step 3.
- **No "Install app" option:** open DevTools → Application → Manifest on desktop Chrome and look for installability
  errors; the usual cause is the manifest or icons being behind basic auth.
