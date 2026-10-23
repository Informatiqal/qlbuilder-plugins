import { writeFileSync } from "fs";
import { dump as yamlDump } from "js-yaml";

import {
    askForChoice,
    askForPassword,
    askForText,
    loadConfig,
} from "./lib/common";

import { meta as viewMeta, action as viewAction } from "./commands/view";
import { meta as addMeta, action as addAction } from "./commands/add";
import { meta as removeMeta, action as removeAction } from "./commands/remove";

export const meta = {
    command: {
        name: "config",
        description: `Set of commands related to ".qlbuilder.yaml" (CRUD)`,
        options: [],
        aliases: ["conf"],
    },
    // subCommands: [
    //     {
    //         // meta: subCommand1.meta,
    //         meta: {
    //             command: {
    //                 name: "property",
    //                 description: `Update ".qlbuilder.yaml" property value`,
    //                 options: [],
    //                 aliases: ["prop"],
    //             },
    //             options: {
    //                 requireConnection: false,
    //                 requireEnv: false,
    //                 requireApp: false,
    //             },
    //             subCommands: [
    //                 {
    //                     // meta: subCommand1.meta,
    //                     meta: {
    //                         command: {
    //                             name: "username",
    //                             description: `TEST`,
    //                             options: [],
    //                             aliases: ["uname"],
    //                         },
    //                         options: {
    //                             requireConnection: false,
    //                             requireEnv: false,
    //                             requireApp: false,
    //                         },
    //                     },
    //                     // action: function (args) {
    //                     //     console.log("Say what?");
    //                     // },
    //                 },
    //             ],
    //         },
    //         action: subCommand1.action,
    //     },
    // ],
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
    ],
    options: {
        requireConnection: false,
        requireEnv: false,
        requireApp: false,
    },
};

export async function action(args) {
    const print = new args.tools.print();

    const { content, isConfigEncrypted, key, configPath } = await loadConfig(
        args.tools.prompts,
        args.tools.decryptText,
    );

    console.log(content);

    const targetedEnvironment = await askForChoice(
        args.tools.prompts,
        "For which environment?",
        Object.keys(content).map((e) => ({
            title: e,
            value: e,
        })),
    );

    const targetedProperty = await askForChoice(
        args.tools.prompts,
        "For which property?",
        Object.keys(content[targetedEnvironment]).properties.map((e) => ({
            title: e,
            value: e,
        })),
    );

    const newValue = await askForNewValue(args.tools.prompts, targetedProperty);
    content[targetedEnvironment][targetedProperty] = newValue;

    let newConfigContent = yamlDump(content);
    if (isConfigEncrypted) {
        newConfigContent = args.tools.encryptText(newConfigContent, key);
    }

    // writeFileSync(configPath, newConfigContent);

    print.ok(`Config file was updated`);

    return;
}

async function askForNewValue(prompts, targetedProperty) {
    const isPasswordProperty =
        targetedProperty.toLowerCase().indexOf("password") > -1 ? true : false;

    if (isPasswordProperty) {
        const pass = await askForPassword(
            prompts,
            "What should be the new value?",
        );
        return pass;
    } else {
        const text = await askForText(prompts, "What should be the new value?");
        return text;
    }
}

/*

conf view env
conf edit env
conf add env
conf delete env
*/
