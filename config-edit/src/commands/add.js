import { writeFileSync } from "fs";
import { dump as yamlDump } from "js-yaml";

import {
    loadConfig,
    askForPassword,
    askForText,
    askForChoice,
} from "../lib/common";

export const meta = {
    command: {
        name: "add",
        description: `Add new environment to ".qlbuilder.yaml"`,
        options: [],
        aliases: ["ins"],
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
    let envData = {};

    const envName = await askForText(prompts, "What should be the name?");

    const envType = await askForChoice(
        prompts,
        "What type is the environment?",
        [
            { title: "QSE (Windows authentication)", value: "winform" },
            { title: "QSE (Certificates)", value: "certificates" },
            { title: "QSE (JWT)", value: "jwt" },
            { title: "Cloud (JWT)", value: "jwt" },
        ],
    );

    if (envType == "winform") {
        const userName = await askForText(
            prompts,
            "For which username? (DOMAIN\\UserName)",
        );
        const password = await askForPassword(prompts, "Password");

        envData["QLIK_USER"] = userName;
        envData["QLIK_PASSWORD"] = password;
    }

    if (envType == "certificates") {
        const certPath = await askForText(
            prompts,
            "Path to certificates folder",
        );
        const userName = await askForText(
            prompts,
            "For which username? (DOMAIN\\UserName)",
        );

        envData["QLIK_CERTS"] = certPath;
        envData["QLIK_USER"] = userName;
    }

    if (envType == "jwt") {
        const token = await askForText(prompts, "JWT content");

        envData["QLIK_TOKEN"] = token;
    }

    const { content, isConfigEncrypted, key, configPath } = await loadConfig(
        args.tools.prompts,
        args.tools.decryptText,
        true,
    );

    if (content[envName]) {
        args.print.error(
            `"${envName}" already exists. Please edit or delete it.`,
        );
        process.exit(1);
    }

    content[envName] = envData;

    let newConfigContent = yamlDump(content);

    if (isConfigEncrypted) {
        newConfigContent = args.tools.encryptText(newConfigContent, key);
    }

    writeFileSync(configPath, newConfigContent);

    print.ok(`Config file was updated`);
}
