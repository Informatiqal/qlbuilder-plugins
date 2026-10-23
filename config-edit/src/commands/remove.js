import { writeFileSync } from "fs";
import { dump as yamlDump } from "js-yaml";

import { loadConfig, askForChoice, askForToggle } from "../lib/common";

export const meta = {
    command: {
        name: "remove",
        description: `Remove environment from ".qlbuilder.yaml"`,
        options: [
            {
                flag: "-e, --env <env_name>",
                description: "Environment name",
            },
            {
                flag: "-y",
                description: "Auto confirm deletion",
            },
        ],
        aliases: [],
    },
    options: {
        requireConnection: false,
        requireEnv: false,
        requireApp: false,
    },
    subCommands: [],
};

export async function action(args) {
    const print = new args.tools.print();
    const prompts = args.tools.prompts;

    const { content, isConfigEncrypted, key, configPath } = await loadConfig(
        args.tools.prompts,
        args.tools.decryptText,
        true,
    );

    let newContent = {};

    if (args.command.options["env"]) {
        if (!content[args.command.options["env"]]) {
            print.error(
                `Environment "${args.command.options["env"]}" not found`,
            );
            return;
        }

        let confirmation = false;

        if (args.command.options.y) {
            confirmation = true;
        } else {
            confirmation = await askForToggle(prompts, "Are you sure?");
        }

        if (confirmation == true) {
            delete content[args.command.options["env"]];
            newContent = { ...content };
        }

        if (confirmation == false) {
            print.ok("Aborting. Nothing was changed.");
            return;
        }
    } else {
        const targetEnvironment = await askForChoice(
            prompts,
            "Which environment?",
            Object.keys(content).map((k) => ({ title: k, value: k })),
        );

        const confirmation = await askForToggle(prompts, "Are you sure?");

        if (confirmation == true) {
            delete content[targetEnvironment];
            newContent = { ...content };
        }

        if (confirmation == false) {
            print.ok("Aborting. Nothing was changed.");
            return;
        }
    }

    newContent = yamlDump(newContent);

    if (isConfigEncrypted) {
        newContent = args.tools.encryptText(newContent, key);
    }

    writeFileSync(configPath, newContent);

    print.ok(`Config file was updated`);
}
