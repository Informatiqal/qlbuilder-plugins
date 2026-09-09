import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

export const meta = {
    command: {
        name: "dmv",
        description: "Export data model viewer as png",
        options: [
            {
                flag: "--output <path>",
                description:
                    "Path to store the generated png. Defaults to current folder dmv.png",
                defaultValue: "./dmv.png",
            },
        ],
    },
    options: {
        requireConnection: true,
        requireEnv: true,
        requireApp: true,
    },
};

const armWidth = 5;
const horizontalOffset = 5;
const defaultOffsetValue = 5;
const styles = `body {
        margin: 0px;
        padding: 0px;
        background-color: rgb(242, 242, 242);
    }

    button {
        position: absolute;
    }

    .zoom {
        background-color: rgb(242, 242, 242);
    }

    span {
        font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
            Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        font-size: 14px;
    }

    .table-container {
        position: absolute;
    }

    line {
        stroke-width: 2px;
        pointer-events: all;
        stroke-linecap: round;
        stroke: grey;
    }

    circle {
        fill: grey;
        stroke: grey;
    }

    .circular {
        stroke: #e64e4e;
        fill: #e64e4e;
        stroke-dasharray: 5, 10;
    }

    .key {
        height: 20px;
        width: 20px;
    }

    .box {
        position: absolute;
        background-color: ff3e00;
        /*opacity: 0.2;*/
    }

    .title {
        font-size: 14px;
        font-weight: bold;
        background-color: rgb(255, 255, 255);
        border: 1px solid grey;
        border-radius: 5px;
        color: rgb(89, 89, 89);
    }

    .title-header {
        height: 10px;
        background: #0000000d;
        display: flex;
        align-items: center;
        padding-left: 10px;
        padding-right: 10px;
    }

    .title-header > span {
        text-overflow: ellipsis;
        display: block;
        white-space: nowrap;
        overflow: hidden;
    }

    ul {
        font-weight: initial;
        list-style: none;
        padding: 0px;
        margin: 0px;
    }

    .field {
        white-space: nowrap;
        font-size: 12px;
        display: flex;
        align-items: center;
        padding-left: 10px;
        padding-right: 5px;
        white-space: nowrap;
        border-bottom: 1px solid #ccc;
    }

    .field-common {
        min-height: 28px;
        max-height: 28px;
    }

    .syn-field {
        border-bottom: 0;
    }

    .syn-field-child {
        padding-left: 25px;
        border-bottom: 0px solid #ccc;
    }

    .syn-field-child-end {
        border-bottom: 1px solid #ccc;
    }

    .original-field {
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0px;
        flex-grow: 1;
    }
`;

let document;
let svgWidth = 0;
let svgHeight = 0;
let arms = [];
let existingTables = [];
let interceptions = [];
let data = [];
let saveInfo = [];
let loosely = [];

function filterOutZeroWidthTables() {
    saveInfo.qCtlInfo.qInternalView.qTables.map((t) => {
        if (t.qPos.qWidth > 0) {
            let b = t.qPos.qLeft + t.qPos.qWidth;
            b;
            if (b > svgWidth) svgWidth = b;
        }

        if (t.qPos.qHeight > 0) {
            let b1 = t.qPos.qTop + t.qPos.qHeight;
            b1;
            if (b1 > svgHeight) svgHeight = b1;
        }
    });
}

async function prepareTablesData() {
    existingTables = data.qtr.map((t) => t.qName);
    return saveInfo.qCtlInfo.qInternalView.qTables.filter((t) => {
        return existingTables.includes(t.qCaption.replace("[dollar]", "$"));
    });
}

function setLooselyCoupledTables() {
    let looselyCoupledTables = [];

    loosely.map((t, i) => {
        if (t > 0) {
            // @ts-ignore
            looselyCoupledTables.push(data.qtr[i].qName);
        }
    });

    return looselyCoupledTables;
}

async function drawTables(tables) {
    const headerHeight = 28;

    const tablesHtml = tables.map((props) => {
        const fieldsRaw = data.qtr.filter(
            (t) => t.qName === props.qCaption.replace("[dollar]", "$"),
        )[0].qFields;

        const nonKeyFields = fieldsRaw.filter((f) => f.qKeyType == "NOT_KEY");
        const keyFields = fieldsRaw.filter((f) => f.qKeyType != "NOT_KEY");

        const fields = [...keyFields, ...nonKeyFields];
        const fieldHeight = Math.floor(
            // svelte-ignore state_referenced_locally
            (props.qPos.qHeight - headerHeight) / fieldsRaw.length,
        );

        let fieldsLi = [];

        const dataName = props.qCaption.replace("[dollar]", "$");

        fields.forEach((field) => {
            let keyElement = "";

            if (field.qKeyType != "NOT_KEY") {
                keyElement = `<span class="key">
  <svg viewBox="-10 -10 100 100" fill="lightgray" xmlns="http://www.w3.org/2000/svg">
    <g transform="scale(0.03065134099616858, -0.03065134099616858) translate(0, -1872.8)">
      <path d="M1525 1039Q1560 1024 1600 1024Q1640 1024 1675 1039Q1710 1054 1736 1080Q1762 1106 1777 1141Q1792 1176 1792 1216Q1792 1256 1777 1291Q1762 1326 1736 1352Q1710 1378 1675 1393Q1640 1408 1600 1408Q1560 1408 1525 1393Q1490 1378 1464 1352Q1438 1326 1423 1291Q1408 1256 1408 1216Q1408 1176 1423 1141Q1438 1106 1464 1080Q1490 1054 1525 1039ZM1578 407Q1496 384 1397 384Q1298 384 1190 422L1190 422L1152 384L896 384L896 128L640 128L640-128L384-128L384-384L0-384L0 0L806 806Q768 914 768 1013Q768 1112 791 1194Q814 1276 855.50 1347Q897 1418 955.50 1476.50Q1014 1535 1085 1576.50Q1156 1618 1238 1641Q1320 1664 1408 1664Q1496 1664 1578 1641Q1660 1618 1731 1576.50Q1802 1535 1860.50 1476.50Q1919 1418 1960.50 1347Q2002 1276 2025 1194Q2048 1112 2048 1024Q2048 936 2025 854Q2002 772 1960.50 701Q1919 630 1860.50 571.50Q1802 513 1731 471.50Q1660 430 1578 407Z"
            transform="translate(0, 0)"/>
    </g>
  </svg>
</span>`;
            }

            const fieldLi = `<li
                data-name="${dataName}--${field.qName}"
                class="field field-common"
                style="height: ${fieldHeight}px;"
            >
                <p class="original-field">
                    <span>
                        ${field.qName}
                    </span>
                </p>
                ${keyElement}
            </li>`;

            fieldsLi.push(fieldLi);
        });

        return `<div
        class="box"
        data-name="${dataName}""
        style="transform: translate(${props.qPos.qLeft}px, ${
            props.qPos.qTop
        }px);height: ${props.qPos.qHeight}px; width: ${props.qPos.qWidth}px"
    >
        <div class="title">
            <div class="title-header" style="height: ${headerHeight}px;">
                <span>
                    ${props.qCaption.replace("[dollar]", "$")}
                </span>
            </div>
            <ul>
                ${fieldsLi.join(" ")}
            </ul>
        </div>
    </div>`;
    });

    return tablesHtml.join(" ");
}

function getTableBounds(tableName) {
    const d = document
        .querySelector(`[data-name="${tableName}"]`)
        ?.getBoundingClientRect();

    return {
        top: d?.top || 0,
        left: d?.left || 0,
        height: d?.height || 0,
        width: d?.width || 0,
    };
}

function isTableLeftOfTargetLeftPosition(tableStartName, targetLeftPosition) {
    const table1Position = getTableBounds(tableStartName);

    //@ts-ignore
    return table1Position.left < targetLeftPosition;
}

function getPositionOfFieldInTable(tableName, fieldName, targetLeftPosition) {
    const field = document
        .querySelector(`[data-name="${tableName}--${fieldName}"]`)
        ?.getBoundingClientRect();

    const tablePosition = getTableBounds(tableName);

    const targetIsToLeft = isTableLeftOfTargetLeftPosition(
        tableName,
        targetLeftPosition,
    );
    const left = targetIsToLeft
        ? //@ts-ignore
          tablePosition.left + tablePosition.width - horizontalOffset
        : //@ts-ignore
          tablePosition.left + horizontalOffset;

    return {
        targetIsToLeft,
        top: (field?.top || 0) + (field?.height || 0) / 2,
        left,
    };
}

function createConnectionBetweenTwoTables(key, looselyCoupledTables) {
    try {
        const armWidth = 5;

        let startTable;
        let endTable;
        let startTableName = "";
        let endTableName = "";
        let line = {
            start: { x: 0, y: 0 },
            end: { x: 0, y: 0 },
            field: "",
            isCircular: false,
        };

        const table1 =
            document
                .querySelector(`[data-name="${key.qTables[0]}"]`)
                ?.getBoundingClientRect() || {};

        const table2 =
            document
                .querySelector(`[data-name="${key.qTables[1]}"]`)
                ?.getBoundingClientRect() || {};

        if (table1?.left < table2?.left) {
            startTable = table1;
            endTable = table2;
            startTableName = key.qTables[0];
            endTableName = key.qTables[1];
        } else {
            startTable = table2;
            endTable = table1;
            startTableName = key.qTables[1];
            endTableName = key.qTables[0];
        }

        key.qKeyFields.map((k) => {
            const startElement = document
                .querySelector(`[data-name="${startTableName}--${k}"]`)
                ?.getBoundingClientRect();
            const endElement =
                document
                    .querySelector(`[data-name="${endTableName}--${k}"]`)
                    ?.getBoundingClientRect() || {};

            if (startElement) {
                line.start.x = startTable?.right + armWidth;
                line.start.y =
                    startElement.top -
                    (startElement.top - startElement.bottom) / 2;
                line.end.x = endTable.left - armWidth;
                line.end.y =
                    endElement.top - (endElement.top - endElement.bottom) / 2;

                line.field = k;

                const arm1 = {
                    start: { x: 0, y: 0 },
                    end: { x: 0, y: 0 },
                    isCircular: false,
                };
                arm1.start.x = startTable?.right;
                arm1.start.y =
                    startElement.top -
                    (startElement.top - startElement.bottom) / 2;
                arm1.end.x = startTable.right + armWidth;
                arm1.end.y = arm1.start.y;

                if (
                    looselyCoupledTables &&
                    (looselyCoupledTables.indexOf(startTableName) != -1 ||
                        looselyCoupledTables.indexOf(endTableName) != -1)
                )
                    arm1.isCircular = true;

                arms.push(arm1);

                const arm2 = {
                    start: { x: 0, y: 0 },
                    end: { x: 0, y: 0 },
                    isCircular: false,
                };
                arm2.start.x = endElement?.left;
                arm2.start.y =
                    endElement.top - (endElement.top - endElement.bottom) / 2;
                arm2.end.x = endElement.left - armWidth;
                arm2.end.y = arm2.start.y;

                if (
                    looselyCoupledTables &&
                    (looselyCoupledTables.indexOf(startTableName) != -1 ||
                        looselyCoupledTables.indexOf(endTableName) != -1)
                )
                    arm2.isCircular = true;

                arms.push(arm2);
            }
        });

        if (
            looselyCoupledTables &&
            (looselyCoupledTables.indexOf(startTableName) != -1 ||
                looselyCoupledTables.indexOf(endTableName) != -1)
        )
            line.isCircular = true;

        return line;
    } catch (e) {
        //
    }
}

function createConnectionBetweenMultipleTables(key, looselyCoupledTables) {
    let positionFurthestTop = Number.MAX_VALUE;
    let positionFurthestLeft = Number.MAX_VALUE;
    let positionFurthestBottom = 0;
    let positionFurthestRight = 0;

    const qFieldName = key.qKeyFields[0];

    const connection = {
        fieldName: qFieldName,
        tables: [],
        lines: [],
        interception: {
            top: 0,
            left: 0,
        },
    };

    for (const i in key.qTables) {
        const qTableName = key.qTables[i];
        const tableBounds = getTableBounds(qTableName);
        const fieldTop = tableBounds.top;

        //@ts-ignore
        connection.tables.push(qTableName);

        positionFurthestTop = Math.min(
            positionFurthestTop,
            //@ts-ignore
            tableBounds.top,
        );
        positionFurthestLeft = Math.min(
            positionFurthestLeft,
            //@ts-ignore
            tableBounds.left,
        );
        positionFurthestBottom = Math.max(
            positionFurthestBottom,
            //@ts-ignore
            fieldTop,
        );
        positionFurthestRight = Math.max(
            positionFurthestRight,
            //@ts-ignore
            tableBounds.left + tableBounds.width,
        );
    }

    connection.interception = {
        top:
            positionFurthestTop +
            (positionFurthestBottom - positionFurthestTop) / 2,
        left:
            positionFurthestLeft +
            (positionFurthestRight - positionFurthestLeft) / 2,
    };

    for (const i in key.qTables) {
        const qTableStartName = key.qTables[i];

        const a = getPositionOfFieldInTable(
            qTableStartName,
            qFieldName,
            connection.interception.left,
        );

        const offset = a.targetIsToLeft
            ? defaultOffsetValue + armWidth
            : -1 * (defaultOffsetValue + armWidth);
        const offset1 = a.targetIsToLeft
            ? defaultOffsetValue
            : -1 * defaultOffsetValue;

        //@ts-ignore
        connection.lines.push({
            start: {
                targetIsToLeft: a.targetIsToLeft,
                y: a.top,
                x: a.left + offset,
            },
            end: {
                y: connection.interception.top,
                x: connection.interception.left,
            },
            startTable: qTableStartName,
        });

        const arm1 = {
            start: { x: 0, y: 0 },
            end: { x: 0, y: 0 },
            isCircular: false,
        };

        //@ts-ignore
        if (looselyCoupledTables.indexOf(key.qTables[i]) > -1)
            arm1.isCircular = true;
        arm1.start.x = a?.left + offset1;
        arm1.start.y = a.top;
        //@ts-ignore
        arm1.end.x =
            a.left + offset1 + (a.targetIsToLeft ? armWidth : -armWidth);
        arm1.end.y = arm1.start.y;

        arms.push(arm1);
    }

    interceptions.push({
        x: connection.interception.left,
        y: connection.interception.top,
    });

    return connection;
}

export async function action(args) {
    const spinner = new args.tools.spinner("Getting required data ...", "arc");
    spinner.start();

    const engineResponses = await Promise.all([
        args.engine.app.getTablesAndKeys({
            qWindowSize: {
                qcx: 0,
                qcy: 0,
            },
            qNullSize: {
                qcx: 0,
                qcy: 0,
            },
            qCellHeight: 0,
            qSyntheticMode: true,
            qIncludeSysVars: false,
            qIncludeProfiling: false,
        }),
        args.engine.app.getViewDlgSaveInfo(),
        args.engine.app.getLooselyCoupledVector(),
    ]);

    saveInfo = engineResponses[1];
    data = engineResponses[0];
    loosely = engineResponses[2];

    filterOutZeroWidthTables();
    const filteredTables = await prepareTablesData();
    const tablesHtml = await drawTables(filteredTables);
    const looselyCoupledTables = setLooselyCoupledTables();

    const scripts = `
        const data = ${JSON.stringify(data)};
        const looselyCoupledTables = ${JSON.stringify(looselyCoupledTables)};
        const lines = [];
        const arms = [];
        const armWidth = 5;
        const horizontalOffset = 5;
        const defaultOffsetValue = 5;
        let interceptions = [];

        async function main() {
            data.qk.map((key) => {
                if (key.qTables.length < 3) {
                    const line = createConnectionBetweenTwoTables(key, looselyCoupledTables);
                    if(line) {
                      lines.push(line);
                    }
                } else {
                    const multipleLines = createConnectionBetweenMultipleTables(key, looselyCoupledTables);
                    multipleLines.lines.map((l) => lines.push(l));
                }
            })

            drawLines()
        }

        function drawLines() {
            const svgNS = "http://www.w3.org/2000/svg";
            const mySvg = document.getElementById("dmv");
            lines.forEach(line => {
                const svgLine = document.createElementNS(svgNS, "line");
                svgLine.setAttribute("x1", line.start.x);
                svgLine.setAttribute("y1", line.start.y);
                svgLine.setAttribute("x2", line.end.x);
                svgLine.setAttribute("y2", line.end.y);
                if(line.isCircular) {
                    svgLine.setAttribute("class", "circular");
                }

                mySvg.appendChild(svgLine);
            });


            arms.forEach(arm => {
                const svgLine = document.createElementNS(svgNS, "line");
                svgLine.setAttribute("x1", arm.start.x);
                svgLine.setAttribute("y1", arm.start.y);
                svgLine.setAttribute("x2", arm.end.x);
                svgLine.setAttribute("y2", arm.end.y);

                const svgCircle = document.createElementNS(svgNS, "circle");
                svgCircle.setAttribute("cx", arm.start.x);
                svgCircle.setAttribute("cy", arm.start.y);
                svgCircle.setAttribute("r", "3");

                if(arm.isCircular) {
                    svgLine.setAttribute("class", "circular");
                    svgCircle.setAttribute("class", "circular");
                }

                mySvg.appendChild(svgLine);
                mySvg.appendChild(svgCircle);
            })

            interceptions.forEach(interception => {
                const svgCircle = document.createElementNS(svgNS, "circle");
                svgCircle.setAttribute("cx", interception.x);
                svgCircle.setAttribute("cy", interception.y);
                svgCircle.setAttribute("r", "5");

                if(interception.isCircular) {
                    svgCircle.setAttribute("class", "circular");
                }

                mySvg.appendChild(svgCircle);
            })
        }

        ${createConnectionBetweenTwoTables.toString()}
        ${createConnectionBetweenMultipleTables.toString()}
        ${getPositionOfFieldInTable.toString()}
        ${isTableLeftOfTargetLeftPosition.toString()}
        ${getTableBounds.toString()}

        document.addEventListener("DOMContentLoaded", async() => {
            await main();

            const marker = document.createElement("div");
            marker.setAttribute("id", "endMarker");

            const container = document.getElementsByClassName("table-container");
            container[0].appendChild(marker);

        });`;

    const htmlContent = `<!DOCTYPE html>
        <html>
            <head>
                <script>${scripts}</script>
                <style>${styles}</style>
            </head>
            <body>
                <div class="table-container">
                    <div class="zoom" style="tablesContainerStyle">${tablesHtml}</div>
                    <svg id="dmv" height=${svgHeight} width=${svgWidth} version="1.1"></svg>
                </div>
            </body>
        </html>`;

    const browser = await chromium.launch({
        channel: "msedge",
        headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent);

    const orderSent = page.locator("#endMarker");
    await orderSent.waitFor({ state: "attached", timeout: 5000 });

    const screenshotData = await page.screenshot({
        fullPage: true,
    });

    browser.close();
    spinner.stop();
    writeFileSync(args.command.options.output, screenshotData);

    return;
}
