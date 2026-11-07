# Run PromptSketch on your own computer (no programming needed)

> Spanish version: [LOCAL_MODE.es.md](LOCAL_MODE.es.md).

Use it to try the platform or to run a small workshop from your own computer. It works on **Windows, macOS and Linux**. You do not need an account on any service or a database.

## Windows

1. **Install Node.js** (once): go to <https://nodejs.org>, download the **LTS** version and install it, clicking "Next" all the way through. From a terminal you can use `winget install OpenJS.NodeJS.LTS` instead.
2. **Download PromptSketch** from GitHub (green *Code* button → *Download ZIP*) and unzip it.
3. **Double-click `start.bat`**.
   - The first time it installs and prepares everything (a few minutes, internet required).
   - If Windows asks about the **Firewall**, choose **"Allow access"** (on private networks). That is what lets participants' phones connect.
4. The browser opens on the admin page. The **password** appears in the black window and is saved in the `.env.local` file.
5. To stop it, press `Ctrl + C` in the black window, or close it.

## macOS

Install Node.js (LTS) from <https://nodejs.org> and double-click `start.command`. If macOS says it has no permission, open Terminal in that folder and type `chmod +x start.command`.

## Linux

```bash
./scripts/run.sh            # development mode, or
pnpm run local              # same as Windows and macOS
```

## How participants join

- Your computer and the phones must be on **the same Wi-Fi**. Some networks (universities, hotels, "guest" networks) block connections between devices. If that happens, use your phone's Wi-Fi hotspot or ask IT to allow device-to-device connections.
- Open the admin page with the address the window shows (something like `http://192.168.1.20:3000/admin`, **not** `localhost`) so your campaign's QR code works on phones.
- Share the code or project the QR from **Live → Project QR**.

## Your data

- Everything is saved in the `data.json` file in this folder. **Keep backups** and do not share it: it can contain participants' answers.
- To start from scratch, stop the program and delete `data.json`.
- The first time you will see **sample data** (demo mode). You can leave demo mode in **Settings**.
- For the assistant to answer with real AI, set up a provider in **Settings**. Without a key the assistant is simulated.

## If something goes wrong

| Problem | What to do |
| --- | --- |
| "Node.js is not installed" | Install it (step 1) and open `start.bat` again. |
| "Installation failed" | Check your internet connection and try again. |
| The window closes by itself | Open `cmd` in the folder and run `node scripts\start-local.js` to see the message. |
| I can open the admin but cannot do anything ("We could not refresh the data") | Update PromptSketch: local mode no longer marks the session as "secure", which was what prevented saving it when entering through the IP address. |
| The phone cannot open the page | Same Wi-Fi, Firewall allowed, and the address with the IP (not `localhost`). |
| Another program is using port 3000 | `start.bat --port 3001` |
| I want to update PromptSketch | Download the new ZIP, copy your `data.json` and `.env.local` into the new folder and run with `--rebuild` the first time. |

To publish the platform on the internet (with many participants at once) this mode is not enough: see the README (Supabase and deployment).
