# Data Model Viewer

This `qlBuilder` plugin tries to re-create Qlik's app data model and exports it as a `png` image.

## Installation

Technically the plugin can be installed in any folder and just point `plugins.yaml` entry to the installed location.

For simplicity the example below installs the plugin as a global npm module:

`npm install -g @informatiqal/qlbuilder-dmv`

## Limitations

The plugin source **all** of its data from Qlik itself and renders whatever Qlik's returns.

At the moment the plugin will render the data model "as it is". This means that the last save point of the app/data model will be used by the plugin to render the data:

- no way to specify zoom level
- no way to specify custom image size
- no wat to customize the image (no custom styling)


The plugin uses the local MS Edge instance to render and export the image. 

In case of an interest (and if I have the time) 

- the plugin can be extended to render the image without the help of the browser (pure svg)
- overcome the above limitations (at least the zoom level and custom image size)
