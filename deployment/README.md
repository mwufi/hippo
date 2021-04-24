
# Deployment on Lightsail

`forever` is a good way to start and stop services!

To get it to run on startup, we're going to create a systemd service.

Here's how!

| What you need to do | command
|--|--
|1. **Copy the service file to the systemd folder** | `make install`
|2. **Enable the service (start it on reboot)**  | `sudo systemctl enable hippo`
|3. **Start the service** | `sudo systemctl start hippo`

At any time, you can check the status of your service by doing `systemctl status hippo`

![image](https://user-images.githubusercontent.com/30219253/115966101-d4407600-a4f1-11eb-93c2-159d95a109b0.png)

You can also interact with the service with `forever`. E.g:

![image](https://user-images.githubusercontent.com/30219253/115966151-0520ab00-a4f2-11eb-9d85-7fc465c3e6ae.png)
