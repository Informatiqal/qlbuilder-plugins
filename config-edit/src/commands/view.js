import { dump as dumpYaml } from "js-yaml";

import { loadConfig } from "../lib/common";

export const meta = {
    command: {
        name: "view",
        description: `View the content of ".qlbuilder.yaml"`,
        options: [
            {
                flag: "-e, --env <env_name>",
                description: "Environment name",
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

    // if no env is provided then print the whole config
    if (!args.command.options["env"]) {
        const { content } = await loadConfig(
            args.tools.prompts,
            args.tools.decryptText,
            false,
        );

        console.log(`\n${content}`);
        return;
    }

    const envName = args.command.options["env"];
    const { content } = await loadConfig(
        args.tools.prompts,
        args.tools.decryptText,
        true,
    );

    if (!content[envName]) {
        print.error(`\nEnvironment "${envName}" was not found`);
        return;
    } else {
        let envData = {};
        envData[envName] = content[envName];

        const yamlData = dumpYaml(envData);
        console.log(`\n${yamlData}`);
        return;
    }
}
