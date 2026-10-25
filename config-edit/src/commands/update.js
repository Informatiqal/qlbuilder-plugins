import { writeFileSync } from "fs";
import { dump as yamlDump } from "js-yaml";

import {
    loadConfig,
    askForChoice,
    askForPassword,
    askForText,
} from "../lib/common";

let prompts = {};
let print = {};

export const meta = {
    command: {
        name: "update",
        description: `Update environment properties`,
        options: [
            {
                flag: "-e, --env <env_name>",
                description: "Environment name",
            },
        ],
        aliases: ["upd", "edit"],
    },
    options: {
        requireConnection: false,
        requireEnv: false,
        requireApp: false,
    },
    subCommands: [],
};

export async function action(args) {
    print = new args.tools.print();
    prompts = args.tools.prompts;

    const { content, isConfigEncrypted, key, configPath } = await loadConfig(
        args.tools.prompts,
        args.tools.decryptText,
        true,
    );

    let targetEnvironment = "";
    if (args.command.options["env"]) {
        if (!content[args.command.options["env"]]) {
            print.error(
                `Environment "${args.command.options["env"]}" not found`,
            );
            return;
        }

        targetEnvironment = args.command.options["env"];
    } else {
        targetEnvironment = await askForChoice(
            prompts,
            "Which environment?",
            Object.keys(content).map((k) => ({ title: k, value: k })),
        );
    }

    const whatToUpdate = await askForChoice(
        prompts,
        "What should be updated?",
        [
            {
                title: "Environment name",
                value: "name",
            },
            {
                title: "Environment property",
                value: "prop",
            },
        ],
    );

    if (whatToUpdate == "name") {
        const newName = await askForText(
            prompts,
            "What should be the new name?",
        );

        content[newName] = { ...content[targetEnvironment] };
        delete content[targetEnvironment];
    }

    if (whatToUpdate == "prop") {
        const targetedProperty = await askForChoice(
            prompts,
            "Which property?",
            Object.keys(content[targetEnvironment]).map((p) => ({
                title: p,
                value: p,
            })),
        );

        const isPasswordProperty =
            targetedProperty.toLowerCase().indexOf("password") > -1
                ? true
                : false;

        let newPropValue = "";
        if (isPasswordProperty == true) {
            newPropValue = await askForPassword(
                prompts,
                "What should be the new value?",
            );
        } else {
            newPropValue = await askForText(
                prompts,
                "What should be the new value?",
            );
        }

        content[targetEnvironment][targetedProperty] = newPropValue;
    }

    let newContent = yamlDump(content);

    if (isConfigEncrypted) {
        newContent = args.tools.encryptText(newContent, key);
    }

    writeFileSync(configPath, newContent);

    print.ok(`Config file was updated`);
}
