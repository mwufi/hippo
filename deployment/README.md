
# Deployment on Lightsail

`forever` is a good way to start and stop services!

To get it to run on startup, we're going to create a systemd service.

Here's how!

| Task | command
|--|--
|1. **Copy the service file to the systemd folder** | `make install`
|2. **Enable the service (start it on reboot)**  | `sudo systemctl enable hippo`
|3. **Start the service** | `sudo systemctl start hippo`

At any time, you can check the status of your service by doing `systemctl status hippo`