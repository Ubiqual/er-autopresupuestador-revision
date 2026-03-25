## Create db on fly.io

- `flyctl auth login`
- `flyctl postgres create`
- `fly ips allocate-v4 --app estebanrivas-db-dev`
- Create db

## Scaling and Managing Fly.io Machines

### To check available machine sizes

```sh
flyctl platform vm-sizes
```

### To get a machine id

```sh
flyctl machines list --app estebanrivas-db
```

### Stopping a Machine

To stop a machine, use the following command:

```sh
flyctl machines stop <machine_id> --app estebanrivas-db
```

### Updating a Machine Configuration

To update the machine configuration, such as changing the VM size:

```sh
flyctl machines update <machine_id> --app estebanrivas-db --vm-size shared-cpu-2x
```

### Starting a Machine

To start a machine, use the following command:

```sh
flyctl machines start <machine_id> --app estebanrivas-db
```

### Verifying Machine Status

To verify the status of your machines:

```sh
flyctl machines list --app estebanrivas-db
```

### Creating a New Machine with Desired Configuration

If you need to create a new machine with a specific configuration:

```sh
flyctl machine run flyio/postgres-flex:16.4 --app estebanrivas-db --region mad --vm-size shared-cpu-2x
```

### Verifying the New Machine

To check the status of the new machine:

```sh
flyctl status --app estebanrivas-db
```
