import { meta as viewMeta, action as viewAction } from "./commands/view";
import { meta as addMeta, action as addAction } from "./commands/add";
import { meta as removeMeta, action as removeAction } from "./commands/remove";
import { meta as updateMeta, action as updateAction } from "./commands/update";
import { meta as listeMeta, action as listAction } from "./commands/list";

export const meta = {
    command: {
        name: "config",
        description: `Set of commands related to ".qlbuilder.yaml" (CRUD)`,
        options: [],
        aliases: ["conf"],
    },
    subCommands: [
        {
            meta: viewMeta,
            action: viewAction,
        },
        {
            meta: addMeta,
            action: addAction,
        },
        {
            meta: removeMeta,
            action: removeAction,
        },
        {
            meta: updateMeta,
            action: updateAction,
        },
        {
            meta: listeMeta,
            action: listAction,
        },
    ],
    options: {
        requireConnection: false,
        requireEnv: false,
        requireApp: false,
    },
};
