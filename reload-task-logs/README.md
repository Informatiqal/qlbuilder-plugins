# Reload Task Logs

This `qlBuilder` plugin allows export/download of the reload tasks logs for the configured app (if any)

## Installation

Technically the plugin can be installed in any folder and just point `plugins.yaml` entry to the installed location.

For simplicity the example below installs the plugin as a global npm module:

`npm install -g @informatiqal/qlbuilder-reload-task-logs`

## Usage

### Default usage

Export the log for the configured app into the current folder. The log file name is "provided" by Qlik:

`qlbuilder logs <env>`

### Extended usage

Specify a custom location where the log file to be saved:

`qlbuilder logs <env> --output c:\path\to\save\file.txt`

## Alias

Apart from the default `logs` command the below alias can be used as well:
- `Logs`
- `reload-logs`
