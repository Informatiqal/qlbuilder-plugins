import { readFileSync } from "fs";
import { homedir } from "os";
import { load as yamlLoad, dump as yamlDump } from "js-yaml";

export function isEncrypted(configContent) {
    const marker = "111111";
    const potentialMarker = Buffer.from(
        configContent.slice(-12),
        "hex",
    ).toString();

    if (potentialMarker == marker) return true;

    return false;
}

export async function loadConfig(prompts, decryptText, parse = true) {
    const configPath = `${homedir}/.qlbuilder.yml`;
    let configRawContent = readFileSync(configPath).toString();
    const isConfigEncrypted = isEncrypted(configRawContent);

    let key = "";
    if (isConfigEncrypted == true) {
        key = await askForPassword(prompts, "Decryption key");
        configRawContent = decryptText(configRawContent, key);
    }

    try {
        if (parse == true) {
            const parsedContent = yamlLoad(configRawContent);
            return {
                content: parsedContent,
                isConfigEncrypted,
                key,
                configPath,
            };
        } else {
            return {
                content: configRawContent,
                isConfigEncrypted,
                key,
                configPath,
            };
        }
    } catch (e) {
        console.log(
            "Error while decrypting. The provided password was wrong or the encrypted file is corrupt",
        );
        process.exit(1);
    }
}

export function cancelPrompt() {
    console.log("Aborted.");
    console.log("");
    process.exit(0);
}

export async function askForText(prompts, message) {
    const prompt = await prompts(
        [
            {
                type: "text",
                name: "input",
                message: message,
            },
        ],
        {
            onCancel: cancelPrompt,
        },
    );

    return prompt.input;
}

export async function askForToggle(prompts, message) {
    const prompt = await prompts(
        [
            {
                type: "toggle",
                name: "value",
                message: message,
                initial: false,
                active: "yes",
                inactive: "no",
            },
        ],
        {
            onCancel: cancelPrompt,
        },
    );

    return prompt.value;
}

export async function askForPassword(prompts, message) {
    const prompt = await prompts(
        [
            {
                type: "password",
                name: "input",
                message: message,
            },
        ],
        {
            onCancel: cancelPrompt,
        },
    );

    return prompt.input;
}

export async function askForChoice(prompts, message, choices) {
    const prompt = await prompts(
        [
            {
                type: "select",
                name: "selectedOption",
                message: message,
                choices: choices,
                initial: 0,
            },
        ],
        {
            onCancel: cancelPrompt,
        },
    );

    return prompt.selectedOption;
}
