import { writeFileSync } from "fs";
import { QlikRepoApi } from "qlik-repo-api";

export const meta = {
    command: {
        name: "logs",
        description: `Extract/download execution result logs for the configured app`,
        options: [
            {
                flag: "-o, --output <file_path>",
                description: "Output file path",
            },
        ],
        aliases: ["Logs", "reload-logs"],
    },
    subCommands: [],
    options: {
        requireConnection: true,
        requireEnv: true,
        requireApp: false,
    },
};

export async function action(args) {
    const print = new args.tools.print();
    const prompts = args.tools.prompts;

    const hostComponents = args.environment.host
        .split("/")
        .filter((a) => a != "");

    const repoConfig = {
        host: hostComponents[1],
        port: "443",
        authentication: {
            sessionId: args.engine.auth.data.headers.Cookie.split("=")[1],
            cookieHeaderName: args.environment.authentication.sessionHeaderName,
        },
    };
    if (hostComponents.length == 3) repoConfig["proxy"] = hostComponents[2];

    const repoApi = new QlikRepoApi.client(repoConfig);

    const availableTasks = await getReloadTasksForAppId(
        repoApi,
        args.environment.appId,
    );
    if (availableTasks.length == 0) {
        print.error(
            `No reload tasks found for appId ${args.environment.appId}`,
        );
        return;
    }

    const selectedTaskId = await askForChoice(
        prompts,
        "Available reload tasks",
        availableTasks.map((t) => ({
            title: t.details.name,
            value: t.details.id,
        })),
    );
    const selectedTask = availableTasks.filter(
        (t) => t.details.id == selectedTaskId,
    )[0];

    const availableExecutionResults = await getExecutionResultsForTask(
        repoApi,
        selectedTaskId,
    );
    if (availableExecutionResults.length == 0) {
        print.error("No execution results for the selected task");
        return;
    }

    const executionResultStatus = {
        0: "Never started",
        1: "Triggered",
        2: "Started",
        3: "Queued",
        4: "Abort initiated",
        5: "Aborting",
        6: "Aborted",
        7: "Finished success",
        8: "Finished fail",
        9: "Skipped",
        10: "Retry",
        11: "Error",
        12: "Reset",
        13: "Distribution queue",
        14: "Distribution running",
    };

    const selectedExecutionResultId = await askForChoice(
        prompts,
        "Available executions (node | status | start time )",
        availableExecutionResults
            .filter((t) => t.details.scriptLogAvailable == true)
            .map((t) => {
                const startTime = t.details.startTime
                    .replace("T", " ")
                    .replace("Z", "");
                const title = `${t.details.executingNodeName} | ${executionResultStatus[t.details.status]} | ${startTime}`;
                return {
                    title: title,
                    value: t.details.id,
                };
            }),
    );
    const selectedExecutionResult = availableExecutionResults.filter(
        (t) => t.details.id == selectedExecutionResultId,
    )[0];

    const reloadLogFileReference = await getLogFileReference(
        selectedTask,
        selectedExecutionResult.details.fileReferenceID,
    );

    const logContent = await getReloadLog(
        repoApi,
        reloadLogFileReference.value,
    );

    let filePath = "";
    if (!args.command.options.hasOwnProperty("output")) {
        const fileName = selectedExecutionResult.details.scriptLogLocation
            .split("\\")
            .at(-1);
        filePath = `./${fileName}`;
    } else {
        filePath = args.command.options.output;
    }

    writeFileSync(filePath, logContent.data);
    print.plain("");
    print.ok(`Reload log saved in ${filePath}`);
    return;
}

async function getReloadTasksForAppId(repoApi, appId) {
    const tasks = await repoApi.reloadTasks.getFilter({
        filter: `app.id eq ${appId}`,
    });

    return tasks;
}

async function getExecutionResultsForTask(repoApi, taskId) {
    const executionResults = await repoApi.executionResults.getFilter({
        filter: `taskID eq ${taskId}`,
    });

    return executionResults;
}

async function getLogFileReference(reloadTask, fileReferenceId) {
    const reloadLog = await reloadTask.scriptLogGet({ fileReferenceId });

    return reloadLog;
}

async function getReloadLog(repoApi, reloadLogFileReference) {
    const logContent = await repoApi.repoClient.Get(
        `download/reloadtask/${reloadLogFileReference}/${reloadLogFileReference}.log`,
    );

    return logContent;
}

function cancelPrompt() {
    console.log("Aborted.");
    console.log("");
    process.exit(0);
}

async function askForChoice(prompts, message, choices) {
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
