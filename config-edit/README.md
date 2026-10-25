# Config related commands

This plugin introduces several commands to manage `.qlBuilder.yaml` config file.

If the config file is encrypted the command will first ask for decryption key and will re-encrypt after the change (with the same key)

## config

Just prints the help for the `config` command

```
qlbuilder config
```

## add

Adds brand environment to `.qlbuilder.yaml`

```
qlbuilder config add
```

OR

```
qlbuilder config add --env new-env
```

The command will ask for:

- name (if plain `config add` is used)
- type of the environment
    - QSE with Windows authentication
    - QSE with certificates authentication
    - QSE with JWT authentication
    - Cloud/SaaS with JWT authentication
- depends on the type an additional property should be provide
    - user/pass
    - certificate path
    - JWT value

## remove

Remove environment from `.qlbuilder.yaml`

```
qlbuilder config remove
```

OR

```
qlbuilder config remove --env some-env
```

## update

Update existing environment - name or property

```
qlbuilder config update
```

OR

```
qlbuilder config update --env some-env
```

The command will ask for:

- name (if plain `config update` is used)
- what to update:
    - env name
    - property and its new value
