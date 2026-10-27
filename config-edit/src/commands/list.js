import { loadConfig } from "../lib/common";

export const meta = {
    command: {
        name: "list",
        description: `List environment names from ".qlbuilder.yaml"`,
        options: [],
        aliases: ["ls"],
    },
    options: {
        requireConnection: false,
        requireEnv: false,
        requireApp: false,
    },
    subCommands: [],
};

export async function action(args) {
    const { content } = await loadConfig(
        args.tools.prompts,
        args.tools.decryptText,
        true,
    );

    Object.keys(content).map((env) => {
        console.log(env);
    });
}
